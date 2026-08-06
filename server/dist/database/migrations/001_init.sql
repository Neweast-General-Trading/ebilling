CREATE TABLE IF NOT EXISTS sim_employees (
  id SERIAL PRIMARY KEY,
  co VARCHAR(50) NOT NULL,
  person_number VARCHAR(50) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  display_name VARCHAR(255),
  email VARCHAR(255),
  position_name VARCHAR(255),
  department_name VARCHAR(255),
  package_value NUMERIC(12, 2),
  is_active BOOLEAN DEFAULT TRUE,
  excel_row_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (co, person_number),
  UNIQUE (co, phone_number)
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  sim_employee_id INTEGER REFERENCES sim_employees(id) ON DELETE SET NULL,
  phone_number VARCHAR(30) NOT NULL,
  package_value NUMERIC(12, 2),
  overage_amount NUMERIC(12, 2) DEFAULT 0,
  amount_due NUMERIC(12, 2),
  billing_month DATE NOT NULL,
  pdf_filename VARCHAR(500),
  pdf_storage_path VARCHAR(1000),
  raw_extracted JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_billing_month ON invoices (billing_month);
CREATE INDEX IF NOT EXISTS idx_invoices_phone ON invoices (phone_number);

CREATE TABLE IF NOT EXISTS monthly_remarks (
  id SERIAL PRIMARY KEY,
  sim_employee_id INTEGER NOT NULL REFERENCES sim_employees(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (sim_employee_id, billing_month)
);

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  sim_employee_id INTEGER REFERENCES sim_employees(id) ON DELETE SET NULL,
  billing_month DATE NOT NULL,
  recipient_email VARCHAR(255),
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
