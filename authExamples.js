/**
 * EXAMPLE INTEGRATION: Using the Authentication System
 * 
 * This file demonstrates how to integrate the authentication system
 * into your Express application and use it in various scenarios.
 */

// ==================== Example 1: Basic Server Integration ====================

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import auth modules
const authRoutes = require('./authRoutes');
const { authMiddleware, requireRole, requireDepartment } = require('./auth');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Authentication routes (no auth required for login)
app.use('/api/auth', authRoutes);

// ==================== Example 2: Protected Routes ====================

/**
 * Public endpoint - anyone can access
 */
app.get('/api/public/info', (req, res) => {
  res.json({ message: 'This is public information' });
});

/**
 * Protected endpoint - requires authentication
 */
app.get('/api/protected/data', authMiddleware, (req, res) => {
  res.json({
    message: 'This is protected data',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

/**
 * Admin-only endpoint
 */
app.get('/api/admin/dashboard', 
  authMiddleware,
  requireRole('Admin'),
  (req, res) => {
    res.json({
      message: 'Admin Dashboard',
      user: req.user,
      data: {
        totalUsers: 100,
        activeUsers: 85,
        suspendedUsers: 5
      }
    });
  }
);

/**
 * Manager endpoint - for both Admin and Manager roles
 */
app.get('/api/manager/reports',
  authMiddleware,
  requireRole('Admin', 'Manager'),
  (req, res) => {
    res.json({
      message: 'Manager Reports',
      department: req.user.department,
      reports: [
        { id: 1, name: 'Attendance Report' },
        { id: 2, name: 'Performance Review' },
        { id: 3, name: 'Payroll Summary' }
      ]
    });
  }
);

/**
 * HR-only endpoint based on department
 */
app.get('/api/hr/employee-records',
  authMiddleware,
  requireDepartment('HR'),
  (req, res) => {
    res.json({
      message: 'HR Employee Records',
      accessLevel: 'Full',
      records: [
        { id: 1, name: 'John Doe', status: 'active' },
        { id: 2, name: 'Jane Smith', status: 'active' }
      ]
    });
  }
);

/**
 * Role-based response content
 */
app.get('/api/dashboard',
  authMiddleware,
  (req, res) => {
    let dashboardContent;

    switch (req.user.role) {
      case 'Admin':
        dashboardContent = {
          title: 'Admin Dashboard',
          widgets: ['User Management', 'System Analytics', 'Audit Logs', 'Settings']
        };
        break;
      case 'Manager':
        dashboardContent = {
          title: 'Manager Dashboard',
          widgets: ['Team Performance', 'Leave Approvals', 'Attendance', 'Reports']
        };
        break;
      case 'HR':
        dashboardContent = {
          title: 'HR Dashboard',
          widgets: ['Recruitment', 'Employee Records', 'Payroll', 'Compliance']
        };
        break;
      default:
        dashboardContent = {
          title: 'Employee Dashboard',
          widgets: ['My Profile', 'Leave Request', 'Attendance', 'Performance']
        };
    }

    res.json(dashboardContent);
  }
);

// ==================== Example 3: Custom Authentication Logic ====================

/**
 * Example: Department-based access with additional validation
 */
app.put('/api/employees/:id/salary',
  authMiddleware,
  requireRole('Admin', 'HR'),
  requireDepartment('HR'),
  (req, res) => {
    const { id } = req.params;
    const { newSalary } = req.body;

    // Additional validation
    if (newSalary < 0) {
      return res.status(400).json({ error: 'Salary must be positive' });
    }

    // Log the action
    console.log(`User ${req.user.email} updated salary for employee ${id}`);

    res.json({
      message: 'Salary updated successfully',
      employeeId: id,
      newSalary,
      updatedBy: req.user.email,
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * Example: Conditional access based on user role
 */
app.delete('/api/employees/:id',
  authMiddleware,
  (req, res) => {
    const { id } = req.params;

    // Only Admin can delete, or Manager if it's their department
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      return res.status(403).json({ 
        error: 'Only Admins or Managers can delete employees' 
      });
    }

    // If Manager, can only delete from their department
    if (req.user.role === 'Manager') {
      // Additional check: verify employee is in manager's department
      // This is just an example - in real app, fetch from DB
      console.log(`Manager ${req.user.email} deleting employee ${id}`);
    }

    res.json({ message: 'Employee deleted successfully' });
  }
);

// ==================== Example 4: Custom Middleware ====================

/**
 * Custom middleware: Log all authenticated requests
 */
function logAuthenticatedRequests(req, res, next) {
  if (req.user) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`  User: ${req.user.email} (${req.user.role})`);
    console.log(`  Department: ${req.user.department}`);
  }
  next();
}

app.use(logAuthenticatedRequests);

/**
 * Custom middleware: Rate limiting for sensitive operations
 */
const loginAttempts = new Map();

function rateLimitLogin(req, res, next) {
  const email = req.body.email;
  const now = Date.now();
  const limit = 10; // 10 attempts
  const window = 60 * 1000; // per 1 minute

  if (!loginAttempts.has(email)) {
    loginAttempts.set(email, []);
  }

  const attempts = loginAttempts.get(email);
  
  // Remove old attempts outside window
  const recentAttempts = attempts.filter(t => now - t < window);
  
  if (recentAttempts.length >= limit) {
    return res.status(429).json({ 
      error: 'Too many login attempts. Please try again later.' 
    });
  }

  recentAttempts.push(now);
  loginAttempts.set(email, recentAttempts);
  
  next();
}

// Apply rate limiting to login endpoint
app.post('/api/auth/login', rateLimitLogin, async (req, res) => {
  // Login logic here
  res.json({ message: 'Login with rate limiting' });
});

// ==================== Example 5: Error Handling ====================

/**
 * Centralized error handler for authentication errors
 */
app.use((err, req, res, next) => {
  // Authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expired',
      message: 'Please refresh your token'
    });
  }

  // Generic errors
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ==================== Example 6: Frontend Integration (JavaScript) ====================

/**
 * In your public/app.js or frontend code:
 */

/*
// Authentication Service
class AuthService {
  constructor(baseURL = 'http://localhost:3000/api/auth') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Login
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    this.token = data.token;
    this.refreshToken = data.refreshToken;

    localStorage.setItem('token', this.token);
    localStorage.setItem('refreshToken', this.refreshToken);

    return data.user;
  }

  // Logout
  async logout() {
    await fetch(`${this.baseURL}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  // Refresh token
  async refresh() {
    const response = await fetch(`${this.baseURL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('token', this.token);

    return this.token;
  }

  // Get current user
  async getCurrentUser() {
    const response = await fetch(`${this.baseURL}/me`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          ...options.headers
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // Token expired, try refreshing
        await this.refresh();
        return this.request(endpoint, options);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      return response.json();
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }
}

// Usage
const auth = new AuthService();

// Login
auth.login('admin@hrms.com', 'admin123')
  .then(user => console.log('Logged in:', user))
  .catch(error => console.error('Login failed:', error));

// Get current user
auth.getCurrentUser()
  .then(data => console.log('User:', data.user))
  .catch(error => console.error('Error:', error));

// Logout
auth.logout()
  .then(() => console.log('Logged out'))
  .catch(error => console.error('Logout failed:', error));
*/

// ==================== Start Server ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`Test login: POST http://localhost:${PORT}/api/auth/login`);
});

module.exports = app;
