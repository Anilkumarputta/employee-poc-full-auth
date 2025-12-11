#!/usr/bin/env node

const API_URL = "https://employee-poc-full-auth.onrender.com";

async function testLocalStorageFlow() {
  console.log("🧪 Testing localStorage flow simulation\n");

  // Step 1: Simulate login and storing tokens
  console.log("Step 1: Simulate storing tokens to localStorage");
  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInJvbGUiOiJkaXJlY3RvciIsImlhdCI6MTc2NTIzOTg5OCwiZXhwIjoxNzY1MjQwNzk4fQ.IAvG5UbYMWQNNKhbAvapJE3awwiKOSJHlVhudvvd1MM";
  const mockUser = { id: 3, email: "director@example.com", role: "director" };

  console.log(`   localStorage.setItem('accessToken', '${mockToken.substring(0, 20)}...')`);
  console.log(`   localStorage.setItem('user', '${JSON.stringify(mockUser)}'`);

  // Step 2: Query with the stored token
  console.log("\nStep 2: Fetch employees with stored token");

  const graphqlQuery = `
    query Employees($filter: EmployeeFilter, $page: Int, $pageSize: Int, $sortBy: EmployeeSortBy, $sortOrder: SortOrder) {
      employees(filter: $filter, page: $page, pageSize: $pageSize, sortBy: $sortBy, sortOrder: $sortOrder) {
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

  try {
    const response = await fetch(`${API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mockToken}`,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          filter: { roleNot: "admin" },
          page: 1,
          pageSize: 6,
          sortBy: "CREATED_AT",
          sortOrder: "ASC",
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("❌ GraphQL errors:", data.errors.map(e => e.message).join(", "));
      return;
    }

    console.log(`✅ Success! Found ${data.data.employees.items.length} employees:`);
    data.data.employees.items.forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.name} (ID: ${emp.id})`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testLocalStorageFlow();
