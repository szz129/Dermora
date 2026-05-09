import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

CATEGORY_MAP = {
    'cleanser':    'Cleanser',
    'moisturiser': 'Moisturizer',
    'moisturizer': 'Moisturizer',
    'serum':       'Serum',
    'toner':       'Toner',
    'treatment':   'Treatment',
    'sunscreen':   'Sunscreen',
}

csv_path = os.path.join(os.path.dirname(__file__), 'pakistan_skincare_products_final.csv')
df = pd.read_csv(csv_path)
df = df.dropna(subset=['product_name'])
print(f"✅ Loaded {len(df)} products")

success = 0
failed = 0

for _, row in df.iterrows():
    try:
        raw_category = str(row.get('category', '')).strip().lower()
        category = CATEGORY_MAP.get(raw_category, 'Treatment')

        targets_raw = str(row.get('targets', ''))
        targets_list = [t.strip() for t in targets_raw.split(',') if t.strip()]

        skin_type_raw = str(row.get('suitable_for_skin_type', ''))
        skin_type_list = [s.strip() for s in skin_type_raw.split(',') if s.strip()]

        def clean(val):
            v = str(row.get(val, '')).strip()
            return '' if v == 'nan' else v

        product = {
            'name':             clean('product_name'),
            'brand':            clean('brand'),
            'category':         category,
            'price_pkr':        float(row.get('price_pkr', 0)) if pd.notna(row.get('price_pkr')) else 0,
            'skin_type_target': targets_list,
            'suitable_for':     skin_type_list,
            'description':      clean('notes'),
            'ingredients':      clean('key_ingredients'),
            'full_ingredients': clean('full_ingredients'),
            'where_to_buy':     clean('where_to_buy'),
            'product_url':      clean('product_url'),
            'image_url':        clean('image_url'),
            'targets':          targets_list,
        }

        supabase.table('product_catalog').insert(product).execute()
        success += 1
        print(f"  ✅ {product['name']} ({product['category']})")

    except Exception as e:
        failed += 1
        print(f"  ❌ {row.get('product_name', 'unknown')} — {e}")

print(f"\n✅ Uploaded: {success} | ❌ Failed: {failed}")