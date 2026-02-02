require('dotenv').config();
const express = require('express');
const cors = require('cors');
const graphService = require('./services/graphService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

// Cache site ID and file IDs per company
let cachedSiteId = null;
let cachedFileIds = {}; // { companyName: fileId }

// Initialize SharePoint connection for a specific company
async function initializeSharePoint(companyName = null) {
  try {
    if (!cachedSiteId) {
      cachedSiteId = await graphService.getSiteId();
      console.log('SharePoint Site ID:', cachedSiteId);
    }

    // Map "Gold Gateway - IBV Gold KZN" to 'default' cache key since it uses Transactions.xlsx
    const cacheKey = (companyName === 'Gold Gateway - IBV Gold KZN' || !companyName) ? 'default' : companyName;
    
    if (!cachedFileIds[cacheKey]) {
      const file = await graphService.getOrCreateExcelFile(cachedSiteId, 'Transactions.xlsx', companyName);
      cachedFileIds[cacheKey] = file.id;
      console.log(`Excel File ID for ${cacheKey}:`, file.id);
    }

    return { siteId: cachedSiteId, fileId: cachedFileIds[cacheKey] };
  } catch (error) {
    console.error('Error initializing SharePoint:', error);
    // If file not found, clear the cache and try once more
    if (error.statusCode === 404) {
      const cacheKey = (companyName === 'Gold Gateway - IBV Gold KZN' || !companyName) ? 'default' : companyName;
      console.log(`File not found for ${cacheKey}, clearing cache and recreating...`);
      delete cachedFileIds[cacheKey];
      const file = await graphService.getOrCreateExcelFile(cachedSiteId, 'Transactions.xlsx', companyName);
      cachedFileIds[cacheKey] = file.id;
      console.log(`Excel File ID (recreated) for ${cacheKey}:`, file.id);
      return { siteId: cachedSiteId, fileId: cachedFileIds[cacheKey] };
    }
    throw error;
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Add transaction to Excel
app.post('/api/transactions/add', async (req, res) => {
  try {
    const transactionData = req.body;
    const companyName = req.body.company_name || null;
    
    let { siteId, fileId } = await initializeSharePoint(companyName);
    
    try {
      await graphService.addTransactionRow(siteId, fileId, transactionData);
    } catch (error) {
      // If file not found, clear cache and recreate
      if (error.statusCode === 404 || error.code === 'FileOpenNotFound') {
        console.log('File not found during add, recreating...');
        const cacheKey = (companyName === 'Gold Gateway - IBV Gold KZN' || !companyName) ? 'default' : companyName;
        delete cachedFileIds[cacheKey];
        const reinit = await initializeSharePoint(companyName);
        fileId = reinit.fileId;
        await graphService.addTransactionRow(siteId, fileId, transactionData);
      } else {
        throw error;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Transaction added to SharePoint Excel successfully' 
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update transaction in Excel
app.put('/api/transactions/update/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const transactionData = req.body;
    const companyName = req.body.company_name || null;
    
    let { siteId, fileId } = await initializeSharePoint(companyName);
    
    try {
      await graphService.updateTransactionRow(siteId, fileId, transactionId, transactionData);
    } catch (error) {
      // If file not found, clear cache and recreate
      if (error.statusCode === 404 || error.code === 'FileOpenNotFound') {
        console.log('File not found during update, recreating...');
        const cacheKey = (companyName === 'Gold Gateway - IBV Gold KZN' || !companyName) ? 'default' : companyName;
        delete cachedFileIds[cacheKey];
        const reinit = await initializeSharePoint(companyName);
        fileId = reinit.fileId;
        // After recreating, we can't update a non-existent row, so add it instead
        await graphService.addTransactionRow(siteId, fileId, transactionData);
      } else {
        throw error;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Transaction updated in SharePoint Excel successfully' 
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Excel file URL for opening
app.get('/api/excel/url', async (req, res) => {
  try {
    const companyName = req.query.companyName || null;
    const { siteId } = await initializeSharePoint(companyName);
    
    let url;
    try {
      url = await graphService.getExcelFileUrl(siteId, 'Transactions.xlsx', companyName);
    } catch (error) {
      // If file not found, clear cache and recreate
      if (error.statusCode === 404 || error.code === 'itemNotFound') {
        console.log('File not found when getting URL, recreating...');
        const cacheKey = (companyName === 'Gold Gateway - IBV Gold KZN' || !companyName) ? 'default' : companyName;
        delete cachedFileIds[cacheKey];
        await initializeSharePoint(companyName);
        url = await graphService.getExcelFileUrl(siteId, 'Transactions.xlsx', companyName);
      } else {
        throw error;
      }
    }
    
    res.json({ 
      success: true, 
      url 
    });
  } catch (error) {
    console.error('Error getting Excel URL:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Recreate Excel file with new headers
app.post('/api/excel/recreate', async (req, res) => {
  try {
    const companyName = req.body.companyName || null;
    const { siteId } = await initializeSharePoint(companyName);
    
    // Delete the old file
    try {
      await graphService.deleteExcelFile(siteId, 'Transactions.xlsx', companyName);
      console.log(`Old Excel file deleted for ${companyName || 'default'}`);
    } catch (err) {
      console.log('No old file to delete or error deleting:', err.message);
    }
    
    // Create new file with updated headers
    const cacheKey = (companyName === 'Gold Gateway - IBV Gold KZN' || !companyName) ? 'default' : companyName;
    delete cachedFileIds[cacheKey];
    const file = await graphService.getOrCreateExcelFile(siteId, 'Transactions.xlsx', companyName);
    cachedFileIds[cacheKey] = file.id;
    
    res.json({ 
      success: true, 
      message: 'Excel file recreated with new headers',
      fileId: file.id
    });
  } catch (error) {
    console.error('Error recreating Excel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all company Excel URLs (for master admin)
app.get('/api/excel/companies', async (req, res) => {
  try {
    const { siteId } = await initializeSharePoint();
    
    // Get all files in the SharePoint folder
    const files = await graphService.client
      .api(`/sites/${siteId}/drive/root:${process.env.SHAREPOINT_FOLDER_PATH}:/children`)
      .get();
    
    // Filter for Transactions Excel files
    const excelFiles = files.value
      .filter(file => file.name.startsWith('Transactions_') && file.name.endsWith('.xlsx'))
      .map(file => ({
        name: file.name.replace('Transactions_', '').replace('.xlsx', '').replace(/_/g, ' '),
        fileName: file.name,
        url: file.webUrl
      }));
    
    res.json({ 
      success: true, 
      companies: excelFiles
    });
  } catch (error) {
    console.error('Error getting company Excel files:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server only when not running in a serverless environment (e.g., Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('Initializing SharePoint connection...');
    initializeSharePoint()
      .then(() => console.log('SharePoint initialized successfully'))
      .catch(err => console.error('Failed to initialize SharePoint:', err));
  });
}

// Export the Express app for serverless platforms
module.exports = app;
