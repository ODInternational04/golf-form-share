# Common Tasks & Commands

Quick reference for common operations.

## Development

### Start Development Server
```powershell
npm run dev
```
Opens at http://localhost:5173

### Build for Production
```powershell
npm run build
```
Creates `dist/` folder with production files

### Preview Production Build
```powershell
npm run preview
```
Test production build locally before deploying

## Customization

### Change Product List
**File**: `src/components/TransactionForm.jsx`

Find this array:
```javascript
const DEFAULT_PRODUCTS = [
  'Gold Bar 1oz',
  'Gold Bar 5g',
  // ... add or remove products here
]
```

### Change Admin Passwords
**File**: `src/components/AdminDashboard.jsx`

Find this object:
```javascript
const ADMIN_USERS = {
  'admin': { password: 'admin123', role: 'Administrator' },
  'accountant': { password: 'acc123', role: 'Accountant' },
  // ... change passwords here
}
```

After changes, rebuild: `npm run build`

### Modify Form Fields
**File**: `src/components/TransactionForm.jsx`

1. Add/remove JSX in the form
2. Update `formData` state
3. Update Supabase insert in `handleSubmit`
4. Update database schema if needed

### Change Styling
**File**: `src/index.css`

All styles are in one file. Find the section you want to change:
- `.container` - Main wrapper
- `.header` - Logo and title
- `.section` - Form sections
- `.submit-btn` - Submit button
- etc.

## Database

### View Data in Supabase
1. Go to https://app.supabase.com
2. Select your project
3. Click "Table Editor"
4. Click "transactions" table

### Manually Add Transaction
In Supabase SQL Editor:
```sql
INSERT INTO transactions (
  transaction_date,
  client_name,
  id_passport,
  sales_consultant,
  items,
  total_gross_profit
) VALUES (
  '2026-01-23',
  'Test Client',
  'ID12345',
  'John Sales',
  '[{"name":"Gold Bar 1oz","qty":1,"unitPrice":50000}]'::jsonb,
  5000
);
```

### Delete All Transactions
```sql
DELETE FROM transactions;
```

### Export Data
In Supabase SQL Editor:
```sql
SELECT * FROM transactions;
```
Click "Download" in results

## Deployment

### Deploy to RegisterDomain (Full)
```powershell
# 1. Build
npm run build

# 2. Upload via FTP
# Upload everything in dist/ to public_html/

# 3. Upload .htaccess
# Copy public/.htaccess to public_html/
```

### Update Live Site
```powershell
# 1. Make changes in code
# 2. Build again
npm run build

# 3. Upload new dist/ contents
# Replace files on server
```

### Quick Deploy (No Install)
If you already ran `npm install`:
```powershell
npm run build
# Upload dist/
```

## Troubleshooting

### "Cannot find module 'react'"
```powershell
npm install
```

### Build fails
```powershell
# Clear everything and reinstall
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
npm run build
```

### Form not submitting
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed requests
5. Verify Supabase credentials in .env

### Admin login not working
1. Check exact username/password (case-sensitive)
2. Check browser console for errors
3. Try clearing browser cache
4. Verify you're on /admin route

### Blank page after deploy
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Check .htaccess is present
4. Verify Supabase credentials are in build

### React Router not working
1. Verify .htaccess file is uploaded
2. Check mod_rewrite is enabled on server
3. Try accessing index.html directly

## Testing

### Test Form Submission
1. Go to http://localhost:5173
2. Fill required fields (marked with *)
3. Add at least one item
4. Click Submit
5. Should see success message

### Test Admin Dashboard
1. Go to http://localhost:5173/admin
2. Login with: admin / admin123
3. Should see transactions table
4. Click "View Details" on a transaction
5. Click "Approve" button

### Test Excel Export
1. Login to admin dashboard
2. Submit a few transactions
3. Click "Download Excel Report"
4. Should download transactions.xlsx
5. Open in Excel to verify

## File Locations

### Environment Variables
```
.env (create from .env.example)
```

### Main Application Code
```
src/main.jsx                 - App entry
src/components/TransactionForm.jsx
src/components/AdminDashboard.jsx
```

### Styling
```
src/index.css                - All styles
```

### Configuration
```
vite.config.js              - Build config
package.json                - Dependencies
```

### Documentation
```
README.md                   - Project overview
QUICKSTART.md              - 5-minute setup
DEPLOYMENT.md              - Deploy guide
SUPABASE_SETUP.md          - Database setup
```

## Environment Variables

### Required Variables
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...xxx
```

### Where to Use Them
```javascript
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

### Production Note
Environment variables are embedded in build at compile time.
If you change them, you must rebuild:
```powershell
npm run build
```

## Git Commands (If Using Git)

### Initialize Repository
```powershell
git init
git add .
git commit -m "Initial commit"
```

### Push to GitHub
```powershell
git remote add origin https://github.com/yourusername/goldform-react.git
git branch -M main
git push -u origin main
```

### Update After Changes
```powershell
git add .
git commit -m "Description of changes"
git push
```

### Important: Never Commit .env
The `.gitignore` file prevents this, but verify:
```powershell
# This should NOT show .env
git status
```

## NPM Commands

### Install Specific Package
```powershell
npm install package-name
```

### Update Dependencies
```powershell
npm update
```

### Check for Outdated Packages
```powershell
npm outdated
```

### Audit Security
```powershell
npm audit
npm audit fix
```

## Quick Checks

### Is Node.js Installed?
```powershell
node --version
```
Should show v14 or higher

### Is NPM Installed?
```powershell
npm --version
```
Should show version number

### Is Project Set Up?
Check for these:
- [ ] `node_modules/` folder exists
- [ ] `.env` file exists with credentials
- [ ] Can run `npm run dev` successfully

### Is Supabase Working?
1. Go to https://app.supabase.com
2. Click your project
3. Click "Table Editor"
4. See "transactions" table

## Performance Tips

### Optimize Build Size
Already done by Vite automatically

### Enable Compression
Upload `.htaccess` file (included in `public/`)

### Use CDN
If hosting supports it, enable CDN in cPanel

### Cache Busting
Vite adds hashes to filenames automatically:
```
index-abc123.js
index-def456.css
```

## Security Checklist

- [x] RLS enabled on Supabase
- [x] .env not committed to git
- [x] HTTPS on production site
- [x] Security headers in .htaccess
- [ ] Change admin passwords (in code)
- [ ] Implement real auth (future)

## Need More Help?

1. Read the documentation files
2. Check browser console (F12)
3. Check Supabase logs
4. Google the error message
5. Check Supabase docs: https://supabase.com/docs

## Quick Reference Links

- **Supabase Dashboard**: https://app.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **RegisterDomain**: Your hosting control panel

---

**Tip**: Bookmark this file for quick reference!
