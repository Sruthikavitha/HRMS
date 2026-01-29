const express = require('express');
const router = express.Router();
const auth = require('./auth');
const db = require('./db');

// ==================== User Registration ====================

/**
 * POST /auth/register
 * Register a new user (Admin only)
 * Body: { email, password, role, department, firstName, lastName }
 */
router.post('/register', auth.authMiddleware, auth.requireRole('Admin'), async (req, res) => {
  try {
    const { email, password, role, department, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !role || !department) {
      return res.status(400).json({ 
        error: 'Email, password, role, and department are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if email already exists
    const existingUser = db.data.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await auth.hashPassword(password);

    // Create new user
    const newUser = {
      id: db.nextId('users'),
      email,
      password: hashedPassword,
      role,
      department,
      firstName: firstName || '',
      lastName: lastName || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      failedLoginAttempts: 0
    };

    db.data.users.push(newUser);
    db.write();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== User Login ====================

/**
 * POST /auth/login
 * User login endpoint
 * Body: { email, password }
 * Returns: { user, token, refreshToken }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Perform login
    const result = await auth.login(email, password);

    // Set secure HTTP-only cookie with refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// ==================== Token Refresh ====================

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 * Body: { refreshToken } OR Cookie: refreshToken
 * Returns: { token }
 */
router.post('/refresh', (req, res) => {
  try {
    // Get refresh token from body or cookie
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    const result = auth.refreshAccessToken(refreshToken);
    
    res.json({
      message: 'Token refreshed successfully',
      token: result.token,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// ==================== User Logout ====================

/**
 * POST /auth/logout
 * User logout endpoint
 * Requires: Authentication token
 */
router.post('/logout', auth.authMiddleware, (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    // Optional: You could maintain a token blacklist here
    // For now, just confirm logout
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Get Current User ====================

/**
 * GET /auth/me
 * Get current logged-in user information
 * Requires: Authentication token
 */
router.get('/me', auth.authMiddleware, (req, res) => {
  try {
    const user = db.data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Change Password ====================

/**
 * PUT /auth/change-password
 * Change user's own password
 * Requires: Authentication token
 * Body: { oldPassword, newPassword, confirmPassword }
 */
router.put('/change-password', auth.authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Old password, new password, and confirmation are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'New password and confirmation do not match' 
      });
    }

    // Change password
    await auth.changePassword(req.user.id, oldPassword, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== Reset Password (Admin) ====================

/**
 * PUT /auth/reset-password/:userId
 * Reset another user's password (Admin only)
 * Requires: Admin role
 * Body: { newPassword }
 */
router.put('/reset-password/:userId', 
  auth.authMiddleware, 
  auth.requireRole('Admin'), 
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      await auth.resetPassword(parseInt(userId), newPassword);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ==================== User Management (Admin) ====================

/**
 * GET /auth/users
 * List all users (Admin only)
 */
router.get('/users', auth.authMiddleware, auth.requireRole('Admin'), (req, res) => {
  try {
    const users = db.data.users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      department: u.department,
      firstName: u.firstName,
      lastName: u.lastName,
      status: u.status,
      lastLogin: u.lastLogin
    }));

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /auth/users/:userId/role
 * Update user role (Admin only)
 * Body: { role }
 */
router.put('/users/:userId/role', 
  auth.authMiddleware, 
  auth.requireRole('Admin'), 
  (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      const validRoles = ['Admin', 'HR', 'Manager', 'Employee'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
        });
      }

      const user = db.data.users.find(u => u.id === parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.role = role;
      db.write();

      res.json({ message: 'User role updated successfully', user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PUT /auth/users/:userId/status
 * Update user status (Admin only)
 * Body: { status } - "active" or "inactive"
 */
router.put('/users/:userId/status', 
  auth.authMiddleware, 
  auth.requireRole('Admin'), 
  (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      const user = db.data.users.find(u => u.id === parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.status = status;
      db.write();

      res.json({ message: 'User status updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ==================== Unlock User Account ====================

/**
 * POST /auth/unlock/:userId
 * Unlock a user account (Admin only)
 * Resets failed login attempts
 */
router.post('/unlock/:userId', 
  auth.authMiddleware, 
  auth.requireRole('Admin'), 
  (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = db.data.users.find(u => u.id === parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      db.write();

      res.json({ message: 'User account unlocked successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ==================== Audit Logs ====================

/**
 * GET /auth/audit-logs
 * Get audit logs (Admin only)
 */
router.get('/audit-logs', 
  auth.authMiddleware, 
  auth.requireRole('Admin'), 
  (req, res) => {
    try {
      const auditLogs = db.data.auditLogs || [];
      const limit = parseInt(req.query.limit) || 50;
      
      // Return latest logs first
      const logs = auditLogs.slice(-limit).reverse();

      res.json({ logs, total: auditLogs.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
