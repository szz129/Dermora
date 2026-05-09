"""
Dermora LLM Recommender Service - Port 8001
<<<<<<< HEAD
=======
Uses Groq (Llama 3) for fast free recommendations
MedGemma via HuggingFace as medical reasoning layer
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
"""

import os
import json
import logging
import httpx
<<<<<<< HEAD
from datetime import date, timedelta
=======
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq

load_dotenv()

<<<<<<< HEAD
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Dermora Medical Recommender", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

=======
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
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info("✅ Supabase connected")

<<<<<<< HEAD
=======
# ── Groq ──────────────────────────────────────────────────────────────────────
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("✅ Groq client initialized")
    except Exception as e:
        logger.error(f"Groq init failed: {e}")

<<<<<<< HEAD
HF_TOKEN = os.getenv("HF_TOKEN")
MEDGEMMA_API_URL = "https://router.huggingface.co/hf-inference/models/google/medgemma-4b-it/v1/chat/completions"

=======
# ── MedGemma via HuggingFace ──────────────────────────────────────────────────
HF_TOKEN = os.getenv("HF_TOKEN")
MEDGEMMA_API_URL = "https://router.huggingface.co/hf-inference/models/google/medgemma-4b-it/v1/chat/completions"

# ── Cycle phase advice ────────────────────────────────────────────────────────
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
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

<<<<<<< HEAD
PHASE_SKIN_TIPS = {
    "menstrual": {
        "tip": "Skin is sensitive — use gentle, fragrance-free products today.",
        "warning": "Avoid retinol and harsh acids right now."
    },
    "follicular": {
        "tip": "Estrogen is rising — great time for Vitamin C and brightening serums!",
        "warning": None
    },
    "ovulation": {
        "tip": "Your skin is at its best — protect it with SPF 50+.",
        "warning": None
    },
    "luteal": {
        "tip": "Progesterone is high — expect oiliness and possible breakouts.",
        "warning": "Use niacinamide and salicylic acid to control breakouts."
    }
}


=======
# ── Models ────────────────────────────────────────────────────────────────────
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
class RecommendationRequest(BaseModel):
    user_id: str
    answers: Dict[str, Any]
    detected_condition: Optional[str] = None
    skin_score: Optional[int] = None


<<<<<<< HEAD
async def call_medgemma(prompt: str) -> Optional[str]:
    if not HF_TOKEN:
        return None
    headers = {"Authorization": f"Bearer {HF_TOKEN}", "Content-Type": "application/json"}
    payload = {"model": "google/medgemma-4b-it", "messages": [{"role": "user", "content": prompt}], "max_tokens": 1000, "temperature": 0.7}
