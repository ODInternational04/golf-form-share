# IBV GOLD Business Form - React + Supabase

A complete rewrite of the IBV Gold Business Form Transaction Sheet application using React and Supabase (serverless architecture).

## 🎯 Overview

This application provides:
- **Transaction Form**: Public-facing form for submitting gold business transactions
- **Admin Dashboard**: Multi-role approval system with Excel export functionality
- **Cloud Database**: Supabase PostgreSQL database for data storage
- **No Server Required**: Fully client-side React application

## ✨ Features

### Transaction Form
- Client details capture
- Multi-item product sales with automatic calculations
- Comprehensive compliance tracking (KYC, AML, TFS screening)
- Finance controls and payment tracking
- Stock management and delivery tracking
- Audit and AI systems review
- Real-time gross profit calculations

### Admin Dashboard
- Role-based access control (Administrator, Accountant, Treasury Manager, Compliance Officer)
- Transaction viewing and filtering
- Multi-level approval workflow
- Excel export with formatting
- Date range filters (Today, This Week, This Month, All Time)
- Search functionality
- Approval status tracking

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Copy `.env.example` to `.env`
4. Add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database
Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create the database tables.

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

## 📦 Build for Production

```bash
npm run build
```

The production files will be in the `dist` folder.

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions for RegisterDomain or any static hosting provider.

## 🔐 Admin Access

### Default Admin Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| accountant | acc123 | Accountant |
| treasury | treas123 | Treasury Manager |
| compliance | comp123 | Compliance Officer |

**⚠️ Important**: Change these credentials in production!

## 📱 Routes

- `/` - Transaction submission form
- `/admin` - Admin dashboard (requires login)

## 🛠️ Technology Stack

- **Frontend**: React 18
- **Routing**: React Router DOM 6
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Excel Export**: xlsx library
- **Styling**: Pure CSS

## 📊 Database Schema

The application uses a single `transactions` table with the following key fields:

- Client information (name, ID, branch)
- Sales details (consultant, items as JSONB)
- Compliance data (risk matrix, KYC, AML)
- Finance controls (invoicing, payment)
- Stock management
- Approval tracking (4 roles with timestamps)
- Audit trails

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete schema.

## 🔄 Differences from Original

### What's the Same
✅ Exact same UI/UX design
✅ All form fields and validation
✅ Same admin login credentials
✅ Multi-role approval workflow
✅ Excel export functionality
✅ All business logic and calculations

### What's Different
🔄 **No Node.js server** - Pure client-side React
🔄 **Supabase instead of PostgreSQL** - Serverless database
🔄 **No Railway deployment** - Deploy to any static host
🔄 **Vite instead of Express** - Modern build tool
🔄 **Component-based** - React components instead of vanilla JS

## 📁 Project Structure

```
goldform-react/
├── src/
│   ├── components/
│   │   ├── TransactionForm.jsx    # Main form component
│   │   └── AdminDashboard.jsx     # Admin dashboard component
│   ├── lib/
│   │   └── supabase.js            # Supabase client configuration
│   ├── main.jsx                   # Application entry point
│   └── index.css                  # Global styles
├── public/                        # Static assets
├── .env.example                   # Environment variables template
├── SUPABASE_SETUP.md             # Database setup instructions
├── DEPLOYMENT.md                  # Deployment guide
└── package.json                   # Dependencies and scripts
```

## 🧪 Testing Locally

1. Make sure Supabase is configured
2. Run `npm run dev`
3. Open http://localhost:5173
4. Submit a test transaction
5. Login to admin at http://localhost:5173/admin
6. Verify transaction appears and can be approved

## 📝 Making Changes

### Adding New Products
Edit the `DEFAULT_PRODUCTS` array in `src/components/TransactionForm.jsx`

### Changing Admin Credentials
Edit the `ADMIN_USERS` object in `src/components/AdminDashboard.jsx`

### Modifying Form Fields
Edit `src/components/TransactionForm.jsx` and update the corresponding database column

### Styling Changes
Edit `src/index.css` for global styles

## 🔒 Security Notes

1. **RLS Enabled**: Row Level Security is configured in Supabase
2. **Environment Variables**: Never commit `.env` file
3. **Admin Auth**: Current implementation uses hard-coded credentials (demo only)
4. **Production**: Implement Supabase Auth for real authentication

## 🐛 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (requires v14+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Supabase Connection Issues
- Verify `.env` file exists and has correct credentials
- Check Supabase project is active
- Verify RLS policies are configured correctly

### Form Submission Fails
- Open browser DevTools (F12) and check Console tab
- Verify network requests are reaching Supabase
- Check Supabase logs in dashboard

## 📞 Support

- **Supabase Documentation**: https://supabase.com/docs
- **React Documentation**: https://react.dev
- **Vite Documentation**: https://vitejs.dev

## 📜 License

This is a private business application for IBV Gold.

## 🎉 Credits

Rebuilt with modern web technologies while maintaining the original business logic and design.
