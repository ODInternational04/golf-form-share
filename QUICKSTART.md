# 🚀 Quick Start Guide

Get your IBV Gold Form up and running in 5 minutes!

## Step 1: Setup Supabase (2 minutes)

1. Go to https://supabase.com and create a free account
2. Click "New Project"
3. Choose a name (e.g., "ibv-gold-form")
4. Choose a strong password and region
5. Wait for project to initialize (~2 minutes)

## Step 2: Create Database Table (1 minute)

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire SQL script from `SUPABASE_SETUP.md` (starting with `CREATE TABLE transactions...`)
4. Paste it into the editor
5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned"

## Step 3: Get Your Credentials (30 seconds)

1. In Supabase dashboard, click "Settings" (gear icon) in the left sidebar
2. Click "API" in the settings menu
3. Copy your "Project URL"
4. Copy your "anon public" key (under "Project API keys")

## Step 4: Configure Your App (30 seconds)

1. Open the `goldform-react` folder
2. Rename `.env.example` to `.env`
3. Edit `.env` and paste your credentials:
```
VITE_SUPABASE_URL=paste_project_url_here
VITE_SUPABASE_ANON_KEY=paste_anon_key_here
```
4. Save the file

## Step 5: Install and Run (1 minute)

Open PowerShell in the `goldform-react` folder and run:

```powershell
npm install
```

Wait for installation to complete, then run:

```powershell
npm run dev
```

🎉 **Done!** Your app is now running at http://localhost:5173

## Test It Out

### Test the Form
1. Go to http://localhost:5173
2. Fill out the form
3. Add at least one item
4. Click "SUBMIT TRANSACTION"
5. You should see "✓ Transaction saved successfully!"

### Test the Admin Dashboard
1. Go to http://localhost:5173/admin
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. You should see your transaction
4. Click "View Details" to see full info
5. Click "Approve" to approve it

## Deploy to Your Domain

When you're ready to go live:

1. Build for production:
```powershell
npm run build
```

2. Upload everything from the `dist` folder to your web hosting

3. Done! See `DEPLOYMENT.md` for detailed instructions.

## Quick Reference

### Admin Logins
- **admin** / admin123 - Administrator
- **accountant** / acc123 - Accountant
- **treasury** / treas123 - Treasury Manager
- **compliance** / comp123 - Compliance Officer

### URLs
- Main Form: `/`
- Admin Dashboard: `/admin`

### Common Commands
```powershell
npm install          # Install dependencies
npm run dev          # Run development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Need Help?

1. **Supabase not connecting?**
   - Check your `.env` file has correct credentials
   - Make sure you ran the SQL script
   - Verify RLS policies are enabled

2. **Form not submitting?**
   - Open browser console (F12) and check for errors
   - Verify Supabase project is active
   - Check network tab for failed requests

3. **Admin login not working?**
   - Make sure you're using exact credentials (case-sensitive)
   - Try clearing browser cache

4. **Build errors?**
   - Delete `node_modules` folder
   - Run `npm install` again
   - Make sure Node.js is installed (check: `node --version`)

## What's Next?

✅ Customize products in `TransactionForm.jsx`
✅ Change admin passwords in `AdminDashboard.jsx`
✅ Modify styling in `index.css`
✅ Deploy to your domain (see `DEPLOYMENT.md`)

Happy coding! 🎉
