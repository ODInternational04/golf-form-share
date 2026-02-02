import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [userRole, setUserRole] = useState('')
  const [currentUser, setCurrentUser] = useState('')
  const [currentUserFullName, setCurrentUserFullName] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [clientTab, setClientTab] = useState('all') // 'all' | 'individual' | 'company' 
  
  // Company Excel Files State
  const [companyExcelFiles, setCompanyExcelFiles] = useState([])
  const [showCompanyExcels, setShowCompanyExcels] = useState(false)
  
  // User Management State
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [users, setUsers] = useState([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'Administrator',
    full_name: '',
    user_type: 'approver',
    company_id: ''
  })
  
  // Company Management State
  const [companies, setCompanies] = useState([])
  const [userCompanyAccess, setUserCompanyAccess] = useState({})
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [selectedUserForCompanies, setSelectedUserForCompanies] = useState(null)
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [userCompanies, setUserCompanies] = useState([])
  const [showCompanyManagement, setShowCompanyManagement] = useState(false)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [showEditCompany, setShowEditCompany] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [newCompany, setNewCompany] = useState({ code: '', name: '' })

  useEffect(() => {
    // Check session storage
    const loggedIn = sessionStorage.getItem('adminLoggedIn')
    const role = sessionStorage.getItem('userRole')
    const user = sessionStorage.getItem('username')
    const userId = sessionStorage.getItem('userId')
    const fullName = sessionStorage.getItem('userFullName')
    
    if (loggedIn === 'true' && role && user && userId) {
      setIsLoggedIn(true)
      setUserRole(role)
      setCurrentUser(user)
      setCurrentUserId(userId)
      setCurrentUserFullName(fullName || user)
      loadCompanies()
      if (role === 'Master Admin') {
        loadTransactions() // Master sees all
        loadUsers()
      } else {
        loadUserCompanyAccess(userId)
      }
    }
  }, [])

  useEffect(() => {
    if (transactions.length > 0) {
      applyFilters()
    }
  }, [transactions, filterPeriod, filterStatus, searchTerm, clientTab])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    try {
      // Query the database for user credentials
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single()
      
      if (error) {
        setLoginError('Invalid username or password')
        return
      }
      
      // Check if user is a consultant (not allowed to access admin)
      if (data && data.user_type === 'consultant') {
        setLoginError('Consultants cannot access the admin dashboard. Please use the consultant portal.')
        return
      }
      
      // Check password (in production, use hashed passwords)
      if (data && data.password === password) {
        const fullName = data.full_name || username
        setIsLoggedIn(true)
        setUserRole(data.role)
        setCurrentUser(username)
        setCurrentUserId(data.id)
        setCurrentUserFullName(fullName)
        sessionStorage.setItem('adminLoggedIn', 'true')
        sessionStorage.setItem('userRole', data.role)
        sessionStorage.setItem('username', username)
        sessionStorage.setItem('userId', data.id)
        sessionStorage.setItem('userFullName', fullName)
        loadCompanies()
        if (data.role === 'Master Admin') {
          loadTransactions() // Master sees all
          loadUsers()
        } else {
          loadUserCompanyAccess(data.id) // Approvers only see their companies
        }
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
    setUserRole('')
    setCurrentUser('')
    sessionStorage.removeItem('adminLoggedIn')
    sessionStorage.removeItem('userRole')
    sessionStorage.removeItem('username')
  }

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, companies(name)')
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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
      
      // Load company access for all users
      const accessData = {}
      for (const user of data || []) {
        if (user.user_type === 'approver' || user.user_type === 'master') {
          const { data: access } = await supabase
            .from('user_company_access')
            .select('company_id, companies(name)')
            .eq('user_id', user.id)
          accessData[user.id] = access || []
        }
      }
      setUserCompanyAccess(accessData)
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Error loading users: ' + error.message)
    }
  }
  
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }
  
  const loadUserCompanyAccess = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', userId)

      if (error) throw error
      
      const companyIds = (data || []).map(item => item.company_id)
      setUserCompanies(companyIds)
      
      // Load transactions for these companies
      if (companyIds.length > 0) {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*, companies(name)')
          .in('company_id', companyIds)
          .order('submission_date', { ascending: false })

        if (txError) throw txError
        setTransactions(txData || [])
      }
    } catch (error) {
      console.error('Error loading user company access:', error)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    
    if (!newUser.username || !newUser.password || !newUser.role) {
      alert('Please fill in all required fields')
      return
    }
    
    // Validate consultant has company
    if (newUser.user_type === 'consultant' && !newUser.company_id) {
      alert('Please select a company for the consultant')
      return
    }

    try {
      const userData = {
        username: newUser.username.toLowerCase(),
        password: newUser.password,
        role: newUser.role,
        full_name: newUser.full_name,
        user_type: newUser.user_type,
        created_by: currentUser
      }
      
      // Only add company_id for consultants
      if (newUser.user_type === 'consultant') {
        userData.company_id = parseInt(newUser.company_id)
      }

      const { error } = await supabase
        .from('users')
        .insert([userData])

      if (error) throw error

      alert('User added successfully!')
      setShowAddUser(false)
      setNewUser({ 
        username: '', 
        password: '', 
        role: 'Administrator', 
        full_name: '',
        user_type: 'approver',
        company_id: ''
      })
      loadUsers()
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Error adding user: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId, username, userRole) => {
    // Protect Master Admin role users from deletion
    if (userRole === 'Master Admin') {
      alert('Cannot delete Master Admin users')
      return
    }

    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('User deleted successfully!')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + error.message)
    }
  }
  
  const openEditUser = (user) => {
    setEditingUser({
      id: user.id,
      username: user.username,
      password: '', // Don't pre-fill password
      full_name: user.full_name || '',
      role: user.role,
      user_type: user.user_type || 'approver',
      company_id: user.company_id || ''
    })
    setShowEditUser(true)
  }
  
  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    try {
      const updateData = {
        full_name: editingUser.full_name,
        role: editingUser.role,
        user_type: editingUser.user_type
      }
      
      // Only update password if provided
      if (editingUser.password) {
        updateData.password = editingUser.password
      }
      
      // Only add company_id for consultants
      if (editingUser.user_type === 'consultant') {
        updateData.company_id = parseInt(editingUser.company_id)
      } else {
        updateData.company_id = null
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', editingUser.id)

      if (error) throw error

      alert('User updated successfully!')
      setShowEditUser(false)
      setEditingUser(null)
      loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user: ' + error.message)
    }
  }
  
  const handleAddCompany = async (e) => {
    e.preventDefault()
    
    if (!newCompany.code || !newCompany.name) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase
        .from('companies')
        .insert([{
          code: newCompany.code.toUpperCase(),
          name: newCompany.name
        }])

      if (error) throw error

      alert('Company added successfully!')
      setShowAddCompany(false)
      setNewCompany({ code: '', name: '' })
      loadCompanies()
    } catch (error) {
      console.error('Error adding company:', error)
      alert('Error adding company: ' + error.message)
    }
  }
  
  const openEditCompany = (company) => {
    setEditingCompany({
      id: company.id,
      code: company.code,
      name: company.name
    })
    setShowEditCompany(true)
  }
  
  const handleUpdateCompany = async (e) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          code: editingCompany.code.toUpperCase(),
          name: editingCompany.name
        })
        .eq('id', editingCompany.id)

      if (error) throw error

      alert('Company updated successfully!')
      setShowEditCompany(false)
      setEditingCompany(null)
      loadCompanies()
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Error updating company: ' + error.message)
    }
  }
  
  const openCompanyManagement = async (user) => {
    setSelectedUserForCompanies(user)
    setShowCompanyModal(true)
    
    // Load current company access for this user
    if (user.user_type === 'approver' || user.user_type === 'master') {
      try {
        const { data, error } = await supabase
          .from('user_company_access')
          .select('company_id')
          .eq('user_id', user.id)

        if (error) throw error
        setSelectedCompanies((data || []).map(item => item.company_id))
      } catch (error) {
        console.error('Error loading company access:', error)
      }
    }
  }
  
  const handleCompanyToggle = (companyId) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId)
      } else {
        return [...prev, companyId]
      }
    })
  }
  
  const saveCompanyAccess = async () => {
    if (!selectedUserForCompanies) return
    
    try {
      // Delete existing access
      await supabase
        .from('user_company_access')
        .delete()
        .eq('user_id', selectedUserForCompanies.id)
      
      // Insert new access
      if (selectedCompanies.length > 0) {
        const accessData = selectedCompanies.map(companyId => ({
          user_id: selectedUserForCompanies.id,
          company_id: companyId
        }))
        
        const { error } = await supabase
          .from('user_company_access')
          .insert(accessData)
        
        if (error) throw error
      }
      
      alert('Company access updated successfully!')
      setShowCompanyModal(false)
      setSelectedUserForCompanies(null)
      setSelectedCompanies([])
      loadUsers()
    } catch (error) {
      console.error('Error saving company access:', error)
      alert('Error saving company access: ' + error.message)
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

    // Approval status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'closed') {
        filtered = filtered.filter(t =>
          t.administrator_approved &&
          t.accountant_approved &&
          t.treasury_manager_approved &&
          t.compliance_officer_approved
        )
      } else {
        const roleColumnMap = {
          'Administrator': 'administrator_approved',
          'Accountant': 'accountant_approved',
          'Treasury Manager': 'treasury_manager_approved',
          'Compliance Officer': 'compliance_officer_approved'
        }
        const column = roleColumnMap[userRole]
        if (column) {
          filtered = filtered.filter(t => {
            const isApproved = t[column] === true
            return filterStatus === 'approved' ? isApproved : !isApproved
          })
        }
      }
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

    // Client type tab filter
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
  }

  const printTransaction = () => {
    window.print()
  }

  const approveTransaction = async (transactionId, role) => {
    if (!confirm(`Are you sure you want to approve this transaction as ${role}?`)) {
      return
    }

    try {
      const roleColumnMap = {
        'Administrator': { approved: 'administrator_approved', date: 'administrator_approved_date', name: 'administrator_name' },
        'Accountant': { approved: 'accountant_approved', date: 'accountant_approved_date', name: 'accountant_name' },
        'Treasury Manager': { approved: 'treasury_manager_approved', date: 'treasury_manager_approved_date', name: 'treasury_manager_name' },
        'Compliance Officer': { approved: 'compliance_officer_approved', date: 'compliance_officer_approved_date', name: 'compliance_officer_name' }
      }

      const columns = roleColumnMap[role]
      const updateData = {
        [columns.approved]: true,
        [columns.date]: new Date().toISOString(),
        [columns.name]: currentUserFullName || currentUser
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()

      if (error) throw error

      // Update SharePoint Excel
      if (data && data[0]) {
        try {
          await fetch(`http://localhost:3001/api/transactions/update/${transactionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data[0])
          })
        } catch (spError) {
          console.error('Error updating SharePoint:', spError)
          // Don't fail the approval if SharePoint fails
        }
      }

      alert('Transaction approved successfully!')
      closeModal()
      loadTransactions()
    } catch (error) {
      console.error('Error approving transaction:', error)
      alert('Error approving transaction: ' + error.message)
    }
  }

  const deleteTransaction = async (transactionId) => {
    if (!confirm('⚠️ Are you sure you want to DELETE this transaction? This action cannot be undone!')) {
      return
    }

    try {
      console.log('Deleting transaction:', transactionId)
      
      const { data, error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .select()

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      console.log('Delete successful:', data)
      alert('✓ Transaction deleted successfully!')
      closeModal()
      await loadTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction: ' + error.message)
    }
  }

  const downloadExcel = async () => {
    try {
      setLoading(true)
      
      // Prepare data for Excel
      const excelData = transactions.map(t => {
        const items = Array.isArray(t.items) ? t.items : []
        
        return items.map((item, index) => ({
          'Submission Date': new Date(t.submission_date).toLocaleDateString(),
          'Transaction Date': new Date(t.transaction_date).toLocaleDateString(),
          'Client Name': t.client_name,
          'ID/Passport': t.id_passport,
          'Order Branch': t.order_branch,
          'Sales Consultant': t.sales_consultant,
          'Item Name': item.name || '',
          'Quantity': item.qty || 0,
          'Unit Price (R)': item.unitPrice || 0,
          'Total Sales (R)': item.totalSales || 0,
          'Unit COS (R)': item.unitCos || 0,
          'Total COS (R)': item.totalCos || 0,
          'Gross Profit 1 (R)': item.grossProfit1 || 0,
          'Supplier': item.supplier || '',
          'Supplier Other': item.supplierOther || '',
          'Other Cost Type': item.otherCostType || '',
          'Other Cost Detail': item.otherCostTypeDetail || '',
          'Other Cost Amount': item.otherCostAmount || 0,
          'Gross Profit 2 (R)': item.grossProfit2 || 0,
          'Transaction Total Profit (R)': index === 0 ? t.total_gross_profit : '',
          'Admin Details': index === 0 ? t.admin_details : '',
          'Risk Matrix': index === 0 ? t.customer_risk_matrix : '',
          'TFS Screening': index === 0 ? t.tfs_screening : '',
          'AML Report': index === 0 ? t.aml_report_number : '',
          'KYC Documents': index === 0 ? t.kyc_documents_received : '',
          'KYC Notes': index === 0 ? t.kyc_notes : '',
          'Invoiced': index === 0 ? t.invoiced : '',
          'Proof of Payment': index === 0 ? t.proof_of_payment : '',
          'Payment Receipt': index === 0 ? t.payment_receipt : '',
          'Supplier Paid': index === 0 ? t.supplier_paid : '',
          'Buyback Paid': index === 0 ? t.buyback_paid : '',
          'Payment Method': index === 0 ? t.payment_method : '',
          'Stock Ordered': index === 0 ? t.stock_ordered : '',
          'Treasury/Stock Control': index === 0 ? t.treasury_stock_control : '',
          'Treasury Notes': index === 0 ? t.treasury_stock_notes : '',
          'Stock Reorder Notes': index === 0 ? t.stock_reorder_notes : '',
          'Packaged': index === 0 ? t.packaged : '',
          'Collection Branch': index === 0 ? t.collection_branch : '',
          'Collection Date': index === 0 ? t.collection_date : '',
          'Collection Form': index === 0 ? t.collection_form : '',
          'Audit': index === 0 ? t.internal_external_audit : '',
          'AI Review': index === 0 ? t.ai_systems_review : '',
          'Administrator': index === 0 ? (t.administrator_approved ? 'Yes' : 'No') : '',
          'Administrator Name': index === 0 ? t.administrator_name : '',
          'Accountant': index === 0 ? (t.accountant_approved ? 'Yes' : 'No') : '',
          'Accountant Name': index === 0 ? t.accountant_name : '',
          'Treasury Manager': index === 0 ? (t.treasury_manager_approved ? 'Yes' : 'No') : '',
          'Treasury Manager Name': index === 0 ? t.treasury_manager_name : '',
          'Compliance Officer': index === 0 ? (t.compliance_officer_approved ? 'Yes' : 'No') : '',
          'Compliance Officer Name': index === 0 ? t.compliance_officer_name : '',
          'Notes': index === 0 ? t.notes : ''
        }))
      }).flat()

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
      
      // Save file
      XLSX.writeFile(wb, 'transactions.xlsx')
    } catch (error) {
      console.error('Error downloading Excel:', error)
      alert('Error downloading Excel file: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const openSharePointExcel = async (companyName = null) => {
    try {
      const url = companyName 
        ? `http://localhost:3001/api/excel/url?companyName=${encodeURIComponent(companyName)}`
        : 'http://localhost:3001/api/excel/url';
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && data.url) {
        window.open(data.url, '_blank')
      } else {
        alert('Error: Could not get Excel file URL')
      }
    } catch (error) {
      console.error('Error opening SharePoint Excel:', error)
      alert('Error opening SharePoint Excel: ' + error.message)
    }
  }

  const loadCompanyExcelFiles = async () => {
    console.log('=== loadCompanyExcelFiles function called ===');
    console.log('User Role:', userRole);
    try {
      console.log('Loading company Excel files...');
      const response = await fetch('http://localhost:3001/api/excel/companies')
      console.log('Response status:', response.status);
      const data = await response.json()
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Fetching default Excel URL...');
        // Get the URL for "Gold Gateway - IBV Gold KZN" (default Transactions.xlsx)
        const defaultUrlResponse = await fetch('http://localhost:3001/api/excel/url?companyName=Gold Gateway - IBV Gold KZN')
        const defaultUrlData = await defaultUrlResponse.json()
        console.log('Default URL data:', defaultUrlData);
        
        // Always include "Gold Gateway - IBV Gold KZN" which uses the default Transactions.xlsx
        const goldGatewayCompany = {
          name: 'Gold Gateway - IBV Gold KZN',
          url: defaultUrlData.url
        }
        
        const allCompanies = [goldGatewayCompany, ...data.companies];
        console.log('All companies:', allCompanies);
        setCompanyExcelFiles(allCompanies)
        console.log('Setting showCompanyExcels to true');
        setShowCompanyExcels(true)
      } else {
        alert('Error loading company Excel files: ' + data.error)
      }
    } catch (error) {
      console.error('Error loading company Excel files:', error)
      alert('Error loading company Excel files: ' + error.message)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="header">
          <div className="logo">IBV GOLD</div>
          <div className="title">Admin Dashboard</div>
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
          <div className="title">Admin Dashboard</div>
          <div className="user-info">
            Logged in as: <strong>{currentUser}</strong> ({userRole})
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'Master Admin' && (
            <>
              <button 
                onClick={() => {
                  setShowUserManagement(!showUserManagement)
                  setShowCompanyManagement(false)
                }} 
                className="logout-btn"
                style={{ backgroundColor: '#4CAF50' }}
              >
                {showUserManagement ? 'View Transactions' : 'Manage Users'}
              </button>
              <button 
                onClick={() => {
                  setShowCompanyManagement(!showCompanyManagement)
                  setShowUserManagement(false)
                }} 
                className="logout-btn"
                style={{ backgroundColor: '#FF9800' }}
              >
                {showCompanyManagement ? 'View Transactions' : 'Manage Companies'}
              </button>
            </>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {showCompanyManagement && userRole === 'Master Admin' ? (
        // Company Management Section
        <div className="user-management">
          <h2>Company Management</h2>
          
          <button 
            onClick={() => setShowAddCompany(!showAddCompany)} 
            className="btn"
            style={{ marginBottom: '20px' }}
          >
            {showAddCompany ? 'Cancel' : '+ Add New Company'}
          </button>

          {showAddCompany && (
            <form onSubmit={handleAddCompany} style={{ 
              marginBottom: '30px', 
              padding: '20px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3>Add New Company</h3>
              <div className="form-group">
                <label>Company Code:</label>
                <input
                  type="text"
                  value={newCompany.code}
                  onChange={(e) => setNewCompany({...newCompany, code: e.target.value})}
                  placeholder="e.g., GG-KZN"
                  required
                />
              </div>
              <div className="form-group">
                <label>Company Name:</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  placeholder="e.g., Gold Gateway - IBV Gold KZN"
                  required
                />
              </div>
              <button type="submit" className="btn">Add Company</button>
            </form>
          )}

          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td><strong>{company.code}</strong></td>
                    <td>{company.name}</td>
                    <td>
                      <span style={{ 
                        color: company.is_active ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {company.is_active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => openEditCompany(company)}
                        style={{ backgroundColor: '#2196F3', marginRight: '5px' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Edit Company Modal */}
          {showEditCompany && editingCompany && (
            <div className="modal show">
              <div className="modal-content" style={{ maxWidth: '500px' }}>
                <span className="close" onClick={() => { setShowEditCompany(false); setEditingCompany(null); }}>&times;</span>
                <h2>Edit Company</h2>
                <form onSubmit={handleUpdateCompany}>
                  <div className="form-group">
                    <label>Company Code:</label>
                    <input
                      type="text"
                      value={editingCompany.code}
                      onChange={(e) => setEditingCompany({...editingCompany, code: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Name:</label>
                    <input
                      type="text"
                      value={editingCompany.name}
                      onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" className="btn" style={{ flex: 1 }}>
                      Update Company
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setShowEditCompany(false); setEditingCompany(null); }} 
                      className="btn" 
                      style={{ flex: 1, backgroundColor: '#666' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : showUserManagement && userRole === 'Master Admin' ? (
        // User Management Section
        <div className="user-management">
          <h2>User Management</h2>
          
          <button 
            onClick={() => setShowAddUser(!showAddUser)} 
            className="btn"
            style={{ marginBottom: '20px' }}
          >
            {showAddUser ? 'Cancel' : '+ Add New User'}
          </button>

          {showAddUser && (
            <form onSubmit={handleAddUser} style={{ 
              marginBottom: '30px', 
              padding: '20px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3>Add New User</h3>
              
              <div className="form-group">
                <label>User Type:</label>
                <select
                  value={newUser.user_type}
                  onChange={(e) => setNewUser({...newUser, user_type: e.target.value, role: e.target.value === 'consultant' ? 'Sales Consultant' : 'Administrator'})}
                  required
                >
                  <option value="approver">Approver (Admin/Accountant/Treasury/Compliance)</option>
                  <option value="consultant">Sales Consultant</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                />
              </div>
              
              {newUser.user_type === 'approver' ? (
                <div className="form-group">
                  <label>Role:</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    required
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Treasury Manager">Treasury Manager</option>
                    <option value="Compliance Officer">Compliance Officer</option>
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Company:</label>
                  <select
                    value={newUser.company_id}
                    onChange={(e) => setNewUser({...newUser, company_id: e.target.value})}
                    required
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <button type="submit" className="btn">Add User</button>
              {newUser.user_type === 'approver' && (
                <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                  Note: Company access for approvers is assigned after user creation
                </p>
              )}
            </form>
          )}

          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Type</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Company Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.full_name || '-'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{user.user_type || 'approver'}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.user_type === 'consultant' && user.companies ? user.companies.name : '-'}
                    </td>
                    <td>
                      {(user.user_type === 'approver' || user.user_type === 'master') && (
                        <>
                          {userCompanyAccess[user.id] && userCompanyAccess[user.id].length > 0 ? (
                            <div style={{ fontSize: '0.85em' }}>
                              {userCompanyAccess[user.id].map(acc => acc.companies.name).join(', ')}
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>None</span>
                          )}
                        </>
                      )}
                      {user.user_type === 'consultant' && '-'}
                    </td>
                    <td>
                      {(user.user_type === 'approver' || user.user_type === 'master') && (
                        <button
                          className="view-btn"
                          onClick={() => openCompanyManagement(user)}
                          style={{ backgroundColor: '#2196F3', marginRight: '5px' }}
                        >
                          Manage Companies
                        </button>
                      )}
                      <button
                        className="view-btn"
                        onClick={() => openEditUser(user)}
                        style={{ backgroundColor: '#FF9800', marginRight: '5px' }}
                      >
                        Edit
                      </button>
                      <button
                        className="view-btn"
                        onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                        style={{ backgroundColor: '#f44336' }}
                        disabled={user.role === 'Master Admin'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Company Management Modal */}
          {showCompanyModal && selectedUserForCompanies && (
            <div className="modal show">
              <div className="modal-content" style={{ maxWidth: '500px' }}>
                <span className="close" onClick={() => { setShowCompanyModal(false); setSelectedUserForCompanies(null); }}>&times;</span>
                <h2>Manage Company Access</h2>
                <p><strong>User:</strong> {selectedUserForCompanies.username} ({selectedUserForCompanies.role})</p>
                
                <div style={{ marginTop: '20px' }}>
                  <h3>Select Companies:</h3>
                  {companies.map(company => (
                    <div key={company.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(company.id)}
                          onChange={() => handleCompanyToggle(company.id)}
                          style={{ marginRight: '10px', width: '18px', height: '18px' }}
                        />
                        <span>{company.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button onClick={saveCompanyAccess} className="btn" style={{ flex: 1 }}>
                    Save Access
                  </button>
                  <button 
                    onClick={() => { setShowCompanyModal(false); setSelectedUserForCompanies(null); }} 
                    className="btn" 
                    style={{ flex: 1, backgroundColor: '#666' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Edit User Modal */}
          {showEditUser && editingUser && (
            <div className="modal show">
              <div className="modal-content" style={{ maxWidth: '500px' }}>
                <span className="close" onClick={() => { setShowEditUser(false); setEditingUser(null); }}>&times;</span>
                <h2>Edit User</h2>
                <form onSubmit={handleUpdateUser}>
                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      disabled
                      style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666' }}>Username cannot be changed</small>
                  </div>
                  <div className="form-group">
                    <label>New Password (leave blank to keep current):</label>
                    <input
                      type="text"
                      value={editingUser.password}
                      onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                      placeholder="Enter new password or leave blank"
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Name:</label>
                    <input
                      type="text"
                      value={editingUser.full_name}
                      onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>User Type:</label>
                    <select
                      value={editingUser.user_type}
                      onChange={(e) => setEditingUser({...editingUser, user_type: e.target.value, role: e.target.value === 'consultant' ? 'Sales Consultant' : editingUser.role})}
                      required
                    >
                      <option value="approver">Approver</option>
                      <option value="consultant">Sales Consultant</option>
                    </select>
                  </div>
                  
                  {editingUser.user_type === 'approver' ? (
                    <div className="form-group">
                      <label>Role:</label>
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                        required
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Treasury Manager">Treasury Manager</option>
                        <option value="Compliance Officer">Compliance Officer</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Company:</label>
                      <select
                        value={editingUser.company_id}
                        onChange={(e) => setEditingUser({...editingUser, company_id: e.target.value})}
                        required
                      >
                        <option value="">Select Company</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" className="btn" style={{ flex: 1 }}>
                      Update User
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setShowEditUser(false); setEditingUser(null); }} 
                      className="btn" 
                      style={{ flex: 1, backgroundColor: '#666' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Transactions Section (existing code)
        <>
          <button onClick={downloadExcel} className="download-btn" disabled={loading}>
            ⬇ Download Excel Report
          </button>
          {userRole === 'Master Admin' && (
            <button 
              onClick={(e) => {
                console.log('Button clicked!', e);
                loadCompanyExcelFiles();
              }} 
              className="download-btn" 
              style={{ marginLeft: '10px', backgroundColor: '#2e7d32' }}
            >
              📊 Open Company Excel Files
            </button>
          )}
          {userRole !== 'Master Admin' && (
            <button 
              onClick={() => openSharePointExcel()} 
              className="download-btn" 
              style={{ marginLeft: '10px', backgroundColor: '#2e7d32' }}
            >
              📊 Open Excel in SharePoint
            </button>
          )}

          {/* Company Excel Files Modal */}
          {showCompanyExcels && (
            <div className="modal-overlay" onClick={() => setShowCompanyExcels(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <h2>Company Excel Files</h2>
                <div style={{ marginTop: '20px' }}>
                  {companyExcelFiles.length === 0 ? (
                    <p>No company Excel files found. Files will be created when transactions are submitted.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {companyExcelFiles.map((company, index) => (
                        <button
                          key={index}
                          onClick={() => window.open(company.url, '_blank')}
                          style={{
                            padding: '15px',
                            backgroundColor: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          📊 {company.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setShowCompanyExcels(false)}
                    style={{
                      marginTop: '20px',
                      padding: '10px 20px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

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

      <div className="filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending My Approval</option>
          <option value="approved">Approved by Me</option>
          <option value="closed">Fully Closed</option>
        </select>
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
        <div className="loading">Loading transactions...</div>
      ) : (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client Name</th>
                <th>Sales Consultant</th>
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
                    <td>{transaction.client_type === 'company' ? `${transaction.company_name || 'N/A'}${transaction.registration_number ? ` (Reg: ${transaction.registration_number})` : ''}` : `${transaction.client_name || 'N/A'}${transaction.id_passport ? ` (ID: ${transaction.id_passport})` : ''}`}</td>
                    <td>{transaction.sales_consultant}</td>
                    <td>R {parseFloat(transaction.total_gross_profit || 0).toFixed(2)}</td>
                    <td>
                      {allApproved ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Closed</span>
                      ) : (
                        <span style={{ color: 'orange' }}>Pending</span>
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
              No transactions found
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="modal show">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
              <span className="close" onClick={closeModal} style={{ fontSize: '28px', cursor: 'pointer' }}>&times;</span>
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>IBV GOLD BUSINESS FORM TRANSACTION SHEET</h2>
            
            {/* 1. CLIENT DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>1. CLIENT DETAILS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <p><strong>Date:</strong> {new Date(selectedTransaction.transaction_date).toLocaleDateString()}</p>
                {selectedTransaction.client_type === 'company' ? (
                  <>
                    <p><strong>Company Name:</strong> {selectedTransaction.company_name || 'N/A'}</p>
                    <p><strong>Registration Number:</strong> {selectedTransaction.registration_number || 'N/A'}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Client Full Name(s):</strong> {selectedTransaction.client_name}</p>
                    <p><strong>ID/Passport Number:</strong> {selectedTransaction.id_passport}</p>
                  </>
                )}
              </div>
            </div>

            {/* 2. SALES DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>2. SALES DETAILS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <p><strong>BRANCH (Order Location):</strong> {selectedTransaction.order_branch}</p>
                <p><strong>SALES CONSULTANT:</strong> {selectedTransaction.sales_consultant}</p>
                <p><strong>Transaction Type:</strong> {selectedTransaction.transaction_type || 'N/A'}</p>
              </div>
              
              <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#3498db', color: 'black' }}>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Product Name</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Qty</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Unit Price</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total Sales</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Supplier</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Unit CoS</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total CoS</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>GP1</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Other Cost</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Amount</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>GP2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedTransaction.items || []).map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{item.qty}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>R {parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>R {parseFloat(item.totalSales || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.supplier === 'Other' ? item.supplierOther || 'Other' : (item.supplier || 'N/A')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>R {parseFloat(item.unitCos || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>R {parseFloat(item.totalCos || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>R {parseFloat(item.grossProfit1 || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.otherCostType === 'Other' ? (item.otherCostTypeDetail || 'Other') : (item.otherCostType || 'None')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>R {parseFloat(item.otherCostAmount || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>R {parseFloat(item.grossProfit2 || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '1.1em', fontWeight: 'bold' }}>
                  TOTAL GROSS PROFIT: R {parseFloat(selectedTransaction.total_gross_profit || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* 3. ADMIN DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>3. ADMIN DETAILS</h3>
              <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.admin_details || 'N/A'}</p>
            </div>

            {/* 4. COMPLIANCE DETAILS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>4. COMPLIANCE DETAILS</h3>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Customer Risk Matrix:</strong> {selectedTransaction.customer_risk_matrix || 'N/A'}</p>
                <p><strong>TFS/ Sanction Screening:</strong> {selectedTransaction.tfs_sanction_screening ? '✓ Yes' : '✗ No'}</p>
                <p><strong>AML Report Number:</strong> {selectedTransaction.aml_report_number || 'N/A'}</p>
                <p><strong>KYC Documents Received:</strong> {selectedTransaction.kyc_documents ? '✓ Yes' : '✗ No'}</p>
                <p><strong>KYC Notes:</strong> {selectedTransaction.kyc_notes || 'N/A'}</p>
              </div>
            </div>

            {/* 5. FINANCE CONTROLS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>5. FINANCE CONTROLS</h3>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Invoiced:</strong> {selectedTransaction.invoiced ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Proof of Payment Received:</strong> {selectedTransaction.proof_of_payment ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Payment Receipt:</strong> {selectedTransaction.payment_receipt ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Payment Method:</strong> {selectedTransaction.payment_method || 'N/A'}</p>
                <p><strong>Supplier Paid:</strong> {selectedTransaction.supplier_paid ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Buyback Paid:</strong> {selectedTransaction.buyback_paid ? '✓ Yes' : '✗ No'}</p>
              </div>
            </div>

            {/* 6. STOCK REORDER CONTROL */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>6. STOCK REORDER CONTROL</h3>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Stock Ordered:</strong> {selectedTransaction.stock_ordered ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Stock Reorder Notes:</strong> {selectedTransaction.stock_reorder_notes || 'N/A'}</p>
              </div>
            </div>

            {/* 7. TREASURY/STOCK CONTROL */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>7. TREASURY/ STOCK CONTROL</h3>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Stock Status:</strong> {selectedTransaction.treasury_stock || 'N/A'}</p>
                <p><strong>Treasury/Stock Control Notes:</strong> {selectedTransaction.treasury_stock_notes || 'N/A'}</p>
              </div>
            </div>

            {/* 8. CUSTOMER COLLECTIONS/DELIVERY */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>8. CUSTOMER COLLECTIONS/ DELIVERY</h3>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Packaged:</strong> {selectedTransaction.packaged ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Branch:</strong> {selectedTransaction.collection_branch || 'N/A'}</p>
                <p><strong>Stock Collected:</strong> {selectedTransaction.collection_form ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Collected Date:</strong> {selectedTransaction.collection_date ? new Date(selectedTransaction.collection_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {/* 9. INTERNAL/EXTERNAL AUDIT */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>9. INTERNAL/ EXTERNAL AUDIT</h3>
              <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.audit || 'N/A'}</p>
            </div>

            {/* 10. AI SYSTEMS REVIEW */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>10. AI SYSTEMS REVIEW</h3>
              <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.ai_review || 'N/A'}</p>
            </div>

            {/* NOTES */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>NOTES</h3>
              <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{selectedTransaction.notes || 'N/A'}</p>
            </div>

            {/* APPROVALS */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
              <h3 style={{ color: '#856404', borderBottom: '2px solid #ffc107', paddingBottom: '10px' }}>APPROVALS STATUS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <strong>Administrator:</strong> {selectedTransaction.administrator_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.administrator_name && <span> by {selectedTransaction.administrator_name}</span>}
                  {userRole === 'Administrator' && !selectedTransaction.administrator_approved && (
                    <button
                      className="approve-btn"
                      onClick={() => approveTransaction(selectedTransaction.id, 'Administrator')}
                      style={{ marginLeft: '10px' }}
                    >
                      Approve
                    </button>
                  )}
                </div>
                <div>
                  <strong>Accountant:</strong> {selectedTransaction.accountant_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.accountant_name && <span> by {selectedTransaction.accountant_name}</span>}
                  {userRole === 'Accountant' && !selectedTransaction.accountant_approved && (
                    <button
                      className="approve-btn"
                      onClick={() => approveTransaction(selectedTransaction.id, 'Accountant')}
                      style={{ marginLeft: '10px' }}
                    >
                      Approve
                    </button>
                  )}
                </div>
                <div>
                  <strong>Treasury Manager:</strong> {selectedTransaction.treasury_manager_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.treasury_manager_name && <span> by {selectedTransaction.treasury_manager_name}</span>}
                  {userRole === 'Treasury Manager' && !selectedTransaction.treasury_manager_approved && (
                    <button
                      className="approve-btn"
                      onClick={() => approveTransaction(selectedTransaction.id, 'Treasury Manager')}
                      style={{ marginLeft: '10px' }}
                    >
                      Approve
                    </button>
                  )}
                </div>
                <div>
                  <strong>Compliance Officer:</strong> {selectedTransaction.compliance_officer_approved ? '✓ Approved' : '✗ Pending'}
                  {selectedTransaction.compliance_officer_name && <span> by {selectedTransaction.compliance_officer_name}</span>}
                  {userRole === 'Compliance Officer' && !selectedTransaction.compliance_officer_approved && (
                    <button
                      className="approve-btn"
                      onClick={() => approveTransaction(selectedTransaction.id, 'Compliance Officer')}
                      style={{ marginLeft: '10px' }}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submission Info */}
            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px', textAlign: 'center' }}>
              <p><strong>Submitted by:</strong> {selectedTransaction.consultant_username || 'N/A'} | <strong>Company:</strong> {selectedTransaction.companies?.name || 'N/A'}</p>
              <p><strong>Submission Date:</strong> {new Date(selectedTransaction.submission_date).toLocaleString()}</p>
            </div>

            {/* Master Admin Delete Button */}
            {userRole === 'Master Admin' && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffe6e6', borderRadius: '8px', border: '2px solid #dc3545', textAlign: 'center' }}>
                <h4 style={{ color: '#dc3545', marginBottom: '10px' }}>⚠️ Danger Zone - Master Admin Only</h4>
                <button
                  onClick={() => deleteTransaction(selectedTransaction.id)}
                  style={{
                    padding: '10px 25px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                  🗑️ Delete Transaction
                </button>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>This action cannot be undone</p>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
