-- ============================================
-- MULTI-COMPANY SYSTEM SETUP
-- ============================================

-- Step 1: Create companies table
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 5 companies
INSERT INTO companies (code, name) VALUES
('GG-KZN', 'Gold Gateway - IBV Gold KZN'),
('GS101-GP', 'GS101 - IBV Gold Gauteng'),
('GBT-CT', 'GBT CT - IBV Gold CT'),
('FZCO-DXB', 'IBV Gold FZCO - IBV Gold Dubai'),
('IBV-LDN', 'IBV Gold London - IBV Gold London');

-- Step 2: Update users table to add user_type and company_id
ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'approver';
ALTER TABLE users ADD COLUMN company_id BIGINT REFERENCES companies(id);

-- Update existing users to be approvers (master stays as Master Admin)
UPDATE users SET user_type = 'master' WHERE role = 'Master Admin';
UPDATE users SET user_type = 'approver' WHERE role != 'Master Admin';

-- Step 3: Create user_company_access junction table (for approvers with multiple companies)
CREATE TABLE user_company_access (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_company_access_user ON user_company_access(user_id);
CREATE INDEX idx_user_company_access_company ON user_company_access(company_id);

-- Step 4: Update transactions table to add company and consultant tracking
ALTER TABLE transactions ADD COLUMN company_id BIGINT REFERENCES companies(id);
ALTER TABLE transactions ADD COLUMN consultant_id BIGINT REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN consultant_username TEXT;

-- Create indexes for faster filtering
CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_consultant ON transactions(consultant_id);

-- Step 5: Enable RLS on new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_access ENABLE ROW LEVEL SECURITY;

-- Policies for companies table
CREATE POLICY "Allow public read" ON companies
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow public insert" ON companies
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public update" ON companies
    FOR UPDATE TO anon
    USING (true);

-- Policies for user_company_access table
CREATE POLICY "Allow public read" ON user_company_access
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow public insert" ON user_company_access
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public delete" ON user_company_access
    FOR DELETE TO anon
    USING (true);

-- ============================================
-- VERIFICATION QUERIES (Optional - Run to check)
-- ============================================

-- View all companies
-- SELECT * FROM companies;

-- View updated users structure
-- SELECT id, username, role, user_type, company_id FROM users;

-- View user company access
-- SELECT u.username, c.name as company_name 
-- FROM user_company_access uca
-- JOIN users u ON uca.user_id = u.id
-- JOIN companies c ON uca.company_id = c.id;
