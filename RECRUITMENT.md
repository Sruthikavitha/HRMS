# Recruitment Module - Database Schema & Design

## Overview

The Recruitment Module provides a complete hiring workflow management system with job requirements, postings, candidate applications, status tracking, and automated email notifications.

---

## Database Schema

### 1. Job Requirements Table

Stores job requirement requests that need to be approved before creating postings.

```javascript
{
  id: 1,                                    // Primary key, auto-increment
  title: "Senior Software Developer",       // Position title
  department: "Engineering",                // Department requesting
  budget: 120000,                          // Annual salary budget
  description: "5+ years experience...",   // Job description
  positions: 3,                             // Number of positions needed
  status: "approved",                      // pending | approved | rejected | closed
  createdBy: 1,                             // User ID who created requirement
  createdAt: "2024-01-29T10:00:00Z",      // Creation timestamp
  approvedBy: 2,                            // User ID who approved
  approvedAt: "2024-01-29T11:00:00Z",     // Approval timestamp
  rejectionReason: null,                   // Reason if rejected
  filledPositions: 1                        // Positions filled so far
}
```

### 2. Job Postings Table

Public job postings created from approved requirements.

```javascript
{
  id: 1,                                    // Primary key, auto-increment
  requirementId: 1,                         // Foreign key to job_requirements
  title: "Senior Software Developer",      // Job title
  description: "Full job description...",  // Detailed job description
  department: "Engineering",               // Department
  location: "New York, NY",                // Job location
  salaryRange: {                           // Salary information
    min: 100000,
    max: 150000
  },
  status: "open",                          // open | closed | filled
  applicationDeadline: "2024-02-28",       // Application closing date
  createdBy: 1,                             // User ID who created posting
  createdAt: "2024-01-29T10:30:00Z",      // Creation timestamp
  updatedAt: "2024-01-29T11:00:00Z",      // Last update timestamp
  applicantCount: 45                        // Total applications received
}
```

### 3. Candidates Table

Job applicants and their status throughout the hiring process.

```javascript
{
  id: 1,                                    // Primary key, auto-increment
  jobPostingId: 1,                          // Foreign key to job_postings
  candidateName: "John Smith",             // Full name
  email: "john.smith@email.com",           // Email address
  phone: "555-123-4567",                   // Phone number
  resume: "1234567890-resume.pdf",         // Stored resume filename
  experience: "8 years in software dev",   // Experience summary
  skills: [                                 // Array of skills
    "JavaScript",
    "Node.js",
    "React",
    "AWS"
  ],
  linkedinProfile: "https://linkedin.com/in/johnsmith",
  status: "interviewed",                   // applied | shortlisted | interviewed | selected | rejected
  appliedAt: "2024-01-29T14:00:00Z",      // Application timestamp
  updatedAt: "2024-01-30T10:00:00Z",      // Last status update
  ratings: [                                // Array of interview ratings
    {
      id: "uuid-123",
      date: "2024-01-30T10:00:00Z",
      rating: 4.5,
      feedback: "Strong technical skills"
    }
  ],
  interviews: [                             // Interview records
    {
      id: "uuid-456",
      date: "2024-01-30T10:00:00Z",
      interviewer: "Sarah Johnson",
      rating: 4.5,
      feedback: "Excellent problem-solving",
      location: "NYC Office - Room 201"
    }
  ],
  notes: [                                  // Status/action notes
    {
      text: "Candidate requested flexibility on start date",
      timestamp: "2024-01-30T15:30:00Z"
    }
  ],
  rejectionReason: null
}
```

### 4. Email Logs Table

Tracks all automated emails sent to candidates.

```javascript
{
  id: 1,                                    // Primary key, auto-increment
  candidateId: 1,                           // Foreign key to candidates
  emailType: "applicationConfirmation",     // Email template type
  messageId: "abc123xyz789",                // SMTP message ID
  recipientEmail: "john.smith@email.com",  // Recipient email
  status: "sent",                           // sent | failed
  error: null,                              // Error message if failed
  timestamp: "2024-01-29T14:05:00Z"        // Send timestamp
}
```

### 5. Status Change Logs Table

Audit trail of all candidate status changes.

```javascript
{
  id: 1,                                    // Primary key, auto-increment
  candidateId: 1,                           // Foreign key to candidates
  oldStatus: "shortlisted",                 // Previous status
  newStatus: "interviewed",                 // New status
  timestamp: "2024-01-30T10:00:00Z"        // Change timestamp
}
```

---

## Relationships

```
JobRequirements (1) ──→ (N) JobPostings
    │
    └──────────────────────┐
                           │
                           ▼
                      Candidates (1) ──→ (N) Interviews
                           │
                           ├──→ (N) EmailLogs
                           │
                           └──→ (N) StatusChangeLogs
```

---

## Status Workflow

