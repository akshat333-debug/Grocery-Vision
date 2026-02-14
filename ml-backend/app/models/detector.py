"""
Grocery & Produce Detector
Uses YOLOv8 (COCO) for local detection of common items,
plus an optional Gemini Vision fallback for items YOLO can't identify
(e.g., packaged goods, specific vegetables, dairy, etc.)
"""

from ultralytics import YOLO
import numpy as np
from PIL import Image
import io
import os
import base64
from datetime import datetime

# ============================================================
# ALL grocery-relevant COCO classes (out of 80 total)
# ============================================================
GROCERY_CLASSES = {
    # === Fruits & Vegetables ===
    46: "banana",
    47: "apple",
    49: "orange",
    50: "broccoli",
    51: "carrot",
    # === Prepared Food ===
    48: "sandwich",
    52: "hot dog",
    53: "pizza",
    54: "donut",
    55: "cake",
    # === Drinks & Containers ===
    39: "bottle",
    40: "wine glass",
    41: "cup",
    # === Kitchenware (often in grocery images) ===
    42: "fork",
    43: "knife",
    44: "spoon",
    45: "bowl",
    # === Other common objects in grocery context ===
    24: "backpack",
    25: "umbrella",
    26: "handbag",
    27: "tie",
    28: "suitcase",
    56: "potted plant",
    73: "book",
    74: "clock",
    75: "vase",
    76: "scissors",
    77: "teddy bear",
    78: "hair drier",
    79: "toothbrush",
}

# Display-friendly names
DISPLAY_NAMES = {
    "banana": "Banana",
    "apple": "Apple",
    "orange": "Orange",
    "broccoli": "Broccoli",
    "carrot": "Carrot",
    "sandwich": "Sandwich",
    "hot dog": "Hot Dog",
    "pizza": "Pizza",
    "donut": "Donut",
    "cake": "Cake",
    "bottle": "Bottle",
    "wine glass": "Wine Glass",
    "cup": "Cup",
    "fork": "Fork",
    "knife": "Knife",
    "spoon": "Spoon",
    "bowl": "Bowl",
    "backpack": "Backpack",
    "umbrella": "Umbrella",
    "handbag": "Handbag",
    "tie": "Tie",
    "suitcase": "Suitcase",
    "potted plant": "Potted Plant",
    "book": "Book",
    "clock": "Clock",
    "vase": "Vase",
    "scissors": "Scissors",
    "teddy bear": "Teddy Bear",
    "hair drier": "Hair Drier",
    "toothbrush": "Toothbrush",
}

# Produce items eligible for freshness analysis
PRODUCE_ITEMS = {"banana", "apple", "orange", "broccoli", "carrot", "potted plant"}


