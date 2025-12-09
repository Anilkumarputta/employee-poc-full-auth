# Employee Management App - Testing & Debugging Guide

## 🎯 Quick Start - Test Credentials

The application is now live at: **https://employeepoc-frontend.vercel.app**

### Available Test Accounts:

1. **Director Account**
   - Email: `director@example.com`
   - Password: `director123`
   - Can see all employees, terminate, and manage records

2. **Manager Account**
   - Email: `manager@example.com`
   - Password: `manager123`
   - Limited access to employee data

3. **Employee Account**
   - Email: `employee@example.com`
   - Password: `employee123`
   - Basic access to personal information

## ✅ What You Should See

### Login Page
- The form should prefill with `director@example.com` and `director123`
- Click "Login" button
- Should redirect to Dashboard

### Employees Page
- Click "Employees" in the left navigation menu
- Should display a list of employees with columns:
  - Name (e.g., "Michael Chen", "Emily Davis", "Robert Wilson")
  - Age, Class, Subjects, Attendance %, Role, Status
- At least 6 employees should be visible with proper employee names

### Expected Employee Data
The app should show these employees:
1. Michael Chen - Age 45, Admin, 100% attendance
2. Emily Davis - Age 26, Class 8-C, 92% attendance
3. Robert Wilson - Age 38, Class 11-A, 88% attendance
4. employee - Age 25, 100% attendance
5. director - Age 25, 100% attendance
6. manager - Age 25, 100% attendance

## 🔍 Debugging - Open Browser Console

If employees don't appear, check the browser console for debug logs:

**Press F12 to open Developer Tools → Console tab**

Look for messages like:
```
[App.tsx] Restoring auth from localStorage: { hasAccessToken: true, hasRefreshToken: true, hasUser: true }
[App.tsx] handleAuthChange called with: { user: "director@example.com", hasAccessToken: true, hasRefreshToken: true }
[App.tsx] Storing tokens to localStorage
[EmployeesPage] useEffect triggered, accessToken: present
[graphqlClient] Request with auth token
```

## ❌ Troubleshooting

### Issue: "Not authenticated" error appears on Employees page

**Solution:**
1. Check if you're actually logged in
2. Try logging out (click profile → logout)
3. Clear browser cache: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
4. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
5. Log in again with correct credentials

### Issue: Login fails with "Invalid credentials"

**Solution:**
1. Use exact credentials from above
2. Make sure caps lock is OFF
3. Verify you're using the correct email format
4. If you created a new account via Register, use those credentials

### Issue: Page shows blank after login

**Solution:**
1. Wait 2-3 seconds for data to load
2. Check browser console (F12) for any errors
3. Try refreshing the page (F5)
4. If you see "Not authenticated" in the console, try:
   - Clear localStorage: Open DevTools → Storage → LocalStorage → Clear All
   - Log in again

### Issue: Employees list shows but names are missing/blank

**Solution:**
1. This should NOT happen - all employees have names in the database
2. If it does, check browser console for GraphQL errors
3. Try refreshing the page
4. Contact support with screenshot of error

## 🧪 Manual Testing Checklist

- [ ] Access https://employeepoc-frontend.vercel.app
- [ ] See login page with prefilled credentials
- [ ] Click "Login" button
- [ ] Successfully redirect to Dashboard
- [ ] Click "Employees" in menu
- [ ] See employee list with names visible
- [ ] Can sort by different columns (Name, Age, Attendance, Created)
- [ ] Can search for employees by name
- [ ] Can filter by status (Active, Flagged, Terminated)
- [ ] Can toggle between Grid and Tile view
- [ ] Can add a new employee (Director only)
- [ ] Can click employee to see details
- [ ] Can terminate an employee (Director only)

## 📊 Backend API Health

The backend is running at: **https://employee-poc-full-auth.onrender.com**

### Verify Backend Status:
```bash
# Check if backend is running
curl https://employee-poc-full-auth.onrender.com/health

# Expected response: { "status": "ok" }
```

### Verify Employee Data:
The backend has 9 employees seeded in the database with proper names, ages, classes, and attendance data. These are fetched via GraphQL query when you access the Employees page with proper authentication.

## 🚀 Performance Notes

- **First Load**: May take 10-15 seconds as backend wakes up on first request (Render free tier)
- **Subsequent Loads**: Should be 1-2 seconds  
- **Uptime Monitoring**: Backend is monitored with cron-job.org every 10 minutes for 24/7 availability

## 📝 Important Notes

1. **Token Expiry**: Access tokens expire after 15 minutes. If you see "Not authenticated" after 15+ minutes of inactivity, just log in again.

2. **localStorage**: The app stores auth tokens in browser's localStorage for persistence across page reloads.

3. **CORS**: The app is configured with proper CORS headers to allow requests from Vercel to the backend API on Render.

4. **Data Persistence**: All changes are saved to PostgreSQL database on Render. Data persists across deployments.

## 📧 Support Information

If you encounter any issues:
1. Check this guide first
2. Open browser DevTools (F12) and share console errors
3. Share screenshot of the problem
4. Include which browser/OS you're using
5. Include steps to reproduce the issue

---

**Last Updated**: 2024-12-08
**Frontend Deployment**: Vercel
**Backend Deployment**: Render (free tier)
**Database**: PostgreSQL on Render
