const bcrypt = require('bcrypt');
const { db, write, nextId } = require('./db');

async function seed() {
  console.log('Seeding database...');

  // Create sample users
  const adminPass = await bcrypt.hash('admin123', 10);
  const hrPass = await bcrypt.hash('hr123', 10);
  const managerPass = await bcrypt.hash('manager123', 10);
  const empPass = await bcrypt.hash('emp123', 10);

  db.data.users = [
    { id: 1, name: 'Admin User', email: 'admin@hrms.com', password: adminPass, role: 'ADMIN', department: 'Management', status: 'active' },
    { id: 2, name: 'HR Manager', email: 'hr@hrms.com', password: hrPass, role: 'HR', department: 'HR', status: 'active' },
    { id: 3, name: 'Project Manager', email: 'manager@hrms.com', password: managerPass, role: 'MANAGER', department: 'IT', status: 'active' },
    { id: 4, name: 'John Employee', email: 'john@hrms.com', password: empPass, role: 'EMPLOYEE', department: 'IT', status: 'active' }
  ];

  // Sample employees
  db.data.employees = [
    {
      id: 1,
      employee_id: 'EMP001',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-05-15',
      gender: 'M',
      department: 'IT',
      designation: 'Software Engineer',
      joining_date: '2020-01-15',
      status: 'active',
      salary: 600000
    },
    {
      id: 2,
      employee_id: 'EMP002',
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1992-08-20',
      gender: 'F',
      department: 'HR',
      designation: 'HR Executive',
      joining_date: '2019-06-01',
      status: 'active',
      salary: 450000
    },
    {
      id: 3,
      employee_id: 'EMP003',
      first_name: 'Mike',
      last_name: 'Johnson',
      date_of_birth: '1988-03-10',
      gender: 'M',
      department: 'Finance',
      designation: 'Finance Manager',
      joining_date: '2018-09-15',
      status: 'active',
      salary: 550000
    },
    {
      id: 4,
      employee_id: 'EMP004',
      first_name: 'Sarah',
      last_name: 'Williams',
      date_of_birth: '1995-11-25',
      gender: 'F',
      department: 'IT',
      designation: 'Junior Developer',
      joining_date: '2021-03-01',
      status: 'active',
      salary: 400000
    },
    {
      id: 5,
      employee_id: 'EMP005',
      first_name: 'David',
      last_name: 'Brown',
      date_of_birth: '1985-07-05',
      gender: 'M',
      department: 'Operations',
      designation: 'Operations Lead',
      joining_date: '2017-01-10',
      status: 'active',
      salary: 520000
    }
  ];

  // Leave types
  db.data.leaveTypes = [
    { id: 1, name: 'Casual Leave', days_per_year: 12, is_paid: 1, requires_approval: 1 },
    { id: 2, name: 'Earned Leave', days_per_year: 20, is_paid: 1, requires_approval: 1 },
    { id: 3, name: 'Sick Leave', days_per_year: 10, is_paid: 1, requires_approval: 0 },
    { id: 4, name: 'Maternity Leave', days_per_year: 180, is_paid: 1, requires_approval: 1 },
    { id: 5, name: 'Unpaid Leave', days_per_year: 5, is_paid: 0, requires_approval: 1 }
  ];

  // Sample job requirements
  db.data.jobRequirements = [
    {
      id: 1,
      position_title: 'Senior Developer',
      department_id: 1,
      required_count: 3,
      budget_allocated: 2000000,
      status: 'approved',
      created_by: 1,
      approved_by: 1
    },
    {
      id: 2,
      position_title: 'UX Designer',
      department_id: 1,
      required_count: 2,
      budget_allocated: 1200000,
      status: 'approved',
      created_by: 2,
      approved_by: 1
    }
  ];

  // Sample job postings
  db.data.jobPostings = [
    {
      id: 1,
      requirement_id: 1,
      title: 'Senior Full Stack Developer',
      description: 'Looking for experienced developer with 5+ years in MERN stack',
      qualifications: 'B.Tech/B.Sc in CS',
      salary_range: '1,200,000 - 1,600,000',
      location: 'Bangalore',
      status: 'open',
      posted_date: new Date().toISOString()
    },
    {
      id: 2,
      requirement_id: 2,
      title: 'UI/UX Designer',
      description: 'Creative designer needed for web and mobile applications',
      qualifications: 'Degree in Design/Fine Arts',
      salary_range: '600,000 - 900,000',
      location: 'Delhi',
      status: 'open',
      posted_date: new Date().toISOString()
    }
  ];

  // Sample candidates
  db.data.candidates = [
    {
      id: 1,
      job_posting_id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh@email.com',
      phone: '9876543210',
      experience_years: 6,
      current_company: 'Tech Corp',
      current_designation: 'Senior Developer',
      status: 'shortlisted',
      applied_date: new Date().toISOString()
    },
    {
      id: 2,
      job_posting_id: 1,
      name: 'Priya Singh',
      email: 'priya@email.com',
      phone: '9123456789',
      experience_years: 5,
      current_company: 'Software Solutions',
      current_designation: 'Developer',
      status: 'interview',
      applied_date: new Date().toISOString()
    },
    {
      id: 3,
      job_posting_id: 2,
      name: 'Arun Patel',
      email: 'arun@email.com',
      phone: '9988776655',
      experience_years: 4,
      current_company: 'Design Studio',
      current_designation: 'UI Designer',
      status: 'applied',
      applied_date: new Date().toISOString()
    }
  ];

  // Sample leave requests
  db.data.leaveRequests = [
    {
      id: 1,
      employee_id: 1,
      leave_type_id: 1,
      start_date: '2026-02-15',
      end_date: '2026-02-18',
      reason: 'Personal work',
      status: 'approved',
      approved_by: 3,
      approved_date: new Date().toISOString()
    },
    {
      id: 2,
      employee_id: 2,
      leave_type_id: 2,
      start_date: '2026-02-20',
      end_date: '2026-02-27',
      reason: 'Vacation',
      status: 'pending',
      approved_by: null
    }
  ];

  // Sample engagement activities
  db.data.engagement = [
    {
      id: 1,
      employee_id: 1,
      event_type: 'birthday',
      event_date: '2026-05-15',
      message: 'Happy Birthday John! Wishing you a wonderful year ahead.',
      status: 'pending',
      created_by: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      employee_id: 2,
      event_type: 'anniversary',
      event_date: '2026-06-01',
      message: 'Congratulations on 7 years with us!',
      status: 'pending',
      created_by: 2,
      created_at: new Date().toISOString()
    }
  ];

  // Sample separations
  db.data.separations = [];

  // Sample performance reviews
  db.data.performanceReviews = [
    {
      id: 1,
      employee_id: 1,
      review_period_start: '2025-01-01',
      review_period_end: '2025-12-31',
      rating: 4.5,
      reviewer_id: 3,
      comments: 'Excellent performance, consistent delivery',
      status: 'submitted'
    }
  ];

  // Update counters
  db.data._id = {
    users: 4,
    employees: 5,
    jobRequirements: 2,
    jobPostings: 2,
    candidates: 3,
    interviews: 0,
    leaveRequests: 2,
    engagement: 2,
    separations: 0,
    performanceReviews: 1,
    auditLogs: 0
  };

  write();
  console.log('Database seeded successfully!');
  console.log('\nDefault credentials:');
  console.log('Admin - admin@hrms.com / admin123');
  console.log('HR - hr@hrms.com / hr123');
  console.log('Manager - manager@hrms.com / manager123');
  console.log('Employee - john@hrms.com / emp123');
}

seed().catch(console.error);
    'PAN Card Xerox',
    'Voter ID Xerox',
    'Community Certificate'
  ];

  for (const title of certificateTypes) {
    db.data.certificate_master.push({
      id: nextId('certificate_master'),
      title,
      created_at: new Date().toISOString()
    });
  }

  // 🔹 ASSIGN ALL CERTIFICATES TO ALL STUDENTS
  const students = db.data.users.filter(u => u.role === 'STUDENT');

  for (const student of students) {
    for (const cert of db.data.certificate_master) {
      db.data.certificates.push({
        id: nextId('certificates'),
        user_id: student.id,
        certificate_id: cert.id,
        title: cert.title,
        present_in_office: 0,          // ❌ Not submitted
        status: 'not_present',
        submitted_at: null,
        created_at: new Date().toISOString()
      });
    }
  }

  write();
  console.log('✅ Database seeded successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
