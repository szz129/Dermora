"""
Dermora LLM Recommender Service - Port 8001
Uses Groq (Llama 3) for fast free recommendations
MedGemma via HuggingFace as medical reasoning layer
"""

import os
import json
import logging
import httpx
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Dermora Medical Recommender",
    description="MedGemma + Groq powered skincare recommendation engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info("✅ Supabase connected")

# ── Groq ──────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("✅ Groq client initialized")
    except Exception as e:
        logger.error(f"Groq init failed: {e}")

# ── MedGemma via HuggingFace ──────────────────────────────────────────────────
HF_TOKEN = os.getenv("HF_TOKEN")
MEDGEMMA_API_URL = "https://router.huggingface.co/hf-inference/models/google/medgemma-4b-it/v1/chat/completions"

# ── Cycle phase advice ────────────────────────────────────────────────────────
CYCLE_ADVICE = {
    "menstrual": {
        "skin_changes": "Skin is sensitive and may feel dry or inflamed. Estrogen and progesterone are at their lowest.",
        "avoid": "harsh acids, retinol, heavy exfoliation",
        "focus": "gentle hydration, barrier repair, soothing ingredients like centella and ceramides"
    },
    "follicular": {
        "skin_changes": "Estrogen is rising. Skin starts clearing and glowing naturally.",
        "avoid": "nothing specific — skin is most resilient now",
        "focus": "vitamin C, brightening serums, light exfoliation"
    },
    "ovulation": {
        "skin_changes": "Estrogen peaks. This is skin's best week — clear, plump, radiant.",
        "avoid": "nothing specific",
        "focus": "antioxidant protection, SPF, maintaining glow"
    },
    "luteal": {
        "skin_changes": "Progesterone rises. Oil production increases. Hormonal acne may appear on chin and jawline.",
        "avoid": "heavy oils, rich butters, skipping SPF",
        "focus": "salicylic acid, niacinamide, oil control, acne prevention"
    }
}

# ── Models ────────────────────────────────────────────────────────────────────
class RecommendationRequest(BaseModel):
    user_id: str
    answers: Dict[str, Any]
    detected_condition: Optional[str] = None
    skin_score: Optional[int] = None


