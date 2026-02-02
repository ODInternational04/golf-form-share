import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LandingPage from './components/LandingPage'
import TransactionForm from './components/TransactionForm'
import AdminDashboard from './components/AdminDashboard'
import ConsultantDashboard from './components/ConsultantDashboard'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<TransactionForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/consultant" element={<ConsultantDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
