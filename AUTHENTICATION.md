# Advanced Authentication System Documentation

## Overview

This document describes the comprehensive Node.js/Express authentication system with JWT tokens, role-based access control (RBAC), password hashing, and session management.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup and Configuration](#setup-and-configuration)
4. [API Endpoints](#api-endpoints)
5. [Middleware](#middleware)
6. [Security Features](#security-features)
7. [Usage Examples](#usage-examples)
8. [Error Handling](#error-handling)

---

## Features

### ✅ Core Authentication
- **JWT-based Authentication**: Stateless token-based auth with configurable expiration
- **Refresh Tokens**: Extended session support with refresh token rotation
- **Password Hashing**: Bcrypt password hashing with salt rounds (10)
- **Session Management**: Automatic session tracking and login history

### ✅ Authorization
- **Role-Based Access Control (RBAC)**: Support for Admin, HR Manager, Employee roles
- **Department-Based Access**: Restrict access based on user department
- **Granular Permissions**: Fine-grained middleware for specific operations

### ✅ Security
- **Account Lockout**: Automatic lockout after 5 failed login attempts (15-minute duration)
- **Audit Logging**: Complete audit trail of all authentication events
- **Secure Cookies**: HTTP-only, Secure, SameSite cookies for refresh tokens
- **Password Validation**: Minimum 6-character password requirement
- **Token Expiration**: 8-hour access token, 7-day refresh token

### ✅ User Management
- **User Registration**: Admin-only user creation
- **Password Management**: Change password (user), Reset password (admin)
- **Account Status**: Active/Inactive/Suspended status management
- **Account Unlock**: Admin unlock for locked accounts

---

## Architecture

### Files Structure

```
project/
├── auth.js                 # Core authentication logic
├── authRoutes.js          # Authentication API routes
├── server.js              # Main server (integrate auth)
├── db.js                  # Database layer
├── seed.js                # Database seeding
└── AUTHENTICATION.md      # This file
```

### Components

#### 1. **auth.js** - Authentication Module
Core authentication logic including:
- Utility functions (hash, compare, token generation)
- Authentication controllers (login, refresh, validate)
- Middleware (auth, authorization, audit logging)
- Password management (change, reset)

#### 2. **authRoutes.js** - API Routes
RESTful endpoints for:
- User registration and login
- Token refresh and logout
- Password management
- User administration
- Audit logging

#### 3. **Database Integration** - User Schema
```javascript
{
  id: 1,
  email: "user@example.com",
  password: "hashed_password_bcrypt",
  role: "Employee",                 // Admin, HR, Manager, Employee
  department: "IT",
  firstName: "John",
  lastName: "Doe",
  status: "active",                 // active, inactive, suspended
  lastLogin: "2024-01-29T10:30:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  createdBy: 1,
  failedLoginAttempts: 0,
  lockUntil: null
}
```

---

## Setup and Configuration

### 1. Install Dependencies

The following packages are required (already in package.json):
```bash
npm install express bcrypt jsonwebtoken cors cookie-parser
```

### 2. Integrate into server.js

Add auth routes to your Express server:

```javascript
const express = require('express');
const authRoutes = require('./authRoutes');
const { authMiddleware } = require('./auth');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Auth routes (no auth required for login)
app.use('/api/auth', authRoutes);

// Protected routes example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is protected', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. Environment Configuration

Create a `.env` file (for production):

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-key-change-this-in-production
DATABASE_PATH=./db.json
```

---

## API Endpoints

### Authentication Endpoints

#### 1. User Registration (Admin Only)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "role": "Employee",
  "department": "IT",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (201)**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 6,
    "email": "newuser@example.com",
    "role": "Employee",
    "department": "IT"
  }
}
```

#### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "Admin",
    "department": "HR",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "8h"
}
```

#### 3. Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Alternative** - Using cookie (automatic):
```http
POST /api/auth/refresh
```

**Response (200)**
```json
{
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "8h"
}
```

#### 4. User Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "message": "Logout successful"
}
```

#### 5. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "Admin",
    "department": "HR",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "lastLogin": "2024-01-29T10:30:00Z"
  }
}
```

#### 6. Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "currentPassword123",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}
```

**Response (200)**
```json
{
  "message": "Password changed successfully"
}
```

#### 7. Reset Password (Admin Only)
```http
PUT /api/auth/reset-password/:userId
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "newPassword": "temporaryPassword123"
}
```

**Response (200)**
```json
{
  "message": "Password reset successfully"
}
```

### User Management Endpoints (Admin Only)

#### 8. List All Users
```http
GET /api/auth/users
Authorization: Bearer <admin-token>
```

**Response (200)**
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@hrms.com",
      "role": "Admin",
      "department": "HR",
      "firstName": "Admin",
      "lastName": "User",
      "status": "active",
      "lastLogin": "2024-01-29T10:30:00Z"
    }
  ]
}
```

#### 9. Update User Role
```http
PUT /api/auth/users/:userId/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "Manager"
}
```

**Response (200)**
```json
{
  "message": "User role updated successfully",
  "user": { ... }
}
```

#### 10. Update User Status
```http
PUT /api/auth/users/:userId/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "inactive"
}
```

Valid statuses: `active`, `inactive`, `suspended`

#### 11. Unlock User Account
```http
POST /api/auth/unlock/:userId
Authorization: Bearer <admin-token>
```

**Response (200)**
```json
{
  "message": "User account unlocked successfully"
}
```

#### 12. Get Audit Logs
```http
GET /api/auth/audit-logs?limit=50
Authorization: Bearer <admin-token>
```

**Response (200)**
```json
{
  "logs": [
    {
      "id": 1,
      "userId": 1,
      "action": "login",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-29T10:30:00Z",
      "status": "success"
    }
  ],
  "total": 150
}
```

---

## Middleware

### 1. authMiddleware
Verifies JWT token from `Authorization` header.

```javascript
const { authMiddleware } = require('./auth');

app.get('/protected-route', authMiddleware, (req, res) => {
  // req.user contains decoded token
  res.json({ user: req.user });
});
```

**Token Format**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. requireRole(...roles)
Checks if user has one of the specified roles.

```javascript
const { requireRole } = require('./auth');

// Only Admin can access
app.get('/admin-only', authMiddleware, requireRole('Admin'), (req, res) => {
  res.json({ message: 'Admin access' });
});

// Admin OR Manager can access
app.get('/management', authMiddleware, requireRole('Admin', 'Manager'), (req, res) => {
  res.json({ message: 'Management access' });
});
```

### 3. requireDepartment(...departments)
Checks if user belongs to specified department.

```javascript
const { requireDepartment } = require('./auth');

app.get('/hr-only', 
  authMiddleware, 
  requireDepartment('HR'), 
  (req, res) => {
    res.json({ message: 'HR department only' });
  }
);
```

### 4. optionalAuth
Verifies token if provided, but doesn't require it.

```javascript
const { optionalAuth } = require('./auth');

app.get('/public-data', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ data: 'personalized data' });
  } else {
    res.json({ data: 'generic data' });
  }
});
```

---

## Security Features

### 1. Password Hashing
Bcrypt with salt rounds of 10:
- Salting: Automatic with bcrypt.genSalt()
- Hashing Cost: 10 iterations (2^10)
- Comparison: Constant-time comparison to prevent timing attacks

### 2. Account Lockout
After 5 failed login attempts:
- Account locked for 15 minutes
- User sees: "Account locked. Try again in X minutes"
- Admin can manually unlock

### 3. Token Security
- **JWT Signature**: HMAC-SHA256 with secret key
- **Expiration**: 8 hours for access token, 7 days for refresh token
- **Claims**: Includes user ID, email, role, department
- **Validation**: Signature and expiration verified on every protected request

### 4. Session Management
- **Refresh Tokens**: Stored in HTTP-only cookies
- **No Token Blacklist**: Relies on short-lived tokens (can implement blacklist if needed)
- **Last Login**: Tracked for security audits

### 5. Audit Logging
Every authentication event is logged:
- User ID
- Action type (login, logout, password change, etc.)
- IP address
- User agent
- Timestamp
- Success/Failure status

### 6. HTTP Security
- **HTTP-Only Cookies**: Prevents XSS access to refresh tokens
- **Secure Flag**: HTTPS only in production
- **SameSite**: Strict policy prevents CSRF attacks

---

## Usage Examples

### Frontend (JavaScript)

#### Login and Store Token
```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    // Store token
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.user;
  } else {
    throw new Error(data.error);
  }
}
```

#### Make Authenticated Request
```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  // If token expired, try refreshing
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return makeAuthenticatedRequest(url, options);
    }
  }

  return response.json();
}
```

#### Refresh Token
```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return true;
  }
  
  return false;
}
```

#### Logout
```javascript
async function logout() {
  const token = localStorage.getItem('token');
  
  await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}
```

### Backend (Express)

#### Protect Admin-Only Route
```javascript
app.delete('/api/admin/user/:id', 
  authMiddleware,
  requireRole('Admin'),
  (req, res) => {
    // Delete user logic
    res.json({ message: 'User deleted' });
  }
);
```

#### Protect Manager Operations
```javascript
app.put('/api/employees/:id/approve',
  authMiddleware,
  requireRole('Admin', 'Manager'),
  (req, res) => {
    // Approve employee logic
    res.json({ message: 'Approved' });
  }
);
```

#### Role-Based Response
```javascript
app.get('/api/dashboard',
  authMiddleware,
  (req, res) => {
    if (req.user.role === 'Admin') {
      res.json({ data: 'Admin dashboard' });
    } else if (req.user.role === 'Manager') {
      res.json({ data: 'Manager dashboard' });
    } else {
      res.json({ data: 'Employee dashboard' });
    }
  }
);
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Email and password are required"
}
```

#### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```
```json
{
  "error": "Token has expired. Please refresh your token."
}
```
```json
{
  "error": "No authorization token provided"
}
```

#### 403 Forbidden
```json
{
  "error": "Access denied. Required role(s): Admin, HR"
}
```

#### 404 Not Found
```json
{
  "error": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Password hashing failed"
}
```

---

## Best Practices

1. **Store Tokens Securely**
   - Access tokens: localStorage or sessionStorage
   - Refresh tokens: HTTP-only cookies

2. **Token Expiration**
   - Keep access token expiration short (8 hours)
   - Use refresh tokens for extended sessions

3. **Password Requirements**
   - Minimum 6 characters (enforce 12+ in production)
   - Consider complexity requirements

4. **Rate Limiting**
   - Implement rate limiting on login endpoint
   - Prevent brute force attacks

5. **HTTPS**
   - Always use HTTPS in production
   - Set Secure flag on cookies

6. **Environment Variables**
   - Change JWT_SECRET in production
   - Use .env files for configuration

7. **Audit Logging**
   - Review audit logs regularly
   - Alert on suspicious activity

8. **Key Rotation**
   - Implement JWT secret rotation
   - Maintain old secrets for verification

---

## Default Test Credentials

After running `npm run seed`:

| Email | Password | Role | Department |
|-------|----------|------|-----------|
| admin@hrms.com | admin123 | Admin | HR |
| hr@hrms.com | hr123 | HR | HR |
| manager@hrms.com | manager123 | Manager | IT |
| john@hrms.com | emp123 | Employee | IT |

---

## Troubleshooting

### Token Expired Error
**Solution**: Use refresh token to get new access token

### User Locked Out
**Solution**: Admin should unlock via `POST /api/auth/unlock/:userId`

### Invalid Password Error After Reset
**Solution**: User may need to change password on first login

### CORS Issues
**Solution**: Add CORS middleware to server.js
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] OAuth2/Social login integration
- [ ] Email verification for new accounts
- [ ] Password reset via email link
- [ ] API key authentication
- [ ] Rate limiting and DDoS protection
- [ ] JWT blacklisting for immediate logout
- [ ] Role-based API scoping
- [ ] Multi-device session management
- [ ] Biometric authentication support

---

**Last Updated**: January 29, 2026
**Version**: 1.0.0
