# 📚 Complete Code Guide - Easy to Understand

This guide explains every part of the codebase in simple, human-friendly language. Perfect for understanding how everything works!

---

## 🗂️ Project Structure

```
employee-poc-full-auth/
├── backend-node/           # Backend server (Node.js + GraphQL + PostgreSQL)
│   ├── prisma/            # Database schema and migrations
│   ├── src/               # Source code
│   │   ├── index.ts       # Main server file - where everything starts
│   │   ├── schema.ts      # GraphQL schema - defines API structure
│   │   ├── resolvers.ts   # GraphQL resolvers - the actual logic
│   │   └── routes/        # REST API routes (login, register)
│   └── Dockerfile         # For deploying to Render
│
└── frontend/              # Frontend app (React + TypeScript)
    ├── src/
    │   ├── main.tsx       # Entry point - renders App
    │   ├── App.tsx        # Main app component - routing logic
    │   ├── auth/          # Login, Register, Forgot Password pages
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # All the main pages (Dashboard, Employees, etc.)
    │   └── lib/           # Utility functions and GraphQL client
    └── index.html         # HTML template
```

---

## 🔐 How Authentication Works

### Step 1: Login Process

```
User fills login form → POST /auth/login → Backend checks email/password
→ If correct: Generate JWT tokens → Return tokens to frontend
→ Frontend stores tokens in localStorage → User is logged in!
```

**Why two tokens?**
- **Access Token** (15 minutes): Short-lived, used for every API request
- **Refresh Token** (7 days): Long-lived, used to get new access tokens when they expire

### Step 2: Making Authenticated Requests

```
Frontend makes GraphQL request → Includes "Authorization: Bearer [access_token]"
→ Backend verifies token → Extracts user ID and role → Allows/denies access
```

### Step 3: Token Refresh (When Access Token Expires)

```
Access token expires after 15 min → API returns 401 error
→ Frontend automatically calls /auth/refresh with refresh token
→ Gets new access token → Retries original request
```