=======
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
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(MEDGEMMA_API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                result = response.json()
<<<<<<< HEAD
                logger.info("✅ MedGemma responded successfully")
                return result["choices"][0]["message"]["content"]
=======
                text = result["choices"][0]["message"]["content"]
                logger.info("✅ MedGemma responded successfully")
                return text
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
            else:
                logger.warning(f"MedGemma error {response.status_code} — falling back to Groq")
                return None
    except Exception as e:
        logger.warning(f"MedGemma failed: {e} — falling back to Groq")
        return None


<<<<<<< HEAD
=======
# ── Build prompt ──────────────────────────────────────────────────────────────
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
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

<<<<<<< HEAD
    pregnancy_note = "CRITICAL SAFETY: User is PREGNANT/BREASTFEEDING. NEVER recommend retinol, retinoids, or high-dose salicylic acid." if pregnancy in ["pregnant", "breastfeeding"] else ""
    allergy_note = "User has history of allergic reactions. Recommend fragrance-free, hypoallergenic products only." if allergies in ["frequently", "occasionally"] else ""
    organic_note = "User prefers exclusively natural/organic products." if organic_pref == "exclusively" else ("User prefers scientifically formulated products." if organic_pref == "scientific" else "")
    smoking_note = "User smokes. Prioritize antioxidants (Vitamin C, E) to combat oxidative stress." if smoking in ["regularly", "occasionally"] else ""
=======
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
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641

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

<<<<<<< HEAD
Consider ALL the user profile. Explain why each product suits the detected condition, cycle phase, and skin type.

Respond ONLY with valid JSON — no extra text:
{{
  "medical_assessment": "Brief assessment",
=======
Consider ALL the user's profile when selecting products. Explain why each product suits:
1. The detected condition ({detected_condition})
2. The current cycle phase ({cycle_phase})
3. The user's specific skin type and concerns

Respond ONLY with valid JSON — no extra text:
{{
  "medical_assessment": "Brief assessment of condition considering lifestyle factors",
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
  "cycle_tip": "Specific skin advice for {cycle_phase} phase",
  "recommendations": [
    {{
      "name": "exact product name from catalog",
      "brand": "brand name",
      "category": "category",
      "price_pkr": 0,
<<<<<<< HEAD
      "reason": "why this product for this user",
=======
      "reason": "why this product for this specific user profile",
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
      "key_ingredients": "main active ingredients",
      "image_url": "exact ImageURL from catalog",
      "priority": 1
    }}
  ]
}}"""


<<<<<<< HEAD
@app.post("/recommend-products")
async def recommend_products(req: RecommendationRequest):
    logger.info(f"Recommendation request for user: {req.user_id}")
=======
# ── Main endpoint ─────────────────────────────────────────────────────────────
@app.post("/recommend-products")
async def recommend_products(req: RecommendationRequest):
    logger.info(f"Recommendation request for user: {req.user_id}")

>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    user_id = req.user_id
    answers = req.answers
    detected_condition = req.detected_condition or "normal_skin"
    cycle_phase = "unknown"

<<<<<<< HEAD
    try:
        res = supabase.table('cycle_data').select('phase').eq('user_id', user_id).order('date', desc=True).limit(1).execute()
=======
    # 1. Fetch cycle phase
    try:
        res = supabase.table('cycle_data') \
            .select('phase') \
            .eq('user_id', user_id) \
            .order('date', desc=True) \
            .limit(1) \
            .execute()
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
        if res.data:
            cycle_phase = res.data[0].get('phase', 'unknown')
            logger.info(f"Cycle phase: {cycle_phase}")
    except Exception as e:
        logger.error(f"Error fetching cycle data: {e}")

<<<<<<< HEAD
=======
    # 2. Fetch products
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    products_text = ""
    try:
        catalog_res = supabase.table('product_catalog').select('*').execute()
        if catalog_res.data:
            lines = []
            for p in catalog_res.data:
                targets = ", ".join(p.get('skin_type_target') or [])
<<<<<<< HEAD
                lines.append(f"- {p['name']} | Brand: {p['brand']} | Category: {p['category']} | Price: PKR {p['price_pkr']} | Targets: {targets} | Ingredients: {p.get('ingredients', 'N/A')} | ImageURL: {p.get('image_url', '')}")
=======
                lines.append(
                    f"- {p['name']} | Brand: {p['brand']} | Category: {p['category']} "
                    f"| Price: PKR {p['price_pkr']} | Targets: {targets} "
                    f"| Ingredients: {p.get('ingredients', 'N/A')} "
                    f"| ImageURL: {p.get('image_url', '')}"
                )
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
            products_text = "\n".join(lines)
            logger.info(f"Loaded {len(catalog_res.data)} products")
    except Exception as e:
        logger.error(f"Error fetching products: {e}")

    prompt = build_prompt(detected_condition, answers, cycle_phase, products_text)
    result = None

<<<<<<< HEAD
=======
    # 3. Try MedGemma first
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
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

<<<<<<< HEAD
=======
    # 4. Fall back to Groq
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    if not result:
        if not groq_client:
            raise HTTPException(status_code=500, detail="No AI model available")
        logger.info("Falling back to Groq (Llama 3)...")
        try:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
<<<<<<< HEAD
                messages=[{"role": "system", "content": "You are a dermatologist AI. Always respond with valid JSON only, no extra text."}, {"role": "user", "content": prompt}],
=======
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
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
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
<<<<<<< HEAD
=======
                logger.info(f"First recommendation: {result['recommendations'][0] if result.get('recommendations') else 'None'}")
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
        except Exception as e:
            logger.error(f"Groq also failed: {e}")
            raise HTTPException(status_code=500, detail=f"All models failed: {e}")

    if "recommendations" in result:
        result["recommendations"] = result["recommendations"][:4]
<<<<<<< HEAD
=======
        # Enrich recommendations with image_url and product_url from catalog
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
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
<<<<<<< HEAD
=======

>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    return result


@app.get("/")
async def root():
<<<<<<< HEAD
    return {"status": "healthy", "medgemma": bool(HF_TOKEN), "groq": bool(groq_client), "supabase": bool(supabase)}
=======
    return {
        "status": "healthy",
        "medgemma": bool(HF_TOKEN),
        "groq": bool(groq_client),
        "supabase": bool(supabase),
        "model_priority": "MedGemma → Groq fallback"
    }
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641


@app.get("/health")
async def health():
<<<<<<< HEAD
    return {"status": "healthy", "services": {"medgemma": "configured" if HF_TOKEN else "not configured", "groq": "configured" if groq_client else "not configured", "supabase": "connected" if supabase else "not connected"}}


# ── Cycle prediction helpers ──────────────────────────────────────────────────
def predict_current_phase(cycle_entries: list) -> dict:
    if not cycle_entries:
        return {"current_phase": "unknown", "cycle_day": 0, "next_period_date": None, "days_until_period": None, "cycle_length": 28}

    menstrual_entries = [e for e in cycle_entries if e.get('phase') == 'menstrual']

    if menstrual_entries:
        menstrual_entries.sort(key=lambda x: x['date'], reverse=True)
        last_period_date = date.fromisoformat(menstrual_entries[0]['date'][:10])
    else:
        cycle_entries_sorted = sorted(cycle_entries, key=lambda x: x['date'])
        last_period_date = date.fromisoformat(cycle_entries_sorted[0]['date'][:10])

    avg_cycle = 28
    if len(menstrual_entries) >= 2:
        menstrual_entries.sort(key=lambda x: x['date'])
        gaps = []
        for i in range(1, len(menstrual_entries)):
            d1 = date.fromisoformat(menstrual_entries[i-1]['date'][:10])
            d2 = date.fromisoformat(menstrual_entries[i]['date'][:10])
            gap = (d2 - d1).days
            if 21 <= gap <= 35:
                gaps.append(gap)
        if gaps:
            avg_cycle = int(sum(gaps) / len(gaps))

    today = date.today()
    cycle_day = (today - last_period_date).days + 1
    if cycle_day > avg_cycle:
        cycle_day = cycle_day % avg_cycle or avg_cycle

    if cycle_day <= 5:
        current_phase = "menstrual"
    elif cycle_day <= 13:
        current_phase = "follicular"
    elif cycle_day <= 16:
        current_phase = "ovulation"
    else:
        current_phase = "luteal"

    next_period = last_period_date + timedelta(days=avg_cycle)
    if next_period <= today:
        next_period = today + timedelta(days=avg_cycle - cycle_day + 1)
    days_until = (next_period - today).days

    return {"current_phase": current_phase, "cycle_day": cycle_day, "cycle_length": avg_cycle, "next_period_date": next_period.isoformat(), "days_until_period": days_until}


def build_7day_forecast(current_phase: str, cycle_day: int, cycle_length: int) -> list:
    forecast = []
    today = date.today()
    for i in range(7):
        forecast_date = today + timedelta(days=i)
        day_in_cycle = cycle_day + i
        if day_in_cycle > cycle_length:
            day_in_cycle = day_in_cycle - cycle_length
        if day_in_cycle <= 5:
            phase = "menstrual"
        elif day_in_cycle <= 13:
            phase = "follicular"
        elif day_in_cycle <= 16:
            phase = "ovulation"
        else:
            phase = "luteal"
        tip_data = PHASE_SKIN_TIPS.get(phase, {})
        forecast.append({"date": forecast_date.isoformat(), "day_label": forecast_date.strftime("%a"), "phase": phase, "tip": tip_data.get("tip", ""), "is_today": i == 0})
    return forecast


# ── Cycle endpoints ───────────────────────────────────────────────────────────
@app.get("/cycle/status/{user_id}")
async def get_cycle_status(user_id: str):
    """Returns predicted cycle status + 7-day skin forecast."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        res = supabase.table('cycle_data').select('*').eq('user_id', user_id).order('date', desc=True).limit(30).execute()
        cycle_entries = res.data or []
        prediction = predict_current_phase(cycle_entries)
        current_phase = prediction["current_phase"]

        forecast = []
        if current_phase != "unknown":
            forecast = build_7day_forecast(current_phase, prediction["cycle_day"], prediction["cycle_length"])

        tip_data = PHASE_SKIN_TIPS.get(current_phase, {"tip": "Log your cycle to get personalised skin tips.", "warning": None})
        logger.info(f"Cycle status for {user_id}: phase={current_phase}, day={prediction['cycle_day']}")

        return {
            "user_id": user_id,
            "current_phase": current_phase,
            "cycle_day": prediction["cycle_day"],
            "cycle_length": prediction["cycle_length"],
            "next_period_date": prediction["next_period_date"],
            "days_until_period": prediction["days_until_period"],
            "skin_tip": tip_data["tip"],
            "skin_warning": tip_data.get("warning"),
            "seven_day_forecast": forecast,
            "has_data": len(cycle_entries) > 0
        }
    except Exception as e:
        logger.error(f"Cycle status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cycle/notify-phase-change")
async def notify_phase_change(data: dict):
    """Called by frontend when phase changes. Returns latest cycle status."""
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    return await get_cycle_status(user_id)


# ── Entry point ───────────────────────────────────────────────────────────────
=======
    return {
        "status": "healthy",
        "services": {
            "medgemma": "configured" if HF_TOKEN else "not configured",
            "groq": "configured" if groq_client else "not configured",
            "supabase": "connected" if supabase else "not connected"
        }
    }


>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("LLM_PORT", 8001))
    logger.info(f"Starting Dermora Medical Recommender on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)