PRAGMA foreign_keys = ON;

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('ADMIN','HR','MANAGER','EMPLOYEE')),
  department TEXT,
  designation TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','separated')),
  joining_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment Module
CREATE TABLE IF NOT EXISTS job_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_title TEXT NOT NULL,
  department_id INTEGER,
  required_count INTEGER NOT NULL,
  budget_allocated REAL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','closed')),
  created_by INTEGER,
  approved_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by) REFERENCES users(id),
  FOREIGN KEY(approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS job_postings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requirement_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  qualifications TEXT,
  salary_range TEXT,
  location TEXT,
  posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  closing_date DATE,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','closed','filled')),
  FOREIGN KEY(requirement_id) REFERENCES job_requirements(id)
);

CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_posting_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_path TEXT,
  experience_years REAL,
  current_company TEXT,
  current_designation TEXT,
  qualification TEXT,
  applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'applied' CHECK(status IN ('applied','shortlisted','rejected','interview','selected','joined')),
  FOREIGN KEY(job_posting_id) REFERENCES job_postings(id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  interview_date DATETIME,
  interviewer_id INTEGER,
  round_number INTEGER DEFAULT 1,
  feedback TEXT,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(candidate_id) REFERENCES candidates(id),
  FOREIGN KEY(interviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS background_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','passed','failed')),
  verification_date DATETIME,
  verified_by INTEGER,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(candidate_id) REFERENCES candidates(id),
  FOREIGN KEY(verified_by) REFERENCES users(id)
);

-- Employee Management Module
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK(gender IN ('M','F','Other')),
  marital_status TEXT,
  blood_group TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  personal_email TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  bank_account TEXT,
  bank_name TEXT,
  ifsc_code TEXT,
  pan_number TEXT,
  aadhar_number TEXT,
  joining_date DATE NOT NULL,
  department TEXT,
  designation TEXT,
  manager_id INTEGER,
  salary REAL,
  employment_type TEXT CHECK(employment_type IN ('Permanent','Contract','Temporary','Intern')),
  status TEXT DEFAULT 'onboarding' CHECK(status IN ('onboarding','active','on_leave','separated')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(manager_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  document_path TEXT,
  uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','rejected')),
  verified_by INTEGER,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(verified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issue_date DATE,
  expiry_date DATE,
  certificate_number TEXT,
  issuing_authority TEXT,
  file_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS salary_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  base_salary REAL NOT NULL,
  da REAL,
  hra REAL,
  allowances REAL,
  deductions REAL,
  net_salary REAL,
  month INTEGER,
  year INTEGER,
  payment_date DATE,
  payment_mode TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processed','paid','failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Leave and Attendance Module
CREATE TABLE IF NOT EXISTS leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  days_per_year INTEGER,
  is_paid INTEGER DEFAULT 1,
  requires_approval INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  approved_by INTEGER,
  approved_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(leave_type_id) REFERENCES leave_types(id),
  FOREIGN KEY(approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'absent' CHECK(status IN ('present','absent','leave','holiday','weekend','half_day')),
  check_in_time DATETIME,
  check_out_time DATETIME,
  hours_worked REAL,
  remarks TEXT,
  marked_by INTEGER,
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(marked_by) REFERENCES users(id),
  UNIQUE(employee_id, attendance_date)
);

-- Employee Relations Module
CREATE TABLE IF NOT EXISTS employee_engagement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('birthday','anniversary','special_day','communication')),
  event_date DATE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','sent','acknowledged')),
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS insurance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  insurance_type TEXT NOT NULL,
  provider TEXT,
  policy_number TEXT,
  coverage_amount REAL,
  premium REAL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Exit Management Module
CREATE TABLE IF NOT EXISTS separations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  separation_date DATE NOT NULL,
  reason TEXT NOT NULL,
  last_working_day DATE,
  notice_period_days INTEGER,
  resignation_letter_path TEXT,
  status TEXT DEFAULT 'initiated' CHECK(status IN ('initiated','in_progress','completed','cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS no_due_clearances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  separation_id INTEGER NOT NULL,
  checklist_item TEXT,
  cleared_by INTEGER,
  cleared_at DATETIME,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','cleared','pending_action')),
  remarks TEXT,
  FOREIGN KEY(separation_id) REFERENCES separations(id),
  FOREIGN KEY(cleared_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS exit_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  separation_id INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('experience_letter','relieving_letter','final_settlement','others')),
  document_path TEXT,
  generated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(separation_id) REFERENCES separations(id)
);

-- HR Analytics and Reports
CREATE TABLE IF NOT EXISTS department (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id INTEGER,
  budget REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  review_period_start DATE,
  review_period_end DATE,
  rating REAL CHECK(rating >= 1 AND rating <= 5),
  reviewer_id INTEGER,
  comments TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','submitted','acknowledged')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(reviewer_id) REFERENCES users(id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id INTEGER,
  changed_by INTEGER,
  old_value TEXT,
  new_value TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(changed_by) REFERENCES users(id)
);
