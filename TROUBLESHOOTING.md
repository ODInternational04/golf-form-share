# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### ❌ "npm: command not found" or "'npm' is not recognized"

**Problem**: Node.js/NPM not installed

**Solution**:
1. Download Node.js from https://nodejs.org
2. Install LTS version (Long Term Support)
3. Restart PowerShell
4. Verify: `node --version` and `npm --version`

### ❌ "Cannot find module 'react'"

**Problem**: Dependencies not installed

**Solution**:
```powershell
npm install
```

### ❌ Permission denied / EPERM error

**Problem**: Windows permissions or antivirus blocking

**Solution**:
```powershell
# Run PowerShell as Administrator
# Or temporarily disable antivirus
# Then:
npm install
```

## Development Server Issues

### ❌ Port 5173 already in use

**Problem**: Another app using the port

**Solution**:
```powershell
# Kill the process using the port
# Or Vite will auto-pick another port
# Just follow the new URL it shows
```

### ❌ Blank page when running dev server

**Problem**: JavaScript error or wrong path

**Solution**:
1. Open browser console (F12)
2. Look for error message
3. Check that you're at http://localhost:5173 (not different port)
4. Try hard refresh: Ctrl+Shift+R

### ❌ "Failed to fetch" or CORS error

**Problem**: Supabase not configured or wrong URL

**Solution**:
1. Check `.env` file exists
2. Verify VITE_SUPABASE_URL is correct
3. Verify VITE_SUPABASE_ANON_KEY is correct
4. Restart dev server: Stop and run `npm run dev` again

## Build Issues

### ❌ Build fails with module errors

**Problem**: Corrupted node_modules

**Solution**:
```powershell
# Delete and reinstall
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
npm run build
```

### ❌ "Out of memory" during build

**Problem**: Large dependencies or limited RAM

**Solution**:
```powershell
# Increase Node memory
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### ❌ Build succeeds but dist/ folder empty

**Problem**: Build output directory issue

**Solution**:
1. Check `vite.config.js` has `outDir: 'dist'`
2. Delete dist/ folder and rebuild
3. Check for errors in terminal

## Supabase Connection Issues

### ❌ "Invalid API key"

**Problem**: Wrong anon key or URL

**Solution**:
1. Go to Supabase dashboard
2. Settings → API
3. Copy Project URL (not reference ID)
4. Copy anon public key (not service_role key!)
5. Update `.env` file
6. Restart dev server

### ❌ "relation 'transactions' does not exist"

**Problem**: Database table not created

**Solution**:
1. Go to Supabase dashboard
2. SQL Editor → New Query
3. Copy SQL from SUPABASE_SETUP.md
4. Run the query
5. Verify "transactions" appears in Table Editor

### ❌ "permission denied for table transactions"

**Problem**: RLS policies not configured

**Solution**:
1. In Supabase, go to Authentication → Policies
2. Click "transactions" table
3. Verify 3 policies exist:
   - Allow public insert
   - Allow public read
   - Allow public update
4. If missing, re-run SQL from SUPABASE_SETUP.md

### ❌ Data not saving / inserting

**Problem**: RLS blocking or wrong data format

**Solution**:
1. Open browser DevTools → Console
2. Look for error message
3. Check Network tab for failed request
4. Click failed request to see error details
5. Common issues:
   - JSONB items field malformed
   - Missing required fields
   - RLS policy blocking

## Form Issues

### ❌ Form not submitting / no success message

**Problem**: Validation error or Supabase error

**Solution**:
1. Open browser console (F12)
2. Check for red error messages
3. Ensure all required fields filled (marked with *)
4. Ensure at least one item added to table
5. Check Network tab for API errors

### ❌ Calculations not working

**Problem**: JavaScript not running or wrong values

**Solution**:
1. Check console for errors
2. Verify you entered numbers (not text) in qty/price fields
3. Try entering values one at a time
4. Check that inputs aren't disabled

### ❌ "Cannot read property 'value' of null"

**Problem**: Element not found in DOM

**Solution**:
1. Check React component structure
2. Verify all inputs have correct refs/state
3. Look for typos in field names

## Admin Dashboard Issues

### ❌ Login not working

**Problem**: Wrong credentials or session issue

**Solution**:
1. Double-check credentials (case-sensitive):
   - admin / admin123
   - accountant / acc123
   - treasury / treas123
   - compliance / comp123
2. Clear browser cache: Ctrl+Shift+Delete
3. Try incognito/private window
4. Check console for errors

### ❌ "No transactions found" but data exists

**Problem**: Query error or filter hiding data

**Solution**:
1. Reset all filters to "All"
2. Clear search box
3. Check browser console for errors
4. Verify data exists in Supabase Table Editor

### ❌ Can't approve transactions

**Problem**: Update permission or wrong role

**Solution**:
1. Check you're logged in as correct role
2. Verify RLS policy allows updates
3. Check console for error message
4. Verify transaction ID is correct

### ❌ Excel download not working

**Problem**: XLSX library issue or no data

**Solution**:
1. Verify transactions exist
2. Check console for errors
3. Try with just one transaction
4. Ensure xlsx package installed: `npm install xlsx`

## Deployment Issues

### ❌ Blank page after deployment

**Problem**: Wrong base path or missing files

**Solution**:
1. Verify all files from `dist/` uploaded
2. Check assets/ folder uploaded
3. Upload .htaccess file
4. Check browser console (F12) for errors
5. Common issue: assets path wrong

**Fix for assets not loading**:
Check `vite.config.js` has:
```javascript
base: '/'  // Not '/dist/' or subdirectory
```

### ❌ "404 Not Found" on /admin route

**Problem**: .htaccess not working

**Solution**:
1. Verify .htaccess file uploaded
2. Check it's in same directory as index.html
3. Verify Apache mod_rewrite enabled
4. Contact hosting support if needed
5. Try adding to .htaccess:
```apache
Options +FollowSymLinks
RewriteEngine On
```

### ❌ Environment variables not working

**Problem**: Variables not embedded in build

**Solution**:
1. Verify .env file exists during build
2. Check variables start with `VITE_`
3. Rebuild: `npm run build`
4. Variables are baked into build (not read at runtime)

### ❌ Mixed content error (HTTP/HTTPS)

**Problem**: Loading HTTP content on HTTPS site

**Solution**:
1. Ensure Supabase URL uses HTTPS
2. Install SSL certificate on hosting
3. Force HTTPS in .htaccess:
```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### ❌ Upload fails via FTP

