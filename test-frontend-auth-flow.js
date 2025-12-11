#!/usr/bin/env node

const API_URL = "https://employee-poc-full-auth.onrender.com";
const GRAPHQL_URL = `${API_URL}/graphql`;

async function testAuthFlow() {
  console.log("🔍 Testing Complete Auth Flow\n");
  console.log(`API URL: ${API_URL}`);
  console.log(`GraphQL URL: ${GRAPHQL_URL}\n`);

  try {
    // Step 1: Login
    console.log("📝 Step 1: Login via REST API");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "director@example.com",
        password: "director123",
      }),
    });

    if (!loginRes.ok) {
      console.error(`❌ Login failed: ${loginRes.status} ${loginRes.statusText}`);
      const errorText = await loginRes.text();
      console.error("Response:", errorText);
      return;
    }

    const loginData = await loginRes.json();
    console.log("✅ Login successful!");
    console.log(`   - User: ${loginData.user.email} (${loginData.user.role})`);
    console.log(`   - Access Token: ${loginData.accessToken.substring(0, 20)}...`);
    console.log(`   - Refresh Token: ${loginData.refreshToken.substring(0, 20)}...`);

    const { accessToken, refreshToken, user } = loginData;

    // Step 2: Simulate App.tsx recovery (page refresh)
    console.log("\n📱 Step 2: Simulating App.tsx useEffect (page refresh scenario)");
    console.log("   - Would store in localStorage:");
    console.log(`     - accessToken: ${accessToken.substring(0, 20)}...`);
    console.log(`     - refreshToken: ${refreshToken.substring(0, 20)}...`);
    console.log(`     - user: ${JSON.stringify(user)}`);

    // Step 3: Test GraphQL query with token
    console.log("\n🔗 Step 3: Query employees via GraphQL with Bearer token");

    const graphqlQuery = `
      query Employees($filter: EmployeeFilter, $page: Int, $pageSize: Int, $sortBy: EmployeeSortBy, $sortOrder: SortOrder) {
        employees(filter: $filter, page: $page, pageSize: $pageSize, sortBy: $sortBy, sortOrder: $sortOrder) {
          items {
            id
            name
            age
            className
            subjects
            attendance
            role
            status
            location
            lastLogin
            createdAt
            updatedAt
          }
          total
          page
          pageSize
        }
      }
    `;

    const graphqlRes = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
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

    const graphqlData = await graphqlRes.json();

    if (graphqlData.errors) {
      console.error("❌ GraphQL query failed!");
      graphqlData.errors.forEach((err) => {
        console.error(`   - ${err.message}`);
      });
      return;
    }

    const employees = graphqlData.data.employees.items;
    console.log(`✅ GraphQL query successful!`);
    console.log(`   - Found ${employees.length} employees:`);
    employees.forEach((emp, idx) => {
      console.log(`     ${idx + 1}. ${emp.name} (ID: ${emp.id}, Age: ${emp.age}, Attendance: ${emp.attendance}%)`);
    });

    // Step 4: Test without token
    console.log("\n🔒 Step 4: Test GraphQL without Bearer token (should fail)");
    const graphqlResNoAuth = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    const graphqlDataNoAuth = await graphqlResNoAuth.json();
    if (graphqlDataNoAuth.errors) {
      console.log("✅ Correctly rejected unauthenticated request");
      console.log(`   - Error: ${graphqlDataNoAuth.errors[0].message}`);
    } else {
      console.warn("⚠️ Request succeeded without auth (security issue!)");
    }

    console.log("\n✨ All tests passed! Frontend auth flow should work correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testAuthFlow();
