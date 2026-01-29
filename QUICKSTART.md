# Smart HRMS - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd c:\Users\rosev\HR
npm install
```

### Step 2: Seed Sample Data
```bash
npm run seed
```

This will create:
- 5 sample employees
- 2 job postings
- 3 candidates
- 5 leave types
- Sample engagement activities
- Performance reviews

### Step 3: Start the Server
```bash
npm start
```

Server will run on: **http://localhost:3000**

### Step 4: Login
Use one of these credentials:

```
Email: admin@hrms.com
Password: admin123
Role: Admin (Full Access)

OR

Email: hr@hrms.com
Password: hr123
Role: HR Manager (HR Operations)

OR

Email: manager@hrms.com
Password: manager123
Role: Manager (Team Management)

OR

Email: john@hrms.com
Password: emp123
Role: Employee (Limited Access)
```

---

## 📊 Module Overview

### 1. Dashboard
- See real-time KPIs
- View headcount by department
- Check salary distribution
- Monitor attrition rates

**Access**: Click "Dashboard" in sidebar

### 2. Employee Management
- View all employees
- Add new employees
- Update employee details
- Track employee documents

**Access**: Click "Employees" in sidebar

### 3. Recruitment
- Post new job openings
- Manage job candidates
- Schedule interviews
- Track recruitment pipeline

**Access**: Click "Recruitment" in sidebar

### 4. Leave Management
- Request leave
- View leave types
- Approve/reject requests
- Track leave balance

**Access**: Click "Leave" in sidebar

### 5. Engagement
- Create birthday/anniversary activities
- Send employee communications
- Manage insurance records
- Track engagement events

**Access**: Click "Engagement" in sidebar

### 6. Exit Management
- Initiate employee separations
- Complete no-due clearance
- Generate experience letters
- Track exit documentation

**Access**: Click "Exit" in sidebar

### 7. Analytics
- View HR metrics
- Generate reports
- Analyze trends
- Export data

**Access**: Click "Analytics" in sidebar

---

## 🎨 UI Features

### Vibrant Design
- **Color Scheme**: Indigo (#6366f1) & Purple (#8b5cf6) gradients
- **Smooth Animations**: All transitions are smooth and fluid
- **Responsive Layout**: Works on all screen sizes
- **Modern Cards**: Beautiful card-based layouts

### Navigation
- **Top Navbar**: Quick access to main functions
- **Left Sidebar**: Module navigation menu
- **Breadcrumbs**: Easy navigation tracking
- **Dashboard Home**: Overview of all metrics

### Forms & Modals
- **Clean Forms**: Organized input fields
- **Modal Dialogs**: Smooth pop-up forms
- **Validation**: Input validation feedback
- **Success Messages**: Toast notifications

### Data Display
- **Cards Grid**: Visual data presentation
- **Data Tables**: Sortable and filterable
- **Charts**: Beautiful bar charts
- **Statistics**: Large number displays

---

## 🔄 Common Tasks

### Adding an Employee

1. Click "Employees" in sidebar
2. Click "+ Add Employee" button
3. Fill in the form:
   - First Name
   - Last Name
   - Employee ID
   - Department
   - Designation
   - Joining Date
4. Click "Add Employee"
5. Success notification appears!

### Requesting Leave

1. Click "Leave" in sidebar
2. Click "+ Request Leave" button
3. Select leave type (Casual/Earned/Sick)
4. Choose From and To dates
5. Enter reason
6. Click "Submit Request"

### Creating a Job Posting

1. Click "Recruitment" in sidebar
2. Click "+ New Job Posting" button
3. Fill in details:
   - Job Title
   - Description
   - Location
   - Salary Range
4. Click "Post Job"

### Viewing Candidates

1. Click "Recruitment" in sidebar
2. Go to "Candidates" tab
3. See all applicants with status
4. Click on candidate for more details

### Checking Dashboard

1. Click "Dashboard" in sidebar
2. View 6 KPI cards with key metrics
3. See headcount chart by department
4. Check salary distribution
5. All data updates in real-time

---

## 📱 Using on Mobile

The system is fully responsive:
- Sidebar collapses on small screens
- Touch-friendly buttons
- Readable on all devices
- Fast loading times

---

## ⚙️ System Requirements

- **Node.js**: v14 or higher
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)
- **RAM**: 512MB minimum
- **Disk Space**: 100MB
- **Internet**: Not required for local use

---

## 🔐 Security Notes

- All passwords are hashed with bcrypt
- Tokens expire after 8 hours
- Use HTTPS in production
- Change default passwords
- Use strong passwords

---

## 🐛 If Something Goes Wrong

### Server won't start
```bash
# Check if port is in use
# Try a different port:
PORT=3001 npm start
```

### Database issues
```bash
# Reseed the database
npm run seed
```

### Can't login
```bash
# Check email spelling
# Use exact credentials from list above
# Clear browser cookies/cache
```

### Slow loading
```bash
# Clear browser cache
# Restart server
# Check internet connection
```

---

## 💡 Tips & Tricks

1. **Dashboard**: Pin important metrics
2. **Search**: Use search bars to filter data
3. **Filters**: Department filter on employee page
4. **Charts**: Hover over charts to see details
5. **Forms**: Tab key to move between fields
6. **Mobile**: Rotate to landscape for better view
7. **History**: Check logs for audit trail
8. **Reports**: Export reports to PDF/Excel

---

## 📖 Full Documentation

See **README.md** for:
- Complete API documentation
- Database schema details
- Developer setup
- Architecture overview
- Contributing guidelines

---

## 🎯 Next Steps

1. ✅ Explore each module
2. ✅ Add sample data
3. ✅ Try different user roles
4. ✅ Generate reports
5. ✅ Customize colors (edit styles.css)
6. ✅ Add your own data
7. ✅ Deploy to production

---

## 📞 Support

- Check README.md for full documentation
- Review API endpoints in server.js
- Check app.js for frontend logic
- View schema.sql for database structure

---

**Happy HRMS-ing! 🎉**
