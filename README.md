# Smart HRMS - Human Resource Management System

A comprehensive, modern web-based application designed to automate and streamline the complete human resource lifecycle of an organization.

## 🎯 Features

### 1. **Recruitment Module**
- Job requirement planning and budget allocation
- Job posting across recruitment portals
- Candidate application and management
- Resume screening and shortlisting
- Interview scheduling and feedback
- Background verification
- Selection tracking

### 2. **Employee Management**
- Employee onboarding and document verification
- Automated mail ID and login creation
- Personal details and salary records management
- Certificate and qualification tracking
- Department-wise employee reports
- Employee status management

### 3. **Leave & Attendance Management**
- Multiple leave types (Casual, Earned, Sick, etc.)
- Leave request and approval workflow
- Daily attendance tracking
- Attendance reports by department

### 4. **Employee Relations & Engagement**
- Automated birthday and anniversary wishes
- Special day notifications
- Insurance and IR updates
- Employee communications and announcements
- Engagement activity tracking

### 5. **Exit Management**
- Separation initiation and tracking
- No-due clearance checklist
- Automated experience letter generation
- Relieving letter generation
- Exit documentation

### 6. **HR Analytics & Reporting**
- Real-time headcount analytics
- Attrition rate tracking
- Salary distribution analysis
- Department-wise performance reports
- Budget utilization tracking
- Recruitment pipeline analytics

## 🚀 Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Modern web browser

### Setup Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Seed Sample Data**
```bash
npm run seed
```

3. **Start the Server**
```bash
npm start
```

4. **Access the Application**
```
http://localhost:3000
```

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hrms.com | admin123 |
| HR Manager | hr@hrms.com | hr123 |
| Manager | manager@hrms.com | manager123 |
| Employee | john@hrms.com | emp123 |

## 📊 User Roles & Permissions

### Admin
- Full system access
- User and role management
- Budget and requirement approval
- System configuration

### HR
- Recruitment management
- Employee onboarding
- Leave and attendance management
- Performance reviews
- Exit management

### Manager
- Team management
- Leave approval for team members
- Attendance tracking
- Performance reviews for team
- Interview scheduling

### Employee
- View own profile and documents
- Request leave
- Check attendance
- View engagement activities
- View performance reviews

## 📂 Project Structure

```
├── server.js              # Express server with all API routes
├── db.js                  # Database connection and management
├── db.json                # JSON database file
├── schema.sql             # Database schema (for SQL reference)
├── seed.js                # Sample data seeding script
├── package.json           # Project dependencies
├── public/
│   ├── index.html         # Main HTML file
│   ├── app.js             # Frontend JavaScript application
│   └── styles.css         # Vibrant CSS styling
└── README.md              # This file
```

## 🎨 UI/UX Features

- **Vibrant Color Scheme**: Modern gradient colors (#6366f1, #8b5cf6)
- **Smooth Transitions**: All interactions have smooth animations
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dashboard Analytics**: Real-time KPI cards and charts
- **Intuitive Navigation**: Sidebar and top navigation for easy access
- **Modal Forms**: Clean modal dialogs for data entry
- **Toast Notifications**: User feedback on actions
- **Data Tables**: Sortable and filterable tables
- **Card Layouts**: Grid-based card displays for various modules

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Recruitment
- `GET /api/job-requirements` - List job requirements
- `POST /api/job-requirements` - Create job requirement
- `GET /api/job-postings` - List job postings
- `POST /api/job-postings` - Create job posting
- `GET /api/candidates` - List candidates
- `POST /api/candidates` - Add candidate
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Schedule interview

### Leave Management
- `GET /api/leave-types` - List leave types
- `GET /api/leave-requests` - List leave requests
- `POST /api/leave-requests` - Create leave request
- `PUT /api/leave-requests/:id/approve` - Approve leave
- `PUT /api/leave-requests/:id/reject` - Reject leave

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance

### Engagement
- `GET /api/engagement` - List engagement activities
- `POST /api/engagement` - Create engagement activity
- `GET /api/insurance` - List insurance records
- `POST /api/insurance` - Add insurance record

### Exit Management
- `GET /api/separations` - List separations
- `POST /api/separations` - Initiate separation
- `GET /api/no-due-clearances/:id` - Get clearance checklist
- `POST /api/no-due-clearances` - Complete clearance item

### Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/headcount` - Get headcount by department
- `GET /api/dashboard/salary-distribution` - Get salary distribution

## 💾 Database Schema

The application uses a JSON database (lowdb) with the following main collections:

- **users** - System users with roles
- **employees** - Employee master data
- **jobRequirements** - Job position requirements
- **jobPostings** - Published job postings
- **candidates** - Job applicants
- **interviews** - Interview records
- **leaveTypes** - Leave type definitions
- **leaveRequests** - Leave request records
- **attendance** - Daily attendance records
- **engagement** - Employee engagement activities
- **separations** - Employee exit records
- **performanceReviews** - Performance ratings

## 🔄 Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
Ensure environment variables are set properly and optimize database for production.

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- HTTP-only cookies for tokens
- CORS enabled for API requests
- Input validation

## 📈 Performance Features

- Efficient JSON database queries
- Client-side pagination for large datasets
- Optimized CSS animations
- Lazy loading of modules
- Caching of user sessions

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in server.js or use:
PORT=3001 npm start
```

### Database Issues
```bash
# Reseed the database
npm run seed
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues and support, please contact:
- Email: support@hrms.com
- Documentation: See inline code comments

## 🎉 Version

**Smart HRMS v1.0.0**
Released: January 2026

---

**Built with ❤️ for modern HR management**


This is a minimal Certificate Management System with role-based access (Admin, Student, Management).

Quick start

1. Install dependencies

```powershell
npm install
```

2. Seed the database

```powershell
npm run seed
```

3. Start the server

```powershell
npm start
```

Open http://localhost:3000

Default seeded accounts:

- Admin: admin@example.com / adminpass
- Management: management@example.com / managepass
- Student: student1@example.com / studentpass

Notes

- Server uses a simple JWT cookie (set `JWT_SECRET` env var for production).
- Only `ADMIN` may create/update certificate data and decide requests.
- All issue/return actions are recorded in the `logs` table for auditing.
