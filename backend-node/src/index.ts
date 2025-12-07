/**
 * MAIN SERVER FILE - Backend Entry Point
 * 
 * This is where our entire backend server starts! Think of this as the "brain" that
 * coordinates everything. It sets up:
 * 1. REST API for authentication (login/register)
 * 2. GraphQL API for all other operations (employees, messages, etc.)
 * 3. Security settings (CORS, JWT authentication)
 * 
 * How it works:
 * - When a user logs in, they get a JWT token (like a special pass)
 * - They send this token with every request to prove who they are
 * - We verify the token and give them access to their data
 */

import "dotenv/config"; // Load environment variables from .env file (keeps secrets safe!)
import express from "express"; // Express = web server framework (handles HTTP requests)
import cors from "cors"; // CORS = lets frontend (different domain) talk to backend
import { ApolloServer } from "apollo-server-express"; // GraphQL server for complex queries
import { PrismaClient } from "@prisma/client"; // Prisma = talks to PostgreSQL database
import { typeDefs } from "./schema"; // GraphQL schema (defines what data we can query)
import { resolvers } from "./resolvers"; // Resolvers (functions that actually fetch the data)
import { authRouter } from "./routes/auth"; // Authentication routes (login/register)
import jwt from "jsonwebtoken"; // JWT = creates and verifies user tokens

// Initialize database connection - this connects us to PostgreSQL
const prisma = new PrismaClient();

// Create Express app - this is our web server
const app = express();

// Get frontend URL from environment variable (different in dev vs production)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Enable CORS - allows our React frontend to make requests to this backend
// Without this, browsers would block our API calls!
app.use(cors({
  origin: [FRONTEND_URL], // Only allow requests from our frontend
  credentials: true, // Allow cookies and auth headers
}));

// Parse JSON in request bodies - converts JSON to JavaScript objects
app.use(express.json());

// Mount REST authentication routes at /auth
// These handle: /auth/login, /auth/register, /auth/refresh, /auth/google
app.use("/auth", authRouter);

/**
 * START APOLLO GRAPHQL SERVER
 * 
 * GraphQL is like a smart API that lets the frontend ask for exactly
 * what it needs in one request, instead of multiple REST calls.
 * 
 * Context: This runs on every request and extracts the user from the JWT token.
 * If the token is valid, we know who the user is (director/manager/employee).
 * If invalid or missing, user stays null and protected queries will fail.
 */
async function start() {
  const server = new ApolloServer({
    typeDefs, // Schema = what queries and mutations are available
    resolvers, // Resolvers = functions that execute those queries
    context: async ({ req }) => {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization || "";
      let user = null; // Will stay null if token is invalid

      if (authHeader.startsWith("Bearer ")) {
        // Token format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        const token = authHeader.replace("Bearer ", "");
        try {
          // Verify token signature and decode payload
          const decoded: any = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || "dev-access-secret"
          );
          // Token is valid! Fetch full user from database
          user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        } catch (err) {
          // Token is invalid/expired - keep user null
          // This is fine, just means they're not logged in
          console.error("JWT verification failed:", err);
        }
      }

      // Return context object - available in all resolvers
      // Every query/mutation can access { prisma, user }
      return { prisma, user };
    },
  });

  // Start Apollo server (async initialization)
  await server.start();
  
  // Connect Apollo to Express at /graphql endpoint
  server.applyMiddleware({ app, path: "/graphql" });

  // Start listening for HTTP requests
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(
      `🚀 Backend running at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

// Start the server! If anything crashes, log error and exit
start().catch((e) => {
  console.error("❌ Fatal error starting server:");
  console.error(e);
  console.error(e.stack);
  process.exit(1); // Exit with error code
});
