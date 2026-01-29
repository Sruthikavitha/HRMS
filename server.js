const express = require('express');
const bodyParser = require('express').json;
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { db, write, nextId } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hrms_secret_key_2026';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser());
app.use(cors());
app.use(cookieParser());

// Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// ==================== Authentication ====================
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ==================== AUTH ROUTES ====================
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = (db.data.users || []).find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.cookie('token', token, { httpOnly: true });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

app.get('/api/user', authMiddleware, (req, res) => {
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// ==================== USER MANAGEMENT ====================
app.post('/api/users', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: nextId('users'),
    name,
    email,
    password: hashedPassword,
    role,
    department,
    status: 'active',
    created_at: new Date().toISOString()
  };

  db.data.users.push(user);
  write();
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.get('/api/users', authMiddleware, requireRole('ADMIN', 'HR'), (req, res) => {
  const users = db.data.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, status: u.status }));
  res.json(users);
});

// ==================== EMPLOYEE MANAGEMENT ====================
app.post('/api/employees', authMiddleware, requireRole('ADMIN', 'HR'), (req, res) => {
  const employee = {
    id: nextId('employees'),
    ...req.body,
    created_at: new Date().toISOString()
  };

  db.data.employees.push(employee);
  write();
  res.json(employee);
});

app.get('/api/employees', authMiddleware, (req, res) => {
  const employees = db.data.employees;
  res.json(employees);
});

app.get('/api/employees/:id', authMiddleware, (req, res) => {
  const employee = db.data.employees.find(e => e.id === parseInt(req.params.id));
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json(employee);
});

app.put('/api/employees/:id', authMiddleware, requireRole('ADMIN', 'HR', 'MANAGER'), (req, res) => {
  const employee = db.data.employees.find(e => e.id === parseInt(req.params.id));
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  Object.assign(employee, req.body, { updated_at: new Date().toISOString() });
  write();
  res.json(employee);
});

app.delete('/api/employees/:id', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const index = db.data.employees.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Employee not found' });

  db.data.employees.splice(index, 1);
  write();
  res.json({ message: 'Employee deleted' });
});

// ==================== RECRUITMENT MODULE ====================
app.post('/api/job-requirements', authMiddleware, requireRole('HR', 'ADMIN'), (req, res) => {
  const jobReq = {
    id: nextId('jobRequirements'),
    ...req.body,
    created_by: req.user.id,
    created_at: new Date().toISOString()
  };
  db.data.jobRequirements.push(jobReq);
  write();
  res.json(jobReq);
});

app.get('/api/job-requirements', authMiddleware, (req, res) => {
  res.json(db.data.jobRequirements);
});

app.put('/api/job-requirements/:id/approve', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const jobReq = db.data.jobRequirements.find(j => j.id === parseInt(req.params.id));
  if (!jobReq) return res.status(404).json({ error: 'Job requirement not found' });

  jobReq.status = 'approved';
  jobReq.approved_by = req.user.id;
  write();
  res.json(jobReq);
});

// Job Postings
app.post('/api/job-postings', authMiddleware, requireRole('HR', 'ADMIN'), (req, res) => {
  const posting = {
    id: nextId('jobPostings'),
    ...req.body,
    posted_date: new Date().toISOString()
  };
  db.data.jobPostings.push(posting);
  write();
  res.json(posting);
});

app.get('/api/job-postings', authMiddleware, (req, res) => {
  res.json(db.data.jobPostings);
});

// Candidates
app.post('/api/candidates', (req, res) => {
  const candidate = {
    id: nextId('candidates'),
    ...req.body,
    applied_date: new Date().toISOString(),
    status: 'applied'
  };
  db.data.candidates.push(candidate);
  write();
  res.json(candidate);
});

app.get('/api/candidates', authMiddleware, (req, res) => {
  res.json(db.data.candidates);
});