def _gemini_detect_items(image_bytes: bytes) -> list:
    """
    Fallback: Use Gemini Vision to identify grocery items YOLO missed.
    Sends a compressed image with a minimal prompt to save tokens.
    Returns list of item dicts or empty list on failure.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return []

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Compress image to reduce token usage
        img = Image.open(io.BytesIO(image_bytes))
        img.thumbnail((512, 512))  # Resize to max 512px
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=60)
        compressed_bytes = buffer.getvalue()

        # Encode as base64 for the API
        img_b64 = base64.b64encode(compressed_bytes).decode("utf-8")

        prompt = (
            "List every grocery/food item visible in this image. "
            "For each item, give the item name and count. "
            "Respond ONLY as a JSON array like: "
            '[{"name": "Milk", "count": 1}, {"name": "Bread", "count": 2}]. '
            "No explanation, just the JSON array."
        )

        response = model.generate_content(
            [
                prompt,
                {"mime_type": "image/jpeg", "data": img_b64},
            ]
        )

        # Parse the JSON response
        import json
        text = response.text.strip()
        # Remove markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]
        items = json.loads(text)

        result = []
        for item in items:
            if isinstance(item, dict) and "name" in item:
                result.append({
                    "itemName": item["name"],
                    "count": item.get("count", 1),
                    "confidence": 85.0,  # Estimated confidence for API detection
                    "source": "gemini",
                    "timestamp": datetime.now().isoformat(),
                })
        print(f"   🤖 Gemini identified {len(result)} additional items")
        return result

    except Exception as e:
        print(f"   ⚠️ Gemini fallback failed (non-critical): {e}")
        return []


class GroceryDetector:
    """Local YOLOv8-based grocery detector with Gemini fallback."""

    def __init__(self):
        print("🔄 Loading YOLOv8 model...")
        self.model = YOLO("yolov8n.pt")
        print("✅ YOLOv8 model loaded successfully")

    def detect(self, image_bytes: bytes, confidence_threshold: float = 0.25) -> list:
        """
        Detect grocery items in an image.
        1. YOLOv8 detects known COCO items locally (free)
        2. If YOLO finds few/no items, Gemini fallback identifies the rest (optional)
        """
        image = Image.open(io.BytesIO(image_bytes))
        results = self.model(image, verbose=False)

        # Parse YOLO results
        detections = {}
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                if class_id in GROCERY_CLASSES and confidence >= confidence_threshold:
                    class_name = GROCERY_CLASSES[class_id]

                    if class_name not in detections:
                        detections[class_name] = {
                            "count": 0,
                            "max_confidence": 0.0,
                        }

                    detections[class_name]["count"] += 1
                    detections[class_name]["max_confidence"] = max(
                        detections[class_name]["max_confidence"], confidence
                    )

        # Format YOLO results
        items = []
        yolo_names = set()
        for class_name, data in detections.items():
            display = DISPLAY_NAMES.get(class_name, class_name.title())
            items.append({
                "itemName": display,
                "count": data["count"],
                "confidence": round(data["max_confidence"] * 100, 1),
                "source": "yolo",
                "timestamp": datetime.now().isoformat(),
            })
            yolo_names.add(display.lower())

        print(f"   🎯 YOLOv8 detected: {[i['itemName'] for i in items] or 'nothing'}")

        # Gemini fallback: if YOLO found ≤ 1 item, try Gemini for more
        if len(items) <= 1:
            print("   🔄 Few YOLO detections, trying Gemini fallback...")
            gemini_items = _gemini_detect_items(image_bytes)

            # Merge — avoid duplicates
            for gi in gemini_items:
                if gi["itemName"].lower() not in yolo_names:
                    items.append(gi)
                    yolo_names.add(gi["itemName"].lower())

        return items

    def get_produce_detections(
        self, image_bytes: bytes, confidence_threshold: float = 0.25
    ) -> list:
        """
        Get only produce items (fruits/vegetables) with bounding boxes.
        Used to crop regions for freshness analysis.
        """
        image = Image.open(io.BytesIO(image_bytes))
        results = self.model(image, verbose=False)

        produce = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                if class_id in GROCERY_CLASSES and confidence >= confidence_threshold:
                    class_name = GROCERY_CLASSES[class_id]
                    if class_name in PRODUCE_ITEMS:
                        produce.append({
                            "name": class_name,
                            "display_name": DISPLAY_NAMES.get(
                                class_name, class_name.title()
                            ),
                            "box": {
                                "x1": int(box.xyxy[0][0]),
                                "y1": int(box.xyxy[0][1]),
                                "x2": int(box.xyxy[0][2]),
                                "y2": int(box.xyxy[0][3]),
                            },
                            "confidence": confidence,
                        })

        # If no produce from YOLO, try Gemini to identify produce
        if not produce and os.getenv("GOOGLE_API_KEY"):
            print("   🔄 No produce from YOLO, trying Gemini for produce detection...")
            gemini_items = _gemini_detect_items(image_bytes)
            produce_keywords = {
                "apple", "banana", "orange", "mango", "grape", "grapes", "strawberry",
                "blueberry", "watermelon", "pineapple", "papaya", "guava", "kiwi",
                "peach", "pear", "plum", "cherry", "lemon", "lime", "pomegranate",
                "avocado", "tomato", "potato", "onion", "garlic", "ginger",
                "spinach", "lettuce", "cabbage", "cauliflower", "broccoli",
                "carrot", "cucumber", "pepper", "chili", "corn", "peas",
                "beans", "eggplant", "zucchini", "mushroom", "beetroot",
            }
            for gi in gemini_items:
                name_lower = gi["itemName"].lower()
                if any(kw in name_lower for kw in produce_keywords):
                    produce.append({
                        "name": name_lower,
                        "display_name": gi["itemName"],
                        "box": None,  # No bounding box from Gemini
                        "confidence": 0.85,
                    })

        return produce
