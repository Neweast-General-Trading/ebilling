#!/usr/bin/env node
/**
 * Reset tab permissions: keep only the approved user list.
 * Super admins are handled in ebilling-admin-access.js (no DB rows needed).
 */
require('dotenv/config');
const { Pool } = require('pg');

const SUPER_ADMINS = new Set([
  'thanzil@neweast.co',
  'sakour@neweast.co',
  'sakour@neweast.com',
  'muhammed.fawaz@neweast.co',
  'henry@neweast.co',
  'guru@neweast.com',
]);

// Non-super-admin users to keep with tab permissions (preserve prior grants).
const KEEP_PERMISSIONS = {
  'soumya.antony@neweast.co': ['dashboard', 'invoices', 'master', 'reports', 'analysis', 'audit_log', 'recovery_log'],
  'sijo@neweast.com': ['dashboard', 'invoices', 'master', 'analysis', 'audit_log', 'recovery_log'],
  'olga@neweast.co': ['dashboard', 'invoices', 'master', 'reports', 'analysis', 'audit_log', 'recovery_log'],
  'mais.alhamwi@neweast.com': ['dashboard', 'invoices', 'master', 'analysis', 'audit_log', 'recovery_log'],
  'info.hq@neweast.co': ['dashboard', 'invoices', 'master', 'analysis', 'recovery_log'],
  'athira@neweast.co': ['dashboard', 'invoices', 'master', 'analysis', 'audit_log', 'recovery_log'],
};

const GRANTED_BY = 'sakour@neweast.co';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM ebilling_user_permissions');
    const del = await pool.query('DELETE FROM ebilling_user_permissions RETURNING email, permission_key');
    console.log(`Removed ${del.rowCount} permission row(s) (was ${before.rows[0].n})`);

    let inserted = 0;
    for (const [email, perms] of Object.entries(KEEP_PERMISSIONS)) {
      for (const permission of perms) {
        await pool.query(
          `INSERT INTO ebilling_user_permissions (email, permission_key, granted_by_email)
           VALUES ($1, $2, $3)`,
          [email, permission, GRANTED_BY],
        );
        inserted += 1;
      }
      console.log(`Kept tabs for ${email}: ${perms.join(', ')}`);
    }

    for (const email of SUPER_ADMINS) {
      console.log(`Super admin (code): ${email}`);
    }

    const after = await pool.query(
      'SELECT email, array_agg(permission_key ORDER BY permission_key) AS perms FROM ebilling_user_permissions GROUP BY email ORDER BY email',
    );
    console.log('\n=== remaining DB permissions ===');
    for (const row of after.rows) {
      console.log(row.email, row.perms.join(', '));
    }
    console.log(`\nInserted ${inserted} row(s) for ${Object.keys(KEEP_PERMISSIONS).length} user(s)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