# ── MedGemma call ─────────────────────────────────────────────────────────────
async def call_medgemma(prompt: str) -> Optional[str]:
    if not HF_TOKEN:
        return None
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "google/medgemma-4b-it",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000,
        "temperature": 0.7
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(MEDGEMMA_API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                result = response.json()
                text = result["choices"][0]["message"]["content"]
                logger.info("✅ MedGemma responded successfully")
                return text
            else:
                logger.warning(f"MedGemma error {response.status_code} — falling back to Groq")
                return None
    except Exception as e:
        logger.warning(f"MedGemma failed: {e} — falling back to Groq")
        return None


# ── Build prompt ──────────────────────────────────────────────────────────────
def build_prompt(detected_condition: str, answers: dict, cycle_phase: str, products_text: str) -> str:
    cycle_info = CYCLE_ADVICE.get(cycle_phase, {})
    skin_type = answers.get("q2", "normal")
    skin_feel = answers.get("q3", "")
    concerns = answers.get("q4", [])
    breakout_freq = answers.get("q5", "")
    conditions = answers.get("q6", [])
    sensitivity = answers.get("q7", "1")
    sunscreen_use = answers.get("q10", "")
    outdoor_time = answers.get("q11", "")
    stress = answers.get("q12", "")
    sleep = answers.get("q13", "")
    water = answers.get("q14", "")
    smoking = answers.get("q15", "never")
    makeup = answers.get("q17", "never")
    budget = answers.get("q19", "2000_5000")
    organic_pref = answers.get("q20", "no_preference")
    allergies = answers.get("q21", "never")
    pregnancy = answers.get("q22", "no")
    goals = answers.get("q23", [])
    extra_notes = answers.get("q25", "")

    pregnancy_note = ""
    if pregnancy in ["pregnant", "breastfeeding"]:
        pregnancy_note = "CRITICAL SAFETY: User is PREGNANT/BREASTFEEDING. NEVER recommend retinol, retinoids, or high-dose salicylic acid. Safe alternatives: azelaic acid, lactic acid, niacinamide."

    allergy_note = ""
    if allergies in ["frequently", "occasionally"]:
        allergy_note = "User has history of allergic reactions. Recommend fragrance-free, hypoallergenic products only."

    organic_note = ""
    if organic_pref == "exclusively":
        organic_note = "User prefers exclusively natural/organic products."
    elif organic_pref == "scientific":
        organic_note = "User prefers scientifically formulated products over natural ones."

    smoking_note = ""
    if smoking in ["regularly", "occasionally"]:
        smoking_note = "User smokes. Prioritize antioxidants (Vitamin C, E) to combat oxidative stress."

    return f"""You are a dermatologist AI specializing in Pakistani skincare.

DETECTED SKIN CONDITION: {detected_condition}
SKIN TYPE: {skin_type}
SKIN FEEL AT MIDDAY: {skin_feel}
SENSITIVITY LEVEL: {sensitivity}/5
MAIN CONCERNS: {', '.join(concerns) if isinstance(concerns, list) else concerns}
SKINCARE GOALS: {', '.join(goals) if isinstance(goals, list) else goals}
SKIN CONDITIONS: {', '.join(conditions) if isinstance(conditions, list) else conditions}
BREAKOUT FREQUENCY: {breakout_freq}
STRESS LEVEL: {stress}/5
SLEEP: {sleep}
WATER INTAKE: {water}
SUNSCREEN USE: {sunscreen_use}
OUTDOOR TIME: {outdoor_time}
MAKEUP USE: {makeup}
MONTHLY BUDGET: PKR {budget}
CYCLE PHASE: {cycle_phase}
CYCLE INFO: {cycle_info.get('skin_changes', 'Unknown')}
CYCLE FOCUS: {cycle_info.get('focus', 'General care')}
CYCLE AVOID: {cycle_info.get('avoid', 'Nothing specific')}
{pregnancy_note}
{allergy_note}
{organic_note}
{smoking_note}
ADDITIONAL NOTES: {extra_notes}

AVAILABLE PAKISTANI PRODUCTS:
{products_text}

Recommend 3 products from the catalog above:
- Product 1: A Cleanser
- Product 2: A Moisturizer or Serum
- Product 3: A Sunscreen or Treatment

Consider ALL the user's profile when selecting products. Explain why each product suits:
1. The detected condition ({detected_condition})
2. The current cycle phase ({cycle_phase})
3. The user's specific skin type and concerns

Respond ONLY with valid JSON — no extra text:
{{
  "medical_assessment": "Brief assessment of condition considering lifestyle factors",
  "cycle_tip": "Specific skin advice for {cycle_phase} phase",
  "recommendations": [
    {{
      "name": "exact product name from catalog",
      "brand": "brand name",
      "category": "category",
      "price_pkr": 0,
      "reason": "why this product for this specific user profile",
      "key_ingredients": "main active ingredients",
      "image_url": "exact ImageURL from catalog",
      "priority": 1
    }}
  ]
}}"""


# ── Main endpoint ─────────────────────────────────────────────────────────────
@app.post("/recommend-products")
async def recommend_products(req: RecommendationRequest):
    logger.info(f"Recommendation request for user: {req.user_id}")

    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    user_id = req.user_id
    answers = req.answers
    detected_condition = req.detected_condition or "normal_skin"
    cycle_phase = "unknown"

    # 1. Fetch cycle phase
    try:
        res = supabase.table('cycle_data') \
            .select('phase') \
            .eq('user_id', user_id) \
            .order('date', desc=True) \
            .limit(1) \
            .execute()
        if res.data:
            cycle_phase = res.data[0].get('phase', 'unknown')
            logger.info(f"Cycle phase: {cycle_phase}")
    except Exception as e:
        logger.error(f"Error fetching cycle data: {e}")

    # 2. Fetch products
    products_text = ""
    try:
        catalog_res = supabase.table('product_catalog').select('*').execute()
        if catalog_res.data:
            lines = []
            for p in catalog_res.data:
                targets = ", ".join(p.get('skin_type_target') or [])
                lines.append(
                    f"- {p['name']} | Brand: {p['brand']} | Category: {p['category']} "
                    f"| Price: PKR {p['price_pkr']} | Targets: {targets} "
                    f"| Ingredients: {p.get('ingredients', 'N/A')} "
                    f"| ImageURL: {p.get('image_url', '')}"
                )
            products_text = "\n".join(lines)
            logger.info(f"Loaded {len(catalog_res.data)} products")
    except Exception as e:
        logger.error(f"Error fetching products: {e}")

    prompt = build_prompt(detected_condition, answers, cycle_phase, products_text)
    result = None

    # 3. Try MedGemma first
    logger.info("Trying MedGemma...")
    medgemma_response = await call_medgemma(prompt)
    if medgemma_response:
        try:
            text = medgemma_response.strip()
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                result = json.loads(text[start:end])
                result['model_used'] = 'MedGemma'
                logger.info("✅ Using MedGemma response")
        except Exception as e:
            logger.warning(f"MedGemma parse failed: {e}")
            result = None

    # 4. Fall back to Groq
    if not result:
        if not groq_client:
            raise HTTPException(status_code=500, detail="No AI model available")
        logger.info("Falling back to Groq (Llama 3)...")
        try:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a dermatologist AI. Always respond with valid JSON only, no extra text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1500,
            )
            text = response.choices[0].message.content.strip()
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                result = json.loads(text[start:end])
                result['model_used'] = 'Groq (Llama 3)'
                logger.info("✅ Using Groq response")
                logger.info(f"First recommendation: {result['recommendations'][0] if result.get('recommendations') else 'None'}")
        except Exception as e:
            logger.error(f"Groq also failed: {e}")
            raise HTTPException(status_code=500, detail=f"All models failed: {e}")

    if "recommendations" in result:
        result["recommendations"] = result["recommendations"][:4]
        # Enrich recommendations with image_url and product_url from catalog
        try:
            catalog_res = supabase.table('product_catalog').select('name, image_url, product_url').execute()
            catalog_map = {p['name'].lower(): p for p in (catalog_res.data or [])}
            for rec in result["recommendations"]:
                name_key = rec.get('name', '').lower()
                if name_key in catalog_map:
                    rec['image_url'] = catalog_map[name_key].get('image_url', '')
                    rec['product_url'] = catalog_map[name_key].get('product_url', '')
        except Exception as e:
            logger.warning(f"Could not enrich recommendations: {e}")

    result["detected_condition"] = detected_condition
    result["cycle_phase"] = cycle_phase

    return result


@app.get("/")
async def root():
    return {
        "status": "healthy",
        "medgemma": bool(HF_TOKEN),
        "groq": bool(groq_client),
        "supabase": bool(supabase),
        "model_priority": "MedGemma → Groq fallback"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "services": {
            "medgemma": "configured" if HF_TOKEN else "not configured",
            "groq": "configured" if groq_client else "not configured",
            "supabase": "connected" if supabase else "not connected"
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("LLM_PORT", 8001))
    logger.info(f"Starting Dermora Medical Recommender on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)