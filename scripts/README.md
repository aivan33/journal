# Re-embedding Script

This script upgrades your embeddings from **voyage-3-lite (512 dimensions)** to **voyage-3 (1024 dimensions)**.

## Migration Steps

### 1. Run Database Migrations

In your Supabase SQL Editor, run these files in order:

```sql
-- Step 1: Upgrade the embedding column to 1024 dimensions
-- Run: supabase/upgrade-to-voyage-3.sql

-- Step 2: Update the match_entries function
-- Run: supabase/match-entries-function.sql
```

### 2. Run Re-embedding Script

Make sure your `.env.local` has the required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VOYAGE_API_KEY`

The script automatically loads environment variables from `.env.local`.

Run the re-embedding script:

```bash
npm run reembed
```

## What the Script Does

1. Fetches all entries from your database
2. For each entry:
   - Generates a new 1024-dimensional embedding using voyage-3
   - Updates the database with the new embedding
   - Waits 25 seconds before the next request (3 RPM rate limit)
3. Displays progress and final statistics

## Estimated Time

The script respects Voyage AI's 3 requests per minute rate limit:
- **10 entries**: ~4 minutes
- **25 entries**: ~10 minutes
- **50 entries**: ~20 minutes
- **100 entries**: ~40 minutes

## Expected Output

```
Found 15 entries to re-embed

Processing: My First Journal Entry
✓ Successfully re-embedded: My First Journal Entry
Waiting 25 seconds before next request...

Processing: React Hooks Guide
✓ Successfully re-embedded: React Hooks Guide
Waiting 25 seconds before next request...

...

=== Re-embedding Complete ===
Successful: 15
Failed: 0
Total: 15

Script completed successfully
```

## Notes

- The script processes entries sequentially with 25-second delays (3 RPM rate limit)
- You can safely interrupt the script (Ctrl+C) and restart - it will update remaining entries
- Failed embeddings are logged but don't stop the script
- Existing entries will continue to work during migration
- Related entries will become more accurate after migration
- The script may take a while for large journals - be patient!
