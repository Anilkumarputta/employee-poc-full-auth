import { PrismaClient, Employee as PrismaEmployee } from "@prisma/client";

type Context = {
  prisma: PrismaClient;
  user: { id: number; role: string } | null;
};

function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new Error("Not authenticated");
  }
}

function requireAdmin(ctx: Context) {
  requireAuth(ctx);
  if (ctx.user!.role !== "admin") {
    throw new Error("Admin only");
  }
}

export const resolvers = {
  Query: {
    employees: async (_: any, args: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma } = ctx;
      const {
        filter,
        page = 1,
        pageSize = 10,
        sortBy = "CREATED_AT",
        sortOrder = "DESC",
      } = args;

      const where: any = {};
      if (filter?.nameContains) {
        where.name = { contains: filter.nameContains, mode: "insensitive" };
      }
      if (filter?.className) {
        where.className = filter.className;
      }
      if (filter?.status) {
        where.status = filter.status;
      }
      if (filter?.roleNot) {
        where.role = { not: filter.roleNot };
      }

      const orderBy: any = {};
      if (sortBy === "NAME") orderBy.name = sortOrder.toLowerCase();
      else if (sortBy === "AGE") orderBy.age = sortOrder.toLowerCase();
      else if (sortBy === "ATTENDANCE")
        orderBy.attendance = sortOrder.toLowerCase();
      else orderBy.createdAt = sortOrder.toLowerCase();

      const [items, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.employee.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
      };
    },

    employee: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.employee.findUnique({ where: { id } });
    },
  },

  Mutation: {
    addEmployee: async (_: any, { input }: any, ctx: Context) => {
      requireAdmin(ctx);
      const now = new Date().toISOString();
      return ctx.prisma.employee.create({
        data: {
          ...input,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        },
      } as any);
    },

    updateEmployee: async (_: any, { id, input }: any, ctx: Context) => {
      requireAdmin(ctx);
      return ctx.prisma.employee.update({
        where: { id },
        data: {
          ...input,
          updatedAt: new Date(),
        } as any,
      });
    },

    deleteEmployee: async (_: any, { id }: any, ctx: Context) => {
      requireAdmin(ctx);
      await ctx.prisma.employee.delete({ where: { id } });
      return true;
    },

    terminateEmployee: async (_: any, { id }: any, ctx: Context) => {
      requireAdmin(ctx);
      return ctx.prisma.employee.update({
        where: { id },
        data: {
          status: "terminated",
          updatedAt: new Date(),
        },
      });
    },
  },
};