app.get('/api/candidates/:id', authMiddleware, (req, res) => {
  const candidate = db.data.candidates.find(c => c.id === parseInt(req.params.id));
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  res.json(candidate);
});

app.put('/api/candidates/:id/status', authMiddleware, requireRole('HR', 'MANAGER'), (req, res) => {
  const candidate = db.data.candidates.find(c => c.id === parseInt(req.params.id));
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  candidate.status = req.body.status;
  write();
  res.json(candidate);
});

// Interviews
app.post('/api/interviews', authMiddleware, requireRole('HR', 'MANAGER'), (req, res) => {
  const interview = {
    id: nextId('interviews'),
    ...req.body,
    interviewer_id: req.user.id,
    created_at: new Date().toISOString()
  };
  db.data.interviews.push(interview);
  write();
  res.json(interview);
});

app.get('/api/interviews', authMiddleware, (req, res) => {
  res.json(db.data.interviews);
});

app.put('/api/interviews/:id', authMiddleware, requireRole('HR', 'MANAGER'), (req, res) => {
  const interview = db.data.interviews.find(i => i.id === parseInt(req.params.id));
  if (!interview) return res.status(404).json({ error: 'Interview not found' });

  Object.assign(interview, req.body);
  write();
  res.json(interview);
});

// ==================== LEAVE MANAGEMENT ====================
app.post('/api/leave-types', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const leaveType = {
    id: nextId('leaveTypes'),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.data.leaveTypes = db.data.leaveTypes || [];
  db.data.leaveTypes.push(leaveType);
  write();
  res.json(leaveType);
});

app.get('/api/leave-types', authMiddleware, (req, res) => {
  res.json(db.data.leaveTypes || []);
});

