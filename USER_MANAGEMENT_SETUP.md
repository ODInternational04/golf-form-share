# User Authentication Setup Instructions

## Overview
The admin authentication system has been updated to use database-backed login credentials instead of hard-coded values. A master admin can now add, view, and delete user accounts.

## Step 1: Run SQL in Supabase

Go to your Supabase SQL Editor and run the SQL from the file `USERS_TABLE_SETUP.sql`:

```sql
-- Create users table for authentication
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX idx_users_username ON users(username);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read for login
CREATE POLICY "Allow public read" ON users
    FOR SELECT TO anon
    USING (true);

-- Create policy to allow public insert (for master admin to add users)
CREATE POLICY "Allow public insert" ON users
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy to allow public update
CREATE POLICY "Allow public update" ON users
    FOR UPDATE TO anon
    USING (true);

-- Create policy to allow public delete
CREATE POLICY "Allow public delete" ON users
    FOR DELETE TO anon
    USING (true);

-- Insert default users (including master admin)
INSERT INTO users (username, password, role, full_name, created_by) VALUES
('master', 'master123', 'Master Admin', 'Master Administrator', 'system'),
('admin', 'admin123', 'Administrator', 'Administrator', 'system'),
('accountant', 'acc123', 'Accountant', 'Accountant', 'system'),
('treasury', 'treas123', 'Treasury Manager', 'Treasury Manager', 'system'),
('compliance', 'comp123', 'Compliance Officer', 'Compliance Officer', 'system');
```

## Step 2: Login Credentials

After running the SQL, you can log in with these default credentials:

| Username | Password | Role | Can Manage Users |
|----------|----------|------|------------------|
| master | master123 | Master Admin | ✓ Yes |
| admin | admin123 | Administrator | ✗ No |
| accountant | acc123 | Accountant | ✗ No |
| treasury | treas123 | Treasury Manager | ✗ No |
| compliance | comp123 | Compliance Officer | ✗ No |

## Step 3: Managing Users (Master Admin Only)

1. Log in as the **master** user
2. Click the **"Manage Users"** button in the header
3. Click **"+ Add New User"** to create new accounts
4. Fill in:
   - Username (must be unique)
   - Password
   - Full Name (optional)
   - Role (select from dropdown)
5. Click **"Add User"** to save
6. To delete a user, click the **"Delete"** button (cannot delete master user)

## Features

### Database Authentication
- All login credentials are stored in the `users` table
- Passwords are checked against the database (Note: passwords are currently stored in plain text - for production, use hashed passwords)

### User Management
- Master admin can add new approval officers
- Master admin can delete users (except master user)
- Each user has:
  - Username
  - Password
  - Full Name
  - Role (Administrator, Accountant, Treasury Manager, Compliance Officer)
  - Created by (tracks who created the user)
  - Created at (timestamp)

### Role-Based Access
- **Master Admin**: Can manage users and view/approve transactions
- **Other Roles**: Can only view/approve transactions based on their role

## Security Notes

⚠️ **Important for Production:**

1. **Password Hashing**: Currently passwords are stored in plain text. For production, implement password hashing using bcrypt or similar
2. **Row Level Security**: Update RLS policies to restrict access based on authenticated users
3. **Input Validation**: Add server-side validation for usernames and passwords
4. **Session Management**: Implement proper session tokens instead of sessionStorage
5. **Master User Protection**: Add additional protection for the master admin account

## Testing

1. Run the SQL script in Supabase
2. Verify the `users` table exists with 5 default users
3. Log in as "master" with password "master123"
4. Click "Manage Users" and verify you see all 5 users
5. Try adding a new user
6. Try deleting a non-master user
7. Try logging in with the new user credentials
8. Verify non-master users don't see the "Manage Users" button
