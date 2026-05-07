# Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase-schema.sql`.
3. Open `supabase-config.js` and paste your project URL and anon public key:

```js
window.supabaseConfig = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-ANON-PUBLIC-KEY"
};
```

4. Add approved rows to the `references` table.

The website reads only rows where `status = 'approved'`.
Public submissions are inserted with `status = 'pending'`, so they do not appear until reviewed.

For now, `data.js` remains as a local fallback. Once all existing references are imported into Supabase, it can be removed from `index.html`.
