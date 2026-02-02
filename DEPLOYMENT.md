# Deployment Guide for RegisterDomain

This guide explains how to deploy your IBV Gold Form application to your domain on RegisterDomain.

## Prerequisites

1. A domain registered with RegisterDomain
2. Access to your hosting control panel (cPanel or similar)
3. Supabase account with database configured (see SUPABASE_SETUP.md)
4. Node.js installed on your local machine for building

## Step 1: Configure Environment Variables

1. Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace with your actual Supabase credentials

## Step 2: Install Dependencies

Open a terminal/PowerShell in the project folder and run:

```bash
npm install
```

Wait for all packages to download and install.

## Step 3: Build for Production

Run the build command:

```bash
npm run build
```

This creates a `dist` folder with all your production-ready files.

## Step 4: Upload to RegisterDomain

### Option A: Using File Manager (Recommended for beginners)

1. Login to your RegisterDomain hosting control panel
2. Navigate to File Manager
3. Go to your website's root directory (usually `public_html` or `www`)
4. Upload all files from the `dist` folder:
   - index.html
   - assets/ folder (contains all CSS and JS)
   
5. Make sure the file structure looks like:
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   ├── index-[hash].css
   │   └── ...
   ```

### Option B: Using FTP

1. Get your FTP credentials from RegisterDomain
2. Use an FTP client like FileZilla
3. Connect to your server
4. Upload all contents from the `dist` folder to `public_html`

## Step 5: Configure Routing (Important!)

Since this is a Single Page Application (SPA) with React Router, you need to configure the server to redirect all requests to `index.html`.

### For Apache (most common):

Create a `.htaccess` file in your `public_html` directory with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

Upload this file to the same directory as your `index.html`.

## Step 6: Test Your Deployment

1. Visit your domain (e.g., https://yourdomain.com)
2. You should see the transaction form
3. Try submitting a test transaction
4. Visit https://yourdomain.com/admin to access the admin dashboard
5. Test logging in with one of the admin credentials

## Accessing the Application

- **Main Form**: `https://yourdomain.com`
- **Admin Dashboard**: `https://yourdomain.com/admin`

### Admin Login Credentials:
- Username: `admin` | Password: `admin123` (Administrator)
- Username: `accountant` | Password: `acc123` (Accountant)
- Username: `treasury` | Password: `treas123` (Treasury Manager)
- Username: `compliance` | Password: `comp123` (Compliance Officer)

## Updating the Application

To update your application after making changes:

1. Make your code changes
2. Run `npm run build`
3. Upload the new contents of the `dist` folder to your server
4. Clear browser cache or use Ctrl+F5 to force reload

## Troubleshooting

### Blank page after deployment
- Check browser console for errors (F12)
- Verify all files were uploaded correctly
- Make sure `.htaccess` file is present (if using Apache)
- Check that environment variables are correctly embedded in the build

### "404 Not Found" when navigating to /admin
- Verify `.htaccess` file is present and configured correctly
- Check that mod_rewrite is enabled on your server
- Contact RegisterDomain support if needed

### Form submissions not working
- Check browser console for CORS errors
- Verify Supabase URL and API key in your build
- Check Supabase RLS policies
- Verify network requests in browser DevTools

### Admin login not working
- Verify you're using the correct credentials
- Check browser console for errors
- Clear browser cache and try again

## SSL Certificate (HTTPS)

Most hosting providers including RegisterDomain offer free SSL certificates:

1. Login to your control panel
2. Look for "SSL/TLS" or "Let's Encrypt"
3. Install free SSL certificate for your domain
4. This ensures secure data transmission

## Performance Optimization

1. **Enable Gzip Compression**: Add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

2. **Browser Caching**: Add to `.htaccess`:
```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## Security Recommendations

1. **Change Admin Passwords**: After deployment, consider changing the hard-coded admin passwords in the source code and rebuilding
2. **Implement Supabase Auth**: For production, use proper authentication instead of hard-coded credentials
3. **Regular Backups**: Use RegisterDomain's backup features regularly
4. **Monitor Access**: Check your Supabase dashboard for unusual activity

## Support

- **Supabase Issues**: https://supabase.com/docs
- **RegisterDomain Support**: Contact their support team for hosting-related issues
- **Application Issues**: Check browser console and Supabase logs

## Local Development

To run locally for testing:

```bash
npm run dev
```

Visit http://localhost:5173 in your browser.

## File Structure Reference

```
goldform-react/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── TransactionForm.jsx
│   │   └── AdminDashboard.jsx
│   ├── lib/
│   │   └── supabase.js  # Supabase client
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables (DO NOT COMMIT)
├── .env.example         # Example env file
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Build configuration
└── SUPABASE_SETUP.md    # Database setup guide
```