### Requirement Status Flow

```
PENDING → APPROVED → CLOSED
   │
   └──→ REJECTED
```

### Job Posting Status Flow

```
OPEN → CLOSED
  │      │
  └─────→ FILLED
```

### Candidate Status Flow

```
APPLIED → SHORTLISTED → INTERVIEWED → SELECTED
            │                            │
            └────────────────────────────┘
                                         │
                                    REJECTED (any stage)
```

---

## API Endpoints

### Job Requirements

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recruitment/requirements` | Create job requirement |
| GET | `/api/recruitment/requirements` | List requirements |
| GET | `/api/recruitment/requirements/:id` | Get requirement details |
| PUT | `/api/recruitment/requirements/:id/approve` | Approve requirement |
| PUT | `/api/recruitment/requirements/:id/reject` | Reject requirement |

### Job Postings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recruitment/postings` | Create job posting |
| GET | `/api/recruitment/postings` | List postings |
| GET | `/api/recruitment/postings/:id` | Get posting details |
| PUT | `/api/recruitment/postings/:id/status` | Update posting status |

### Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recruitment/apply` | Submit application |
| GET | `/api/recruitment/candidates` | List candidates |
| GET | `/api/recruitment/candidates/:id` | Get candidate details |
| GET | `/api/recruitment/candidates/posting/:postingId` | Get candidates by posting |
| PUT | `/api/recruitment/candidates/:id/status` | Update candidate status |
| POST | `/api/recruitment/candidates/:id/interview` | Add interview record |

### Bulk Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recruitment/bulk-update` | Bulk update candidates |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recruitment/stats` | Recruitment statistics |
| GET | `/api/recruitment/top-candidates` | Top rated candidates |
| GET | `/api/recruitment/email-logs/:candidateId` | Candidate email history |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recruitment/resume/:filename` | Download resume |
| POST | `/api/recruitment/email/verify` | Verify email config |
| POST | `/api/recruitment/email/test` | Send test email |

---

## Request/Response Examples

### Create Job Requirement

**Request:**
```http
POST /api/recruitment/requirements
Content-Type: application/json

{
  "title": "Senior Developer",
  "department": "Engineering",
  "budget": 150000,
  "description": "Looking for experienced developer",
  "positions": 2
}
```

**Response (201):**
```json
{
  "message": "Job requirement created successfully",
  "requirement": {
    "id": 1,
    "title": "Senior Developer",
    "department": "Engineering",
    "budget": 150000,
    "description": "Looking for experienced developer",
    "positions": 2,
    "status": "pending",
    "createdBy": 1,
    "createdAt": "2024-01-29T10:00:00Z"
  }
}
```

### Create Job Posting

**Request:**
```http
POST /api/recruitment/postings
Content-Type: application/json

{
  "requirementId": 1,
  "title": "Senior Developer",
  "description": "We are hiring...",
  "location": "New York, NY",
  "salaryRange": { "min": 120000, "max": 150000 },
  "applicationDeadline": "2024-02-28"
}
```

**Response (201):**
```json
{
  "message": "Job posting created successfully",
  "posting": {
    "id": 1,
    "requirementId": 1,
    "title": "Senior Developer",
    "status": "open",
    "applicantCount": 0
  }
}
```

### Apply for Job

**Request:**
```http
POST /api/recruitment/apply
Content-Type: multipart/form-data

{
  "jobPostingId": "1",
  "candidateName": "John Smith",
  "email": "john@example.com",
  "phone": "555-1234",
  "experience": "8 years",
  "skills": "JavaScript,Node.js,React",
  "resume": [File]
}
```

**Response (201):**
```json
{
  "message": "Application submitted successfully",
  "candidate": {
    "id": 1,
    "jobPostingId": 1,
    "candidateName": "John Smith",
    "email": "john@example.com",
    "status": "applied",
    "appliedAt": "2024-01-29T14:00:00Z"
  },
  "resumeFile": "1234567890-resume.pdf"
}
```

### Update Candidate Status

**Request:**
```http
PUT /api/recruitment/candidates/1/status
Content-Type: application/json

{
  "status": "shortlisted",
  "notes": "Great technical background, schedule interview"
}
```

**Response (200):**
```json
{
  "message": "Candidate status updated to shortlisted",
  "candidate": {
    "id": 1,
    "status": "shortlisted",
    "updatedAt": "2024-01-30T10:00:00Z",
    "notes": [
      {
        "text": "Great technical background, schedule interview",
        "timestamp": "2024-01-30T10:00:00Z"
      }
    ]
  }
}
```

### Add Interview

**Request:**
```http
POST /api/recruitment/candidates/1/interview
Content-Type: application/json

