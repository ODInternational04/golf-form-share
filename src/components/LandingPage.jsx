import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#D4AF37',
            marginBottom: '10px'
          }}>
            IBV GOLD
          </div>
          <div style={{
            fontSize: '20px',
            color: '#666',
            marginBottom: '30px'
          }}>
            Transaction Management System
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div
            onClick={() => navigate('/consultant')}
            style={{
              padding: '40px',
              backgroundColor: '#4CAF50',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>👤</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
              Sales Consultant
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Submit and track your transactions
            </div>
          </div>

          <div
            onClick={() => navigate('/admin')}
            style={{
              padding: '40px',
              backgroundColor: '#2196F3',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔐</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
              Admin / Approver
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Review and approve transactions
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>Need help?</strong>
          </p>
          <p style={{ margin: 0 }}>
            Contact your system administrator for login credentials
          </p>
        </div>
      </div>
    </div>
  )
}
