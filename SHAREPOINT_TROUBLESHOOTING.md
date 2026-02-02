# SharePoint Integration Setup - Troubleshooting

## Current Status
The backend server is running but encountering a **401 Authentication Error** when trying to access SharePoint.

## Issue
`statusCode: 401, code: 'generalException'`

This means the Azure AD app registration doesn't have proper permissions or admin consent hasn't been granted.

## Required Actions in Azure Portal

### 1. Verify API Permissions
Go to your Azure AD App Registration:
- Navigate to: [Azure Portal > Azure Active Directory > App registrations](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)
- Find your app with Client ID: `4455669a-e3f5-44c5-9423-9f0053a891cd`

### 2. Check and Add Required Permissions
Click on **API permissions** and ensure you have:

#### Microsoft Graph Permissions (Application type):
- `Sites.ReadWrite.All` - Read and write items in all site collections
- `Files.ReadWrite.All` - Read and write files in all site collections

#### How to Add:
1. Click **Add a permission**
2. Choose **Microsoft Graph**
3. Choose **Application permissions** (NOT Delegated)
4. Search for and select:
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
5. Click **Add permissions**

### 3. Grant Admin Consent (CRITICAL!)
After adding permissions:
1. Click the **Grant admin consent for [Your Organization]** button
2. Click **Yes** to confirm
3. Wait for the status to show green checkmarks

### 4. Verify SharePoint Site Access
Make sure the app has access to your SharePoint site:
- The app may need explicit access to the SharePoint site
- Site URL: `https://ibvza.sharepoint.com/sites/AINexGen`

### 5. Alternative: Use SharePoint Specific Permissions
If the issue persists, you might need to add SharePoint-specific permissions:
1. In API permissions, click **Add a permission**
2. Choose **SharePoint**
3. Choose **Application permissions**
4. Add `Sites.FullControl.All`
5. Grant admin consent

## Testing the Fix

After completing the above steps:

1. **Restart the backend server:**
   ```
   cd backend
   npm start
   ```

2. **Check for successful connection:**
   You should see:
   ```
   SharePoint Site ID: [some-id]
   Excel File ID: [some-id]
   SharePoint initialized successfully
   ```

3. **Test from the admin dashboard:**
   - Click "Open Excel in SharePoint" button
   - Should open the Excel file in Office Online

## Common Issues

### "Admin consent required"
- Contact your Microsoft 365 administrator
- They need to grant consent in the Azure Portal

### "Access denied" 
- The service principal might not have access to the specific SharePoint site
- Ask your admin to grant the app access to the site

### "Invalid client secret"
- Verify the client secret is correct in `.env` file
- Secrets expire - you may need to generate a new one

## Need Help?
If issues persist, please provide:
1. Screenshot of API permissions page in Azure Portal
2. Whether admin consent shows green checkmarks
3. Your organization's Microsoft 365 admin contact

## Backend Configuration Files
All credentials are stored in: `backend/.env`
- **DO NOT** commit this file to source control
- It's already in `.gitignore`
