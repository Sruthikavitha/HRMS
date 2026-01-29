/**
 * Recruitment Module - Core Recruitment Logic
 * Handles job requirements, postings, candidates, and status tracking
 */

const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// ==================== Job Requirement Management ====================

/**
 * Create a new job requirement
 * @param {object} data - { title, department, budget, description, positions, createdBy }
 * @returns {object} Created job requirement
 */
function createJobRequirement(data) {
  try {
    const {
      title,
      department,
      budget,
      description,
      positions = 1,
      createdBy
    } = data;

    if (!title || !department || !budget) {
      throw new Error('Title, department, and budget are required');
    }

    if (budget < 0) {
      throw new Error('Budget must be positive');
    }

    if (positions < 1) {
      throw new Error('Positions must be at least 1');
    }

    const requirement = {
      id: db.nextId('jobRequirements'),
      title,
      department,
      budget,
      description,
      positions,
      status: 'pending', // pending, approved, rejected, closed
      createdBy,
      createdAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      filledPositions: 0
    };

    if (!db.data.jobRequirements) {
      db.data.jobRequirements = [];
    }

    db.data.jobRequirements.push(requirement);
    db.write();

    return requirement;
  } catch (error) {
    throw new Error(`Failed to create job requirement: ${error.message}`);
  }
}

/**
 * Get all job requirements with filters
 * @param {object} filters - { department, status, createdBy }
 * @returns {array} Filtered job requirements
 */
function getJobRequirements(filters = {}) {
  try {
    let requirements = db.data.jobRequirements || [];

    if (filters.department) {
      requirements = requirements.filter(r => r.department === filters.department);
    }

    if (filters.status) {
      requirements = requirements.filter(r => r.status === filters.status);
    }

    if (filters.createdBy) {
      requirements = requirements.filter(r => r.createdBy === filters.createdBy);
    }

    return requirements;
  } catch (error) {
    throw new Error(`Failed to get job requirements: ${error.message}`);
  }
}

/**
 * Get job requirement by ID
 * @param {number} id - Requirement ID
 * @returns {object} Job requirement
 */
function getJobRequirementById(id) {
  const requirement = db.data.jobRequirements?.find(r => r.id === id);
  
  if (!requirement) {
    throw new Error('Job requirement not found');
  }

  return requirement;
}

/**
 * Approve job requirement (HR/Admin only)
 * @param {number} requirementId - ID of requirement to approve
 * @param {number} approvedBy - User ID of approver
 * @returns {object} Updated requirement
 */
function approveJobRequirement(requirementId, approvedBy) {
  try {
    const requirement = getJobRequirementById(requirementId);

    requirement.status = 'approved';
    requirement.approvedBy = approvedBy;
    requirement.approvedAt = new Date().toISOString();

    db.write();

    return requirement;
  } catch (error) {
    throw new Error(`Failed to approve job requirement: ${error.message}`);
  }
}

/**
 * Reject job requirement
 * @param {number} requirementId - ID of requirement to reject
 * @param {string} reason - Rejection reason
 * @returns {object} Updated requirement
 */
function rejectJobRequirement(requirementId, reason) {
  try {
    const requirement = getJobRequirementById(requirementId);

    requirement.status = 'rejected';
    requirement.rejectionReason = reason;

    db.write();

    return requirement;
  } catch (error) {
    throw new Error(`Failed to reject job requirement: ${error.message}`);
  }
}

// ==================== Job Posting Management ====================

/**
 * Create a job posting from an approved requirement
 * @param {object} data - { requirementId, title, description, location, salaryRange, applicationDeadline }
 * @returns {object} Created job posting
 */
