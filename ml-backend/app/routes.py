"""
API Routes for Grocery Vision
Matches the existing frontend's expected JSON contract.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from datetime import datetime
from app.models.detector import GroceryDetector
from app.models.freshness import FreshnessAnalyzer
from app.models import knowledge

router = APIRouter(prefix="/api")

# Models are loaded once and reused (initialized in main.py startup)
detector: GroceryDetector = None
freshness_analyzer: FreshnessAnalyzer = None


def init_models():
    """Initialize ML models. Called once at startup."""
    global detector, freshness_analyzer
    detector = GroceryDetector()
    freshness_analyzer = FreshnessAnalyzer()


@router.post("/detect-items")
async def detect_items(image: UploadFile = File(...)):
    """
    Detect grocery/food items in an uploaded image.
    Uses YOLOv8 locally — no API calls.
    """
    try:
        print("🔍 Starting item detection process (YOLOv8 + Gemini fallback)")

        # Read image bytes
        image_bytes = await image.read()
        print(f"📸 Processing image: {image.filename}, {len(image_bytes)} bytes")

        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # Run local YOLOv8 detection
        items = detector.detect(image_bytes)
        print(f"✅ Detected {len(items)} items")

        if not items:
            # If YOLO finds nothing, return a helpful message
            print("⚠️ No grocery items detected")
            return {
                "message": "Success",
                "result": [],
                "note": "No grocery items detected. Try a clearer, well-lit image.",
            }

        return {"message": "Success", "result": items}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in detect-items: {e}")
        return {"message": "Error", "error": f"Detection error: {str(e)}"}


@router.post("/detect-freshness")
async def detect_freshness(image: UploadFile = File(...)):
    """
    Analyze freshness of produce in an uploaded image.
    Uses YOLOv8 (local) to find produce, then OpenCV (local) to analyze freshness.
    Gemini API is used ONLY for optional text enrichment (text-only, no images).
    """
    try:
        print("🔍 Starting freshness detection process (local ML)")

        # Read image bytes
        image_bytes = await image.read()
        print(f"📸 Processing image: {image.filename}, {len(image_bytes)} bytes")

        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # Step 1: Find produce items with YOLOv8 (local)
        produce_items = detector.get_produce_detections(image_bytes)
        print(f"🎯 Found {len(produce_items)} produce items")

        if not produce_items:
            return {
                "message": "Success",
                "result": [],
                "note": "No produce items detected for freshness analysis.",
            }

        # Step 2: Analyze each item's freshness with OpenCV (local)
        results = []
        for item in produce_items:
            print(f"🔬 Analyzing freshness of {item['display_name']}...")

            analysis = freshness_analyzer.analyze(
                image_bytes, item["name"], item["box"]
            )

            # Get rule-based knowledge (local)
            shelf_life = knowledge.get_shelf_life(item["name"], analysis["label"])
            storage = knowledge.get_storage_advice(item["name"])

            # Step 3: Optional Gemini text enrichment (text-only, minimal tokens)
            enriched_description = knowledge.enrich_with_gemini(
                item["name"], analysis["label"], analysis["freshness_percentage"]
            )

            # Use enriched description if available, otherwise use local one
            description = enriched_description or analysis["description"]

            results.append({
                "produce": item["display_name"],
                "freshness": f"{analysis['label']} ({analysis['freshness_percentage']:.0f}% fresh). {description}",
                "expectedLifespan": shelf_life,
                "storage": storage,
                "freshness_percentage": analysis["freshness_percentage"],
                "metrics": analysis["metrics"],
                "timestamp": datetime.now().isoformat(),
            })

        print(f"✅ Freshness analysis complete for {len(results)} items")
        return {"message": "Success", "result": results}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in detect-freshness: {e}")
        return {"message": "Error", "error": f"Freshness analysis error: {str(e)}"}
