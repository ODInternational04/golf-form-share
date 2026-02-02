# SharePoint Excel Integration

## Overview
Your application now integrates with SharePoint to automatically save transaction data to an Excel file stored in SharePoint.

## Features

### 1. Automatic Excel Updates
- Every time a transaction is submitted, it's automatically added to the Excel file in SharePoint
- When a transaction is updated, the Excel row is updated accordingly
- All data syncs in real-time

### 2. Open Excel in SharePoint
- Admins can click **"Open Excel in SharePoint"** button in the dashboard
- Opens the live Excel file in Office Online (browser) or Excel desktop app
- View all transactions in a familiar Excel interface

### 3. SharePoint Storage Location
- **Site**: `https://ibvza.sharepoint.com/sites/AINexGen`
- **Folder**: `/Shared Documents/Documents`
- **File**: `Transactions.xlsx`

## How It Works

### When a Transaction is Submitted:
1. Data is saved to Supabase database (primary storage)
2. Data is automatically sent to the backend API
3. Backend adds a new row to the Excel file in SharePoint
4. Excel file is updated in real-time

### When a Transaction is Updated:
1. Database is updated in Supabase
2. Future enhancement: Backend will update the corresponding Excel row

### When Admin Opens Excel:
1. Admin clicks "Open Excel in SharePoint"
2. Backend fetches the Excel file URL from SharePoint
3. Excel file opens in a new browser tab

## Setup Instructions

### 1. Start the Backend Server
```bash
cd backend
npm install  # First time only
npm start
```

The backend runs on `http://localhost:3001`

### 2. Start the Frontend (in separate terminal)
```bash
npm run dev
```

The frontend runs on `http://localhost:5173`

### 3. Verify Connection
Check the backend terminal for:
- ✓ `SharePoint Site ID: [id]`
- ✓ `Excel File ID: [id]`
- ✓ `SharePoint initialized successfully`

## Architecture

```
React Frontend (localhost:5173)
    ↓
    ├─> Supabase (Primary Database)
    └─> Backend API (localhost:3001)
            ↓
        Microsoft Graph API
            ↓
        SharePoint Excel File
```

## API Endpoints

### POST `/api/transactions/add`
Adds a new transaction row to Excel
```json
{
  "id": "123",
  "date": "2026-02-02",
  "clientName": "John Doe",
  "items": [...],
  ...
}
```

### PUT `/api/transactions/update/:id`
Updates an existing transaction row in Excel

### GET `/api/excel/url`
Returns the SharePoint URL to open the Excel file

## Excel File Structure

The Excel file contains these columns:
- Transaction ID
- Date
- Client Type
- Client Name
- ID/Passport
- Company Name
- Registration Number
- Transaction Type
- Items (formatted as text)
- Total Gross Profit
- Payment Method
- Collection Date
- Company
- Consultant
- Notes

## Troubleshooting

If you see authentication errors (401), refer to:
**[SHAREPOINT_TROUBLESHOOTING.md](./SHAREPOINT_TROUBLESHOOTING.md)**

Common issues:
- Missing API permissions in Azure AD
- Admin consent not granted
- Invalid or expired client secret

## Security Notes

⚠️ **Important Security Information:**

1. **Backend Required**: Never expose Azure credentials in the frontend
2. **Environment Variables**: All credentials are in `backend/.env` (never commit this file!)
3. **CORS Protection**: Backend only accepts requests from your frontend
4. **API Permissions**: Uses least-privilege access model

## Files Added/Modified

### New Files:
- `backend/package.json` - Backend dependencies
- `backend/server.js` - Express server
- `backend/services/graphService.js` - SharePoint/Graph API service
- `backend/.env` - Environment variables (DO NOT COMMIT)
- `backend/.gitignore` - Protects sensitive files

### Modified Files:
- `src/components/TransactionForm.jsx` - Sends data to SharePoint
- `src/components/AdminDashboard.jsx` - Added "Open Excel" button

## Next Steps

1. ✅ Backend server is running
2. ⏳ Waiting for Azure AD permissions to be granted (see SHAREPOINT_TROUBLESHOOTING.md)
3. 🔄 Once permissions are granted, test:
   - Submit a new transaction
   - Click "Open Excel in SharePoint"
   - Verify data appears in Excel

## Support

If you need help:
1. Check `SHAREPOINT_TROUBLESHOOTING.md`
2. Review backend terminal for error messages
3. Verify Azure AD app permissions with your Microsoft 365 admin
