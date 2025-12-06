# Employee Management System - Full Authentication & Approval Workflow

A comprehensive employee management platform with role-based access control, real-time messaging, notification system, and approval workflows for flag/termination requests.

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

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18+
- PostgreSQL database
- npm or yarn

### **Backend Setup**

```bash
cd backend-node

# Install dependencies
npm install

# Configure environment variables
# Create .env file with:
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=4000

# Push database schema
npx prisma db push

# Seed initial data (creates director, manager, employee users)
npx prisma db seed

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Start server
npm start
```

### **Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint
# Update GRAPHQL_URL in src/lib/graphqlClient.ts

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔐 Default Credentials

After running the seed script, use these credentials to log in:

| Role | Email | Password |
|------|-------|----------|
| **Director** | director@example.com | director123 |
| **Manager** | manager@example.com | manager123 |
| **Employee** | employee@example.com | employee123 |

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

## 🎯 Key Accomplishments

### **Interview-Ready Features**
✅ Enterprise-level role-based access control
✅ Complete approval workflow with audit trail
✅ Real-time notification system
✅ WhatsApp-like messaging interface
✅ Comprehensive permission validation
✅ Professional UI/UX with gradients and animations
✅ Type-safe TypeScript throughout
✅ GraphQL API with nested resolvers
✅ Database relationships and constraints
✅ JWT authentication with refresh tokens
✅ Containerized deployment (Docker)
✅ Auto-deployment pipelines (Render + Vercel)

### **Business Logic**
✅ Hierarchical communication rules enforced
✅ Mandatory minimum character counts for reasons
✅ Visibility controls for sensitive information
✅ Status flow enforcement (ACTIVE → UNDER_REVIEW → FLAGGED/TERMINATED)
✅ System messages for audit trail
✅ Notification cascades on state changes
✅ Permission-based resolver guards

### **Code Quality**
✅ Clean architecture with separation of concerns
✅ Reusable components and utilities
✅ Type safety with TypeScript
✅ Error handling and validation
✅ Consistent coding style
✅ Modular file structure
✅ Environment-based configuration

## 📞 Support

For issues or questions, contact the development team or create an issue in the repository.

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ using React, TypeScript, GraphQL, and PostgreSQL**