### Security Features
- **Passwords are hashed** with bcrypt (never stored in plain text)
- **JWT tokens are signed** (can't be tampered with)
- **Role-based permissions** (Director > Manager > Employee)
- **Refresh tokens can be revoked** (logout invalidates them)

---

## 🗄️ Database Schema Explained

### Core Tables

#### **User** - Login accounts
```
User {
  id: Unique number for each user
  email: Login email (must be unique)
  passwordHash: Encrypted password (never the real password!)
  role: "director" | "manager" | "employee"
  provider: "local" (email/password) or "google" (Google login)
}
```

#### **Employee** - Employee records
```
Employee {
  id: Unique number
  name: Full name
  email: Work email
  userId: Links to User table (optional - some employees don't have logins)
  age, className, subjects, attendance, role, status, location, lastLogin
  flagged: Boolean - true if employee is flagged
  managerId: Links to another Employee (their manager)
}
```

#### **Message** - WhatsApp-like messaging
```
Message {
  id: Unique number
  conversationId: Groups messages in a thread ("dm_1_5" means user 1 & 5)
  senderId: Who sent it
  recipientId: Who receives it (null = broadcast to role)
  message: The actual message text
  isRead: Boolean - has recipient seen it?
  createdAt: Timestamp
}
```

#### **Notification** - Alert system
```
Notification {
  id: Unique number
  userId: Who gets this notification
  title: "New message from director@example.com"
  message: Message preview
  type: "INFO" | "WARNING" | "CRITICAL" | "MESSAGE" | "APPROVAL"
  linkTo: Where to navigate when clicked ("/messages")
  isRead: Boolean
}
```

#### **ReviewRequest** - Flag/Terminate workflow
```
ReviewRequest {
  id: Unique number
  employeeId: Which employee is being reviewed
  requestedByManagerId: Which manager created the request
  type: "FLAG" | "TERMINATE"
  status: "PENDING" | "APPROVED" | "REJECTED"
  managerReasonType: "Performance" | "Behaviour" | "Attendance" | etc.
  managerReasonText: Detailed explanation (min 20 characters)
  visibleToEmployee: Boolean - can employee see this?
  adminComment: Director's decision notes (min 10 characters)
  reviewedByAdminId: Which director reviewed it
  threadId: Links to discussion thread
}
```

#### **Thread** & **ThreadMessage** - Discussion system
```
Thread {
  id: Unique number
  participants: Array of user IDs [1, 5, 8]
  linkedEmployeeId: Related to which employee
  linkedRequestId: Related to which review request
  title: "FLAG Request: John Smith"
}

ThreadMessage {
  id: Unique number
  threadId: Which thread this belongs to
  senderId: Who posted (0 = system message)
  body: Message content
  type: "USER" (from person) or "SYSTEM" (automated)
}
```

#### **LeaveRequest** - Time-off requests
```
LeaveRequest {
  id: Unique number
  employeeId: Who is requesting leave
  reason: Why they need leave
  startDate, endDate: Leave period
  status: "pending" | "approved" | "rejected"
  adminNote: Director/Manager's comment on decision
}
```

#### **RefreshToken** - Track valid refresh tokens
```
RefreshToken {
  token: The actual refresh token string
  userId: Who owns this token
  expiresAt: When it expires (7 days)
  revoked: Boolean - set to true on logout
}
```

---

## 🔧 Backend Deep Dive

### File: `backend-node/src/index.ts` - Server Entry Point

**What it does:** Starts the entire backend server

**Key parts:**

1. **Environment Setup**
```typescript
import "dotenv/config";  // Load .env variables (DATABASE_URL, JWT secrets)
const prisma = new PrismaClient();  // Connect to PostgreSQL
```

2. **CORS Configuration**
```typescript
app.use(cors({
  origin: [FRONTEND_URL],  // Only allow our frontend to make requests
  credentials: true,
}));
```

3. **REST Auth Routes**
```typescript
app.use("/auth", authRouter);  // /auth/login, /auth/register, etc.
```

4. **GraphQL Context**
```typescript
context: async ({ req }) => {
  // Extract JWT token from Authorization header
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  // Verify token and get user
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  
  // Return context - available in all resolvers
  return { prisma, user };
}
```

This means every GraphQL query/mutation can access the database (`prisma`) and knows who the user is (`user`).

### File: `backend-node/src/routes/auth.ts` - Authentication

**What it does:** Handles login, register, logout, password reset

**Key endpoints:**

1. **POST /auth/register**
```typescript
// Create new user account
1. Check if email already exists
2. Hash password with bcrypt.hash(password, 10)
3. Create user in database
4. Generate access & refresh tokens
5. Store refresh token
6. Return user + tokens
```

2. **POST /auth/login**
```typescript
// Login existing user
1. Find user by email
2. Compare password with hash using bcrypt.compare()
3. If match, generate new tokens
4. Store refresh token
5. Return user + tokens
```

3. **POST /auth/refresh**
```typescript
// Get new access token when old one expires
1. Verify refresh token
2. Check if revoked
3. Generate new access token
4. Return new access token
```

4. **POST /auth/logout**
```typescript
// Logout user
1. Mark refresh token as revoked in database
2. Frontend deletes tokens from localStorage
```

**Security Notes:**
- Passwords are NEVER stored in plain text - always hashed with bcrypt
- JWT tokens are signed - tampering is detected
- Refresh tokens can be revoked (logout = revoke token)

### File: `backend-node/src/schema.ts` - GraphQL API Structure

**What it does:** Defines what queries and mutations are available

**Think of it as a menu:**
- Queries = Read-only operations (GET)
- Mutations = Modify data (POST/PUT/DELETE)

**Key types:**

```graphql
type Employee {
  id: Int!
  name: String!
  email: String
  age: Int!
  role: String!
  status: String!  # "active", "terminated", "flagged", etc.
  flagged: Boolean!
  managerId: Int  # Their manager's employee ID
}
```

**Key queries:**

```graphql
type Query {
  # Get paginated employees with filtering and sorting
  employees(filter: EmployeeFilter, page: Int, pageSize: Int): EmployeesPage!
  
  # Get single employee
  employee(id: Int!): Employee
  
  # Get my own profile
  myProfile: Employee
  
  # Get my messages
  myMessages: [Message!]!
  
  # Get notifications
  notifications: [Notification!]!
  
  # Director: Get all review requests
  reviewRequests(status: String): [ReviewRequest!]!
}
```

**Key mutations:**

```graphql
type Mutation {
  # Employee CRUD
  addEmployee(input: EmployeeInput!): Employee!
  updateEmployee(id: Int!, input: EmployeeInput!): Employee!
  deleteEmployee(id: Int!): Boolean!
  flagEmployee(id: Int!, flagged: Boolean!): Employee!
  
  # Messaging
  sendMessage(input: SendMessageInput!): Message!
  
  # Notifications
  createNotification(input: CreateNotificationInput!): Notification!
  
  # Review workflow
  createReviewRequest(input: CreateReviewRequestInput!): ReviewRequest!
  reviewDecision(input: ReviewDecisionInput!): ReviewRequest!
  
  # Leave requests
  createLeaveRequest(input: LeaveRequestInput!): LeaveRequest!
  updateLeaveRequestStatus(id: Int!, status: String!): LeaveRequest!
}
```

### File: `backend-node/src/resolvers.ts` - Business Logic

**What it does:** Contains the actual functions that execute queries/mutations

**Permission Guards:**

```typescript
// Must be logged in
function requireAuth(ctx: Context) {
  if (!ctx.user) throw new Error("Not authenticated");
}

// Must be Director (supreme admin)
function requireDirector(ctx: Context) {
  requireAuth(ctx);
  if (ctx.user.role !== "director") throw new Error("Director only");
}

// Must be Manager or Director
function requireManagerOrAbove(ctx: Context) {
  requireAuth(ctx);
  if (!["director", "manager"].includes(ctx.user.role)) {
    throw new Error("Manager or Director required");
  }
}
```

**Example Query Resolver:**

```typescript
employees: async (_: any, args: any, ctx: Context) => {
  requireAuth(ctx);  // Must be logged in
  
  const { filter, page = 1, pageSize = 10 } = args;
  
  // Build WHERE clause from filter
  const where: any = {};
  if (filter?.nameContains) {
    where.name = { contains: filter.nameContains, mode: "insensitive" };
  }
  if (filter?.status) {
    where.status = filter.status;
  }
  
  // Fetch from database with pagination
  const [items, total] = await Promise.all([
    ctx.prisma.employee.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    ctx.prisma.employee.count({ where }),
  ]);
  
  return { items, total, page, pageSize };
}
```

**Example Mutation Resolver:**

```typescript
createReviewRequest: async (_: any, { input }: any, ctx: Context) => {
  requireManagerOrAbove(ctx);  // Must be Manager or Director
  
  // Validate reason length
  if (input.managerReasonText.length < 20) {
    throw new Error("Reason must be at least 20 characters");
  }
  
  // Update employee status
  await ctx.prisma.employee.update({
    where: { id: input.employeeId },
    data: {
      status: input.type === "FLAG" ? "UNDER_REVIEW" : "TERMINATION_REQUESTED"
    },
  });
  
  // Create review request
  const request = await ctx.prisma.reviewRequest.create({
    data: {
      employeeId: input.employeeId,
      requestedByManagerId: ctx.user.id,
      type: input.type,  // "FLAG" or "TERMINATE"
      status: "PENDING",
      managerReasonText: input.managerReasonText,
      visibleToEmployee: input.visibleToEmployee,
    },
  });
  
  // Notify all directors
  const directors = await ctx.prisma.user.findMany({
    where: { role: "director" },
  });
  
  for (const director of directors) {
    await ctx.prisma.notification.create({
      data: {
        userId: director.id,
        title: `${input.type} Request`,
        message: `Review needed for employee`,
        type: "APPROVAL",
        linkTo: `/review-requests/${request.id}`,
      },
    });
  }
  
  return request;
}
```

---

## 🎨 Frontend Deep Dive

### File: `frontend/src/main.tsx` - Entry Point

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Render the entire app into <div id="root"></div> in index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### File: `frontend/src/App.tsx` - Main Application

**What it does:** Manages authentication state and page routing

**Key state variables:**

```typescript
const [view, setView] = useState<View>("login");  // "login", "register", "forgot", or "app"
const [auth, setAuth] = useState({
  user: null,          // Current user object
  accessToken: null,   // JWT access token
  refreshToken: null,  // JWT refresh token
});
const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
```

**Auth flow:**

```typescript
const handleAuthChange = (data) => {
  setAuth(data);
  if (data.user && data.accessToken) {
    // User logged in successfully
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setCurrentPage("dashboard");  // Go to dashboard
    setView("app");
  } else {
    // User logged out
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setView("login");
  }
};
```

**Routing logic:**

```typescript
{view !== "app" ? (
  // Show auth pages (login, register, forgot password)
  <div className="auth-shell">
    {view === "login" && <LoginPage />}
    {view === "register" && <RegisterPage />}
    {view === "forgot" && <ForgotPasswordPage />}
  </div>
) : (
  // Show main app with navigation
  <div>
    <HorizontalNav currentPage={currentPage} onNavigate={setCurrentPage} />
    
    {/* Render current page */}
    {currentPage === "dashboard" && <DashboardPage />}
    {currentPage === "employees" && <EmployeesPage />}
    {currentPage === "messages" && <MessagesPage />}
    {currentPage === "review-requests" && <ReviewRequestsPage />}
    {/* etc... */}
  </div>
)}
```

### File: `frontend/src/auth/LoginPage.tsx` - Login Form

**What it does:** Handles user login

**Flow:**

```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // Call REST API
    const response = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Login successful - update auth context
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    } else {
      setError(data.error);
    }
  } catch (err) {
    setError('Network error');
  }
};
```

### File: `frontend/src/lib/graphqlClient.ts` - GraphQL Client

**What it does:** Handles all GraphQL requests with automatic token refresh

**Key function:**

```typescript
export async function graphqlRequest(query: string, variables?: any) {
  // Get token from localStorage
  let accessToken = localStorage.getItem('accessToken');
  
  // Make GraphQL request
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  const result = await response.json();
  
  // If token expired, refresh it and retry
  if (result.errors?.[0]?.message.includes('authenticated')) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call /auth/refresh
    const refreshResponse = await fetch('http://localhost:4000/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    const refreshData = await refreshResponse.json();
    
    if (refreshData.accessToken) {
      // Got new access token - retry original request
      localStorage.setItem('accessToken', refreshData.accessToken);
      return graphqlRequest(query, variables);  // Recursive retry
    }
  }
  
  return result;
}
```

### Component: `NotificationBell.tsx` - Real-time Notifications

**What it does:** Shows notification icon with badge in header

**Key features:**

```typescript
// Poll for unread count every 30 seconds
useEffect(() => {
  fetchNotificationCount();
  const interval = setInterval(fetchNotificationCount, 30000);
  return () => clearInterval(interval);
}, []);

// Fetch unread count
const fetchNotificationCount = async () => {
  const result = await graphqlRequest(`
    query {
      notificationCount
    }
  `);
  setUnreadCount(result.data.notificationCount);
};

// Mark as read and navigate
const handleNotificationClick = async (notification) => {
  // Mark as read
  await graphqlRequest(`
    mutation {
      markNotificationAsRead(id: ${notification.id})
    }
  `);
  
  // Navigate to relevant page
  if (notification.linkTo) {
    onNavigate(notification.linkTo);
  }
  
  setDropdownOpen(false);
};
```

**UI:**

```tsx
<div className="notification-bell">
  {/* Bell icon with badge */}
  <button onClick={() => setDropdownOpen(!dropdownOpen)}>
    🔔
    {unreadCount > 0 && (
      <span className="badge">{unreadCount}</span>
    )}
  </button>
  
  {/* Dropdown panel */}
  {dropdownOpen && (
    <div className="dropdown-panel">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`notification-item ${notif.type.toLowerCase()}`}
          onClick={() => handleNotificationClick(notif)}
        >
          <div className="icon">
            {notif.type === 'CRITICAL' && '🔴'}
            {notif.type === 'WARNING' && '⚠️'}
            {notif.type === 'APPROVAL' && '✅'}
            {notif.type === 'MESSAGE' && '💬'}
            {notif.type === 'INFO' && 'ℹ️'}
          </div>
          <div className="content">
            <div className="title">{notif.title}</div>
            <div className="message">{notif.message}</div>
            <div className="time">{formatTime(notif.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

### Page: `ReviewRequestsPage.tsx` - Approval Workflow

**What it does:** Directors review and approve/reject flag/terminate requests

**Fetching requests:**

```typescript
const fetchReviewRequests = async () => {
  const statusFilter = filter === 'ALL' ? null : filter;
  
  const result = await graphqlRequest(`
    query($status: String) {
      reviewRequests(status: $status) {
        id
        type
        status
        managerReasonType
        managerReasonText
        visibleToEmployee
        createdAt
        requestedByEmail
        employee {
          id
          name
          email
          status
          attendance
        }
      }
    }
  `, { status: statusFilter });
  
  setRequests(result.data.reviewRequests);
};
```

**Review modal:**

```tsx
<div className="decision-modal">
  {/* Employee info card */}
  <div className="employee-card">
    <h4>{selectedRequest.employee.name}</h4>
    <p>{selectedRequest.employee.email}</p>
    <p>Status: {selectedRequest.employee.status}</p>
    <p>Attendance: {selectedRequest.employee.attendance}%</p>
  </div>
  
  {/* Manager's reason */}
  <div className="reason-section">
    <h4>Manager's Reason</h4>
    <p><strong>Type:</strong> {selectedRequest.managerReasonType}</p>
    <p><strong>Details:</strong></p>
    <pre>{selectedRequest.managerReasonText}</pre>
    <p>
      {selectedRequest.visibleToEmployee 
        ? '✅ Employee can see this'
        : '❌ Hidden from employee'}
    </p>
  </div>
  
  {/* Decision buttons */}
  <div className="decision-buttons">
    <button
      className={decision === 'APPROVED' ? 'active-approve' : ''}
      onClick={() => setDecision('APPROVED')}
    >
      ✅ Approve
    </button>
    <button
      className={decision === 'REJECTED' ? 'active-reject' : ''}
      onClick={() => setDecision('REJECTED')}
    >
      ❌ Reject
    </button>
  </div>
  
  {/* Admin comment */}
  <textarea
    placeholder="Add your comment (minimum 10 characters)..."
    value={adminComment}
    onChange={(e) => setAdminComment(e.target.value)}
  />
  <div className="char-count">
    {adminComment.length} / 10 minimum
  </div>
  
  {/* Impact preview */}
  <div className="impact-box">
    <strong>Impact:</strong>
    {decision === 'APPROVED' && selectedRequest.type === 'FLAG' && (
      <p>Employee status will change to: <strong>FLAGGED</strong></p>
    )}
    {decision === 'APPROVED' && selectedRequest.type === 'TERMINATE' && (
      <p>Employee status will change to: <strong>TERMINATED</strong></p>
    )}
    {decision === 'REJECTED' && (
      <p>Employee status will revert to: <strong>ACTIVE</strong></p>
    )}
  </div>
  
  {/* Submit button */}
  <button
    onClick={handleSubmitDecision}
    disabled={!decision || adminComment.length < 10}
  >
    {submitting ? 'Submitting...' : 'Confirm Decision'}
  </button>
</div>
```

**Submit decision:**

```typescript
const handleSubmitDecision = async () => {
  if (!decision || adminComment.length < 10) return;
  
  setSubmitting(true);
  
  try {
    await graphqlRequest(`
      mutation($input: ReviewDecisionInput!) {
        reviewDecision(input: $input) {
          id
          status
        }
      }
    `, {
      input: {
        requestId: selectedRequest.id,
        decision: decision,  // "APPROVED" or "REJECTED"
        adminComment: adminComment,
      },
    });
    
    alert('Decision submitted successfully!');
    setShowModal(false);
    fetchReviewRequests();  // Refresh list
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    setSubmitting(false);
  }
};
```

---

## 🔄 Complete Workflows

### 1. Flag/Terminate Approval Workflow

**Step 1: Manager Creates Request**

```
Manager opens EmployeesPage
→ Clicks "Flag" or "Request Termination" on employee
→ Modal opens with form:
   - Reason Type: Dropdown (Performance, Behaviour, Attendance, Policy, Other)
   - Reason Details: Textarea (minimum 20 characters)
   - Visible to Employee: Checkbox
→ Submit calls createReviewRequest mutation
→ Backend:
   1. Validates reason length (>= 20 chars)
   2. Updates employee status (UNDER_REVIEW or TERMINATION_REQUESTED)
   3. Creates ReviewRequest with PENDING status
   4. Creates Thread for discussion
   5. Posts SYSTEM message to thread
   6. Notifies all directors (APPROVAL type)
   7. Optionally notifies employee (WARNING type if visible)
→ Manager sees success message
```

**Step 2: Director Gets Notified**

```
Director sees notification bell badge increase
→ Clicks bell → Sees "FLAG Request from manager@example.com"
→ Clicks notification → Navigates to /review-requests
→ Sees PENDING tab with new request highlighted orange
```

**Step 3: Director Reviews Request**

```
Director clicks "Review" button
→ Modal opens showing:
   - Employee mini-profile (name, email, status, attendance)
   - Manager's reason (type + full details)
   - Visibility status
   - Decision buttons (Approve / Reject)
   - Admin comment field (required, min 10 chars)
   - Impact preview (shows result of decision)
→ Director selects Approve or Reject
→ Types admin comment explaining decision
→ Clicks "Confirm Decision"
→ Backend:
   1. Validates comment length (>= 10 chars)
   2. Updates ReviewRequest status (APPROVED/REJECTED)
   3. Updates employee status:
      - If APPROVED FLAG → FLAGGED
      - If APPROVED TERMINATE → TERMINATED
      - If REJECTED → ACTIVE (reverted)
   4. Updates employee flagged field (if FLAG request)
   5. Posts SYSTEM message to thread with decision
   6. Notifies manager (APPROVAL type)
   7. Notifies employee if visible (CRITICAL for approve, INFO for reject)
→ Director sees success message
→ Modal closes, request list refreshes
```

**Step 4: Manager & Employee Get Notified**

```
Manager receives notification: "Your FLAG request was approved"
→ Clicks → Navigates to review request details
→ Can see admin comment and final status

Employee (if visible):
→ Receives notification: "Your status is now FLAGGED"
→ Clicks → Navigates to profile page
→ Can see new status badge
```

### 2. Messaging Workflow (WhatsApp-like)

**Sending Direct Message:**

```
User opens MessagesPage
→ Clicks "New Message" button
→ Modal opens:
   - Recipient: Dropdown (filtered by role permissions)
   - Subject: Optional
   - Message: Textarea
   - Priority: Normal/High
→ Submit calls sendMessage mutation
→ Backend:
   1. Checks hierarchical permissions:
      - Employees can message Managers (not Directors)
      - Managers can message Directors and Employees
      - Directors can message anyone
   2. Generates conversationId: "dm_1_5" (sorted user IDs)
   3. Creates Message in database
   4. Creates Notification for recipient (MESSAGE type)
   5. Sets linkTo: "/messages?conversation=dm_1_5"
→ Sender sees message in conversation immediately
```

**Receiving Message:**

```
Recipient sees notification bell badge increase
→ Clicks bell → Sees "New message from manager@example.com"
→ Clicks notification → Navigates to /messages with conversation open
→ Message appears in conversation thread
→ Recipient types reply in textarea at bottom
→ Presses Enter or clicks Send
→ Reply posted with same conversationId
→ Original sender gets notification
```

**Broadcast Message to Role:**

```
Director/Manager opens MessagesPage
→ Clicks "Broadcast" button
→ Modal opens:
   - Recipient Role: Dropdown (Directors, Managers, Employees)
   - Subject: Required
   - Message: Textarea
→ Submit calls sendMessage with recipientRole (no recipientId)
→ Backend:
   1. Finds all users with that role
   2. Creates ONE message with conversationId: "broadcast_1_1234567890"
   3. Creates separate Notification for each recipient
→ All recipients see notification and message
```

### 3. Leave Request Workflow

**Employee Requests Leave:**

```
Employee opens LeaveRequestsPage (or Dashboard → Quick Actions)
→ Clicks "Request Leave" button
→ Modal opens:
   - Reason: Textarea
   - Start Date: Date picker
   - End Date: Date picker
→ Submit calls createLeaveRequest mutation
→ Backend:
   1. Finds/creates employee record
   2. Creates LeaveRequest with PENDING status
   3. No notification (managers check dashboard periodically)
→ Employee sees request in their list with PENDING badge
```

**Manager/Director Approves Leave:**

```
Manager opens Dashboard → Sees "Pending Approvals" widget
→ Shows list of PENDING leave requests
→ Clicks "Approve" or "Reject" button
→ Mini-modal opens for admin note (optional)
→ Submit calls updateLeaveRequestStatus mutation
→ Backend:
   1. Updates LeaveRequest status (APPROVED/REJECTED)
   2. Stores admin note
   3. Updates updatedAt timestamp
   4. (Could add notification to employee - not implemented)
→ Manager sees updated status immediately
→ Dashboard widget refreshes, request disappears from pending
```

---

## 🎯 Role-Based Access Control

### Permission Matrix

| Feature | Director | Manager | Employee |
|---------|----------|---------|----------|
| View Dashboard | ✅ All metrics | ✅ Team metrics | ✅ Personal metrics |
| View All Employees | ✅ | ✅ | ❌ |
| Add Employee | ✅ | ✅ | ❌ |
| Edit Employee | ✅ | ✅ | ❌ |
| Delete Employee | ✅ | ❌ | ❌ |
| Flag Employee | ✅ | ✅ | ❌ |
| Create Terminate Request | ✅ | ✅ | ❌ |
| Approve/Reject Requests | ✅ | ❌ | ❌ |
| View Users List | ✅ | ✅ Managers & Employees | ❌ |
| Delete User | ✅ | ❌ | ❌ |
| View Access Logs | ✅ | ❌ | ❌ |
| Generate Employee Logins | ✅ | ❌ | ❌ |
| Send Notes | ✅ | ✅ | ❌ |
| View All Leave Requests | ✅ | ✅ | ❌ |
| Approve Leave Requests | ✅ | ✅ | ❌ |
| Create Leave Request | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ |
| Send Messages to Directors | ✅ | ✅ | ❌ |
| Send Messages to Managers | ✅ | ✅ | ✅ |
| Send Messages to Employees | ✅ | ✅ | ❌ |
| Broadcast Messages | ✅ | ✅ | ❌ |

### How Permissions Are Enforced

**Backend (GraphQL Resolvers):**

```typescript
// Every sensitive resolver starts with a permission check
createReviewRequest: async (_, { input }, ctx) => {
  requireManagerOrAbove(ctx);  // Throws error if employee tries
  // ... rest of logic
}

reviewDecision: async (_, { input }, ctx) => {
  requireDirector(ctx);  // Only directors can approve
  // ... rest of logic
}
```

**Frontend (Component-level):**

```tsx
// Hide buttons based on role
{user.role === "director" && (
  <button onClick={handleDelete}>Delete Employee</button>
)}

{(user.role === "director" || user.role === "manager") && (
  <button onClick={handleFlag}>Flag Employee</button>
)}

// Show access denied page
if (user.role !== "director") {
  return (
    <div>
      <h2>Access Denied</h2>
      <p>Only directors can view this page</p>
    </div>
  );
}
```

---

## 📊 Dashboard Widgets Explained

### Director Dashboard

1. **Total Employees Card**
   - Query: `employee.count()`
   - Shows total count with employee icon

2. **Active Employees Card**
   - Query: `employee.count({ where: { status: 'active' } })`
   - Shows active count vs total

3. **New Hires Card**
   - Query: `employee.count({ where: { createdAt: { gte: thirtyDaysAgo } } })`
   - Shows employees added in last 30 days

4. **Average Attendance Card**
   - Query: `employees.findMany()` → calculate average of attendance field
   - Shows percentage with progress bar

5. **On Leave Today Card**
   - Query: `leaveRequest.count({ where: { status: 'approved', startDate: { lte: today }, endDate: { gte: today } } })`
   - Shows count of people on leave

6. **Employees by Department Chart**
   - Query: `employees.findMany()` → group by className
   - Bar chart showing distribution

7. **Recently Changed Timeline**
   - Query: `employees.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 })`
   - Shows last 5 profile updates with relative time

8. **Flagged Employees Panel**
   - Query: `employees.findMany({ where: { flagged: true } })`
   - Red warning cards with "Review" button

### Manager Dashboard

1. **My Team Size Card**
   - Query: `employee.count({ where: { managerId: currentUser.employeeId } })`
   - Shows team member count

2. **Team Attendance Card**
   - Query: `employees.findMany({ where: { managerId: currentUser.employeeId } })`
   - Calculate average attendance for team

3. **Upcoming Leaves Card**
   - Query: `leaveRequests where employee.managerId = currentUser.id AND startDate within next 7 days`
   - Shows count of upcoming team leaves

4. **Pending Approvals Card**
   - Query: `leaveRequests.count({ where: { status: 'pending', employee.managerId: currentUser.id } })`
   - Shows count of pending leave approvals

5. **At-Risk Attendance List**
   - Query: `employees.findMany({ where: { managerId: currentUser.id, attendance: { lt: 75 } } })`
   - Red/orange cards for low attendance (<75%)

6. **Pending Approvals Panel**
   - Query: `leaveRequests.findMany({ where: { status: 'pending', employee.managerId: currentUser.id } })`
   - Cards with Approve/Reject buttons

### Employee Dashboard

1. **Welcome Card**
   - Shows user's name, avatar, role badge
   - Personal greeting message

2. **Leave Balance Card**
   - Hardcoded for POC (shows "12 days")
   - In real app: track used vs total leave days

3. **My Attendance Card**
   - Query: employee.attendance for current user
   - Shows percentage with color-coded progress bar

4. **Next Leave Card**
   - Query: `leaveRequests.findFirst({ where: { employeeId: currentUser.id, status: 'approved', startDate: { gt: today } }, orderBy: { startDate: 'asc' } })`
   - Shows next approved leave date

5. **Activity Timeline**
   - Query: Recent actions (profile updates, leave approvals, messages)
   - Shows last 5-10 activities with icons

---

## 🚀 Deployment Guide

### Backend (Render.com)

**What is deployed:**
- Node.js server (Express + Apollo GraphQL)
- Docker container with all dependencies
- Connected to PostgreSQL database

**Environment variables needed:**
```
DATABASE_URL=postgresql://...  (Render provides this)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=another-secret-here
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=4000
```

**Deployment process:**
1. Push code to GitHub
2. Render automatically detects Dockerfile
3. Builds Docker image
4. Runs `npm install` and `npm run build`
5. Starts server with `npm start`
6. Runs migrations with `npx prisma db push`

**Access:**
- Backend URL: `https://employee-poc-backend.onrender.com`
- GraphQL Playground: `https://employee-poc-backend.onrender.com/graphql`

