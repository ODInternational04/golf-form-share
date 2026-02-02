# 🚀 Quick Start - Multi-Company System

## What's New?

✅ **Sales Consultants** can now log in, submit forms, and view their own transactions
✅ **5 Companies** are now in the system (KZN, Gauteng, CT, Dubai, London)
✅ **Approvers** can be assigned to multiple companies
✅ **Company-based filtering** - everyone only sees what they should see
✅ **Auto-assignment** - consultant submissions are automatically tagged with their company

---

## 📥 Installation Steps

### 1. Run the SQL Scripts

**First** (if not done): Run `USERS_TABLE_SETUP.sql` in Supabase SQL Editor

**Second**: Run `MULTI_COMPANY_SETUP.sql` in Supabase SQL Editor

This creates all the tables, companies, and relationships.

### 2. Restart Development Server (if needed)

```bash
npm run dev
```

---

## 🎯 Quick Usage Guide

### As Master Admin:

1. Go to http://localhost:5173/admin
2. Login: `master` / `master123`
3. Click **"Manage Users"** to:
   - Create new consultants (assign to one company)
   - Create new approvers (then assign multiple companies)
   - Manage company access for existing approvers

**Important**: Existing approvers (admin, accountant, etc.) need company access assigned!

### As Consultant:

1. Go to http://localhost:5173/consultant
2. Login with your consultant credentials (created by master)
3. Click **"+ New Transaction"** to submit a form
4. Your submissions are automatically tagged with your company
5. View all your previous submissions in the consultant dashboard

### As Approver:

1. Go to http://localhost:5173/admin
2. Login with your approver credentials
3. View transactions from your assigned companies only
4. Approve based on your role

---

## 📋 Default Credentials

| Username | Password | Type | Access |
|----------|----------|------|--------|
| master | master123 | Master Admin | Everything |
| admin | admin123 | Approver | Needs company assignment |
| accountant | acc123 | Approver | Needs company assignment |
| treasury | treas123 | Approver | Needs company assignment |
| compliance | comp123 | Approver | Needs company assignment |

---

## 🏢 The 5 Companies

1. Gold Gateway - IBV Gold KZN
2. GS101 - IBV Gold Gauteng
3. GBT CT - IBV Gold CT
4. IBV Gold FZCO - IBV Gold Dubai
5. IBV Gold London - IBV Gold London

---

## 🎨 Key Features

### Consultant Features
- ✅ Login to consultant portal
- ✅ Submit transaction forms
- ✅ View own submissions only
- ✅ Auto-company assignment
- ✅ Filter by date period
- ✅ Search transactions

### Master Admin Features
- ✅ View ALL transactions
- ✅ Create consultant logins
- ✅ Create approver logins
- ✅ Assign companies to approvers
- ✅ Delete users
- ✅ Full user management

### Approver Features
- ✅ View transactions from assigned companies only
- ✅ Approve based on role
- ✅ Filter and search
- ✅ Download Excel reports
- ✅ Company-filtered view

---

## 📁 Files Created/Modified

### New Files:
- `MULTI_COMPANY_SETUP.sql` - Database setup script
- `MULTI_COMPANY_GUIDE.md` - Detailed documentation
- `QUICK_START_MULTICOMPANY.md` - This file
- `src/components/ConsultantDashboard.jsx` - Consultant portal

### Modified Files:
- `src/components/AdminDashboard.jsx` - Added company management
- `src/components/TransactionForm.jsx` - Auto-assign company
- `src/main.jsx` - Added consultant route

---

## 🔗 URLs

- **Form**: http://localhost:5173/
- **Consultant**: http://localhost:5173/consultant
- **Admin**: http://localhost:5173/admin

---

## ⚠️ Important First Steps

1. **Run both SQL scripts** in Supabase (USERS_TABLE then MULTI_COMPANY)
2. **Log in as master** admin
3. **Assign companies** to existing approvers (admin, accountant, etc.)
4. **Create test consultants** to try the system

---

## 📖 Need More Details?

See `MULTI_COMPANY_GUIDE.md` for comprehensive documentation including:
- Detailed transaction flow
- Company filtering logic
- Troubleshooting guide
- Future customization options

---

## ✨ What's Next?

Later you mentioned wanting to customize forms per company - the system is designed to support this! Each transaction is tagged with `company_id`, so you can add company-specific form fields or workflows in the future.
