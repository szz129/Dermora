# Frontend-Backend Integration Guide

## ✅ Quick Setup (5 minutes)

### Step 1: Install Supabase Package

```bash
cd Frontend
npm install @supabase/supabase-js
```

### Step 2: Create Environment File

Create `Frontend/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get these from:** Supabase Dashboard → Settings → API

### Step 3: Update Your Store

Replace the import in your app files:

**Before:**
```typescript
import { useSkincareStore } from '../hooks/use-skincare-store';
```

**After:**
```typescript
import { useSkincareStore } from '../hooks/use-skincare-store-supabase';
```

### Step 4: Test!

The app will automatically:
- ✅ Use Supabase if configured
- ✅ Fallback to AsyncStorage if Supabase fails
- ✅ Work offline with AsyncStorage

---

## 🔄 How It Works

### Automatic Fallback

The integrated store (`use-skincare-store-supabase.ts`) automatically:

1. **Checks if Supabase is configured** (via `.env` file)
2. **Tries to load from Supabase** first
3. **Falls back to AsyncStorage** if Supabase fails or isn't configured
4. **Saves to both** when Supabase is available

### Testing User ID

For testing without authentication, the store uses a test user ID:
```typescript
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";
```

**To use real authentication later:**
1. Replace `TEST_USER_ID` with actual user ID from auth
2. Enable RLS in database schema
3. Update API calls to use authenticated user

---

## 📁 Files Created

```
Frontend/
├── lib/
│   ├── supabase.ts        ← Supabase client (checks if configured)
│   └── api.ts             ← API functions (with transformations)
└── hooks/
    └── use-skincare-store-supabase.ts  ← Integrated store
```

---

## 🧪 Testing Checklist

- [ ] Supabase project created
- [ ] Database schema run (with RLS disabled)
- [ ] `.env` file created with API keys
- [ ] `@supabase/supabase-js` installed
- [ ] Store import updated to `use-skincare-store-supabase`
- [ ] App runs without errors
- [ ] Data saves to Supabase (check dashboard)
- [ ] Data loads from Supabase on app restart

---

## 🐛 Troubleshooting

### "Supabase is not configured"
- Check `.env` file exists
- Check environment variable names start with `EXPO_PUBLIC_`
- Restart Expo dev server after creating `.env`

### "Table doesn't exist"
- Run `database/schema.sql` in Supabase SQL Editor
- Check table names match exactly

### "Permission denied"
- RLS is disabled, so this shouldn't happen
- If it does, check schema.sql was run correctly

### Data not saving
- Check browser console for errors
- Check Supabase Dashboard → Table Editor for data
- Verify `.env` file has correct keys

---

## 🚀 Next Steps

1. **Test basic CRUD operations**
   - Save profile
   - Add skin analysis
   - Add cycle data

2. **Check Supabase Dashboard**
   - Go to Table Editor
   - Verify data is being saved

3. **Enable Authentication** (later)
   - Set up Supabase Auth
   - Replace TEST_USER_ID with real user ID
   - Enable RLS policies

---

## 📝 Notes

- **RLS is disabled** for testing - enable it for production!
- **Test user ID** is hardcoded - replace with auth later
- **Automatic fallback** ensures app works even if Supabase fails
- **Data transformation** is handled automatically (camelCase ↔ snake_case)



