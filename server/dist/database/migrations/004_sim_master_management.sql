ALTER TABLE sim_employees
  ADD COLUMN IF NOT EXISTS reassigned_from_id INTEGER REFERENCES sim_employees(id),
  ADD COLUMN IF NOT EXISTS reassigned_to_id INTEGER REFERENCES sim_employees(id),
  ADD COLUMN IF NOT EXISTS inactive_at TIMESTAMPTZ;

ALTER TABLE sim_employees DROP CONSTRAINT IF EXISTS sim_employees_co_phone_number_key;
ALTER TABLE sim_employees DROP CONSTRAINT IF EXISTS sim_employees_co_person_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS sim_employees_co_phone_active_uidx
  ON sim_employees (co, phone_number) WHERE is_active = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS sim_employees_co_person_active_uidx
  ON sim_employees (co, person_number) WHERE is_active = TRUE;
