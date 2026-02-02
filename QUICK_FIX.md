# Quick Troubleshooting for Your Issues

## Issue 1: Accessing Admin Panel

### ❌ WRONG Way:
```
http://localhost:5173/admin.html  ← This won't work!
file:///admin.html                ← This won't work!
```

### ✅ CORRECT Way:
```
http://localhost:5173/admin       ← Use this!
```

**Steps:**
1. Make sure dev server is running: `npm run dev`
2. Open browser
3. Go to: `http://localhost:5173/admin` (just type `/admin` after the port)
4. You should see the login screen
5. Login with: **admin** / **admin123**

## Issue 2: Can't Type in Form Fields

**Possible causes:**
1. Form inputs might be read-only
2. React state not updating
3. Browser console has errors

**Check this:**
1. Open browser DevTools (press F12)
2. Go to Console tab
3. Look for any RED errors
4. Share what you see

## Issue 3: Items Not Formatted in Database

The items should be stored as JSONB. Let me check your Supabase:

1. Go to Supabase dashboard
2. Click "Table Editor"
3. Click "transactions" table
4. Click on a transaction row
5. Look at the "items" column

**It should look like this:**
```json
[
  {
    "name": "Gold Bar 1oz",
    "qty": 2,
    "unitPrice": 50000,
    "totalSales": 100000,
    "unitCos": 48000,
    "totalCos": 96000,
    "grossProfit1": 4000,
    "otherCostType": "Courier",
    "otherCostAmount": 200,
    "grossProfit2": 3800
  }
]
```

**If it's not formatted:**
- The data might be saving as text instead of JSONB
- Check your SQL script ran correctly

## Quick Test Steps

### Test 1: Is the dev server running?
```powershell
# In your goldform-react folder, run:
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Test 2: Can you access the main form?
1. Go to: `http://localhost:5173/`
2. You should see "IBV GOLD BUSINESS FORM TRANSACTION SHEET"
3. Try typing in "Client Full Name" field
4. Can you type?

### Test 3: Can you access admin?
1. Go to: `http://localhost:5173/admin` (add /admin to the URL)
2. You should see "Admin Dashboard" login screen
3. If you see 404 or blank page, there's a routing issue

## Common Mistakes

### ❌ Mistake 1: Trying to open HTML files directly
```
Double-clicking admin.html  ← Won't work with React!
file:///C:/Users/.../admin.html  ← Won't work!
```

### ✅ Solution: Use the dev server
```
npm run dev
Then go to: http://localhost:5173/admin
```

### ❌ Mistake 2: Going to wrong URL
```
http://localhost:5173/admin.html  ← No .html!
http://localhost:5173/admin/      ← No trailing slash needed
```

### ✅ Solution: Use exact path
```
http://localhost:5173/admin
```

## Debug Checklist

Run through these:

- [ ] Is `npm run dev` running? (Check terminal)
- [ ] Is there a message showing "Local: http://localhost:5173"?
- [ ] Can you visit http://localhost:5173 and see the form?
- [ ] Open browser console (F12) - any errors?
- [ ] Try going to http://localhost:5173/admin directly
- [ ] Does login screen appear?
- [ ] Can you type username: admin?
- [ ] Can you type password: admin123?

## Next Steps

Please do this and tell me what happens:

1. **Open PowerShell in goldform-react folder**
2. **Run:** `npm run dev`
3. **Open browser**
4. **Go to:** `http://localhost:5173`
5. **Open DevTools:** Press F12
6. **Go to Console tab**
7. **Take screenshot if there are errors**
8. **Then try:** `http://localhost:5173/admin`
9. **Tell me what you see**

## Expected Behavior

### At http://localhost:5173
- ✅ You should see the transaction form
- ✅ You should be able to type in all fields
- ✅ You should be able to add items
- ✅ Product dropdown should work

### At http://localhost:5173/admin
- ✅ You should see "Admin Dashboard" header
- ✅ You should see Username and Password fields
- ✅ You should be able to type in both fields
- ✅ You should be able to click LOGIN button

## If Still Not Working

Share with me:
1. What URL are you trying to access?
2. What do you see on the screen?
3. Any error messages in console (F12)?
4. Is the dev server running?
5. Screenshot of what you see would help!
