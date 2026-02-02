# Multi-Company System Setup Guide

## Overview
This system now supports multiple companies with:
- **Consultants**: Can only submit forms and view their own submissions (assigned to ONE company)
- **Approvers**: Can approve transactions from multiple companies (assigned by master admin)
- **Master Admin**: Can manage all users, companies, and view all transactions

## 🏢 Companies
1. **GG-KZN** - Gold Gateway - IBV Gold KZN
2. **GS101-GP** - GS101 - IBV Gold Gauteng
3. **GBT-CT** - GBT CT - IBV Gold CT
4. **FZCO-DXB** - IBV Gold FZCO - IBV Gold Dubai
5. **IBV-LDN** - IBV Gold London - IBV Gold London

---

## 📋 Step-by-Step Setup

### Step 1: Run the Users Table SQL (if not done already)
Run the SQL from `USERS_TABLE_SETUP.sql` in your Supabase SQL Editor first.

### Step 2: Run the Multi-Company SQL
Go to Supabase SQL Editor and run the entire contents of `MULTI_COMPANY_SETUP.sql`. This will:
- Create the `companies` table and insert the 5 companies
- Add `user_type` and `company_id` columns to the `users` table
- Create `user_company_access` junction table for approver-company assignments
- Add `company_id` and `consultant_id` columns to the `transactions` table
- Set up proper indexes and RLS policies

### Step 3: Access the System
The system has three main portals:

1. **Transaction Form** (Public): `http://localhost:5173/`
   - Anyone can access to view the form
   - Consultants should log in first at `/consultant` to auto-assign their company

2. **Consultant Portal**: `http://localhost:5173/consultant`
   - Login with consultant credentials
   - Can submit new transactions (automatically tagged with their company)
   - Can view only their own submitted transactions

3. **Admin Portal**: `http://localhost:5173/admin`
   - Login with admin/approver credentials
   - Approvers see transactions only from their assigned companies
   - Master admin sees all transactions and can manage users

---

## 👤 User Management (Master Admin)

### Creating a Sales Consultant

1. Log in as **master** (password: master123)
2. Click **"Manage Users"**
3. Click **"+ Add New User"**
4. Fill in the form:
   - **User Type**: Select "Sales Consultant"
   - **Username**: e.g., "john.doe"
   - **Password**: e.g., "john123"
   - **Full Name**: e.g., "John Doe"
   - **Company**: Select ONE company (e.g., "Gold Gateway - IBV Gold KZN")
5. Click **"Add User"**

The consultant can now:
- Log in at `/consultant`
- Submit transaction forms (automatically tagged with their company)
- View only their own submissions

### Creating an Approver (Admin/Accountant/etc.)

1. Log in as **master**
2. Click **"Manage Users"**
3. Click **"+ Add New User"**
4. Fill in the form:
   - **User Type**: Select "Approver"
   - **Username**: e.g., "jane.admin"
   - **Password**: e.g., "jane123"
   - **Full Name**: e.g., "Jane Smith"
   - **Role**: Select role (Administrator, Accountant, Treasury Manager, or Compliance Officer)
5. Click **"Add User"**
6. After creation, click **"Manage Companies"** next to the user
7. Check the companies this approver should have access to
8. Click **"Save Access"**

The approver can now:
- Log in at `/admin`
- See transactions only from their assigned companies
- Approve transactions based on their role

---

## 🔄 Transaction Flow

### For Consultants:
1. Log in at `/consultant`
2. Click **"+ New Transaction"** (redirects to form at `/`)
3. Fill out the transaction form
4. Submit → Transaction is automatically tagged with:
   - Their consultant ID
   - Their username
   - Their company ID
5. Redirected back to consultant dashboard to view the submission

### For Approvers:
1. Log in at `/admin`
2. View transactions from all assigned companies
3. Filter by period, status, or search
4. Click "View Details" on a transaction
5. Approve based on their role
6. Transaction is marked with approval status

### For Master Admin:
1. Log in at `/admin`
2. View ALL transactions from ALL companies
3. Can manage users through "Manage Users" button
4. Can assign company access to approvers
5. Can create consultants assigned to specific companies

---

## 🔐 Default Login Credentials

### Master Admin
- **Username**: master
- **Password**: master123
- **Access**: All companies, all users, all transactions

### Existing Approvers (Need Company Assignment)
- **admin** / admin123 (Administrator)
- **accountant** / acc123 (Accountant)
- **treasury** / treas123 (Treasury Manager)
- **compliance** / comp123 (Compliance Officer)

**Note**: These existing approvers need company access assigned by the master admin before they can see any transactions!

### Consultants
None exist by default - must be created by master admin.

---

## 📊 How Company Filtering Works

### Consultants
- Assigned to ONE company only (stored in `users.company_id`)
- Can only submit forms for their company
- Can only view their own submissions
- Company is automatically assigned when they submit

### Approvers
- Can be assigned to MULTIPLE companies (stored in `user_company_access` table)
- Only see transactions from their assigned companies
- Can approve transactions from any of their assigned companies
- Must have at least one company assigned to see any transactions

### Master Admin
- Automatically sees ALL transactions from ALL companies
- No company filtering applied
- Can manage everything

---

## 🎯 Key Features

### Auto-Assignment
- When a consultant submits a transaction, it's automatically tagged with:
  - `consultant_id`: The consultant's user ID
  - `consultant_username`: The consultant's username
  - `company_id`: The consultant's assigned company

### Company-Based Filtering
- Approvers only see transactions from companies they have access to
- Master admin sees everything
- Consultants only see their own submissions

### Flexible Company Access
- Master admin can change which companies an approver has access to at any time
- Multiple approvers can have access to the same company
- One approver can have access to multiple companies

---

## 🔧 Future Customization

The system is designed so that you can:
- Customize the transaction form per company (future enhancement)
- Add new companies easily via SQL
- Change company assignments without affecting existing transactions
- Track which consultant submitted which transaction

### To Add a New Company:
```sql
INSERT INTO companies (code, name) VALUES
('NEW-CODE', 'New Company Name');
```

---

## 🚨 Important Notes

### Company Assignment for Existing Approvers
After running the multi-company SQL, your existing approvers (admin, accountant, treasury, compliance) will NOT have any company access assigned. The master admin must:

1. Log in as master
2. Go to "Manage Users"
3. Click "Manage Companies" for each approver
4. Select which companies they should have access to
5. Save

### Consultant Login vs Public Form
- If someone accesses the form at `/` without logging in as a consultant, the transaction will NOT have a company or consultant assigned
- Consultants should ALWAYS log in at `/consultant` first, then click "New Transaction"
- This ensures proper tracking and company assignment

### Transaction Visibility
- Transactions without a company_id will only be visible to the master admin
- Make sure consultants log in before submitting to ensure proper company assignment

---

## 📱 URLs

- **Home/Form**: http://localhost:5173/
- **Consultant Portal**: http://localhost:5173/consultant
- **Admin Portal**: http://localhost:5173/admin

---

## 🐛 Troubleshooting

### "No transactions found" for approver
→ Master admin needs to assign companies to that approver

### Transaction doesn't show company
→ Consultant didn't log in before submitting the form

### Can't see "Manage Users" button
→ Only master admin can see this button

### Error when creating consultant
→ Make sure you select a company from the dropdown

### Approver can't approve
→ Check if they have access to the company of that transaction
