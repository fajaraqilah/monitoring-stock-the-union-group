# Inventory Management System

A comprehensive multi-page inventory management system built with vanilla JavaScript, Tailwind CSS, and Supabase.

## Features

- **Multi-page Architecture**: Clean separation of concerns with dedicated pages for different functions
- **Authentication**: Secure email/password authentication with role-based access control (admin/user)
- **Dashboard**: Real-time summary cards and interactive charts
- **Inventory Management**: Comprehensive inventory tracking with filtering and pagination
- **Receiving**: Receiving management with supplier and warehouse filtering
- **Internal Transfers**: Track internal transfers between warehouses
- **Data Upload**: Admin-only feature for bulk data uploads via Excel files
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Real-time Data**: Live data from Supabase database

## Tech Stack

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (ES Modules)
- Supabase (Authentication + PostgreSQL database)
- Chart.js for data visualization
- SheetJS for Excel parsing

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project at [supabase.io](https://supabase.io)
   - Get your Project URL and Anonymous Key from Project Settings
   - Update the credentials in `public/js/supabase.js`:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

4. Create the required database tables in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory stock table
CREATE TABLE inventory_stock (
  item_code TEXT,
  item_name TEXT,
  item_group TEXT,
  item_sub_group TEXT,
  warehouse_code TEXT,
  warehouse_name TEXT,
  unit TEXT,
  bin TEXT,
  stock NUMERIC,
  item_cost NUMERIC,
  total NUMERIC,
  area TEXT,
  brand TEXT,
  outlet TEXT,
  date_stock date
);

-- Receiving table
CREATE TABLE receiving (
  grpo TEXT,
  po TEXT,
  receiving_date DATE,
  item_code TEXT,
  item_group TEXT,
  item_name TEXT,
  supplier TEXT,
  location TEXT,
  warehouse_code TEXT,
  warehouse_name TEXT,
  brand TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  total NUMERIC,
  unit TEXT,
  due_date DATE,
  remarks TEXT
);

-- Internal transfer table
CREATE TABLE internal_transfer (
  document_number TEXT,
  posting_date DATE,
  document_date DATE,
  item_code TEXT,
  item_description TEXT,
  quantity NUMERIC,
  total TEXT,
  unit TEXT,
  stock_price NUMERIC,
  from_warehouse_code TEXT,
  from_location TEXT,
  to_warehouse_code TEXT,
  warehouse_name TEXT,
  from_warehouse_name TEXT,
  to_location TEXT,
  remarks TEXT
);
```
SQL VIEW
{
    "table_name": "receiving_daily_summary",
    "table_type": "VIEW"
    [
  {
    "warehouse_name",
    "receiving_date",
    "unit",
    "total_value"
  }
]
  },
  {
    "table_name": "receiving_supplier_summary",
    "table_type": "VIEW"
    [
  {
    "warehouse_name",
    "receiving_date",
    "supplier",
    "unit",
    "total_value"
  }
]
  },
  {
    "table_name": "receiving_warehouse_item_value_summary",
    "table_type": "VIEW"
    [
  {
    "receiving_date",
    "item_name",
    "warehouse_name",
    "unit",
    "total_value"
  }
]
  },
  {
    "table_name": "stock_item_value_summary",
    "table_type": "VIEW"
    [
  {
    "warehouse_name",
    "item_name",
    "unit",
    "month",
    "total_value"
  }
]
  },
  {
    "table_name": "stock_warehouse_value_summary",
    "table_type": "VIEW"
    [
  {
    "item_group",
    "unit",
    "month",
    "warehouse_name",
    "total_value"
  }
]
  },
  {
    "table_name": "transfer_warehouse_summary",
    "table_type": "VIEW"
   [
  {
    "document_date",
    "warehouse_name",
    "unit",
    "to_location",
    "total_value"
  }
]
  }

5. Configure Row Level Security (RLS) in Supabase:
   - Enable RLS on all tables
   - Create policies allowing SELECT for authenticated users
   - Create policies allowing INSERT/UPDATE for admin users only

## Usage

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Register a new account or use an existing one to log in

4. Admin users can upload data via the "Upload Data" menu option

## Deployment

The application is designed for deployment to Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. The application will be deployed automatically

## Security Features

- Role-based access control (admin/user)
- Database RLS policies
- Secure authentication with Supabase
- Input validation and sanitization

## File Structure

```
/public
  /assets
    UnionGroupLogo.png
  /js
    auth.js
    chart.min.js
    charts.js
    sidebar.js
    supabase.js
    utils.js
/index.html
/login.html
/dashboard.html
/inventory.html
/receiving.html
/internal-transfer.html
/upload.html
/package.json
/vercel.json
/.gitignore
```

## Deployment to Vercel

1. **GitHub Integration**: Push this project to a GitHub repository.
2. **Vercel Import**: Go to Vercel, click "Add New", and import your repository.
3. **Configuration**: Vercel will automatically detect the settings from `package.json` and `vercel.json`.
4. **Clean URLs**: Access your pages without the `.html` extension (e.g., `yoursite.vercel.app/dashboard`).

## License

This project is licensed under the ISC License.
