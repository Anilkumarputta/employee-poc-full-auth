// Quick test to check if employees API is returning data
// Usage: node test-employees.js

const API_URL = "https://employee-poc-full-auth.onrender.com/graphql";

const query = `
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
    console.log("🔍 Testing Employees API...");
    console.log("Endpoint:", API_URL);
    console.log("");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("❌ API Error:");
      console.error(data.errors[0].message);
      return;
    }

    if (!data.data || !data.data.employees) {
      console.error("❌ No employee data returned");
      console.error("Response:", data);
      return;
    }

    const employees = data.data.employees;
    console.log(`✅ Found ${employees.total} employees (showing ${employees.items.length}):`);
    console.log("");

    if (employees.items.length === 0) {
      console.log("⚠️  No employees in database!");
      console.log("   → Run: npx prisma db seed");
      return;
    }

    employees.items.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.name} (ID: ${emp.id})`);
      console.log(`   Age: ${emp.age}, Class: ${emp.className}, Attendance: ${emp.attendance}%`);
    });

    console.log("");
    console.log("✅ API is working correctly!");

  } catch (error) {
    console.error("❌ Network Error:", error.message);
    console.error("   → Backend might be sleeping (takes 30-60 seconds to wake up on first request)");
    console.error("   → Wake it up at: https://employee-poc-full-auth.onrender.com/health");
  }
}

testEmployeesAPI();