### Frontend (Vercel)

**What is deployed:**
- React app built with Vite
- Static files (HTML, CSS, JS)
- Served via CDN (super fast!)

**Environment variables needed:**
```
VITE_GRAPHQL_URL=https://employee-poc-backend.onrender.com/graphql
VITE_AUTH_URL=https://employee-poc-backend.onrender.com/auth
```

**Deployment process:**
1. Push code to GitHub
2. Vercel automatically detects changes
3. Runs `npm install`
4. Runs `npm run build` (creates `dist/` folder)
5. Uploads `dist/` to CDN
6. Updates DNS to point to new version

**Access:**
- Frontend URL: `https://employee-poc.vercel.app`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Not authenticated" error

**Problem:** GraphQL queries fail with "Not authenticated"

**Solutions:**
1. Check if access token is in localStorage: `localStorage.getItem('accessToken')`
2. Check if token is expired (15-minute lifetime)
3. Try refresh: Call `/auth/refresh` with refresh token
4. If refresh fails: User needs to login again

### Issue 2: CORS errors

**Problem:** "Access-Control-Allow-Origin" error in browser

**Solutions:**
1. Check CORS configuration in `backend-node/src/index.ts`
2. Make sure FRONTEND_URL environment variable is correct
3. Check browser console for exact error message
4. Make sure credentials: true in both frontend and backend

