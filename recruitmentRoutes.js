/**
 * Recruitment Routes - RESTful API Endpoints
 * Handles job requirements, postings, candidate management, and resume uploads
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const recruitment = require('./recruitmentModule');
const emailService = require('./emailService');
const db = require('./db');

// ==================== Multer Configuration ====================

// Configure resume upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (recruitment.isValidResumeFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT allowed'), false);
    }
  }
});

// ==================== Job Requirement Routes ====================

/**
 * POST /api/recruitment/requirements
 * Create a new job requirement (HR/Admin only)
 * Body: { title, department, budget, description, positions }
 */
router.post('/requirements', (req, res) => {
  try {
    const { title, department, budget, description, positions } = req.body;

    const requirement = recruitment.createJobRequirement({
      title,
      department,
      budget: parseFloat(budget),
      description,
      positions: parseInt(positions) || 1,
      createdBy: req.user?.id || 1
    });

    res.status(201).json({
      message: 'Job requirement created successfully',
      requirement
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/requirements
 * Get all job requirements with optional filters
 * Query: { department, status, limit }
 */
router.get('/requirements', (req, res) => {
  try {
    const filters = {
      department: req.query.department,
      status: req.query.status
    };

    const requirements = recruitment.getJobRequirements(filters);
    const limit = parseInt(req.query.limit) || requirements.length;

    res.json({
      total: requirements.length,
      requirements: requirements.slice(0, limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/requirements/:id
 * Get specific job requirement
 */
router.get('/requirements/:id', (req, res) => {
  try {
    const requirement = recruitment.getJobRequirementById(parseInt(req.params.id));
    res.json({ requirement });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * PUT /api/recruitment/requirements/:id/approve
 * Approve a job requirement (Admin/HR only)
 */
router.put('/requirements/:id/approve', (req, res) => {
  try {
    const requirement = recruitment.approveJobRequirement(
      parseInt(req.params.id),
      req.user?.id || 1
    );

    res.json({
      message: 'Job requirement approved successfully',
      requirement
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/recruitment/requirements/:id/reject
 * Reject a job requirement
 * Body: { reason }
 */
router.put('/requirements/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;

    const requirement = recruitment.rejectJobRequirement(
      parseInt(req.params.id),
      reason
    );

    res.json({
      message: 'Job requirement rejected',
      requirement
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== Job Posting Routes ====================

/**
 * POST /api/recruitment/postings
 * Create a new job posting from an approved requirement
 * Body: { requirementId, title, description, location, salaryRange, applicationDeadline }
 */
router.post('/postings', (req, res) => {
  try {
    const {
      requirementId,
      title,
      description,
      location,
      salaryRange,
      applicationDeadline
    } = req.body;

    const posting = recruitment.createJobPosting({
      requirementId: parseInt(requirementId),
      title,
      description,
      location,
      salaryRange,
      applicationDeadline,
      createdBy: req.user?.id || 1
    });

    res.status(201).json({
      message: 'Job posting created successfully',
      posting
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/postings
 * Get all job postings with optional filters
 * Query: { status, department, location, limit }
 */
router.get('/postings', (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'open',
      department: req.query.department,
      location: req.query.location
    };

    const postings = recruitment.getJobPostings(filters);
    const limit = parseInt(req.query.limit) || postings.length;

    res.json({
      total: postings.length,
      postings: postings.slice(0, limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/postings/:id
 * Get specific job posting with candidate statistics
 */
router.get('/postings/:id', (req, res) => {
  try {
    const posting = recruitment.getJobPostingById(parseInt(req.params.id));
    res.json({ posting });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * PUT /api/recruitment/postings/:id/status
 * Update job posting status
 * Body: { status } - "open", "closed", "filled"
 */
router.put('/postings/:id/status', (req, res) => {
  try {
    const { status } = req.body;

    const posting = recruitment.updateJobPostingStatus(
      parseInt(req.params.id),
      status
    );

    res.json({
      message: 'Job posting status updated',
      posting
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== Candidate Application Routes ====================

/**
 * POST /api/recruitment/apply
 * Apply for a job posting with resume upload
 * Form: { jobPostingId, candidateName, email, phone, experience, skills, resume (file) }
 */
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const {
      jobPostingId,
      candidateName,
      email,
      phone,
      experience,
      skills,
      linkedinProfile
    } = req.body;

    // Validate required fields
    if (!jobPostingId || !candidateName || !email) {
      return res.status(400).json({
        error: 'Job posting ID, candidate name, and email are required'
      });
    }

    // Parse skills array
    const skillsArray = skills ? (Array.isArray(skills) ? skills : skills.split(',')) : [];

    // Create candidate application
    const candidate = recruitment.applyForJob({
      jobPostingId: parseInt(jobPostingId),
      candidateName,
      email,
      phone,
      resume: req.file ? req.file.filename : null,
      experience,
      skills: skillsArray,
      linkedinProfile
    });

    // Get job posting for email
    const posting = recruitment.getJobPostingById(parseInt(jobPostingId));

    // Send confirmation email
    try {
      await emailService.sendApplicationConfirmation(candidate, posting);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the application if email fails
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      candidate,
      resumeFile: req.file ? req.file.filename : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/candidates
 * Get all candidates with optional filters
 * Query: { jobPostingId, status, limit }
 */
router.get('/candidates', (req, res) => {
  try {
    const filters = {
      jobPostingId: req.query.jobPostingId ? parseInt(req.query.jobPostingId) : undefined,
      status: req.query.status
    };

    const candidates = recruitment.getCandidates(filters);
    const limit = parseInt(req.query.limit) || candidates.length;

    res.json({
      total: candidates.length,
      candidates: candidates.slice(0, limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/candidates/:id
 * Get specific candidate details
 */
router.get('/candidates/:id', (req, res) => {
  try {
    const candidate = recruitment.getCandidateById(parseInt(req.params.id));
    res.json({ candidate });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/candidates/posting/:postingId
 * Get all candidates for a specific posting grouped by status
 */
router.get('/candidates/posting/:postingId', (req, res) => {
  try {
    const candidates = recruitment.getCandidatesByPosting(parseInt(req.params.postingId));
    res.json({ candidates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/recruitment/candidates/:id/status
 * Update candidate status and trigger notifications
 * Body: { status, notes }
 */
router.put('/candidates/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const candidate = recruitment.updateCandidateStatus(
      parseInt(req.params.id),
      status,
      notes
    );

    // Get posting info for email
    const posting = recruitment.getJobPostingById(candidate.jobPostingId);

    // Send status notification email
    try {
      switch (status) {
        case 'shortlisted':
          await emailService.sendShortlistedNotification(candidate, posting, notes);
          break;
        case 'selected':
          await emailService.sendSelectedNotification(candidate, posting, notes);
          break;
        case 'rejected':
          await emailService.sendRejectionNotification(candidate, posting, notes);
          break;
      }
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      message: `Candidate status updated to ${status}`,
      candidate
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/recruitment/candidates/:id/interview
 * Add interview record for candidate
 * Body: { date, interviewer, rating, feedback, location }
 */
router.post('/candidates/:id/interview', async (req, res) => {
  try {
    const {
      date,
      interviewer,
      rating,
      feedback,
      location
    } = req.body;

    const candidate = recruitment.addInterview(
      parseInt(req.params.id),
      {
        date,
        interviewer,
        rating: parseInt(rating),
        feedback,
        location
      }
    );

    // Get posting info for email
    const posting = recruitment.getJobPostingById(candidate.jobPostingId);

    // Send interview scheduled email if not already sent
    try {
      await emailService.sendInterviewScheduled(candidate, posting, {
        date,
        interviewer,
        location
      });
    } catch (emailError) {
      console.error('Failed to send interview email:', emailError);
    }

    res.status(201).json({
      message: 'Interview record added successfully',
      candidate
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/recruitment/bulk-update
 * Bulk update candidate status with email notifications
 * Body: { candidateIds, status }
 */
router.post('/bulk-update', async (req, res) => {
  try {
    const { candidateIds, status } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: 'Candidate IDs array is required' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const candidateId of candidateIds) {
      try {
        recruitment.updateCandidateStatus(candidateId, status);
        results.success.push(candidateId);
      } catch (error) {
        results.failed.push({ candidateId, error: error.message });
      }
    }

    // Send bulk emails
    try {
      await emailService.sendBulkStatusUpdate(results.success, status);
    } catch (emailError) {
      console.error('Bulk email send partially failed:', emailError);
    }

    res.json({
      message: 'Bulk update completed',
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== Analytics Routes ====================

/**
 * GET /api/recruitment/stats
 * Get recruitment dashboard statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = recruitment.getRecruitmentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/top-candidates
 * Get top rated candidates
 * Query: { limit }
 */
router.get('/top-candidates', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const candidates = recruitment.getTopCandidates(limit);

    res.json({
      total: candidates.length,
      candidates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruitment/email-logs/:candidateId
 * Get email communication history for a candidate
 */
router.get('/email-logs/:candidateId', (req, res) => {
  try {
    const logs = emailService.getEmailLogs(parseInt(req.params.candidateId));

    res.json({
      candidateId: parseInt(req.params.candidateId),
      total: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Resume Download Route ====================

/**
 * GET /api/recruitment/resume/:filename
 * Download candidate resume
 */
router.get('/resume/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', 'resumes', filename);

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    res.download(filepath, filename);
  } catch (error) {
    res.status(404).json({ error: 'Resume not found' });
  }
});

// ==================== Email Configuration Routes ====================

/**
 * POST /api/recruitment/email/verify
 * Verify email configuration (Admin only)
 */
router.post('/email/verify', async (req, res) => {
  try {
    const isValid = await emailService.verifyEmailConfig();

    res.json({
      message: isValid ? 'Email configuration is valid' : 'Email configuration failed',
      valid: isValid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/recruitment/email/test
 * Send test email (Admin only)
 * Body: { email }
 */
router.post('/email/test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const result = await emailService.sendApplicationConfirmation(
      { candidateName: 'Test', email, id: 0 },
      { title: 'Test Position' }
    );

    res.json({
      message: 'Test email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
