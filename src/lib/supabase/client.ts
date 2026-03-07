import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
→ **Commit directly to main** ✅

---

## 📁 Fichier 2

**"Add file" → "Create new file"**, dans le nom tape :
```
src/lib/supabase/server.ts
