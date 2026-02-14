"""
Rule-based Fruit Knowledge Base
Provides shelf life estimates, storage advice, and nutritional data.
Optionally enriches with Gemini text API (no images sent, text only).
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


# === LOCAL KNOWLEDGE DATABASE (No API needed) ===

GROCERY_KNOWLEDGE = {
    "apple": {
        "shelf_life": {"Fresh": "7-10 days", "Good": "5-7 days", "Semi-Fresh": "2-3 days", "Stale": "1 day", "Spoiled": "0 days"},
        "storage": "Store in refrigerator crisper drawer. Keep away from other fruits as apples release ethylene gas.",
        "nutrition": {"calories": 52, "protein": 0.3, "carbs": 14, "fiber": 2.4, "vitamin_c": 4.6},
        "tips": "Wash before eating. Brown spots near stem can indicate early spoilage.",
    },
    "banana": {
        "shelf_life": {"Fresh": "4-6 days", "Good": "3-4 days", "Semi-Fresh": "1-2 days", "Stale": "0-1 days", "Spoiled": "0 days"},
        "storage": "Store at room temperature. Separate from other fruits. Refrigerate only when fully ripe to slow further ripening.",
        "nutrition": {"calories": 89, "protein": 1.1, "carbs": 23, "fiber": 2.6, "vitamin_c": 8.7},
        "tips": "Green = unripe, Yellow = ripe, Brown spots = very ripe (great for baking).",
    },
    "orange": {
        "shelf_life": {"Fresh": "10-14 days", "Good": "7-10 days", "Semi-Fresh": "3-5 days", "Stale": "1-2 days", "Spoiled": "0 days"},
        "storage": "Store in refrigerator for maximum shelf life. Can be stored at room temperature for up to a week.",
        "nutrition": {"calories": 47, "protein": 0.9, "carbs": 12, "fiber": 2.4, "vitamin_c": 53},
        "tips": "Heavy oranges are juicier. Soft spots indicate spoilage.",
    },
    "broccoli": {
        "shelf_life": {"Fresh": "5-7 days", "Good": "3-5 days", "Semi-Fresh": "1-3 days", "Stale": "0-1 days", "Spoiled": "0 days"},
        "storage": "Store unwashed in a loosely sealed plastic bag in the refrigerator. Do not wash until ready to use.",
        "nutrition": {"calories": 34, "protein": 2.8, "carbs": 7, "fiber": 2.6, "vitamin_c": 89},
        "tips": "Yellowing florets indicate age. Fresh broccoli should be dark green with tight florets.",
    },
    "carrot": {
        "shelf_life": {"Fresh": "14-21 days", "Good": "10-14 days", "Semi-Fresh": "5-7 days", "Stale": "2-3 days", "Spoiled": "0 days"},
        "storage": "Remove green tops and store in the refrigerator in a sealed container with a damp paper towel.",
        "nutrition": {"calories": 41, "protein": 0.9, "carbs": 10, "fiber": 2.8, "vitamin_c": 5.9},
        "tips": "Flexible, rubbery carrots are dehydrated but still edible. Slimy carrots should be discarded.",
    },
}

# Default for unknown items
DEFAULT_KNOWLEDGE = {
    "shelf_life": {"Fresh": "5-7 days", "Good": "3-5 days", "Semi-Fresh": "1-3 days", "Stale": "0-1 days", "Spoiled": "0 days"},
    "storage": "Store in a cool, dry place or refrigerate for extended shelf life.",
    "nutrition": {"calories": 50, "protein": 1.0, "carbs": 12, "fiber": 2.0, "vitamin_c": 10},
    "tips": "Check for visual signs of spoilage before consuming.",
}


def get_shelf_life(item_name: str, freshness_label: str) -> str:
    """Get estimated shelf life based on fruit type and current freshness."""
    knowledge = GROCERY_KNOWLEDGE.get(item_name.lower(), DEFAULT_KNOWLEDGE)
    return knowledge["shelf_life"].get(freshness_label, "2-4 days")


def get_storage_advice(item_name: str) -> str:
    """Get storage advice for a fruit."""
    knowledge = GROCERY_KNOWLEDGE.get(item_name.lower(), DEFAULT_KNOWLEDGE)
    return knowledge["storage"]


def get_nutrition(item_name: str) -> dict:
    """Get nutritional data per 100g serving."""
    knowledge = GROCERY_KNOWLEDGE.get(item_name.lower(), DEFAULT_KNOWLEDGE)
    return knowledge["nutrition"]


def get_tips(item_name: str) -> str:
    """Get freshness tips for a fruit."""
    knowledge = GROCERY_KNOWLEDGE.get(item_name.lower(), DEFAULT_KNOWLEDGE)
    return knowledge["tips"]


# === OPTIONAL: Gemini Text-Only Enrichment ===

def enrich_with_gemini(item_name: str, freshness_label: str, freshness_pct: float) -> str | None:
    """
    Optionally enrich the freshness description using Gemini API.
    ONLY sends text — no images, minimal tokens.
    Returns None if API is unavailable or fails.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = (
            f"In 2 sentences, describe the condition of a {item_name} that is "
            f"{freshness_label} ({freshness_pct:.0f}% fresh). "
            f"Include one practical tip for the consumer. Keep it concise."
        )

        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"⚠️ Gemini enrichment failed (non-critical): {e}")
        return None