**Problem**: Connection issue or permissions

**Solution**:
1. Verify FTP credentials
2. Check you're in correct directory (public_html)
3. Ensure you have write permissions
4. Try File Manager instead
5. Try uploading as ZIP and extracting on server

## Browser-Specific Issues

### ❌ Works in Chrome but not Safari/Firefox

**Problem**: Browser compatibility

**Solution**:
1. Clear cache in that browser
2. Check browser console for specific errors
3. Ensure JavaScript enabled
4. Try latest browser version

### ❌ Works locally but not on phone

**Problem**: Mobile browser differences

**Solution**:
1. Check responsive design (rare issue with this app)
2. Verify HTTPS enabled (required for some features)
3. Test in mobile browser desktop mode
4. Check console on mobile (connect to computer)

## Performance Issues

### ❌ Site loading slowly

**Problem**: Large files or slow server

**Solution**:
1. Verify .htaccess compression enabled
2. Check Supabase in same region as users
3. Enable CDN if hosting supports it
4. Check internet connection
5. Look at Network tab to find slow requests

### ❌ Excel export takes too long

**Problem**: Many transactions

**Solution**:
1. Expected behavior with 1000+ transactions
2. Filter data before exporting
3. Consider exporting in batches
4. Check if browser freezing (normal for large exports)

## Data Issues

### ❌ Transactions missing items

**Problem**: Items array empty or null

**Solution**:
1. Check form requires at least one item
2. Verify items saved as JSONB array
3. Check Supabase for actual data
4. Ensure submit button clicked after adding items

### ❌ Numbers showing as text

**Problem**: Type mismatch

**Solution**:
1. Check input type="number" on form
2. Verify parseFloat() used when saving
3. Check database column types

### ❌ Dates not displaying correctly

**Problem**: Date format or timezone issue

**Solution**:
1. Dates stored in ISO format
2. Use `new Date(dateString).toLocaleDateString()`
3. Check browser timezone settings

## Common Error Messages Decoded

### "Failed to fetch"
- **Cause**: Network issue or wrong Supabase URL
- **Fix**: Check .env file, verify internet connection

### "Cannot read properties of undefined"
- **Cause**: Accessing property on null/undefined object
- **Fix**: Check console line number, add null checks

### "Unexpected token <"
- **Cause**: Server returning HTML instead of JSON
- **Fix**: Check API endpoint, verify Supabase project active

### "CORS policy blocked"
- **Cause**: Cross-origin request issue
- **Fix**: Verify Supabase RLS policies, check URL

### "Maximum update depth exceeded"
- **Cause**: Infinite loop in React state updates
- **Fix**: Check useEffect dependencies, avoid state updates in render

## Still Having Issues?

### Debug Checklist

- [ ] Check browser console (F12 → Console)
- [ ] Check Network tab for failed requests
- [ ] Verify .env file has correct values
- [ ] Verify Supabase project is active
- [ ] Try in incognito/private window
- [ ] Clear browser cache completely
- [ ] Try different browser
- [ ] Check Supabase logs in dashboard
- [ ] Verify all files uploaded correctly
- [ ] Check file permissions on server

### Getting Help

1. **Check Documentation**
   - README.md
   - QUICKSTART.md
   - DEPLOYMENT.md
   - SUPABASE_SETUP.md

2. **Check Logs**
   - Browser console
   - Supabase dashboard logs
   - Server error logs (cPanel)

3. **Google the Error**
   - Copy exact error message
   - Add "React" or "Supabase" to search
   - Check Stack Overflow

4. **Ask for Help**
   - Include exact error message
   - Include what you were trying to do
   - Include browser console screenshot
   - Mention which step of setup you're on

## Prevention Tips

✅ **Always**:
- Run `npm install` before first use
- Create .env from .env.example
- Run `npm run build` before deploying
- Upload ALL files from dist/
- Test locally before deploying
- Keep browser DevTools open when testing
- Check Supabase project is active

❌ **Never**:
- Commit .env file to git
- Use service_role key in frontend
- Deploy without testing locally
- Skip .htaccess file
- Edit code directly on server
- Share admin passwords publicly

## Quick Fixes

```powershell
# Reset everything and start fresh
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
Remove-Item .env
Copy-Item .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

---

**Remember**: 90% of issues are caused by:
1. Missing .env file
2. Wrong Supabase credentials  
3. Forgot to run `npm install`
4. Missing .htaccess on deployment
5. Database table not created

Check these first! 🎯
