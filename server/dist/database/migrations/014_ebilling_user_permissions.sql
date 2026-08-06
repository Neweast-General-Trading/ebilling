CREATE TABLE IF NOT EXISTS ebilling_user_permissions (
  email VARCHAR(255) NOT NULL,
  permission_key VARCHAR(80) NOT NULL,
  granted_by_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (email, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_ebilling_user_permissions_email
  ON ebilling_user_permissions (email);