app.post('/api/leave-requests', authMiddleware, (req, res) => {
  const leaveReq = {
    id: nextId('leaveRequests'),
    employee_id: req.user.id,
    ...req.body,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  db.data.leaveRequests.push(leaveReq);
  write();
  res.json(leaveReq);
});

app.get('/api/leave-requests', authMiddleware, (req, res) => {
  const leaveReqs = db.data.leaveRequests;
  res.json(leaveReqs);
});

app.put('/api/leave-requests/:id/approve', authMiddleware, requireRole('MANAGER', 'HR', 'ADMIN'), (req, res) => {
  const leaveReq = db.data.leaveRequests.find(l => l.id === parseInt(req.params.id));
  if (!leaveReq) return res.status(404).json({ error: 'Leave request not found' });

  leaveReq.status = 'approved';
  leaveReq.approved_by = req.user.id;
  leaveReq.approved_date = new Date().toISOString();
  write();
  res.json(leaveReq);
});

app.put('/api/leave-requests/:id/reject', authMiddleware, requireRole('MANAGER', 'HR', 'ADMIN'), (req, res) => {
  const leaveReq = db.data.leaveRequests.find(l => l.id === parseInt(req.params.id));
  if (!leaveReq) return res.status(404).json({ error: 'Leave request not found' });

  leaveReq.status = 'rejected';
  leaveReq.approved_by = req.user.id;
  write();
  res.json(leaveReq);
});

// ==================== ATTENDANCE ====================
app.post('/api/attendance', authMiddleware, requireRole('MANAGER', 'HR', 'ADMIN'), (req, res) => {
  const attendance = {
    id: nextId('attendance'),
    ...req.body,
    marked_by: req.user.id,
    marked_at: new Date().toISOString()
  };
  db.data.attendance.push(attendance);
  write();
  res.json(attendance);
});

app.get('/api/attendance', authMiddleware, (req, res) => {
  const { employee_id, from_date, to_date } = req.query;
  let records = db.data.attendance;

  if (employee_id) {
    records = records.filter(a => a.employee_id === parseInt(employee_id));
  }
  if (from_date && to_date) {
    records = records.filter(a => a.attendance_date >= from_date && a.attendance_date <= to_date);
  }

  res.json(records);
});

// ==================== ENGAGEMENT ====================
app.post('/api/engagement', authMiddleware, requireRole('HR'), (req, res) => {
  const engagement = {
    id: nextId('engagement'),
    ...req.body,
    created_by: req.user.id,
    created_at: new Date().toISOString()
  };
  db.data.engagement.push(engagement);
  write();
  res.json(engagement);
});

app.get('/api/engagement', authMiddleware, (req, res) => {
  res.json(db.data.engagement);
});

// Insurance
app.post('/api/insurance', authMiddleware, requireRole('HR'), (req, res) => {
  const insurance = {
    id: nextId('insuranceRecords'),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.data.insuranceRecords.push(insurance);
  write();
  res.json(insurance);
});

app.get('/api/insurance', authMiddleware, (req, res) => {
  res.json(db.data.insuranceRecords);
});

// ==================== EXIT MANAGEMENT ====================
app.post('/api/separations', authMiddleware, requireRole('HR', 'ADMIN'), (req, res) => {
  const separation = {
    id: nextId('separations'),
    ...req.body,
    status: 'initiated',
    created_at: new Date().toISOString()
  };
  db.data.separations.push(separation);
  write();
  res.json(separation);
});

app.get('/api/separations', authMiddleware, (req, res) => {
  res.json(db.data.separations);
});

app.post('/api/no-due-clearances', authMiddleware, requireRole('HR', 'ADMIN'), (req, res) => {
  const clearance = {
    id: nextId('noDueClearances'),
    ...req.body,
    cleared_by: req.user.id,
    cleared_at: new Date().toISOString()
  };
  db.data.noDueClearances.push(clearance);
  write();
  res.json(clearance);
});

app.get('/api/no-due-clearances/:separation_id', authMiddleware, (req, res) => {
  const clearances = db.data.noDueClearances.filter(c => c.separation_id === parseInt(req.params.separation_id));
  res.json(clearances);
});

// ==================== PERFORMANCE REVIEWS ====================
app.post('/api/performance-reviews', authMiddleware, requireRole('MANAGER', 'HR'), (req, res) => {
  const review = {
    id: nextId('performanceReviews'),
    ...req.body,
    reviewer_id: req.user.id,
    created_at: new Date().toISOString()
  };
  db.data.performanceReviews.push(review);
  write();
  res.json(review);
});

app.get('/api/performance-reviews', authMiddleware, (req, res) => {
  res.json(db.data.performanceReviews);
});

// ==================== DASHBOARD & ANALYTICS ====================
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const totalEmployees = db.data.employees.length;
  const activeEmployees = db.data.employees.filter(e => e.status === 'active').length;
  const separations = db.data.separations.filter(s => s.status === 'completed').length;
  const attritionRate = totalEmployees > 0 ? ((separations / totalEmployees) * 100).toFixed(2) : 0;
  const openPositions = db.data.jobPostings.filter(j => j.status === 'open').length;
  const pendingApprovals = db.data.leaveRequests.filter(l => l.status === 'pending').length;

  res.json({
    totalEmployees,
    activeEmployees,
    separations,
    attritionRate,
    openPositions,
    pendingApprovals
  });
});

app.get('/api/dashboard/headcount', authMiddleware, (req, res) => {
  const departments = {};
  db.data.employees.forEach(emp => {
    if (emp.department) {
      departments[emp.department] = (departments[emp.department] || 0) + 1;
    }
  });
  res.json(departments);
});

app.get('/api/dashboard/salary-distribution', authMiddleware, (req, res) => {
  const distribution = db.data.employees.reduce((acc, emp) => {
    const range = emp.salary ? Math.floor(emp.salary / 100000) : 0;
    const key = `${range * 100000}-${(range + 1) * 100000}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  res.json(distribution);
});

// ==================== File Uploads ====================
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log(`Smart HRMS Server running on http://localhost:${PORT}`);
});