### Issue 3: Database connection fails

**Problem:** "Can't reach database server" error

**Solutions:**
1. Check DATABASE_URL in .env file
2. Make sure PostgreSQL is running (locally or on Render)
3. Run `npx prisma db push` to sync schema
4. Check firewall/security group settings

### Issue 4: GraphQL query returns null

**Problem:** Query returns null or empty array

**Solutions:**
1. Check permissions - maybe user doesn't have access
2. Run query in GraphQL Playground to see raw response
3. Check database - maybe data doesn't exist
4. Look at backend console for error messages

### Issue 5: Notifications not appearing

**Problem:** Bell icon doesn't show new notifications

**Solutions:**
1. Check if polling is working (30-second interval)
2. Check network tab - is notificationCount query being called?
3. Check if notification was actually created in database
4. Try manually refreshing the page

---

## 💡 Tips for Understanding the Code

### 1. Start with the User Journey

Don't try to understand everything at once! Follow a specific user action:

**Example: "I want to understand login"**
1. Start at `LoginPage.tsx` → see the form
2. Follow `handleSubmit` → see the fetch call to `/auth/login`
3. Jump to `backend-node/src/routes/auth.ts` → see the `/login` endpoint
4. See how password is verified with `bcrypt.compare()`
5. See how tokens are generated
6. Back to frontend → see how tokens are stored in localStorage
7. Done! You understand login flow.

