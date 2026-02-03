import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

// Use backend API base from env in production; fall back to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export default function ConsultantDashboard() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [currentUser, setCurrentUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [clientTab, setClientTab] = useState('all') // 'all' | 'individual' | 'company'
  const [filteredTransactions, setFilteredTransactions] = useState([])

  const recordAudit = async (action, details = {}) => {
    try {
      console.log('Recording audit:', action, details)
      const result = await supabase.from('audit_logs').insert([{
        actor: currentUser?.username || 'unknown',
        action,
        details: JSON.stringify(details)
      }])
      if (result.error) {
        console.error('Audit log error:', result.error)
        throw result.error
      }
      console.log('Audit log insert result:', result)
    } catch (err) {
      console.error('Audit log failed:', err)
      throw err
    }
  }

  useEffect(() => {
    // Check session storage
    const loggedIn = sessionStorage.getItem('consultantLoggedIn')
    const userId = sessionStorage.getItem('consultantId')
    const user = sessionStorage.getItem('consultantUsername')
    
    if (loggedIn === 'true' && userId && user) {
      setIsLoggedIn(true)
      setCurrentUser({ id: userId, username: user })
      loadTransactions(userId)
    }
  }, [])

  useEffect(() => {
    if (transactions.length > 0) {
      applyFilters()
    }
  }, [transactions, filterPeriod, searchTerm, clientTab])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    try {
      // Query the database for consultant user
      const { data, error } = await supabase
        .from('users')
        .select('*, companies(name)')
        .eq('username', username.toLowerCase())
        .eq('user_type', 'consultant')
        .single()
      
      if (error) {
        setLoginError('Invalid username or password. Only sales consultants can access this portal.')
        return
      }
      
      // Check password
      if (data && data.password === password) {
        setIsLoggedIn(true)
        setCurrentUser(data)
        sessionStorage.setItem('consultantLoggedIn', 'true')
        sessionStorage.setItem('consultantId', data.id)
        sessionStorage.setItem('consultantUsername', username)
        sessionStorage.setItem('consultantCompanyId', data.company_id)
        loadTransactions(data.id)
      } else {
        setLoginError('Invalid username or password')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('An error occurred during login')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setCurrentUser(null)
    sessionStorage.removeItem('consultantLoggedIn')
    sessionStorage.removeItem('consultantId')
    sessionStorage.removeItem('consultantUsername')
    sessionStorage.removeItem('consultantCompanyId')
  }

  const loadTransactions = async (consultantId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, companies(name)')
        .eq('consultant_id', consultantId)
        .order('submission_date', { ascending: false })

      if (error) throw error
      
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      alert('Error loading transactions: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // Date filter
    if (filterPeriod !== 'all') {
      const now = new Date()
      filtered = filtered.filter(t => {
        const txDate = new Date(t.transaction_date)
        
        if (filterPeriod === 'today') {
          return txDate.toDateString() === now.toDateString()
        } else if (filterPeriod === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return txDate >= weekAgo
        } else if (filterPeriod === 'month') {
          return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    // Search filter (include company fields)
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.client_name?.toLowerCase().includes(search) ||
        t.id_passport?.toLowerCase().includes(search) ||
        t.company_name?.toLowerCase().includes(search) ||
        t.registration_number?.toLowerCase().includes(search) ||
        t.sales_consultant?.toLowerCase().includes(search)
      )
    }

    // Client tab filter
    if (clientTab === 'individual') {
      filtered = filtered.filter(t => !t.client_type || t.client_type === 'individual')
    } else if (clientTab === 'company') {
      filtered = filtered.filter(t => t.client_type === 'company')
    }

    setFilteredTransactions(filtered)
  }

  const viewTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedTransaction(null)
    setEditMode(false)
    setEditedTransaction(null)
  }

  const goToForm = () => {
    navigate('/form')
  }
  
  const [editMode, setEditMode] = useState(false)
  const [editedTransaction, setEditedTransaction] = useState(null)
  
  const startEdit = () => {
    setEditedTransaction({...selectedTransaction})
    setEditMode(true)
  }
  
  const cancelEdit = () => {
    setEditMode(false)
    setEditedTransaction(null)
  }
  
  const saveEdit = async () => {
    if (!editedTransaction) return
    
    if (!confirm('Are you sure you want to save these changes?')) {
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          client_type: editedTransaction.client_type,
          client_name: editedTransaction.client_name,
          id_passport: editedTransaction.id_passport,
          company_name: editedTransaction.company_name,
          registration_number: editedTransaction.registration_number,
          transaction_type: editedTransaction.transaction_type,
          transaction_date: editedTransaction.transaction_date,
          order_branch: editedTransaction.order_branch,
          sales_consultant: editedTransaction.sales_consultant,
          items: editedTransaction.items,
          total_gross_profit: editedTransaction.total_gross_profit,
          admin_details: editedTransaction.admin_details,
          customer_risk_matrix: editedTransaction.customer_risk_matrix,
          tfs_screening: editedTransaction.tfs_screening,
          aml_report_number: editedTransaction.aml_report_number,
          kyc_documents_received: editedTransaction.kyc_documents_received,
          kyc_notes: editedTransaction.kyc_notes,
          invoiced: editedTransaction.invoiced,
          proof_of_payment: editedTransaction.proof_of_payment,
          payment_receipt: editedTransaction.payment_receipt,
          payment_method: editedTransaction.payment_method,
          supplier_paid: editedTransaction.supplier_paid,
          buyback_paid: editedTransaction.buyback_paid,
          stock_ordered: editedTransaction.stock_ordered,
          treasury_stock_control: editedTransaction.treasury_stock_control,
          treasury_stock_notes: editedTransaction.treasury_stock_notes,
          packaged: editedTransaction.packaged,
          collection_branch: editedTransaction.collection_branch,
          collection_form: editedTransaction.collection_form,
          collection_date: editedTransaction.collection_date,
          stock_reorder_notes: editedTransaction.stock_reorder_notes,
          internal_external_audit: editedTransaction.internal_external_audit,
          ai_systems_review: editedTransaction.ai_systems_review,
          notes: editedTransaction.notes
        })
        .eq('id', editedTransaction.id)
        .select('*, companies(name)')

      if (error) throw error

      // Track changed fields for audit log
      const changedFields = {}
      const fieldsToTrack = [
        'client_type', 'client_name', 'id_passport', 'company_name', 'registration_number',
        'transaction_type', 'transaction_date', 'order_branch', 'sales_consultant',
        'items', 'total_gross_profit', 'admin_details', 'customer_risk_matrix',
        'tfs_screening', 'aml_report_number', 'kyc_documents_received', 'kyc_notes',
        'invoiced', 'proof_of_payment', 'payment_receipt', 'payment_method',
        'supplier_paid', 'buyback_paid', 'stock_ordered', 'treasury_stock_control',
        'treasury_stock_notes', 'stock_reorder_notes', 'packaged', 'collection_branch',
        'collection_form', 'collection_date', 'internal_external_audit', 'ai_systems_review', 'notes'
      ]
      
      fieldsToTrack.forEach(key => {
        const oldVal = selectedTransaction[key]
        const newVal = editedTransaction[key]
        // Compare values, handling different types (including objects for items)
        if (key === 'items' || typeof oldVal === 'object' || typeof newVal === 'object') {
          const oldStr = JSON.stringify(oldVal)
          const newStr = JSON.stringify(newVal)
          if (oldStr !== newStr) {
            changedFields[key] = { from: 'previous value', to: 'updated value' }
          }
        } else {
          const oldStr = oldVal == null ? '' : String(oldVal)
          const newStr = newVal == null ? '' : String(newVal)
          if (oldStr !== newStr) {
            changedFields[key] = {
              from: oldVal,
              to: newVal
            }
          }
        }
      })
      
      console.log('Changed fields:', changedFields) // Debug log
      console.log('Number of changes:', Object.keys(changedFields).length)
      
      // Record audit log (do this BEFORE SharePoint so it always happens)
      if (Object.keys(changedFields).length > 0) {
        try {
          await recordAudit('transaction_update', {
            transaction_id: editedTransaction.id,
            client_name: editedTransaction.client_name || data?.[0]?.client_name,
            company: data?.[0]?.companies?.name,
            changes: changedFields
          })
          console.log('✅ Audit log recorded successfully')
        } catch (auditError) {
          console.error('❌ Audit log failed:', auditError)
        }
      } else {
        console.log('⚠️ No changes detected, skipping audit log')
      }

      // Update SharePoint Excel (after audit log)
      if (data && data[0]) {
        try {
          const sharePointData = {
            ...data[0],
            company_name: data[0].companies?.name || null
          };
          
          await fetch(`${API_BASE_URL}/api/transactions/update/${editedTransaction.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sharePointData)
          })
          console.log('✅ SharePoint updated')
        } catch (spError) {
          console.error('❌ SharePoint update failed:', spError)
          // Don't fail the edit if SharePoint fails
        }
      }

      alert('Transaction updated successfully!')
      setEditMode(false)
      setSelectedTransaction(editedTransaction)
      loadTransactions(currentUser.id)
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('Error updating transaction: ' + error.message)
    }
  }
  
  const updateEditedItem = (index, field, value) => {
    const updatedItems = [...editedTransaction.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // If it's a numeric field, recalculate immediately with the new value (same logic as TransactionForm)
    if (['qty', 'unitPrice', 'unitCos', 'otherCostAmount'].includes(field)) {
      const item = updatedItems[index]
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
    
    // Calculate total gross profit
    const totalGrossProfit = updatedItems.reduce((sum, item) => sum + (parseFloat(item.grossProfit2) || 0), 0)
    
    setEditedTransaction({
      ...editedTransaction,
      items: updatedItems,
      total_gross_profit: totalGrossProfit.toFixed(2)
    })
  }
  
  const addItem = () => {
    const newItem = {
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
    }
    setEditedTransaction({
      ...editedTransaction,
      items: [...editedTransaction.items, newItem]
    })
  }
  
  const removeItem = (index) => {
    if (!confirm('Remove this item?')) return
    
    const updatedItems = editedTransaction.items.filter((_, i) => i !== index)
    const totalGrossProfit = updatedItems.reduce((sum, item) => sum + (parseFloat(item.grossProfit2) || 0), 0)
    
    setEditedTransaction({
      ...editedTransaction,
      items: updatedItems,
      total_gross_profit: totalGrossProfit.toFixed(2)
    })
  }
  
  const printTransaction = () => {
    window.print()
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="header">
          <div className="logo">IBV GOLD</div>
          <div className="title">Sales Consultant Portal</div>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {loginError && <div className="error-message">{loginError}</div>}
          <button type="submit" className="btn">LOGIN</button>
        </form>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <div className="logo">IBV GOLD</div>
          <div className="title">Sales Consultant Portal</div>
          <div className="user-info">
            Logged in as: <strong>{currentUser.username}</strong>
            {currentUser.companies && <span> - {currentUser.companies.name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={goToForm} className="btn" style={{ backgroundColor: '#4CAF50' }}>
            + New Transaction
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filterPeriod === 'all' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('all')}
        >
          All Time
        </button>
        <button
          className={`filter-btn ${filterPeriod === 'today' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('today')}
        >
          Today
        </button>
        <button
          className={`filter-btn ${filterPeriod === 'week' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('week')}
        >
          This Week
        </button>
        <button
          className={`filter-btn ${filterPeriod === 'month' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('month')}
        >
          This Month
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by client name, ID, registration, or consultant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ margin: '12px 0' }}>
        <button className={`filter-btn ${clientTab === 'all' ? 'active' : ''}`} onClick={() => setClientTab('all')}>All Clients</button>
        <button className={`filter-btn ${clientTab === 'individual' ? 'active' : ''}`} onClick={() => setClientTab('individual')} style={{ marginLeft: 8 }}>Individuals</button>
        <button className={`filter-btn ${clientTab === 'company' ? 'active' : ''}`} onClick={() => setClientTab('company')} style={{ marginLeft: 8 }}>Companies</button>
      </div>

      {loading ? (
        <div className="loading">Loading your transactions...</div>
      ) : (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client Name / Company</th>
                <th>ID / Registration</th>
                <th>Total Profit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const allApproved =
                  transaction.administrator_approved &&
                  transaction.accountant_approved &&
                  transaction.treasury_manager_approved &&
                  transaction.compliance_officer_approved
                
                return (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                    <td>{transaction.client_type === 'company' ? transaction.company_name || 'N/A' : transaction.client_name || 'N/A'}</td>
                    <td>{transaction.client_type === 'company' ? transaction.registration_number || 'N/A' : transaction.id_passport || 'N/A'}</td>
                    <td>R {parseFloat(transaction.total_gross_profit || 0).toFixed(2)}</td>
                    <td>
                      {allApproved ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Approved</span>
                      ) : (
                        <span style={{ color: 'orange' }}>Pending Approval</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => viewTransaction(transaction)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No transactions found. Click "New Transaction" to create one.
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="modal show">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={printTransaction}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  🖨️ Print Form
                </button>
                {!editMode && (
                  <button 
                    onClick={startEdit}
                    style={{
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✏️ Edit Transaction
                  </button>
                )}
                {editMode && (
                  <>
                    <button 
                      onClick={saveEdit}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      💾 Save Changes
                    </button>
                    <button 
                      onClick={cancelEdit}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✖ Cancel
                    </button>
                  </>
                )}
              </div>
              <span className="close" onClick={closeModal} style={{ fontSize: '28px', cursor: 'pointer' }}>&times;</span>
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>IBV GOLD BUSINESS FORM TRANSACTION SHEET</h2>
            
            {/* 1. CLIENT DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>1. CLIENT DETAILS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <strong>Date:</strong> {editMode ? (
                    <input
                      type="date"
                      value={editedTransaction.transaction_date}
                      onChange={(e) => setEditedTransaction({...editedTransaction, transaction_date: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px' }}
                    />
                  ) : (
                    <span> {new Date(selectedTransaction.transaction_date).toLocaleDateString()}</span>
                  )}
                </div>

                {selectedTransaction.client_type === 'company' ? (
                  <>
                    <div>
                      <strong>Company Name:</strong> {editMode ? (
                        <input
                          type="text"
                          value={editedTransaction.company_name}
                          onChange={(e) => setEditedTransaction({...editedTransaction, company_name: e.target.value})}
                          style={{ marginLeft: '10px', padding: '5px', width: '70%' }}
                        />
                      ) : (
                        <span> {selectedTransaction.company_name}</span>
                      )}
                    </div>
                    <div>
                      <strong>Registration Number:</strong> {editMode ? (
                        <input
                          type="text"
                          value={editedTransaction.registration_number}
                          onChange={(e) => setEditedTransaction({...editedTransaction, registration_number: e.target.value})}
                          style={{ marginLeft: '10px', padding: '5px', width: '70%' }}
                        />
                      ) : (
                        <span> {selectedTransaction.registration_number}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <strong>Client Full Name(s):</strong> {editMode ? (
                        <input
                          type="text"
                          value={editedTransaction.client_name}
                          onChange={(e) => setEditedTransaction({...editedTransaction, client_name: e.target.value})}
                          style={{ marginLeft: '10px', padding: '5px', width: '70%' }}
                        />
                      ) : (
                        <span> {selectedTransaction.client_name}</span>
                      )}
                    </div>
                    <div>
                      <strong>ID/Passport Number:</strong> {editMode ? (
                        <input
                          type="text"
                          value={editedTransaction.id_passport}
                          onChange={(e) => setEditedTransaction({...editedTransaction, id_passport: e.target.value})}
                          style={{ marginLeft: '10px', padding: '5px', width: '70%' }}
                        />
                      ) : (
                        <span> {selectedTransaction.id_passport}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. SALES DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>2. SALES DETAILS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <strong>BRANCH (Order Location):</strong> {editMode ? (
                    <input
                      type="text"
                      value={editedTransaction.order_branch}
                      onChange={(e) => setEditedTransaction({...editedTransaction, order_branch: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '60%' }}
                    />
                  ) : (
                    <span> {selectedTransaction.order_branch}</span>
                  )}
                </div>
                <div>
                  <strong>SALES CONSULTANT:</strong> {editMode ? (
                    <input
                      type="text"
                      value={editedTransaction.sales_consultant}
                      onChange={(e) => setEditedTransaction({...editedTransaction, sales_consultant: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '60%' }}
                    />
                  ) : (
                    <span> {selectedTransaction.sales_consultant}</span>
                  )}
                </div>
                <div>
                  <strong>Transaction Type:</strong> {editMode ? (
                    <select value={editedTransaction.transaction_type || 'Sales'} onChange={(e) => setEditedTransaction({...editedTransaction, transaction_type: e.target.value})} style={{ marginLeft: '10px', padding: '5px' }}>
                      <option value="Sales">Sales</option>
                      <option value="Buyback">Buyback</option>
                    </select>
                  ) : (
                    <span> {selectedTransaction.transaction_type || 'N/A'}</span>
                  )}
                </div>
              </div>

              {/* 6. STOCK REORDER CONTROL */}
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>6. STOCK REORDER CONTROL</h3>
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Stock Ordered:</strong> {editMode ? (
                    <input type="checkbox" checked={editedTransaction.stock_ordered || false} onChange={(e) => setEditedTransaction({...editedTransaction, stock_ordered: e.target.checked})} style={{ marginLeft: '10px' }} />
                  ) : (
                    <span> {selectedTransaction.stock_ordered ? '✓ Yes' : '✗ No'}</span>
                  )}</p>

                  <p><strong>Stock Reorder Notes:</strong> {editMode ? (
                    <textarea value={editedTransaction.stock_reorder_notes || ''} onChange={(e) => setEditedTransaction({...editedTransaction, stock_reorder_notes: e.target.value})} style={{ marginTop: '8px', width: '100%' }} />
                  ) : (
                    <span> {selectedTransaction.stock_reorder_notes || 'N/A'}</span>
                  )}</p>
                </div>
              </div>

              {/* 8. CUSTOMER COLLECTIONS/DELIVERY */}
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>8. CUSTOMER COLLECTIONS/ DELIVERY</h3>
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Packaged:</strong> {editMode ? (
                    <input type="checkbox" checked={editedTransaction.packaged || false} onChange={(e) => setEditedTransaction({...editedTransaction, packaged: e.target.checked})} style={{ marginLeft: '10px' }} />
                  ) : (
                    <span> {selectedTransaction.packaged ? '✓ Yes' : '✗ No'}</span>
                  )}</p>
                  <p><strong>Branch:</strong> {editMode ? (
                    <select value={editedTransaction.collection_branch || ''} onChange={(e) => setEditedTransaction({...editedTransaction, collection_branch: e.target.value})} style={{ marginLeft: '10px', padding: '5px' }}>
                      <option value="">Select Branch...</option>
                      <option value="london">London</option>
                      <option value="dubai">Dubai</option>
                      <option value="gateway">Gateway</option>
                      <option value="prive">Prive</option>
                      <option value="sandton">Sandton</option>
                      <option value="alice lane">Alice Lane</option>
                      <option value="rosebank">Rosebank</option>
                    </select>
                  ) : (
                    <span> {selectedTransaction.collection_branch || 'N/A'}</span>
                  )}</p>
                  <p><strong>Stock Collected:</strong> {editMode ? (
                    <input type="checkbox" checked={editedTransaction.collection_form || false} onChange={(e) => setEditedTransaction({...editedTransaction, collection_form: e.target.checked})} style={{ marginLeft: '10px' }} />
                  ) : (
                    <span> {selectedTransaction.collection_form ? '✓ Yes' : '✗ No'}</span>
                  )}</p>

                  <p><strong>Collected Date:</strong> {editMode ? (
                    <input type="date" value={editedTransaction.collection_date || ''} onChange={(e) => setEditedTransaction({...editedTransaction, collection_date: e.target.value})} style={{ marginLeft: '10px' }} />
                  ) : (
                    <span> {selectedTransaction.collection_date ? new Date(selectedTransaction.collection_date).toLocaleDateString() : 'N/A'}</span>
                  )}</p>
                </div>
              </div>
              
              <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#3498db', color: 'black' }}>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Product Name</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Qty</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Unit Price</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total Sales</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Unit CoS</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total CoS</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>GP1</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Other Cost</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Amount</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>GP2</th>
                      {editMode && <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(editMode ? editedTransaction.items : selectedTransaction.items || []).map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          {editMode ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateEditedItem(index, 'name', e.target.value)}
                              style={{ width: '100%', padding: '4px' }}
                            />
                          ) : item.name}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          {editMode ? (
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateEditedItem(index, 'qty', e.target.value)}
                              style={{ width: '60px', padding: '4px' }}
                            />
                          ) : item.qty}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          {editMode ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateEditedItem(index, 'unitPrice', e.target.value)}
                              style={{ width: '80px', padding: '4px' }}
                            />
                          ) : `R ${parseFloat(item.unitPrice || 0).toFixed(2)}`}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          R {parseFloat(item.totalSales || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          {editMode ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCos}
                              onChange={(e) => updateEditedItem(index, 'unitCos', e.target.value)}
                              style={{ width: '80px', padding: '4px' }}
                            />
                          ) : `R ${parseFloat(item.unitCos || 0).toFixed(2)}`}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          R {parseFloat(item.totalCos || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          R {parseFloat(item.grossProfit1 || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          {editMode ? (
                            <input
                              type="text"
                              value={item.otherCostType || ''}
                              onChange={(e) => updateEditedItem(index, 'otherCostType', e.target.value)}
                              style={{ width: '100%', padding: '4px' }}
                            />
                          ) : (item.otherCostType || 'None')}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          {editMode ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.otherCostAmount}
                              onChange={(e) => updateEditedItem(index, 'otherCostAmount', e.target.value)}
                              style={{ width: '80px', padding: '4px' }}
                            />
                          ) : `R ${parseFloat(item.otherCostAmount || 0).toFixed(2)}`}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                          R {parseFloat(item.grossProfit2 || 0).toFixed(2)}
                        </td>
                        {editMode && (
                          <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <button
                              onClick={() => removeItem(index)}
                              style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ✖
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editMode && (
                  <button
                    onClick={addItem}
                    style={{ marginTop: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                )}
                <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '1.1em', fontWeight: 'bold' }}>
                  TOTAL GROSS PROFIT: R {parseFloat((editMode ? editedTransaction : selectedTransaction).total_gross_profit || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* 3. ADMIN DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>3. ADMIN DETAILS</h3>
              {editMode ? (
                <textarea
                  value={editedTransaction.admin_details || ''}
                  onChange={(e) => setEditedTransaction({...editedTransaction, admin_details: e.target.value})}
                  style={{ width: '100%', marginTop: '15px', padding: '10px', minHeight: '80px' }}
                />
              ) : (
                <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.admin_details || 'N/A'}</p>
              )}
            </div>

            {/* 4. COMPLIANCE DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>4. COMPLIANCE DETAILS</h3>
              <div style={{ marginTop: '15px' }}>
                <p>
                  <strong>Customer Risk Matrix:</strong> {editMode ? (
                    <input
                      type="text"
                      value={editedTransaction.customer_risk_matrix || ''}
                      onChange={(e) => setEditedTransaction({...editedTransaction, customer_risk_matrix: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '60%' }}
                    />
                  ) : (
                    <span> {selectedTransaction.customer_risk_matrix || 'N/A'}</span>
                  )}
                </p>
                <p>
                  <strong>TFS/ Sanction Screening:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.tfs_screening || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, tfs_screening: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.tfs_screening ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
                <p>
                  <strong>AML Report Number:</strong> {editMode ? (
                    <input
                      type="text"
                      value={editedTransaction.aml_report_number || ''}
                      onChange={(e) => setEditedTransaction({...editedTransaction, aml_report_number: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '60%' }}
                    />
                  ) : (
                    <span> {selectedTransaction.aml_report_number || 'N/A'}</span>
                  )}
                </p>
                <p>
                  <strong>KYC Documents Received:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.kyc_documents_received || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, kyc_documents_received: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.kyc_documents_received ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
                <p>
                  <strong>KYC Notes:</strong> {editMode ? (
                    <textarea
                      value={editedTransaction.kyc_notes || ''}
                      onChange={(e) => setEditedTransaction({...editedTransaction, kyc_notes: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '90%', marginTop: '5px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.kyc_notes || 'N/A'}</span>
                  )}
                </p>
              </div>
            </div>

            {/* 5. FINANCE CONTROLS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>5. FINANCE CONTROLS</h3>
              <div style={{ marginTop: '15px' }}>
                <p>
                  <strong>Invoiced:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.invoiced || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, invoiced: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.invoiced ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
                <p>
                  <strong>Proof of Payment Received:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.proof_of_payment || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, proof_of_payment: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.proof_of_payment ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
                <p>
                  <strong>Payment Receipt:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.payment_receipt || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, payment_receipt: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.payment_receipt ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
                <p>
                  <strong>Payment Method:</strong> {editMode ? (
                    <input
                      type="text"
                      value={editedTransaction.payment_method || ''}
                      onChange={(e) => setEditedTransaction({...editedTransaction, payment_method: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '60%' }}
                    />
                  ) : (
                    <span> {selectedTransaction.payment_method || 'N/A'}</span>
                  )}
                </p>

                <p>
                  <strong>Supplier Paid:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.supplier_paid || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, supplier_paid: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.supplier_paid ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>

                <p>
                  <strong>Buyback Paid:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.buyback_paid || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, buyback_paid: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.buyback_paid ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
              </div>
            </div>

            {/* 6. STOCK REORDER CONTROL */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>6. STOCK REORDER CONTROL</h3>
              <div style={{ marginTop: '15px' }}>
                <p>
                  <strong>Stock Ordered:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.stock_ordered || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, stock_ordered: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.stock_ordered ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
              </div>
            </div>

            {/* 7. TREASURY/STOCK CONTROL */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>7. TREASURY/ STOCK CONTROL</h3>
              <div style={{ marginTop: '15px' }}>
                <p>
                  <strong>Stock Status:</strong> {editMode ? (
                    <input
                      type="text"
                      value={editedTransaction.treasury_stock_control || ''}
                      onChange={(e) => setEditedTransaction({...editedTransaction, treasury_stock_control: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '60%' }}
                    />
                  ) : (
                    <span> {selectedTransaction.treasury_stock_control || 'N/A'}</span>
                  )}
                </p>
                <p>
                  <strong>Treasury/Stock Control Notes:</strong> {editMode ? (
                    <textarea
                      value={editedTransaction.treasury_stock_notes || ''}
                      onChange={(e) => setEditedTransaction({...editedTransaction, treasury_stock_notes: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '90%', marginTop: '5px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.treasury_stock_notes || 'N/A'}</span>
                  )}
                </p>
              </div>
            </div>

            {/* 8. CUSTOMER COLLECTIONS/DELIVERY */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>8. CUSTOMER COLLECTIONS/ DELIVERY</h3>
              <div style={{ marginTop: '15px' }}>
                <p>
                  <strong>Packaged:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.packaged || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, packaged: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.packaged ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
                <p>
                  <strong>Branch:</strong> {editMode ? (
                    <input
                      type="text"
                      value={editedTransaction.collection_branch || ''}
                      onChange={(e) => setEditedTransaction({...editedTransaction, collection_branch: e.target.value})}
                      style={{ marginLeft: '10px', padding: '5px', width: '60%' }}
                    />
                  ) : (
                    <span> {selectedTransaction.collection_branch || 'N/A'}</span>
                  )}
                </p>
                <p>
                  <strong>Stock Collected:</strong> {editMode ? (
                    <input
                      type="checkbox"
                      checked={editedTransaction.collection_form || false}
                      onChange={(e) => setEditedTransaction({...editedTransaction, collection_form: e.target.checked})}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : (
                    <span> {selectedTransaction.collection_form ? '✓ Yes' : '✗ No'}</span>
                  )}
                </p>
              </div>
            </div>

            {/* 9. INTERNAL/EXTERNAL AUDIT */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>9. INTERNAL/ EXTERNAL AUDIT</h3>
              {editMode ? (
                <textarea
                  value={editedTransaction.internal_external_audit || ''}
                  onChange={(e) => setEditedTransaction({...editedTransaction, internal_external_audit: e.target.value})}
                  style={{ width: '100%', marginTop: '15px', padding: '10px', minHeight: '80px' }}
                />
              ) : (
                <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.internal_external_audit || 'N/A'}</p>
              )}
            </div>

            {/* 10. AI SYSTEMS REVIEW */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>10. AI SYSTEMS REVIEW</h3>
              {editMode ? (
                <textarea
                  value={editedTransaction.ai_systems_review || ''}
                  onChange={(e) => setEditedTransaction({...editedTransaction, ai_systems_review: e.target.value})}
                  style={{ width: '100%', marginTop: '15px', padding: '10px', minHeight: '80px' }}
                />
              ) : (
                <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.ai_systems_review || 'N/A'}</p>
              )}
            </div>

            {/* NOTES */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>NOTES</h3>
              {editMode ? (
                <textarea
                  value={editedTransaction.notes || ''}
                  onChange={(e) => setEditedTransaction({...editedTransaction, notes: e.target.value})}
                  style={{ width: '100%', marginTop: '15px', padding: '10px', minHeight: '80px' }}
                />
              ) : (
                <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.notes || 'N/A'}</p>
              )}
            </div>

            {/* APPROVALS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
              <h3 style={{ color: '#856404', borderBottom: '2px solid #ffc107', paddingBottom: '10px' }}>APPROVALS STATUS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <strong>Administrator:</strong> {selectedTransaction.administrator_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.administrator_name && <span> by {selectedTransaction.administrator_name}</span>}
                </div>
                <div>
                  <strong>Accountant:</strong> {selectedTransaction.accountant_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.accountant_name && <span> by {selectedTransaction.accountant_name}</span>}
                </div>
                <div>
                  <strong>Treasury Manager:</strong> {selectedTransaction.treasury_manager_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.treasury_manager_name && <span> by {selectedTransaction.treasury_manager_name}</span>}
                </div>
                <div>
                  <strong>Compliance Officer:</strong> {selectedTransaction.compliance_officer_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.compliance_officer_name && <span> by {selectedTransaction.compliance_officer_name}</span>}
                </div>
              </div>
            </div>

            {/* Submission Info */}
            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px', textAlign: 'center' }}>
              <p><strong>Company:</strong> {selectedTransaction.companies ? selectedTransaction.companies.name : 'N/A'}</p>
              <p><strong>Submission Date:</strong> {new Date(selectedTransaction.submission_date).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
