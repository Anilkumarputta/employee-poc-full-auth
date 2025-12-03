import "dotenv/config";
import express from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { PrismaClient } from "@prisma/client";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { authRouter } from "./routes/auth";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin: [FRONTEND_URL],
  credentials: true,
}));
app.use(express.json());

// REST auth routes
app.use("/auth", authRouter);

// Apollo GraphQL server with JWT-based context
async function start() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || "";
      let user = null;

      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        try {
          const decoded: any = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || "dev-secret"
          );
          user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        } catch (err) {
          // invalid token, keep user null
        }
      }

      return { prisma, user };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(
      `Backend running at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

start().catch((e) => {
  console.error("Fatal error starting server:");
  console.error(e);
  console.error(e.stack);
  process.exit(1);
});