### 2. Use Console.log() Liberally

Add logging to understand data flow:

```typescript
console.log('User clicked login with:', { email, password });
console.log('API response:', data);
console.log('Access token:', accessToken);
console.log('Current user:', auth.user);
```

### 3. Read Error Messages Carefully

Error messages tell you exactly what's wrong:
- "Not authenticated" → Missing or invalid JWT token
- "Director only" → Wrong role trying to access
- "Invalid credentials" → Wrong email/password
- "Employee not found" → Query for non-existent ID

### 4. Use GraphQL Playground

Test queries directly without frontend:

```
1. Open http://localhost:4000/graphql in browser
2. Set Authorization header: "Bearer YOUR_TOKEN_HERE"
3. Try queries:
   query {
     myProfile {
       id
       name
       email
       role
     }
   }
4. See response immediately
```

### 5. Database Tool (Prisma Studio)

Visualize database contents:

```bash
cd backend-node
npx prisma studio
```

Opens GUI at `http://localhost:5555` where you can:
- See all tables
- Browse data
- Edit records
- Run queries

---

## 🎓 Learning Resources

### GraphQL
- Official Docs: https://graphql.org/learn/
- How to GraphQL: https://www.howtographql.com/

### React
- Official Docs: https://react.dev/
- React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app/

### Prisma ORM
- Official Docs: https://www.prisma.io/docs/
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

### JWT Authentication
- JWT.io: https://jwt.io/introduction
- JWT Best Practices: https://curity.io/resources/learn/jwt-best-practices/

### TypeScript
- Official Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- TypeScript for JavaScript Programmers: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html

---

## 📞 Need Help?

If you're stuck, try this checklist:

1. ✅ Read the error message carefully
2. ✅ Check browser console (F12)
3. ✅ Check backend terminal for errors
4. ✅ Try logging out and logging back in
5. ✅ Check if database is running
6. ✅ Try running `npm install` again
7. ✅ Check if environment variables are set
8. ✅ Search error message on Google/StackOverflow
9. ✅ Read relevant section in this CODE_GUIDE.md
10. ✅ Ask for help with specific error message

---

**Happy Coding! 🎉**

This codebase is designed to be interview-ready and production-quality. Take your time understanding each part, and you'll have deep knowledge of modern full-stack development!
