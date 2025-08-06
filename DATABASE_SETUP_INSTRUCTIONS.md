# Database Setup Instructions

## Problem
You're seeing the error: "Failed to load cash flow data: relation 'public.transactions' does not exist"

This indicates that your Supabase database schema hasn't been set up yet.

## Solution

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Copy the entire contents of `supabase/migrations/20250802172431_accounting_pro_complete_schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration
6. Refresh your application

### Option 2: Using Supabase CLI
1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Push the migrations:
   ```bash
   supabase db push
   ```

### Option 3: Manual Setup
If the above options don't work, you can manually create the tables:

1. Go to Supabase Dashboard → SQL Editor
2. Run each CREATE TABLE statement from the migration file one by one
3. Make sure to run them in order (types first, then tables, then policies)

## Verification
After running the migration, you should see these tables in your Supabase dashboard:
- user_profiles
- accounts
- clients
- transactions
- reports
- tax_filings
- bank_accounts
- bank_transactions
- documents
- activity_logs

## Troubleshooting

### "Permission denied" errors
- Make sure you're using the correct Supabase project
- Check that your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct

### "Project paused" errors
- Free tier Supabase projects pause after 1 week of inactivity
- Go to your Supabase dashboard and click "Resume" to reactivate

### Connection timeout
- Check your internet connection
- Verify Supabase service status at status.supabase.com

## Environment Variables
Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Need Help?
- Check the Supabase documentation: https://supabase.com/docs
- Contact support through your Supabase dashboard
- Verify your project is active and not paused