function createJobPosting(data) {
  try {
    const {
      requirementId,
      title,
      description,
      location,
      salaryRange,
      applicationDeadline,
      createdBy
    } = data;

    // Verify requirement exists and is approved
    const requirement = getJobRequirementById(requirementId);
    if (requirement.status !== 'approved') {
      throw new Error('Can only create posting from approved requirement');
    }

    if (!title || !description || !location) {
      throw new Error('Title, description, and location are required');
    }

    const posting = {
      id: db.nextId('jobPostings'),
      requirementId,
      title,
      description,
      department: requirement.department,
      location,
      salaryRange,
      status: 'open', // open, closed, filled
      applicationDeadline,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicantCount: 0
    };

    if (!db.data.jobPostings) {
      db.data.jobPostings = [];
    }

    db.data.jobPostings.push(posting);
    db.write();

    return posting;
  } catch (error) {
    throw new Error(`Failed to create job posting: ${error.message}`);
  }
}

/**
 * Get all job postings with filters
 * @param {object} filters - { status, department, location }
 * @returns {array} Filtered job postings
 */
function getJobPostings(filters = {}) {
  try {
    let postings = db.data.jobPostings || [];

    if (filters.status) {
      postings = postings.filter(p => p.status === filters.status);
    }

    if (filters.department) {
      postings = postings.filter(p => p.department === filters.department);
    }

    if (filters.location) {
      postings = postings.filter(p => p.location === filters.location);
    }

    return postings;
  } catch (error) {
    throw new Error(`Failed to get job postings: ${error.message}`);
  }
}

/**
 * Get job posting by ID with candidate count
 * @param {number} id - Posting ID
 * @returns {object} Job posting with stats
 */
function getJobPostingById(id) {
  const posting = db.data.jobPostings?.find(p => p.id === id);
  
  if (!posting) {
    throw new Error('Job posting not found');
  }

  // Count candidates by status
  const candidates = db.data.candidates?.filter(c => c.jobPostingId === id) || [];
  const stats = {
    total: candidates.length,
    applied: candidates.filter(c => c.status === 'applied').length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    interviewed: candidates.filter(c => c.status === 'interviewed').length,
    selected: candidates.filter(c => c.status === 'selected').length,
    rejected: candidates.filter(c => c.status === 'rejected').length
  };

  return { ...posting, stats };
}

/**
 * Update job posting status
 * @param {number} postingId - Posting ID
 * @param {string} status - New status (open, closed, filled)
 * @returns {object} Updated posting
 */
