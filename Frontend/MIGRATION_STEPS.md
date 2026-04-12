# Migration Steps - Switch to Supabase Store

## Quick Migration (2 steps)

### Step 1: Update `app/_layout.tsx`

**Change this line:**
```typescript
import { SkincareStoreProvider } from "../hooks/use-skincare-store";
```

**To this:**
```typescript
import { SkincareStoreProvider } from "../hooks/use-skincare-store-supabase";
```

### Step 2: Create `.env` file

Create `Frontend/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**That's it!** The app will automatically:
- ✅ Use Supabase if `.env` is configured
- ✅ Fallback to AsyncStorage if Supabase isn't configured
- ✅ Work the same way as before

---

## What Changed?

### Before (AsyncStorage only)
- Data stored locally on device
- Lost when app is uninstalled
- No sync across devices

### After (Supabase + AsyncStorage)
- Data stored in cloud database
- Persists across devices
- Automatic fallback to local storage
- Same API - no code changes needed!

---

## Testing

1. **Without `.env` file:**
   - App works with AsyncStorage (same as before)

2. **With `.env` file:**
   - App uses Supabase
   - Data syncs to cloud
   - Check Supabase Dashboard to see data

---

## Files Created

- `lib/supabase.ts` - Supabase client
- `lib/api.ts` - API functions
- `hooks/use-skincare-store-supabase.ts` - Integrated store

**No changes needed to your existing components!** 🎉



