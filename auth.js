const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

// ==================== Configuration ====================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '8h';
const REFRESH_TOKEN_EXPIRY = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// ==================== Utility Functions ====================

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
}

/**
 * Generate a JWT token for a user
 * @param {object} user - User object with id, email, role
 * @returns {string} Signed JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, department: user.department },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Generate a refresh token for a user
 * @param {object} user - User object
 * @returns {string} Signed refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Check if a user is locked out due to failed login attempts
 * @param {object} user - User object
 * @returns {boolean} True if user is locked out
 */
function isUserLockedOut(user) {
  if (!user.lockUntil) return false;
  return new Date() < new Date(user.lockUntil);
}

/**
 * Increment failed login attempts and lock user if necessary
 * @param {object} user - User object
 */
function incrementFailedAttempts(user) {
  const users = db.data.users;
  const userIndex = users.findIndex(u => u.id === user.id);
  
  if (userIndex !== -1) {
    users[userIndex].failedLoginAttempts = (users[userIndex].failedLoginAttempts || 0) + 1;
    
    // Lock user after MAX_LOGIN_ATTEMPTS
    if (users[userIndex].failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      users[userIndex].lockUntil = new Date(Date.now() + LOCK_TIME);
    }
    
    db.write();
  }
}

/**
 * Reset failed login attempts after successful login
 * @param {object} user - User object
 */
function resetFailedAttempts(user) {
  const users = db.data.users;
  const userIndex = users.findIndex(u => u.id === user.id);
  
  if (userIndex !== -1) {
    users[userIndex].failedLoginAttempts = 0;
    users[userIndex].lockUntil = null;
    users[userIndex].lastLogin = new Date().toISOString();
    db.write();
  }
}

// ==================== Authentication Controllers ====================

/**
 * Handle user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} User data and tokens
 * @throws {Error} If login fails
 */
async function login(email, password) {
  // Find user by email
  const user = db.data.users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is locked out
  if (isUserLockedOut(user)) {
    const lockTimeRemaining = Math.ceil((new Date(user.lockUntil) - new Date()) / 1000 / 60);
    throw new Error(`Account locked. Try again in ${lockTimeRemaining} minutes`);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    incrementFailedAttempts(user);
    throw new Error('Invalid password');
  }

  // Password is valid, reset failed attempts and update last login
  resetFailedAttempts(user);

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status
    },
    token,
    refreshToken,
    expiresIn: JWT_EXPIRY
  };
}

/**
 * Validate a token and refresh it if needed
 * @param {string} refreshToken - Refresh token
 * @returns {object} New access token
 * @throws {Error} If refresh token is invalid
 */
function refreshAccessToken(refreshToken) {
  try {
    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = db.data.users.find(u => u.id === decoded.id);
    
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    const newToken = generateToken(user);
    return { token: newToken, expiresIn: JWT_EXPIRY };
  } catch (error) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

/**
 * Validate user credentials and return user if valid
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} User object
 * @throws {Error} If credentials are invalid
 */
async function validateCredentials(email, password) {
  const user = db.data.users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new Error('User account is not active');
  }

  return user;
}

// ==================== Middleware ====================

/**
 * Middleware to verify JWT token from request headers
 * Extracts token from Authorization header (Bearer token)
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    // Verify and decode token
    const decoded = verifyToken(token);
    
    // Attach user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return res.status(401).json({ error: 'Token expired. Please refresh your token.' });
    }
    res.status(401).json({ error: error.message || 'Invalid token' });
  }
}

/**
 * Middleware to check if user has required role(s)
 * @param {...string} requiredRoles - Roles that are allowed
 * @returns {function} Express middleware function
 */
function requireRole(...requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role(s): ${requiredRoles.join(', ')}` 
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has required department
 * @param {...string} requiredDepts - Departments that are allowed
 * @returns {function} Express middleware function
 */
function requireDepartment(...requiredDepts) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!requiredDepts.includes(req.user.department)) {
      return res.status(403).json({ 
        error: `Access denied. Required department(s): ${requiredDepts.join(', ')}` 
      });
    }

    next();
  };
}

/**
 * Middleware for optional authentication
 * Verifies token if provided, but doesn't require it
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
      
      req.user = verifyToken(token);
    }
  } catch (error) {
    // If token is invalid, just continue without user info
  }
  
  next();
}

/**
 * Middleware to log authentication events (audit trail)
 */
function auditLog(action, req, res, next) {
  return (req, res, next) => {
    const auditEntry = {
      id: db.nextId('auditLogs'),
      userId: req.user?.id || 'anonymous',
      action,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Capture response status
    const originalJson = res.json;
    res.json = function(data) {
      auditEntry.status = res.statusCode < 400 ? 'success' : 'failed';
      
      if (!db.data.auditLogs) {
        db.data.auditLogs = [];
      }
      db.data.auditLogs.push(auditEntry);
      db.write();

      return originalJson.call(this, data);
    };

    next();
  };
}

// ==================== Password Management ====================

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @throws {Error} If old password is incorrect or validation fails
 */
async function changePassword(userId, oldPassword, newPassword) {
  const user = db.data.users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Verify old password
  const isPasswordValid = await comparePassword(oldPassword, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  // Check if new password is same as old password
  const isSamePassword = await comparePassword(newPassword, user.password);
  
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }

  // Hash and update password
  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  db.write();

  return { message: 'Password changed successfully' };
}

/**
 * Reset user password (admin only)
 * @param {number} userId - User ID to reset
 * @param {string} newPassword - New password
 * @throws {Error} If user not found
 */
async function resetPassword(userId, newPassword) {
  const user = db.data.users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.passwordResetRequired = true;
  db.write();

  return { message: 'Password reset successfully' };
}

// ==================== Exports ====================
module.exports = {
  // Utility functions
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  
  // Authentication controllers
  login,
  refreshAccessToken,
  validateCredentials,
  
  // Middleware
  authMiddleware,
  requireRole,
  requireDepartment,
  optionalAuth,
  auditLog,
  
  // Password management
  changePassword,
  resetPassword,
  
  // Configuration
  JWT_SECRET,
  JWT_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