function updateJobPostingStatus(postingId, status) {
  try {
    const validStatuses = ['open', 'closed', 'filled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const posting = db.data.jobPostings?.find(p => p.id === postingId);
    
    if (!posting) {
      throw new Error('Job posting not found');
    }

    posting.status = status;
    posting.updatedAt = new Date().toISOString();

    db.write();

    return posting;
  } catch (error) {
    throw new Error(`Failed to update job posting: ${error.message}`);
  }
}

// ==================== Candidate Management ====================

/**
 * Apply for a job posting
 * @param {object} data - { jobPostingId, candidateName, email, phone, resume, experience, skills }
 * @returns {object} Created candidate application
 */
function applyForJob(data) {
  try {
    const {
      jobPostingId,
      candidateName,
      email,
      phone,
      resume,
      experience,
      skills,
      linkedinProfile
    } = data;

    if (!jobPostingId || !candidateName || !email) {
      throw new Error('Job posting ID, candidate name, and email are required');
    }

    // Verify job posting exists
    const posting = db.data.jobPostings?.find(p => p.id === jobPostingId);
    if (!posting) {
      throw new Error('Job posting not found');
    }

    // Check for duplicate application
    const existingApp = db.data.candidates?.find(c => 
      c.jobPostingId === jobPostingId && c.email === email
    );

    if (existingApp) {
      throw new Error('You have already applied for this position');
    }

    const candidate = {
      id: db.nextId('candidates'),
      jobPostingId,
      candidateName,
      email,
      phone,
      resume, // Store filename or path
      experience,
      skills: Array.isArray(skills) ? skills : [skills],
      linkedinProfile,
      status: 'applied', // applied, shortlisted, interviewed, selected, rejected
      appliedAt: new Date().toISOString(),
      ratings: [], // Array of interview ratings
      notes: [],
      interviews: [],
      rejectionReason: null
    };

    if (!db.data.candidates) {
      db.data.candidates = [];
    }

    db.data.candidates.push(candidate);
    
    // Update posting applicant count
    posting.applicantCount = (posting.applicantCount || 0) + 1;
    
    db.write();

    return candidate;
  } catch (error) {
    throw new Error(`Failed to apply for job: ${error.message}`);
  }
}

/**
 * Get all candidates with filters
 * @param {object} filters - { jobPostingId, status, email }
 * @returns {array} Filtered candidates
 */
function getCandidates(filters = {}) {
  try {
    let candidates = db.data.candidates || [];

    if (filters.jobPostingId) {
      candidates = candidates.filter(c => c.jobPostingId === filters.jobPostingId);
    }

    if (filters.status) {
      candidates = candidates.filter(c => c.status === filters.status);
    }

    if (filters.email) {
      candidates = candidates.filter(c => c.email === filters.email);
    }

    return candidates;
  } catch (error) {
    throw new Error(`Failed to get candidates: ${error.message}`);
  }
}

/**
 * Get candidate by ID
 * @param {number} candidateId - Candidate ID
 * @returns {object} Candidate details
 */
function getCandidateById(candidateId) {
  const candidate = db.data.candidates?.find(c => c.id === candidateId);
  
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  return candidate;
}

/**
 * Update candidate status and trigger notifications
 * @param {number} candidateId - Candidate ID
 * @param {string} newStatus - New status
 * @param {string} notes - Optional notes
 * @returns {object} Updated candidate
 */
function updateCandidateStatus(candidateId, newStatus, notes = '') {
  try {
    const validStatuses = ['applied', 'shortlisted', 'interviewed', 'selected', 'rejected'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const candidate = getCandidateById(candidateId);
    const oldStatus = candidate.status;

    candidate.status = newStatus;
    candidate.updatedAt = new Date().toISOString();

    if (notes) {
      candidate.notes = candidate.notes || [];
      candidate.notes.push({
        text: notes,
        timestamp: new Date().toISOString()
      });
    }

    if (newStatus === 'rejected' && !candidate.rejectionReason) {
      candidate.rejectionReason = notes || 'No reason provided';
    }

    db.write();

    // Log status change
    logStatusChange(candidateId, oldStatus, newStatus);

    return candidate;
  } catch (error) {
    throw new Error(`Failed to update candidate status: ${error.message}`);
  }
}

/**
 * Add interview record for candidate
 * @param {number} candidateId - Candidate ID
 * @param {object} interviewData - { date, interviewer, rating, feedback }
 * @returns {object} Updated candidate with interview
 */
function addInterview(candidateId, interviewData) {
  try {
    const {
      date,
      interviewer,
      rating,
      feedback
    } = interviewData;

    if (!date || !interviewer) {
      throw new Error('Interview date and interviewer are required');
    }

    if (rating && (rating < 1 || rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const candidate = getCandidateById(candidateId);

    const interview = {
      id: uuidv4(),
      date,
      interviewer,
      rating: rating || 0,
      feedback,
      createdAt: new Date().toISOString()
    };

    if (!candidate.interviews) {
      candidate.interviews = [];
    }

    candidate.interviews.push(interview);

    // Update candidate status to interviewed if not already
    if (candidate.status === 'shortlisted') {
      candidate.status = 'interviewed';
    }

    db.write();

    return candidate;
  } catch (error) {
    throw new Error(`Failed to add interview: ${error.message}`);
  }
}

/**
 * Get candidates for a specific posting with status breakdown
 * @param {number} jobPostingId - Posting ID
 * @returns {object} Candidates grouped by status
 */
function getCandidatesByPosting(jobPostingId) {
  try {
    const candidates = getCandidates({ jobPostingId });

    return {
      total: candidates.length,
      byStatus: {
        applied: candidates.filter(c => c.status === 'applied'),
        shortlisted: candidates.filter(c => c.status === 'shortlisted'),
        interviewed: candidates.filter(c => c.status === 'interviewed'),
        selected: candidates.filter(c => c.status === 'selected'),
        rejected: candidates.filter(c => c.status === 'rejected')
      }
    };
  } catch (error) {
    throw new Error(`Failed to get candidates by posting: ${error.message}`);
  }
}

// ==================== Recruitment Analytics ====================

/**
 * Get recruitment dashboard statistics
 * @returns {object} Recruitment metrics
 */
function getRecruitmentStats() {
  try {
    const requirements = db.data.jobRequirements || [];
    const postings = db.data.jobPostings || [];
    const candidates = db.data.candidates || [];

    return {
      requirements: {
        total: requirements.length,
        pending: requirements.filter(r => r.status === 'pending').length,
        approved: requirements.filter(r => r.status === 'approved').length,
        rejected: requirements.filter(r => r.status === 'rejected').length,
        closed: requirements.filter(r => r.status === 'closed').length
      },
      postings: {
        total: postings.length,
        open: postings.filter(p => p.status === 'open').length,
        closed: postings.filter(p => p.status === 'closed').length,
        filled: postings.filter(p => p.status === 'filled').length
      },
      candidates: {
        total: candidates.length,
        applied: candidates.filter(c => c.status === 'applied').length,
        shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
        interviewed: candidates.filter(c => c.status === 'interviewed').length,
        selected: candidates.filter(c => c.status === 'selected').length,
        rejected: candidates.filter(c => c.status === 'rejected').length
      },
      conversionRate: candidates.length > 0 
        ? ((candidates.filter(c => c.status === 'selected').length / candidates.length) * 100).toFixed(2)
        : 0
    };
  } catch (error) {
    throw new Error(`Failed to get recruitment stats: ${error.message}`);
  }
}

/**
 * Get top candidates (by rating)
 * @param {number} limit - Number of candidates to return
 * @returns {array} Top candidates
 */
function getTopCandidates(limit = 10) {
  try {
    const candidates = db.data.candidates || [];

    return candidates
      .filter(c => c.interviews && c.interviews.length > 0)
      .sort((a, b) => {
        const avgA = a.interviews.reduce((sum, i) => sum + i.rating, 0) / a.interviews.length;
        const avgB = b.interviews.reduce((sum, i) => sum + i.rating, 0) / b.interviews.length;
        return avgB - avgA;
      })
      .slice(0, limit);
  } catch (error) {
    throw new Error(`Failed to get top candidates: ${error.message}`);
  }
}

// ==================== Helper Functions ====================

/**
 * Log candidate status change for audit trail
 * @param {number} candidateId - Candidate ID
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 */
function logStatusChange(candidateId, oldStatus, newStatus) {
  if (!db.data.statusChangeLogs) {
    db.data.statusChangeLogs = [];
  }

  db.data.statusChangeLogs.push({
    id: db.nextId('statusChangeLogs'),
    candidateId,
    oldStatus,
    newStatus,
    timestamp: new Date().toISOString()
  });

  db.write();
}

/**
 * Validate resume file
 * @param {string} filename - Resume filename
 * @returns {boolean} True if valid
 */
function isValidResumeFile(filename) {
  const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
}

// ==================== Exports ====================

module.exports = {
  // Job Requirements
  createJobRequirement,
  getJobRequirements,
  getJobRequirementById,
  approveJobRequirement,
  rejectJobRequirement,

  // Job Postings
  createJobPosting,
  getJobPostings,
  getJobPostingById,
  updateJobPostingStatus,

  // Candidates
  applyForJob,
  getCandidates,
  getCandidateById,
  updateCandidateStatus,
  addInterview,
  getCandidatesByPosting,

  // Analytics
  getRecruitmentStats,
  getTopCandidates,

  // Utilities
  isValidResumeFile,
  logStatusChange
};
