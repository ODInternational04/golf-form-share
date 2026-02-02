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
