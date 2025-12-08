# 🏢 Employee Management System

<div align="center">

### 🚀 Complete Enterprise HR Platform with Role-Based Access Control

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge&logo=vercel)](https://employee-poc-full-auth.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![GraphQL](https://img.shields.io/badge/GraphQL-API-E10098?style=for-the-badge&logo=graphql)](https://graphql.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

**🌟 Full-stack application with authentication, messaging, notifications & approval workflows**

[🎯 Live Demo](https://employee-poc-full-auth.vercel.app) • [📖 Documentation](#-what-is-this) • [🔐 Test Accounts](#-try-it-out---test-accounts) • [🛠️ Setup Guide](#-running-locally-step-by-step)

</div>

---

## 🌐 **Live Demo - Try It Now!**

### **🎯 Frontend App (Live & Ready):** 
```
🔗 https://employee-poc-full-auth.vercel.app
```

### **👉 [CLICK HERE TO OPEN THE APP](https://employee-poc-full-auth.vercel.app)** 👈

> ✨ No installation needed! Works instantly on any device - Desktop, Tablet, or Mobile

### **Quick Access Test Accounts:**

| Role | Login Link | Email | Password |
|------|------------|-------|----------|
| 👑 **Director** | [Open as Director](https://employee-poc-full-auth.vercel.app) | director@example.com | director123 |
| 👔 **Manager** | [Open as Manager](https://employee-poc-full-auth.vercel.app) | manager@example.com | manager123 |
| 👤 **Employee** | [Open as Employee](https://employee-poc-full-auth.vercel.app) | employee@example.com | employee123 |

**📱 Works on Desktop, Tablet & Mobile!**

---

## 🎯 What is This?

Think of this as a complete HR management system that handles everything from employee data to leave requests. It's like having three different apps in one:
- **Directors** get the bird's-eye view of the entire company
- **Managers** focus on their team's performance and approvals  
- **Employees** can manage their profile, request leaves, and stay connected

The best part? Everyone sees a different dashboard based on their role, but the UI looks consistent and professional across all levels!

---

## 🔐 Try It Out - Test Accounts

Want to explore the app? Here are ready-to-use test accounts for each role:

### 👑 **Director Account** (Full Admin Access)
```
Email: director@example.com
Password: director123
```
**What you can do:**
- ✅ See **all employees** across the company (except other directors)
- ✅ Approve or reject manager's flag/termination requests
- ✅ Access all reports, logs, and analytics
- ✅ Send messages to anyone in the organization
- ✅ View leave requests (but **can't approve** - that's manager's job)
- ✅ Generate employee logins for new hires

**Dashboard Shows:**
- Total employees, active/inactive counts
- Company-wide attendance average
- Department breakdowns with charts
- Flagged & terminated employees list
- Recent system activity feed

---

### 👔 **Manager Account** (Team Lead)
```
Email: manager@example.com
Password: manager123
```
**What you can do:**
- ✅ View and manage **your team members only** (employees assigned to you)
- ✅ Flag employees or request terminations (needs director approval)
- ✅ **Approve/reject team leave requests** (this is your main power!)
- ✅ Send messages to your team and directors
- ❌ Can't see other managers or directors
- ❌ Can't see your own name in the employee list

**Dashboard Shows:**
- Your team size and attendance
- At-risk team members (low attendance)
- Pending leave approvals (with approve/reject buttons)
- Upcoming team leaves
- Team activity timeline

---

### 👤 **Employee Account** (Standard User)
```
Email: employee@example.com
Password: employee123
```
**What you can do:**
- ✅ View your profile and attendance percentage
- ✅ See your **team members** (people with the same manager as you)
- ✅ Request time off from your manager
- ✅ Update your personal information
- ✅ Send messages to your manager
- ❌ Can't see managers or directors
- ❌ Can't see yourself in the team list

**Dashboard Shows:**
- Personal welcome card with your info
- Your attendance percentage
- Leave balance and next approved leave
- Activity timeline (your profile updates, leave status)
- Quick actions to request leave

---

### 🔄 **Quick Test Flow** (Try This!)

**Scenario: Employee requests leave, Manager approves it**

1. **Log in as Employee** (employee@example.com / employee123)
   - Click "Leave Requests" in the menu
   - Click "+ New Leave Request"
   - Fill in: Reason, Start Date, End Date → Submit
   - ✅ You'll see "Leave request submitted successfully!"

2. **Log out** → **Log in as Manager** (manager@example.com / manager123)
   - You'll see a badge on "Leave Requests" menu
   - Open "Leave Requests" → See the pending request
   - Click "✓ Approve" → Add optional note → Approve
   - ✅ Status changes to "Approved"!

3. **Log out** → **Log in as Director** (director@example.com / director123)
   - Open "Leave Requests"
   - You'll see the approved leave with "👁️ View Only" badge
   - Click it to see details (but can't change anything)
   - ✅ This is by design - managers handle leave approvals!

4. **Bonus:** Log back in as Employee
   - Check your dashboard → See "Next Approved Leave" updated!
   - ✅ Full circle completed!

---

## 🚀 Features

### **Authentication & Authorization**
- **JWT-based authentication** with access and refresh tokens
- **3-tier role system**: Director, Manager, Employee
- **Role-specific dashboards** with tailored metrics and widgets
- **Secure password hashing** with bcryptjs
- Login/Register/Forgot Password flows

### **Role-Based Permissions**

#### 👑 **Director (Supreme Admin)**
- Full access to all system features
- View and manage all employees across the organization
- Approve/Reject flag and termination requests from managers
- Access to:
  - User management
  - Access logs
  - Employee login generation
  - Review requests dashboard
  - All reports and analytics
  - Complete messaging system access

#### 👔 **Manager**
- Manage team members (view, add, edit, flag)
- Create flag/terminate requests with mandatory reasons
- View and approve team leave requests
- Send notes and messages to team
- Dashboard with team metrics:
  - Team size and attendance
  - At-risk team members
  - Pending approvals

#### 👤 **Employee**
- Personal dashboard with activity timeline
- View own profile and attendance
- Request time off
- Edit personal information
- Receive messages and notifications
- Leave balance tracking

### **Employee Management**
- **Grid & Tile view** options for employee listings
- **Advanced filtering**: Search by name, status, role, department
- **Sorting**: Name, age, attendance, creation date
- **Pagination** with configurable page sizes
- **Quick actions**: Add, edit, flag, terminate, delete employees
- **Status tracking**: Active, Under Review, Flagged, Termination Requested, Terminated
- **Auto-generate employee logins** from existing records

### **Messaging & Communication System**

#### 📬 **WhatsApp-like Messaging Interface**
- Direct messaging between users
- Conversation threading with message history
- Read receipts (✓✓ indicator)
- Unread message badges
- Real-time updates (30-second polling)
- Hierarchical messaging rules:
  - Employees → Managers only
  - Managers → Directors and Employees
  - Directors → Everyone
- Broadcast messaging to entire roles (Directors/Managers)

#### 🔔 **Notification System**
- Bell icon in header with unread count badge
- Dropdown panel with color-coded notifications:
  - 🔴 **CRITICAL** - Terminations, urgent alerts
  - ⚠️ **WARNING** - Flag requests, important updates
  - ✅ **APPROVAL** - Request decisions, approvals
  - 💬 **MESSAGE** - New messages, thread updates
  - ℹ️ **INFO** - General information
- Click-to-navigate to relevant pages
- Mark as read functionality
- Auto-polling every 30 seconds

#### 💬 **Discussion Threads**
- Dedicated threads for review requests
- System messages for audit trail
- Multi-participant conversations
- Linked to employees and review requests

### **Flag / Terminate Approval Workflow**

#### Step 1: Manager Request
- Manager selects employee → "Flag" or "Request Termination"
- **Mandatory fields**:
  - Reason type: Performance, Behaviour, Attendance, Policy Violation, Other
  - Reason details: Minimum 20 characters
  - Visibility toggle: Share with employee (yes/no)
- **Automatic actions**:
  - Employee status updates (UNDER_REVIEW or TERMINATION_REQUESTED)
  - Review request created with PENDING status
  - Discussion thread created
  - Notification sent to all Directors
  - Optional notification to employee (if visible)
  - System message posted to thread

#### Step 2: Director Review
- Director receives notification → navigates to Review Requests page
- Review modal shows:
  - Employee mini-profile (name, email, status, attendance)
  - Manager's full reason (type + details)
  - Request history
  - Decision options: Approve / Reject
  - Admin comment field (minimum 10 characters, required)
- **On Approve**:
  - Employee status → FLAGGED or TERMINATED
  - Request status → APPROVED
  - System message in thread
  - Manager notified (APPROVAL type)
  - Employee notified if visible (CRITICAL type)
- **On Reject**:
  - Employee status → ACTIVE (reverted)
  - Request status → REJECTED
  - System message in thread
  - Manager notified (APPROVAL type)
  - Employee notified if visible (INFO type)

### **Leave Management**
- Employees submit leave requests with reason and date range
- Directors/Managers approve or reject requests
- Status tracking: Pending, Approved, Rejected
- Admin notes for decision justification
- Dashboard widgets showing upcoming leaves and pending approvals

### **Dashboard Analytics**

#### Director Dashboard
- Total employees count
- Active/Inactive ratio
- New hires this month
- Average attendance percentage
- On leave today count
- Employees by department (bar chart)
- Recently changed records timeline
- Flagged employees panel with review buttons
- Quick actions: Add Employee, Manage Roles, Generate Reports

#### Manager Dashboard
- My team size (filtered by managerId)
- Team attendance percentage
- Upcoming leaves (next 7 days)
- Pending approvals count
- At-risk attendance list (<75% attendance, color-coded)
- Pending approvals panel with Approve/Reject buttons
- Quick actions: Approve Leaves, View Team, Flag Member

#### Employee Dashboard
- Personal welcome card with avatar and role
- Leave balance remaining
- Personal attendance percentage
- Next approved leave
- Activity timeline (profile updates, leave approvals, messages)
- Quick actions: Request Leave, Update Profile, View Attendance

### **Reports & Analytics**
- Generate custom reports
- Access logs with user activity tracking
- Employee performance metrics
- Attendance tracking

### **Additional Features**
- **Preferences**: Theme (Light/Dark/Auto), Language (20+ languages), Timezone settings
- **Settings**: System configuration
- **Profile Management**: View and edit personal information
- **Access Logs**: Track all user actions with timestamps
- **Employee Logins**: Auto-generate login credentials for employees

## 🛠️ Tech Stack

### **Backend**
- **Runtime**: Node.js 18 (Alpine)
- **Framework**: Express.js 4.18.2
- **GraphQL**: Apollo Server 3.13.0
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL (Render hosted)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4.21
- **GraphQL Client**: Custom fetch-based client
- **Styling**: Inline CSS with gradient themes
- **Deployment**: Vercel (auto-deploy on push)

## 🛠️ Running Locally (Step-by-Step)

### **What You'll Need**
- Node.js 18 or higher ([Download here](https://nodejs.org/))
- PostgreSQL database ([Get free one at Render.com](https://render.com/))
- A code editor (VS Code recommended)
- 10 minutes of your time ☕

### **Step 1: Get the Code**
```bash
git clone https://github.com/YourUsername/employee-poc-full-auth.git
cd employee-poc-full-auth
```

### **Step 2: Set Up the Backend (Server)**

Open a terminal and run:

```bash
# Go to backend folder
cd backend-node

# Install all the packages (this takes ~2 minutes)
npm install

# Create your environment file
# Copy this and save as .env in backend-node folder:
```

Create a file called `.env` in the `backend-node` folder with this content:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_ACCESS_SECRET="your-super-secret-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this"
PORT=4000
```

> 💡 **Don't have a database?** Go to [Render.com](https://render.com/) → Create Free PostgreSQL → Copy the "External Database URL" → Paste it as DATABASE_URL

```bash
# Set up the database tables
npx prisma db push

# Create test accounts (director, manager, employee)
npx prisma db seed

# Generate database client
npx prisma generate

# Start the server (runs on http://localhost:4000)
npm run dev
```

✅ **You should see:** `🚀 GraphQL Server ready at http://localhost:4000/graphql`

### **Step 3: Set Up the Frontend (Website)**

Open a **NEW terminal** (keep the backend running!) and run:

```bash
# Go to frontend folder (from project root)
cd frontend

# Install packages
npm install

# Start the app (runs on http://localhost:5173)
npm run dev
```

✅ **You should see:** `Local: http://localhost:5173/`

### **Step 4: Open and Login!**

1. Open your browser to **http://localhost:5173**
2. You'll see the login page
3. Use one of these accounts to try different roles:

| **Role** | **Email** | **Password** | **What You'll See** |
|----------|-----------|--------------|---------------------|
| 👑 **Director** | director@example.com | director123 | Full company view, all employees, approval requests |
| 👔 **Manager** | manager@example.com | manager123 | Your team only, leave approvals, flag employees |
| 👤 **Employee** | employee@example.com | employee123 | Your profile, team members, request leaves |

### **Step 5: Test the Features**

Here's a fun flow to test everything:

1. **Log in as Employee** → Click "Leave Requests" → Submit a leave request
2. **Log out** → **Log in as Manager** → See the pending leave → Approve it
3. **Log out** → **Log in as Director** → View all company data and reports

---

## 🌐 For Recruiters & Reviewers (No Installation!)

**Don't want to set up locally? No problem!**

Just visit the live app and try it out:

### **🔗 Live Application URL:**
```
https://employee-poc-full-auth.vercel.app
```

### **🎭 Test Each Role:**

**🔵 Director Access (Full Admin):**
```
Email: director@example.com
Password: director123
What to check: View all employees, see reports, access review requests
```

**🟢 Manager Access (Team Lead):**
```
Email: manager@example.com
Password: manager123
What to check: View your team, approve leaves, flag employees
```

**🟡 Employee Access (Standard User):**
```
Email: employee@example.com
Password: employee123
What to check: Request leave, view team members, update profile
```

### **⚡ Quick Demo Flow (2 minutes):**
1. Open app → Login as **Employee** → Submit a leave request
2. Logout → Login as **Manager** → Approve that leave
3. Logout → Login as **Director** → See all company data
4. ✅ You've now tested the complete workflow!

> 💡 **Tip:** Open in incognito/private window to test multiple roles side-by-side!

## 📊 Database Schema

### **Core Models**
- `User` - Authentication and user accounts
- `Employee` - Employee records and details
- `RefreshToken` - JWT refresh token management
- `Note` - Internal notes and messages
- `Message` - WhatsApp-like messaging system
- `Notification` - Push-style notification alerts
- `Thread` - Discussion threads for collaboration
- `ThreadMessage` - Individual messages in threads
- `ReviewRequest` - Flag/terminate approval workflow
- `LeaveRequest` - Time-off request management
- `AccessLog` - User activity audit trail

### **Key Relationships**
- Employee → User (optional, for login access)
- Employee → Employee (managerId for hierarchy)
- ReviewRequest → Employee (which employee is under review)
- Thread → ReviewRequest (discussion linked to request)
- ThreadMessage → Thread (messages in discussion)
- Notification → User (recipient)
- Message → User (sender and recipient)

## 🎨 UI/UX Highlights

### **Design System**
- Gradient purple theme (#667eea → #764ba2)
- Clean, modern card-based layouts
- Responsive design with mobile support
- Smooth transitions and hover effects
- Color-coded status indicators

### **Navigation**
- Horizontal navigation bar with gradient
- Hamburger drawer menu (320px width)
- Role-specific menu items
- Portal titles: 🏢 Director Portal, 👔 Manager Portal, 👤 Employee Portal
- Notification bell with real-time badge
- User profile dropdown with logout

### **Interaction Patterns**
- Modal dialogs for forms and confirmations
- Toast-style notifications
- Auto-scroll in message threads
- Relative time formatting ("Just now", "5m ago", "2h ago")
- Pagination with customizable page size
- Sortable tables with filter options

## 🔄 Workflows

### **Employee Lifecycle**
1. Director/Manager adds new employee
2. Optional: Generate login credentials
3. Employee status: ACTIVE
4. Manager can flag for review (status → UNDER_REVIEW)
5. Director reviews and approves/rejects
6. If approved: FLAGGED or TERMINATED
7. If rejected: Back to ACTIVE

### **Communication Flow**
1. User composes message (direct or broadcast)
2. Permission check (hierarchical rules)
3. Message created with conversation ID
4. Notification sent to recipient(s)
5. Recipient sees bell badge → clicks → reads message
6. Read receipt updated (✓✓)
7. Reply continues thread

### **Leave Request Process**
1. Employee submits leave request
2. Manager/Director sees in dashboard
3. Approve with optional note OR Reject with reason
4. Employee notified of decision
5. Dashboard updates (upcoming leaves, leave balance)

## 🚀 Deployment

### **Backend (Render)**
- Dockerfile included for containerized deployment
- Auto-deploy on git push to main branch
- Environment variables configured in Render dashboard
- Database migrations run automatically

### **Frontend (Vercel)**
- Auto-deploy on git push to main branch
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables in Vercel project settings

## 📝 API Documentation

### **GraphQL Queries**
- `employees(filter, page, pageSize, sortBy, sortOrder)` - Paginated employee list
- `employee(id)` - Single employee details
- `myMessages` - User's message inbox
- `myConversations` - Active conversations with unread counts
- `notifications` - User's notifications
- `reviewRequests(status)` - Flag/terminate requests
- `leaveRequests(status)` - Time-off requests
- `accessLogs` - Activity audit trail
- `allUsers` - All system users

### **GraphQL Mutations**
- `addEmployee(input)` - Create employee
- `updateEmployee(id, input)` - Update employee
- `deleteEmployee(id)` - Remove employee
- `flagEmployee(id, flagged)` - Toggle flag status
- `sendMessage(input)` - Send direct or broadcast message
- `createNotification(input)` - Create alert notification
- `createReviewRequest(input)` - Start flag/terminate workflow
- `reviewDecision(input)` - Approve/reject review request
- `sendThreadMessage(input)` - Post to discussion thread
- `createLeaveRequest(input)` - Submit time-off request
- `updateLeaveRequestStatus(id, status, adminNote)` - Approve/reject leave
- `generateEmployeeLogins` - Auto-create user accounts

## 🎯 What Makes This Special?

### **Real-World Enterprise Features**
✅ **Smart Role System** - Three levels (Director → Manager → Employee) with different views  
✅ **Approval Workflows** - Flag/terminate requests go through proper approval chain  
✅ **Real-Time Updates** - Notifications and messages update every 30 seconds  
✅ **Security First** - JWT tokens, password hashing, role-based access everywhere  
✅ **Beautiful UI** - Consistent purple gradient theme, smooth animations  
✅ **Data Privacy** - Employees only see their team, managers don't see themselves in lists  

### **Technical Highlights**
✅ **Full-Stack TypeScript** - Type safety from database to UI  
✅ **GraphQL API** - Flexible queries, no over-fetching  
✅ **PostgreSQL + Prisma** - Robust database with relationships  
✅ **React 18 + Vite** - Fast development and builds  
✅ **Production Ready** - Deployed on Render (backend) + Vercel (frontend)  

### **User Experience**
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Smart Filtering** - Employees don't see directors, managers don't see their own name  
✅ **Time-Based Greetings** - "Good Morning John!" changes based on time of day  
✅ **Activity Feed** - Real-time timeline of all system events  
✅ **Leave Management** - Employees request → Managers approve (directors just view)  

---

## 📤 Share This App

Want to show this to your team, recruiter, or friends? Just share this link:

```
🔗 https://employee-poc-full-auth.vercel.app
```

**Quick Copy-Paste for Email/Message:**
```
Check out this Employee Management System I built!

Live App: https://employee-poc-full-auth.vercel.app

Test it with these accounts:
👑 Director: director@example.com / director123
👔 Manager: manager@example.com / manager123
👤 Employee: employee@example.com / employee123

Features: Role-based dashboards, leave management, real-time messaging, 
approval workflows, and more!

Tech Stack: React + TypeScript + GraphQL + PostgreSQL
```

---

## 🐛 Troubleshooting

### "Not authenticated" error when submitting leave request
**Solution:** Log out and log back in. This refreshes your authentication token.

### Backend won't start (for local setup)
**Check:**
1. Is PostgreSQL running?
2. Is your `.env` file in the `backend-node` folder?
3. Is the DATABASE_URL correct?
4. Did you run `npx prisma db push`?

### Frontend won't connect to backend (local)
**Check:**
1. Is the backend running on port 4000?
2. Check `frontend/src/lib/graphqlClient.ts` - should point to `http://localhost:4000/graphql`
3. Check browser console for errors (F12)

### Port already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :4000  # Find process using port 4000
taskkill /PID <process_id> /F  # Kill that process

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

### Live site not loading?
**Check:**
- Try clearing browser cache (Ctrl+F5)
- Check if backend is running on Render
- Open browser console (F12) for any errors

---

## 🌟 Deployment Info

### **Frontend (Vercel)**
- ✅ **Live URL:** https://employee-poc-full-auth.vercel.app
- 🔄 **Auto-deploys:** Every git push to main branch
- ⚡ **CDN:** Global edge network for fast loading worldwide
- 📱 **Mobile Optimized:** Responsive design works on all devices

### **Backend (Render)**
- 🔗 **GraphQL API:** Running on Render cloud platform
- 🗄️ **Database:** PostgreSQL on Render
- 🔐 **Secure:** HTTPS, JWT authentication, environment variables
- 🚀 **Always On:** Production-ready deployment

---

## 📞 Questions or Contact

- 📧 **Email:** your-email@example.com
- 💼 **LinkedIn:** [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)
- 💻 **GitHub:** [View Source Code](https://github.com/Anilkumarputta/employee-poc-full-auth)
- 💬 **Issues:** [Report a Bug](https://github.com/Anilkumarputta/employee-poc-full-auth/issues)

---

## 📄 License

This is a portfolio project. Feel free to explore the code and learn from it!

---

<div align="center">

**Built with ❤️ using React, TypeScript, GraphQL, and PostgreSQL**

### ⭐ If you like this project, give it a star on GitHub!

[![Live Demo](https://img.shields.io/badge/🚀-Try%20Live%20Demo-success?style=for-the-badge)](https://employee-poc-full-auth.vercel.app)

*Last Updated: December 2025*

</div>
