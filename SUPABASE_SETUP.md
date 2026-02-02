# Supabase Database Setup

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Copy your project URL and anon key

## Environment Variables Setup

1. Create a `.env` file in the root of your project:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Schema

Run the following SQL in your Supabase SQL Editor (Database > SQL Editor):

```sql
-- Create transactions table
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_date DATE NOT NULL,
    client_type TEXT,
    client_name TEXT,
    id_passport TEXT,
    company_name TEXT,
    registration_number TEXT,
    transaction_type TEXT,
    order_branch TEXT,
    sales_consultant TEXT,
    items JSONB,
    total_gross_profit NUMERIC(10, 2),
    admin_details TEXT,
    customer_risk_matrix TEXT,
    tfs_screening TEXT,
    aml_report_number TEXT,
    kyc_documents_received TEXT,
    kyc_notes TEXT,
    invoiced TEXT,
    proof_of_payment TEXT,
    payment_receipt TEXT,
    payment_method TEXT,
    stock_ordered TEXT,
    stock_reorder_notes TEXT,
    treasury_stock_control TEXT,
    treasury_stock_notes TEXT,
    packaged TEXT,
    collection_branch TEXT,
    collection_date DATE,
    collection_form TEXT,
    supplier_paid TEXT,
    buyback_paid TEXT,
    internal_external_audit TEXT,
    ai_systems_review TEXT,
    administrator_approved BOOLEAN DEFAULT FALSE,
    administrator_approved_date TIMESTAMPTZ,
    administrator_name TEXT,
    accountant_approved BOOLEAN DEFAULT FALSE,
    accountant_approved_date TIMESTAMPTZ,
    accountant_name TEXT,
    treasury_manager_approved BOOLEAN DEFAULT FALSE,
    treasury_manager_approved_date TIMESTAMPTZ,
    treasury_manager_name TEXT,
    compliance_officer_approved BOOLEAN DEFAULT FALSE,
    compliance_officer_approved_date TIMESTAMPTZ,
    compliance_officer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_client ON transactions(client_name);
CREATE INDEX idx_transactions_company ON transactions(company_name);
CREATE INDEX idx_transactions_submission ON transactions(submission_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

--
-- If you already created the `transactions` table, run the ALTER statements below to add the new columns and make `client_name` nullable:
--
-- ALTER TABLE transactions ALTER COLUMN client_name DROP NOT NULL;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_type TEXT;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS company_name TEXT;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS registration_number TEXT;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supplier_paid TEXT;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyback_paid TEXT;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stock_reorder_notes TEXT;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_date DATE;
-- CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_name);

-- Create policy to allow public insert (for form submissions)
CREATE POLICY "Allow public insert" ON transactions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy to allow public read (for admin dashboard)
CREATE POLICY "Allow public read" ON transactions
    FOR SELECT TO anon
    USING (true);

-- Create policy to allow public update (for approvals)
CREATE POLICY "Allow public update" ON transactions
    FOR UPDATE TO anon
    USING (true);
```

## ITEMS JSONB Structure

The `items` column stores an array of objects with the following structure:

```json
[
  {
    "name": "Gold Bar 1oz",
    "qty": 2,
    "unitPrice": 50000.00,
    "totalSales": 100000.00,
    "unitCos": 48000.00,
    "totalCos": 96000.00,
    "grossProfit1": 4000.00,
    "otherCostType": "Courier",
    "otherCostAmount": 200.00,
    "grossProfit2": 3800.00
  }
]
```

## Admin Login Credentials

The application uses hard-coded admin credentials (stored in the React app):

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| accountant | acc123 | Accountant |
| treasury | treas123 | Treasury Manager |
| compliance | comp123 | Compliance Officer |

**Note:** For production use, you should implement proper authentication using Supabase Auth.

## Security Notes

1. **RLS Policies**: The current setup allows public access for demo purposes. For production, you should:
   - Implement Supabase Auth
   - Update RLS policies to restrict access based on authenticated users
   - Add role-based access control

2. **API Keys**: Never commit your `.env` file to version control. The anon key is safe for public use as long as RLS is properly configured.

3. **Admin Credentials**: Replace hard-coded credentials with Supabase Auth for production.

## Verifying Setup

1. After running the SQL, check that the `transactions` table exists in your Supabase dashboard
2. The table should have all the columns listed above
3. RLS should be enabled (check the shield icon next to the table name)
4. Three policies should be visible: "Allow public insert", "Allow public read", and "Allow public update"

## Testing

1. Submit a test transaction through the form
2. Check the Supabase Table Editor to see if the data was saved
3. Login to the admin dashboard and verify you can see the transaction
4. Test the approval workflow

## Troubleshooting

- **"relation transactions does not exist"**: Make sure you ran the SQL script
- **"permission denied"**: Check your RLS policies
- **"Invalid API key"**: Verify your `.env` file has correct credentials
- **Data not saving**: Check browser console for errors and verify network requests in DevTools
