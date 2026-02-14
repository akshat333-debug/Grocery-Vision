"""
OpenCV-based Freshness Analyzer
Analyzes produce freshness using color, texture, and spot detection.
No API calls, no trained model needed — pure computer vision heuristics.
"""

import cv2
import numpy as np
from PIL import Image
import io


class FreshnessAnalyzer:
    """Analyze produce freshness using OpenCV color and texture analysis."""

    # Color ranges for spoilage indicators (in HSV)
    # Brown spots / dark areas indicate spoilage
    BROWN_LOWER = np.array([10, 50, 20])
    BROWN_UPPER = np.array([25, 255, 180])

    DARK_LOWER = np.array([0, 0, 0])
    DARK_UPPER = np.array([180, 255, 50])

    # Healthy color ranges for specific fruits (HSV)
    ITEM_HEALTHY_COLORS = {
        "apple": {
            "ranges": [
                (np.array([0, 80, 80]), np.array([10, 255, 255])),    # Red
                (np.array([160, 80, 80]), np.array([180, 255, 255])), # Red (wrap)
                (np.array([25, 60, 80]), np.array([45, 255, 255])),   # Green apple
            ],
            "name": "Apple",
        },
        "banana": {
            "ranges": [
                (np.array([20, 80, 80]), np.array([35, 255, 255])),   # Yellow
            ],
            "name": "Banana",
        },
        "orange": {
            "ranges": [
                (np.array([10, 100, 100]), np.array([25, 255, 255])), # Orange
            ],
            "name": "Orange",
        },
        "broccoli": {
            "ranges": [
                (np.array([30, 40, 40]), np.array([85, 255, 255])),   # Green
            ],
            "name": "Broccoli",
        },
        "carrot": {
            "ranges": [
                (np.array([10, 100, 100]), np.array([25, 255, 255])), # Orange
            ],
            "name": "Carrot",
        },
    }

    def analyze(self, image_bytes: bytes, item_name: str, box: dict = None) -> dict:
        """
        Analyze freshness of a produce item.

        Args:
            image_bytes: Raw image bytes
            item_name: Name of the fruit (e.g., 'apple', 'banana')
            box: Optional bounding box dict with x1,y1,x2,y2 to crop the region

        Returns:
            Dict with freshness_percentage, label, description, and metrics
        """
        # Load image
        img_array = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            return self._default_result(item_name)

        # Crop to bounding box if provided
        if box:
            x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
            # Add small padding
            h, w = img.shape[:2]
            pad = 10
            x1 = max(0, x1 - pad)
            y1 = max(0, y1 - pad)
            x2 = min(w, x2 + pad)
            y2 = min(h, y2 + pad)
            img = img[y1:y2, x1:x2]

        if img.size == 0:
            return self._default_result(item_name)

        # Convert to HSV for color analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # === Metric 1: Brown/Dark Spot Ratio ===
        brown_score = self._analyze_brown_spots(hsv)

        # === Metric 2: Healthy Color Ratio ===
        color_score = self._analyze_healthy_color(hsv, item_name)

        # === Metric 3: Texture Uniformity ===
        texture_score = self._analyze_texture(img)

        # === Metric 4: Brightness & Vibrancy ===
        vibrancy_score = self._analyze_vibrancy(hsv)

        # Combine scores (weighted average)
        freshness_pct = (
            brown_score * 0.30
            + color_score * 0.30
            + texture_score * 0.20
            + vibrancy_score * 0.20
        )

        # Clamp to 0-100
        freshness_pct = max(0, min(100, freshness_pct))

        # Determine label and description
        label, description = self._get_label_and_description(
            freshness_pct, item_name, brown_score, color_score
        )

        return {
            "freshness_percentage": round(freshness_pct, 1),
            "label": label,
            "description": description,
            "metrics": {
                "brown_spot_score": round(brown_score, 1),
                "healthy_color_score": round(color_score, 1),
                "texture_score": round(texture_score, 1),
                "vibrancy_score": round(vibrancy_score, 1),
            },
        }

    def _analyze_brown_spots(self, hsv: np.ndarray) -> float:
        """Score based on absence of brown/dark spots. 100 = no spots, 0 = lots of spots."""
        total_pixels = hsv.shape[0] * hsv.shape[1]
        if total_pixels == 0:
            return 50.0

        # Count brown pixels
        brown_mask = cv2.inRange(hsv, self.BROWN_LOWER, self.BROWN_UPPER)
        brown_ratio = cv2.countNonZero(brown_mask) / total_pixels

        # Count dark pixels
        dark_mask = cv2.inRange(hsv, self.DARK_LOWER, self.DARK_UPPER)
        dark_ratio = cv2.countNonZero(dark_mask) / total_pixels

        # Combined spoilage ratio (cap at 50% to avoid background dark pixels dominating)
        spoilage_ratio = min(0.5, brown_ratio + dark_ratio * 0.5)

        # Convert to freshness score (0 spoilage = 100, 50% spoilage = 0)
        return max(0, (1 - spoilage_ratio * 2) * 100)

    def _analyze_healthy_color(self, hsv: np.ndarray, item_name: str) -> float:
        """Score based on how much of the fruit matches its expected healthy color."""
        total_pixels = hsv.shape[0] * hsv.shape[1]
        if total_pixels == 0:
            return 50.0

        item_config = self.ITEM_HEALTHY_COLORS.get(item_name)
        if not item_config:
            # Unknown fruit — return neutral score
            return 60.0

        # Count pixels matching healthy color ranges
        healthy_pixels = 0
        for lower, upper in item_config["ranges"]:
            mask = cv2.inRange(hsv, lower, upper)
            healthy_pixels += cv2.countNonZero(mask)

        healthy_ratio = healthy_pixels / total_pixels

        # Scale: 60%+ healthy pixels = 100 score, <10% = 0
        return min(100, max(0, (healthy_ratio - 0.1) / 0.5 * 100))

    def _analyze_texture(self, img: np.ndarray) -> float:
        """Score based on texture uniformity. Smooth = fresh, wrinkled = old."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Laplacian variance — higher value = more edges/wrinkles
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()

        # Normalize: low variance (smooth) = high score
        # Typical range: 100-2000 for food images
        if variance < 200:
            return 95.0  # Very smooth — great freshness
        elif variance < 500:
            return 80.0
        elif variance < 1000:
            return 60.0
        elif variance < 2000:
            return 40.0
        else:
            return 20.0  # Very textured — likely wrinkled/old

    def _analyze_vibrancy(self, hsv: np.ndarray) -> float:
        """Score based on color saturation and brightness. Vibrant = fresh."""
        # Average saturation (channel 1) and value/brightness (channel 2)
        avg_saturation = np.mean(hsv[:, :, 1])
        avg_brightness = np.mean(hsv[:, :, 2])

        # High saturation + good brightness = fresh
        sat_score = min(100, (avg_saturation / 150) * 100)
        bright_score = min(100, (avg_brightness / 180) * 100)

        return (sat_score * 0.6 + bright_score * 0.4)

    def _get_label_and_description(
        self, pct: float, item_name: str, brown_score: float, color_score: float
    ) -> tuple:
        """Generate human-readable label and description."""
        display_name = item_name.title()

        if pct >= 80:
            label = "Fresh"
            description = (
                f"{display_name} appears fresh with vibrant color and smooth texture. "
                f"No visible signs of spoilage or browning detected."
            )
        elif pct >= 60:
            label = "Good"
            description = (
                f"{display_name} is in good condition with minor signs of aging. "
                f"Color is mostly healthy with slight texture changes."
            )
        elif pct >= 40:
            label = "Semi-Fresh"
            description = (
                f"{display_name} shows moderate signs of aging. "
                f"Some color changes and texture degradation visible. "
                f"Should be consumed soon."
            )
        elif pct >= 20:
            label = "Stale"
            description = (
                f"{display_name} shows significant signs of spoilage. "
                f"Noticeable browning or dark spots present. "
                f"Quality has degraded considerably."
            )
        else:
            label = "Spoiled"
            description = (
                f"{display_name} appears to be spoiled with heavy discoloration "
                f"and texture breakdown. Not recommended for consumption."
            )

        return label, description

    def _default_result(self, item_name: str) -> dict:
        """Return a default result when analysis fails."""
        return {
            "freshness_percentage": 50.0,
            "label": "Unknown",
            "description": f"Could not properly analyze {item_name.title()} freshness.",
            "metrics": {
                "brown_spot_score": 50.0,
                "healthy_color_score": 50.0,
                "texture_score": 50.0,
                "vibrancy_score": 50.0,
            },
        }
