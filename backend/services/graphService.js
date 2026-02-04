const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

class GraphService {
  constructor() {
    console.log('Initializing GraphService...');
    console.log('Tenant ID:', process.env.TENANT_ID);
    console.log('Client ID:', process.env.CLIENT_ID);
    console.log('Client Secret:', process.env.CLIENT_SECRET ? '***configured***' : 'MISSING');
    
    this.credential = new ClientSecretCredential(
      process.env.TENANT_ID,
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET
    );

    const authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    this.client = Client.initWithMiddleware({ authProvider });
  }

  /**
   * Get SharePoint site ID from URL
   */
  async getSiteId() {
    try {
      const siteUrl = process.env.SHAREPOINT_SITE_URL;
      const urlParts = new URL(siteUrl);
      const hostname = urlParts.hostname;
      const sitePath = urlParts.pathname;

      const site = await this.client
        .api(`/sites/${hostname}:${sitePath}`)
        .get();

      return site.id;
    } catch (error) {
      console.error('Error getting site ID:', error);
      throw error;
    }
  }

  /**
   * Get or create Excel file in SharePoint
   * @param {string} companyName - Optional company name for company-specific file
   */
  async getOrCreateExcelFile(siteId, fileName = 'Transactions.xlsx', companyName = null) {
    // If company name provided and it's NOT "Gold Gateway - IBV Gold KZN", create company-specific filename
    // "Gold Gateway - IBV Gold KZN" uses the default Transactions.xlsx
    if (companyName && companyName !== 'Gold Gateway - IBV Gold KZN') {
      const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
      fileName = `Transactions_${sanitizedName}.xlsx`;
    }
    try {
      // Try to get the file first
      try {
        const file = await this.client
          .api(`/sites/${siteId}/drive/root:${process.env.SHAREPOINT_FOLDER_PATH}/${fileName}`)
          .get();
        return file;
      } catch (error) {
        // File doesn't exist, create it
        if (error.statusCode === 404) {
          console.log('Excel file not found. Creating new file...');
          
          // Create a new Excel file with headers
          const workbook = await this.createExcelWorkbook();
          
          const uploadedFile = await this.client
            .api(`/sites/${siteId}/drive/root:${process.env.SHAREPOINT_FOLDER_PATH}/${fileName}:/content`)
            .putStream(workbook);

          return uploadedFile;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error getting/creating Excel file:', error);
      throw error;
    }
  }

  /**
   * Create a new Excel workbook with headers
   */
  async createExcelWorkbook() {
    // Create a minimal Excel file with headers
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Add headers - Transaction ID first (hidden), then Sales Consultant, then rest
    worksheet.columns = [
      { header: 'Transaction ID', key: 'transactionId', width: 36 },
      { header: 'Sales Consultant', key: 'salesConsultant', width: 25 },
      { header: 'Submission Date', key: 'submissionDate', width: 18 },
      { header: 'Transaction Date', key: 'transactionDate', width: 18 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'ID/Passport', key: 'idPassport', width: 20 },
      { header: 'Order Branch', key: 'orderBranch', width: 20 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit Price (R)', key: 'unitPrice', width: 15 },
      { header: 'Total Sales (R)', key: 'totalSales', width: 18 },
      { header: 'Unit COS (R)', key: 'unitCos', width: 15 },
      { header: 'Total COS (R)', key: 'totalCos', width: 18 },
      { header: 'Gross Profit 1 (R)', key: 'grossProfit1', width: 18 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Supplier Other', key: 'supplierOther', width: 20 },
      { header: 'Other Cost Type', key: 'otherCostType', width: 20 },
      { header: 'Other Cost Detail', key: 'otherCostDetail', width: 25 },
      { header: 'Other Cost Amount', key: 'otherCostAmount', width: 18 },
      { header: 'Gross Profit 2 (R)', key: 'grossProfit2', width: 18 },
      { header: 'Transaction Total Profit (R)', key: 'totalProfit', width: 25 },
      { header: 'Admin Details', key: 'adminDetails', width: 25 },
      { header: 'Risk Matrix', key: 'riskMatrix', width: 20 },
      { header: 'TFS Screening', key: 'tfsScreening', width: 18 },
      { header: 'AML Report', key: 'amlReport', width: 20 },
      { header: 'KYC Documents', key: 'kycDocs', width: 18 },
      { header: 'KYC Notes', key: 'kycNotes', width: 30 },
      { header: 'Invoiced', key: 'invoiced', width: 12 },
      { header: 'Proof of Payment', key: 'proofPayment', width: 18 },
      { header: 'Payment Receipt', key: 'paymentReceipt', width: 18 },
      { header: 'Supplier Paid', key: 'supplierPaid', width: 15 },
      { header: 'Buyback Paid', key: 'buybackPaid', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 18 },
      { header: 'Stock Ordered', key: 'stockOrdered', width: 15 },
      { header: 'Treasury/Stock Control', key: 'treasuryStock', width: 25 },
      { header: 'Treasury Notes', key: 'treasuryNotes', width: 30 },
      { header: 'Stock Reorder Notes', key: 'stockNotes', width: 30 },
      { header: 'Packaged', key: 'packaged', width: 12 },
      { header: 'Collection Branch', key: 'collectionBranch', width: 20 },
      { header: 'Collection Date', key: 'collectionDate', width: 18 },
      { header: 'Collection Form', key: 'collectionForm', width: 18 },
      { header: 'Audit', key: 'audit', width: 25 },
      { header: 'AI Review', key: 'aiReview', width: 20 },
      { header: 'Administrator', key: 'administrator', width: 18 },
      { header: 'Administrator Name', key: 'administratorName', width: 25 },
      { header: 'Accountant', key: 'accountant', width: 18 },
      { header: 'Accountant Name', key: 'accountantName', width: 25 },
      { header: 'Treasury Manager', key: 'treasuryManager', width: 20 },
      { header: 'Treasury Manager Name', key: 'treasuryManagerName', width: 25 },
      { header: 'Compliance Officer', key: 'complianceOfficer', width: 22 },
      { header: 'Compliance Officer Name', key: 'complianceOfficerName', width: 25 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Add a new row to the Excel file
   */
  async addTransactionRow(siteId, fileId, transactionData) {
    try {
      // Get the worksheet
      const worksheetId = await this.getWorksheetId(siteId, fileId);

      // Get the current used range to find the next row
      const usedRange = await this.client
        .api(`/sites/${siteId}/drive/items/${fileId}/workbook/worksheets/${worksheetId}/usedRange`)
        .get();

      const nextRow = usedRange.rowCount + 1;

      // Prepare row data
      const rowData = this.prepareRowData(transactionData);

      // Add row to the worksheet (52 columns: A to AZ - Transaction ID + 51 data columns)
      await this.client
        .api(`/sites/${siteId}/drive/items/${fileId}/workbook/worksheets/${worksheetId}/range(address='A${nextRow}:AZ${nextRow}')`)
        .patch({
          values: [rowData]
        });

      console.log('Transaction added to Excel successfully at row', nextRow);
      return { success: true };
    } catch (error) {
      console.error('Error adding transaction row:', error);
      throw error;
    }
  }

  /**
   * Update an existing row in the Excel file
   */
  async updateTransactionRow(siteId, fileId, transactionId, transactionData) {
    try {
      // Find the row with the matching transaction ID
      const worksheetId = await this.getWorksheetId(siteId, fileId);
      
      // Get all rows
      const rows = await this.client
        .api(`/sites/${siteId}/drive/items/${fileId}/workbook/worksheets/${worksheetId}/usedRange`)
        .get();

      console.log('Looking for transaction ID:', transactionId);
      console.log('Row count:', rows.values.length);
      
      // Find the row index with matching transaction ID
      let rowIndex = -1;
      if (rows.values) {
        for (let i = 1; i < rows.values.length; i++) { // Skip header row
          const excelId = rows.values[i][0];
          console.log(`Row ${i}: Excel ID = "${excelId}" (type: ${typeof excelId}), Looking for = "${transactionId}" (type: ${typeof transactionId})`);
          
          // Compare both as strings to handle type mismatches
          if (String(excelId) === String(transactionId)) {
            rowIndex = i;
            console.log(`Found match at row ${i}`);
            break;
          }
        }
      }

      if (rowIndex === -1) {
        console.error('Transaction ID not found in Excel. Available IDs:', rows.values.slice(1).map(row => row[0]));
        throw new Error('Transaction not found in Excel');
      }

      // Prepare updated row data
      const rowData = this.prepareRowData(transactionData);

      // Update the row (52 columns: A to AZ - Transaction ID + 51 data columns)
      await this.client
        .api(`/sites/${siteId}/drive/items/${fileId}/workbook/worksheets/${worksheetId}/range(address='A${rowIndex + 1}:AZ${rowIndex + 1}')`)
        .patch({
          values: [rowData]
        });

      console.log('Transaction updated in Excel successfully at row', rowIndex + 1);
      return { success: true };
    } catch (error) {
      console.error('Error updating transaction row:', error);
      throw error;
    }
  }

  /**
   * Get worksheet ID
   */
  async getWorksheetId(siteId, fileId) {
    const worksheets = await this.client
      .api(`/sites/${siteId}/drive/items/${fileId}/workbook/worksheets`)
      .get();

    return worksheets.value[0].id;
  }

  /**
   * Prepare row data from transaction
   */
  prepareRowData(transaction) {
    // Get first item for row, or empty values if no items
    const items = Array.isArray(transaction.items) ? transaction.items : [];
    const firstItem = items[0] || {};

    return [
      transaction.id || '',
      transaction.sales_consultant || '',
      transaction.submission_date || new Date().toISOString(),
      transaction.transaction_date || transaction.date || '',
      transaction.client_name || '',
      transaction.id_passport || '',
      transaction.order_branch || '',
      firstItem.name || '',
      firstItem.qty || '',
      firstItem.unitPrice || '',
      firstItem.totalSales || '',
      firstItem.unitCos || '',
      firstItem.totalCos || '',
      firstItem.grossProfit1 || '',
      firstItem.supplier || '',
      firstItem.supplierOther || '',
      firstItem.otherCostType || '',
      firstItem.otherCostTypeDetail || '',
      firstItem.otherCostAmount || '',
      firstItem.grossProfit2 || '',
      transaction.total_gross_profit || '',
      transaction.admin_details || '',
      transaction.customer_risk_matrix || '',
      transaction.tfs_screening || '',
      transaction.aml_report_number || '',
      transaction.kyc_documents_received || '',
      transaction.kyc_notes || '',
      transaction.invoiced || '',
      transaction.proof_of_payment || '',
      transaction.payment_receipt || '',
      transaction.supplier_paid || '',
      transaction.buyback_paid || '',
      transaction.payment_method || '',
      transaction.stock_ordered || '',
      transaction.treasury_stock_control || '',
      transaction.treasury_stock_notes || '',
      transaction.stock_reorder_notes || '',
      transaction.packaged || '',
      transaction.collection_branch || '',
      transaction.collection_date || '',
      transaction.collection_form || '',
      transaction.internal_external_audit || '',
      transaction.ai_systems_review || '',
      transaction.administrator_approved ? 'Yes' : 'No',
      transaction.administrator_name || '',
      transaction.accountant_approved ? 'Yes' : 'No',
      transaction.accountant_name || '',
      transaction.treasury_manager_approved ? 'Yes' : 'No',
      transaction.treasury_manager_name || '',
      transaction.compliance_officer_approved ? 'Yes' : 'No',
      transaction.compliance_officer_name || '',
      transaction.notes || ''
    ];
  }

  /**
   * Get Excel file web URL for opening
   * @param {string} companyName - Optional company name for company-specific file
   */
  async getExcelFileUrl(siteId, fileName = 'Transactions.xlsx', companyName = null) {
    // If company name provided and it's NOT "Gold Gateway - IBV Gold KZN", use company-specific filename
    // "Gold Gateway - IBV Gold KZN" uses the default Transactions.xlsx
    if (companyName && companyName !== 'Gold Gateway - IBV Gold KZN') {
      const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
      fileName = `Transactions_${sanitizedName}.xlsx`;
    }
    try {
      const file = await this.client
        .api(`/sites/${siteId}/drive/root:${process.env.SHAREPOINT_FOLDER_PATH}/${fileName}`)
        .get();

      return file.webUrl;
    } catch (error) {
      console.error('Error getting Excel file URL:', error);
      throw error;
    }
  }

  /**
   * Delete Excel file from SharePoint
   * @param {string} companyName - Optional company name for company-specific file
   */
  async deleteExcelFile(siteId, fileName = 'Transactions.xlsx', companyName = null) {
    // If company name provided and it's NOT "Gold Gateway - IBV Gold KZN", use company-specific filename
    // "Gold Gateway - IBV Gold KZN" uses the default Transactions.xlsx
    if (companyName && companyName !== 'Gold Gateway - IBV Gold KZN') {
      const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
      fileName = `Transactions_${sanitizedName}.xlsx`;
    }
    try {
      await this.client
        .api(`/sites/${siteId}/drive/root:${process.env.SHAREPOINT_FOLDER_PATH}/${fileName}`)
        .delete();

      console.log('Excel file deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting Excel file:', error);
      throw error;
    }
  }
}

module.exports = new GraphService();