{
  "date": "2024-02-05T14:00:00Z",
  "interviewer": "Sarah Johnson",
  "rating": 4.5,
  "feedback": "Excellent problem-solving skills",
  "location": "NYC Office - Room 201"
}
```

**Response (201):**
```json
{
  "message": "Interview record added successfully",
  "candidate": {
    "id": 1,
    "status": "interviewed",
    "interviews": [
      {
        "id": "uuid-456",
        "date": "2024-02-05T14:00:00Z",
        "interviewer": "Sarah Johnson",
        "rating": 4.5,
        "feedback": "Excellent problem-solving skills",
        "location": "NYC Office - Room 201"
      }
    ]
  }
}
```

### Get Statistics

**Request:**
```http
GET /api/recruitment/stats
```

**Response (200):**
```json
{
  "requirements": {
    "total": 5,
    "pending": 1,
    "approved": 3,
    "rejected": 1,
    "closed": 0
  },
  "postings": {
    "total": 3,
    "open": 2,
    "closed": 1,
    "filled": 0
  },
  "candidates": {
    "total": 45,
    "applied": 30,
    "shortlisted": 10,
    "interviewed": 4,
    "selected": 1,
    "rejected": 0
  },
  "conversionRate": "2.22"
}
```

---

## Email Notifications

Automated emails are sent at key status changes:

### 1. Application Confirmation
- **Trigger:** When application submitted
- **To:** Candidate email
- **Content:** Confirms receipt, explains next steps

### 2. Shortlisted Notification
- **Trigger:** Status changed to "shortlisted"
- **To:** Candidate email
- **Content:** Congratulations, next steps info

### 3. Interview Scheduled
- **Trigger:** Interview added to candidate record
- **To:** Candidate email
- **Content:** Interview date, time, location, interviewer

### 4. Selection Notification
- **Trigger:** Status changed to "selected"
- **To:** Candidate email
- **Content:** Congratulations, offer details, next steps

### 5. Rejection Notification
- **Trigger:** Status changed to "rejected"
- **To:** Candidate email
- **Content:** Thank you message, optional feedback

### 6. Job Posting Notification
- **Trigger:** New job posting created
- **To:** Subscriber emails
- **Content:** New opening details, application link

---

## Data Validation

### Job Requirement Validation
- ✅ Title: Required, string
- ✅ Department: Required, string
- ✅ Budget: Required, positive number
- ✅ Positions: Optional, positive integer (default: 1)
- ✅ Description: Optional, string

### Candidate Application Validation
- ✅ Job Posting ID: Required, must exist
- ✅ Candidate Name: Required, string
- ✅ Email: Required, valid email format
- ✅ Phone: Optional, string
- ✅ Resume: Optional, PDF/DOC/DOCX/TXT only (max 5MB)
- ✅ Experience: Optional, string
- ✅ Skills: Optional, array or comma-separated string
- ✅ Duplicate Check: Only one application per email per posting

### Interview Validation
- ✅ Date: Required, valid timestamp
- ✅ Interviewer: Required, string
- ✅ Rating: Optional, 1-5 scale
- ✅ Feedback: Optional, string

---

## File Storage

### Resume Files
- **Location:** `uploads/resumes/`
- **Naming:** `{timestamp}-{randomId}.{extension}`
- **Max Size:** 5MB
- **Allowed Types:** PDF, DOC, DOCX, TXT
- **Access:** Via `GET /api/recruitment/resume/{filename}`

---

## Error Handling

### Common Errors

| Code | Error | Cause |
|------|-------|-------|
| 400 | Invalid file type | Resume not PDF/DOC/DOCX/TXT |
| 400 | File too large | Resume exceeds 5MB |
| 400 | Job posting not found | Invalid posting ID |
| 400 | Duplicate application | Candidate already applied |
| 404 | Candidate not found | Invalid candidate ID |
| 500 | Email send failed | SMTP/email config issue |

---

## Best Practices

1. **Email Configuration**
   - Verify email config before using email features
   - Use `.env` for SMTP credentials
   - Test email sending in development

2. **Resume Management**
   - Validate file types on upload
   - Store files outside web root for security
   - Implement virus scanning for production

3. **Status Tracking**
   - Always include notes when changing status
   - Maintain audit trail of all changes
   - Never delete candidate records

4. **Performance**
   - Implement pagination for large candidate lists
   - Index frequently filtered fields (email, status)
   - Cache job posting statistics

5. **Security**
   - Validate all file uploads
   - Prevent directory traversal in resume downloads
   - Implement rate limiting on applications
   - Sanitize user inputs

---

## Integration with Main System

### Add to server.js:
```javascript
const recruitmentRoutes = require('./recruitmentRoutes');

app.use('/api/recruitment', recruitmentRoutes);
```

### Include in seed.js:
```javascript
// Seed job requirements, postings, and sample applications
```

---

**Version:** 1.0.0  
**Last Updated:** January 29, 2026  
**Status:** Production Ready ✅
