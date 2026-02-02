import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const DEFAULT_PRODUCTS = [
  'Gold Bar 1oz',
  'Gold Bar 5g',
  'Gold Bar 10g',
  'Gold Bar 20g',
  'Gold Bar 50g',
  'Gold Bar 100g',
  'Gold Coin Krugerrand 1oz',
  'Gold Coin Krugerrand 1/2oz',
  'Gold Coin Krugerrand 1/4oz',
  'Gold Coin Krugerrand 1/10oz',
  'Silver Bar 1oz',
  'Silver Bar 100oz',
  'Platinum Bar 1oz'
]

export default function TransactionForm() {
  const navigate = useNavigate()
  
  // Check if consultant is logged in
  const [consultantId, setConsultantId] = useState(null)
  const [consultantUsername, setConsultantUsername] = useState(null)
  const [consultantCompanyId, setConsultantCompanyId] = useState(null)
  const [consultantCompanyName, setConsultantCompanyName] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check session storage for consultant login
    const id = sessionStorage.getItem('consultantId')
    const username = sessionStorage.getItem('consultantUsername')
    const companyId = sessionStorage.getItem('consultantCompanyId')
    
    if (!id || !username || !companyId) {
      // Not logged in - redirect to consultant portal
      navigate('/consultant')
      return
    }
    
    setConsultantId(id)
    setConsultantUsername(username)
    setConsultantCompanyId(companyId)
    loadConsultantInfo(id)
  }, [navigate])
  
  const loadConsultantInfo = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, companies(name)')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      if (data?.companies?.name) {
        setConsultantCompanyName(data.companies.name)
      }
      
      // Pre-fill sales consultant name
      if (data?.full_name) {
        setFormData(prev => ({
          ...prev,
          salesConsultant: data.full_name
        }))
      }
    } catch (error) {
      console.error('Error loading consultant info:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const [items, setItems] = useState([{
    name: '',
    qty: '',
    unitPrice: '',
    totalSales: '0.00',
    supplier: '',
    supplierOther: '',
    unitCos: '',
    totalCos: '0.00',
    grossProfit1: '0.00',
    otherCostType: '',
    otherCostTypeDetail: '',
    otherCostAmount: '',
    grossProfit2: '0.00'
  }])

  const addItem = () => {
    setItems([...items, {
      name: '',
      qty: '',
      unitPrice: '',
      totalSales: '0.00',
      supplier: '',
      supplierOther: '',
      unitCos: '',
      totalCos: '0.00',
      grossProfit1: '0.00',
      otherCostType: '',
      otherCostTypeDetail: '',
      otherCostAmount: '',
      grossProfit2: '0.00'
    }])
  }
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    clientType: 'individual', // 'individual' or 'company'
    clientName: '',
    idPassport: '',
    companyName: '',
    registrationNumber: '',
    orderBranch: '',
    salesConsultant: '',
    transactionType: 'Sales', // 'Sales' or 'Buyback'
    supplierPaid: false,
    buybackPaid: false,
    adminDetails: '',
    customerRiskMatrix: '',
    tfsSanctionScreening: false,
    amlReportNumber: '',
    kycDocuments: false,
    kycNotes: '',
    invoiced: false,
    proofOfPayment: false,
    paymentReceipt: false,
    paymentMethod: '',
    stockOrdered: false,
    stockReorderNotes: '',
    treasuryStock: '',
    treasuryStockNotes: '',
    packaged: false,
    collectionBranch: '',
    collectionDate: '',
    collectionForm: false,
    audit: '',
    aiReview: '',
    notes: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items]
    const item = { ...updatedItems[index], [field]: value }

    // Clear dependent detail fields when switching away from 'Other'
    if (field === 'otherCostType' && value !== 'Other') {
      item.otherCostTypeDetail = ''
    }
    if (field === 'supplier' && value !== 'Other') {
      item.supplierOther = ''
    }

    updatedItems[index] = item

    // If it's a numeric field, recalculate immediately with the new value
    if (['qty', 'unitPrice', 'unitCos', 'otherCostAmount'].includes(field)) {
      const qty = parseFloat(item.qty) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      const unitCos = parseFloat(item.unitCos) || 0
      const otherCostAmount = parseFloat(item.otherCostAmount) || 0
      
      const totalSales = qty * unitPrice
      const totalCos = qty * unitCos
      const grossProfit1 = totalSales - totalCos
      const grossProfit2 = grossProfit1 - otherCostAmount
      
      updatedItems[index] = {
        ...item,
        totalSales: totalSales.toFixed(2),
        totalCos: totalCos.toFixed(2),
        grossProfit1: grossProfit1.toFixed(2),
        grossProfit2: grossProfit2.toFixed(2)
      }
    }

    setItems(updatedItems)
  }



  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    } else {
      alert('At least one item row is required.')
    }
  }

  const calculateTotalGrossProfit = () => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.grossProfit2) || 0)
    }, 0).toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    // Validate per-item required fields
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.otherCostType === 'Other' && (!it.otherCostTypeDetail || it.otherCostTypeDetail.trim() === '')) {
        setMessage('Please specify the other cost detail for item ' + (i + 1))
        setSubmitting(false)
        return
      }
      if (it.supplier === 'Other' && (!it.supplierOther || it.supplierOther.trim() === '')) {
        setMessage('Please specify the supplier name for item ' + (i + 1))
        setSubmitting(false)
        return
      }
    }

    try {
      const totalGrossProfit = calculateTotalGrossProfit()
      
      const submissionData = {
        submission_date: new Date().toISOString(),
        transaction_date: formData.date,
        client_type: formData.clientType,
        client_name: formData.clientType === 'individual' ? formData.clientName : null,
        id_passport: formData.clientType === 'individual' ? formData.idPassport : null,
        company_name: formData.clientType === 'company' ? formData.companyName : null,
        registration_number: formData.clientType === 'company' ? formData.registrationNumber : null,
        transaction_type: formData.transactionType,
        order_branch: formData.orderBranch,
        sales_consultant: formData.salesConsultant,
        items: items,
        total_gross_profit: parseFloat(totalGrossProfit),
        admin_details: formData.adminDetails,
        customer_risk_matrix: formData.customerRiskMatrix,
        tfs_screening: formData.tfsSanctionScreening ? 'Yes' : 'No',
        aml_report_number: formData.amlReportNumber,
        kyc_documents_received: formData.kycDocuments ? 'Yes' : 'No',
        kyc_notes: formData.kycNotes,
        invoiced: formData.invoiced ? 'Yes' : 'No',
        proof_of_payment: formData.proofOfPayment ? 'Yes' : 'No',
        payment_receipt: formData.paymentReceipt ? 'Yes' : 'No',
        payment_method: formData.paymentMethod,
        stock_ordered: formData.stockOrdered ? 'Yes' : 'No',
        treasury_stock_control: formData.treasuryStock,
        treasury_stock_notes: formData.treasuryStockNotes,
        packaged: formData.packaged ? 'Yes' : 'No',
        stock_reorder_notes: formData.stockReorderNotes,
        collection_branch: formData.collectionBranch,
        collection_date: formData.collectionDate,
        collection_form: formData.collectionForm ? 'Yes' : 'No',
        internal_external_audit: formData.audit,
        ai_systems_review: formData.aiReview,
        notes: formData.notes,
        supplier_paid: formData.supplierPaid ? 'Yes' : 'No',
        buyback_paid: formData.buybackPaid ? 'Yes' : 'No'
      }
      
      // Auto-assign consultant and company if logged in
      if (consultantId && consultantCompanyId) {
        submissionData.consultant_id = parseInt(consultantId)
        submissionData.consultant_username = consultantUsername
        submissionData.company_id = parseInt(consultantCompanyId)
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([submissionData])
        .select('*, companies(name)')

      if (error) throw error

      // Send to SharePoint Excel
      try {
        // Add company name to the data for SharePoint routing
        const sharePointData = {
          ...data[0],
          company_name: data[0].companies?.name || null
        };
        
        await fetch('http://localhost:3001/api/transactions/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sharePointData)
        })
      } catch (spError) {
        console.error('Error saving to SharePoint:', spError)
        // Don't fail the whole transaction if SharePoint fails
      }

      setMessage('✓ Transaction saved successfully!')
      
      // Redirect consultant to their dashboard after 2 seconds
      setTimeout(() => {
        navigate('/consultant')
      }, 2000)
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        clientType: 'individual',
        clientName: '',
        idPassport: '',
        companyName: '',
        registrationNumber: '',
        orderBranch: '',
        salesConsultant: '',
        transactionType: 'Sales',
        supplierPaid: false,
        buybackPaid: false,
        adminDetails: '',
        customerRiskMatrix: '',
        tfsSanctionScreening: false,
        amlReportNumber: '',
        kycDocuments: false,
        kycNotes: '',
        invoiced: false,
        proofOfPayment: false,
        paymentReceipt: false,
        paymentMethod: '',
        stockOrdered: false,
        stockReorderNotes: '',
        treasuryStock: '',
        treasuryStockNotes: '',
        packaged: false,
        collectionBranch: '',
        collectionDate: '',
        collectionForm: false,
        audit: '',
        aiReview: '',
        notes: ''
      })
      
      setItems([{
        name: '',
        qty: '',
        unitPrice: '',
        totalSales: '0.00',
        unitCos: '',
        totalCos: '0.00',
        grossProfit1: '0.00',
        otherCostType: '',
        otherCostAmount: '',
        grossProfit2: '0.00'
      }])

      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      console.error('Error submitting transaction:', error)
      setMessage('Error: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">IBV GOLD</div>
          <div className="title">IBV GOLD BUSINESS FORM TRANSACTION SHEET</div>
        </div>
        <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">IBV GOLD</div>
        <div className="title">IBV GOLD BUSINESS FORM TRANSACTION SHEET</div>
        <div className="date-stamp">{new Date().toLocaleDateString()}</div>
      </div>
      
      {/* Consultant Info Banner */}
      {consultantUsername && consultantCompanyName && (
        <div style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Logged in as:</strong> {consultantUsername}
            <span style={{ marginLeft: '20px' }}>
              <strong>Company:</strong> {consultantCompanyName}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/consultant')}
            style={{
              backgroundColor: 'white',
              color: '#4CAF50',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. CLIENT DETAILS */}
        <div className="section">
          <div className="section-title">1. CLIENT DETAILS</div>
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Client Type:</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="clientType"
                  value="individual"
                  checked={formData.clientType === 'individual'}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value, clientName: '', idPassport: '', companyName: '', registrationNumber: '' })}
                /> Individual
              </label>
              <label style={{ marginLeft: '12px' }}>
                <input
                  type="radio"
                  name="clientType"
                  value="company"
                  checked={formData.clientType === 'company'}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value, clientName: '', idPassport: '', companyName: '', registrationNumber: '' })}
                /> Company
              </label>
            </div>
          </div>

          {formData.clientType === 'individual' ? (
            <>
              <div className="form-group">
                <label>Client Full Name(s):</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>ID/Passport Number:</label>
                <input
                  type="text"
                  value={formData.idPassport}
                  onChange={(e) => setFormData({ ...formData, idPassport: e.target.value })}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Company Name:</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Registration Number:</label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  required
                />
              </div>
            </>
          )}
        </div>

        {/* 2. SALES DETAILS */}
        <div className="section">
          <div className="section-title">2. SALES DETAILS</div>
          <div className="form-group">
            <label>BRANCH (Order Location):</label>
            <input
              type="text"
              value={formData.orderBranch}
              onChange={(e) => setFormData({ ...formData, orderBranch: e.target.value })}
              placeholder="Enter branch where order was made"
              required
            />
          </div>
          <div className="form-group">
            <label>SALES CONSULTANT:</label>
            <input
              type="text"
              value={formData.salesConsultant}
              onChange={(e) => setFormData({ ...formData, salesConsultant: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Transaction Type:</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="transactionType"
                  value="Sales"
                  checked={formData.transactionType === 'Sales'}
                  onChange={(e) => { setFormData({ ...formData, transactionType: e.target.value }); }}
                /> Sales
              </label>
              <label style={{ marginLeft: '12px' }}>
                <input
                  type="radio"
                  name="transactionType"
                  value="Buyback"
                  checked={formData.transactionType === 'Buyback'}
                  onChange={(e) => { setFormData({ ...formData, transactionType: e.target.value }); }}
                /> Buyback
              </label>
            </div>
          </div>
          
          <table id="itemsTable">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>Q</th>
                <th>UNIT PRICE</th>
                <th>TOTAL SALES PRICE</th>
                <th>SUPPLIER</th>
                <th>UNIT COS</th>
                <th>TOTAL COS</th>
                <th>GROSS PROFIT 1</th>
                <th>OTHER COST TYPE</th>
                <th>OTHER COST AMOUNT</th>
                <th>GROSS PROFIT 2</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="item-row">
                  <td>
                    <select
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      required
                    >
                      <option value="">Select Product...</option>
                      {DEFAULT_PRODUCTS.map(product => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.qty || ''}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.totalSales}
                      placeholder="0.00"
                      step="0.01"
                      readOnly
                    />
                  </td>

                  <td>
                    <select
                      value={item.supplier || ''}
                      onChange={(e) => handleItemChange(index, 'supplier', e.target.value)}
                    >
                      <option value="">Select Supplier...</option>
                      <option value="Rand Refinery">Rand Refinery</option>
                      <option value="SA Mint">SA Mint</option>
                      <option value="Other">Other</option>
                    </select>
                    {item.supplier === 'Other' && (
                      <input
                        type="text"
                        value={item.supplierOther || ''}
                        onChange={(e) => handleItemChange(index, 'supplierOther', e.target.value)}
                        placeholder="Supplier name"
                        style={{ marginLeft: '8px' }}
                      />
                    )}
                  </td>

                  <td>
                    <input
                      type="number"
                      value={item.unitCos || ''}
                      onChange={(e) => handleItemChange(index, 'unitCos', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.totalCos}
                      placeholder="0.00"
                      step="0.01"
                      readOnly
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.grossProfit1}
                      placeholder="0.00"
                      step="0.01"
                      readOnly
                    />
                  </td>
                  <td>
                    <select
                      value={item.otherCostType}
                      onChange={(e) => handleItemChange(index, 'otherCostType', e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Courier">Courier Cost</option>
                      <option value="Bank">Bank Charges</option>
                      <option value="Other">Other</option>
                    </select>
                    {item.otherCostType === 'Other' && (
                      <input
                        type="text"
                        value={item.otherCostTypeDetail || ''}
                        onChange={(e) => handleItemChange(index, 'otherCostTypeDetail', e.target.value)}
                        placeholder="Specify other cost"
                        style={{ marginLeft: '8px' }}
                      />
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.otherCostAmount || ''}
                      onChange={(e) => handleItemChange(index, 'otherCostAmount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.grossProfit2}
                      placeholder="0.00"
                      step="0.01"
                      readOnly
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button type="button" className="add-item-btn" onClick={addItem}>
            + Add Item
          </button>
          
          <div className="total-display">
            TOTAL GROSS PROFIT: <span>{calculateTotalGrossProfit()}</span>
          </div>
        </div>

        {/* 3. ADMIN DETAILS */}
        <div className="section">
          <div className="section-title">3. ADMIN DETAILS</div>
          <div className="form-group">
            <textarea
              value={formData.adminDetails}
              onChange={(e) => setFormData({ ...formData, adminDetails: e.target.value })}
              placeholder="Enter admin details..."
            />
          </div>
        </div>

        {/* 4. COMPLIANCE DETAILS */}
        <div className="section">
          <div className="section-title">4. COMPLIANCE DETAILS</div>
          <div className="form-group">
            <label>Customer Risk Matrix:</label>
            <select
              value={formData.customerRiskMatrix}
              onChange={(e) => setFormData({ ...formData, customerRiskMatrix: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="tfsSanction"
              checked={formData.tfsSanctionScreening}
              onChange={(e) => setFormData({ ...formData, tfsSanctionScreening: e.target.checked })}
            />
            <label htmlFor="tfsSanction">TFS/ Sanction Screening</label>
          </div>
          <div className="form-group">
            <label>AML Report Number (If Required):</label>
            <input
              type="text"
              value={formData.amlReportNumber}
              onChange={(e) => setFormData({ ...formData, amlReportNumber: e.target.value })}
            />
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="kycDocs"
              checked={formData.kycDocuments}
              onChange={(e) => setFormData({ ...formData, kycDocuments: e.target.checked })}
            />
            <label htmlFor="kycDocs">KYC Documents Received</label>
          </div>
          <div className="form-group">
            <label>Notes:</label>
            <textarea
              value={formData.kycNotes}
              onChange={(e) => setFormData({ ...formData, kycNotes: e.target.value })}
              placeholder="Additional compliance notes..."
            />
          </div>
        </div>

        {/* 5. FINANCE CONTROLS */}
        <div className="section">
          <div className="section-title">5. FINANCE CONTROLS</div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="invoiced"
              checked={formData.invoiced}
              onChange={(e) => setFormData({ ...formData, invoiced: e.target.checked })}
            />
            <label htmlFor="invoiced">Invoiced</label>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="proofPayment"
              checked={formData.proofOfPayment}
              onChange={(e) => setFormData({ ...formData, proofOfPayment: e.target.checked })}
            />
            <label htmlFor="proofPayment">Proof of Payment Received</label>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="paymentReceipt"
              checked={formData.paymentReceipt}
              onChange={(e) => setFormData({ ...formData, paymentReceipt: e.target.checked })}
            />
            <label htmlFor="paymentReceipt">Payment Receipt</label>
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="supplierPaid"
              checked={formData.supplierPaid}
              onChange={(e) => setFormData({ ...formData, supplierPaid: e.target.checked })}
            />
            <label htmlFor="supplierPaid">Supplier Paid</label>
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="buybackPaid"
              checked={formData.buybackPaid}
              onChange={(e) => setFormData({ ...formData, buybackPaid: e.target.checked })}
            />
            <label htmlFor="buybackPaid">Buyback Paid</label>
          </div>

          <div className="form-group">
            <label>Payment Method:</label>
            <div className="radio-group">
              <div className="radio-item">
                <input
                  type="radio"
                  id="eft"
                  name="paymentMethod"
                  value="EFT"
                  checked={formData.paymentMethod === 'EFT'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
                <label htmlFor="eft">EFT</label>
              </div>
              <div className="radio-item">
                <input
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  value="Card"
                  checked={formData.paymentMethod === 'Card'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
                <label htmlFor="card">Card</label>
              </div>
              <div className="radio-item">
                <input
                  type="radio"
                  id="cash"
                  name="paymentMethod"
                  value="Cash"
                  checked={formData.paymentMethod === 'Cash'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
                <label htmlFor="cash">Cash</label>
              </div>
            </div>
          </div>
        </div>

        {/* 6. STOCK REORDER CONTROL */}
        <div className="section">
          <div className="section-title">6. STOCK REORDER CONTROL</div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="stockOrdered"
              checked={formData.stockOrdered}
              onChange={(e) => setFormData({ ...formData, stockOrdered: e.target.checked })}
            />
            <label htmlFor="stockOrdered">Stock Ordered</label>
          </div>

          <div className="form-group">
            <label>Reorder Notes:</label>
            <textarea
              value={formData.stockReorderNotes}
              onChange={(e) => setFormData({ ...formData, stockReorderNotes: e.target.value })}
              placeholder="Notes about the stock reorder..."
            />
          </div>
        </div>

        {/* 7. TREASURY/STOCK CONTROL */}
        <div className="section">
          <div className="section-title">7. TREASURY/ STOCK CONTROL</div>
          <div className="form-group">
            <label>Stock Status:</label>
            <select
              value={formData.treasuryStock}
              onChange={(e) => setFormData({ ...formData, treasuryStock: e.target.value })}
            >
              <option value="">Select Status...</option>
              <option value="Stock backed up and not paid">Stock backed up and not paid</option>
              <option value="Stock backed up and paid">Stock backed up and paid</option>
              <option value="Stock paid and awaiting delivery">Stock paid and awaiting delivery</option>
              <option value="Stock taken from stock on hand and not backed up">Stock taken from stock on hand and not backed up</option>
            </select>
          </div>
          <div className="form-group">
            <label>Treasury/Stock Control Notes:</label>
            <textarea
              value={formData.treasuryStockNotes}
              onChange={(e) => setFormData({ ...formData, treasuryStockNotes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* 8. CUSTOMER COLLECTIONS/DELIVERY */}
        <div className="section">
          <div className="section-title">8. CUSTOMER COLLECTIONS/ DELIVERY</div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="packaged"
              checked={formData.packaged}
              onChange={(e) => setFormData({ ...formData, packaged: e.target.checked })}
            />
            <label htmlFor="packaged">Packaged</label>
          </div>

          <div className="form-group">
            <label>Branch:</label>
            <select
              value={formData.collectionBranch}
              onChange={(e) => setFormData({ ...formData, collectionBranch: e.target.value })}
            >
              <option value="">Select Branch...</option>
              <option value="london">London</option>
              <option value="dubai">Dubai</option>
              <option value="gateway">Gateway</option>
              <option value="prive">Prive</option>
              <option value="sandton">Sandton</option>
              <option value="alice lane">Alice Lane</option>
              <option value="rosebank">Rosebank</option>
            </select>
          </div>

          <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <input
                type="checkbox"
                id="collectionForm"
                checked={formData.collectionForm}
                onChange={(e) => setFormData({ ...formData, collectionForm: e.target.checked })}
              />
              <label htmlFor="collectionForm">Stock Collected</label>
            </div>

            <div>
              <label style={{ marginLeft: '6px' }}>Collected Date:</label>
              <input
                type="date"
                value={formData.collectionDate}
                onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 9. INTERNAL/EXTERNAL AUDIT */}
        <div className="section">
          <div className="section-title">9. INTERNAL/ EXTERNAL AUDIT</div>
          <div className="form-group">
            <textarea
              value={formData.audit}
              onChange={(e) => setFormData({ ...formData, audit: e.target.value })}
              placeholder="Audit information..."
            />
          </div>
        </div>

        {/* 10. AI SYSTEMS REVIEW */}
        <div className="section">
          <div className="section-title">10. AI SYSTEMS REVIEW</div>
          <div className="form-group">
            <textarea
              value={formData.aiReview}
              onChange={(e) => setFormData({ ...formData, aiReview: e.target.value })}
              placeholder="AI systems review..."
            />
          </div>
        </div>

        {/* NOTES */}
        <div className="section">
          <div className="section-title">NOTES</div>
          <div className="form-group">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="6"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'SUBMITTING...' : 'SUBMIT TRANSACTION'}
        </button>
      </form>
    </div>
  )
}
