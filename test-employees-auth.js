// Test with REST authentication
// Login via REST, then test employees via GraphQL

const BACKEND_URL = "https://employee-poc-full-auth.onrender.com";
const GRAPHQL_URL = `${BACKEND_URL}/graphql`;
const AUTH_URL = `${BACKEND_URL}/auth/login`;

const employeesQuery = `
  query {
    employees(page: 1, pageSize: 10) {
      items {
        id
        name
        age
        className
        attendance
      }
      total
    }
  }
`;

async function testEmployeesAPI() {
  try {
    console.log("🔍 Step 1: Logging in via REST...");
    console.log(`POST ${AUTH_URL}`);
    console.log("");
    
    const loginResponse = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "director@example.com",
        password: "director123"
      }),
    });

    const loginData = await loginResponse.json();

    if (loginData.error || loginResponse.status !== 200) {
      console.error("❌ Login failed:", loginData.error || "Unknown error");
      console.error("Status:", loginResponse.status);
      return;
    }

    const token = loginData.accessToken;
    if (!token) {
      console.error("❌ No token received");
      console.error("Response:", loginData);
      return;
    }

    console.log("✅ Logged in successfully!");
    console.log("");
    console.log("🔍 Step 2: Fetching employees via GraphQL...");
    console.log(`POST ${GRAPHQL_URL}`);
    console.log("");

    const employeeResponse = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ query: employeesQuery }),
    });

    const employeeData = await employeeResponse.json();

    if (employeeData.errors) {
      console.error("❌ Query failed:");
      employeeData.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
      return;
    }

    const employees = employeeData.data?.employees;
    if (!employees) {
      console.error("❌ No employee data");
      console.error("Response:", employeeData);
      return;
    }

    console.log(`✅ Found ${employees.total} employees in database:`);
    console.log("");

    if (employees.items.length === 0) {
      console.log("⚠️  NO EMPLOYEES FOUND!");
      console.log("");
      console.log("SOLUTION:");
      console.log("You need to seed the database with employees first.");
      console.log("");
      console.log("Run these commands:");
      console.log("  1. cd backend-node");
      console.log("  2. npx prisma db seed");
      console.log("");
      console.log("Then go to the app and refresh:");
      console.log("  https://employeepoc-frontend.vercel.app");
      return;
    }

    employees.items.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.name} (ID: ${emp.id})`);
      console.log(`   Age: ${emp.age}, Class: ${emp.className}, Attendance: ${emp.attendance}%`);
    });

    console.log("");
    console.log("✅ SUCCESS! Your app is working correctly!");
    console.log("");
    console.log("🎯 Next steps:");
    console.log("  1. Go to: https://employeepoc-frontend.vercel.app");
    console.log("  2. Login with: director@example.com / director123");
    console.log("  3. You should see all employees listed!");

  } catch (error) {
    console.error("❌ Network Error:", error.message);
    console.error("");
    console.error("⏳ The backend might be sleeping (it takes 30-60 seconds to wake up)");
    console.error("");
    console.error("FIX: First, wake up the backend:");
    console.log(`  Visit: ${BACKEND_URL}/health`);
    console.error("");
    console.error("Then wait 30-60 seconds and try again");
  }
}

testEmployeesAPI();
