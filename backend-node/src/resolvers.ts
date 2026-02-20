/**
 * GRAPHQL RESOLVERS - The "Brain" of the Backend
 *
 * Resolvers are functions that fetch data for GraphQL queries and mutations.
 * Think of GraphQL as a menu, and resolvers as the kitchen that prepares each dish.
 *
 * Organization:
 * - Query resolvers: Fetch data (GET requests)
 * - Mutation resolvers: Modify data (POST/PUT/DELETE requests)
 * - Type resolvers: Calculate fields on existing objects
 *
 * Permission Levels:
 * 1. Director: Supreme admin - can do EVERYTHING
 * 2. Manager: Can manage teams, approve leaves, flag employees
 * 3. Employee: Can view own data, request leaves, send messages
 *
 * Every resolver has access to:
 * - ctx.prisma: Database client to query PostgreSQL
 * - ctx.user: Current logged-in user (or null if not logged in)
 */

import { PrismaClient, Employee } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { sendSlackMessage } from './utils/slack';
import { generate2FASecret, verify2FACode } from './utils/twofa';

// Context type = what every resolver receives
type Context = {
  prisma: PrismaClient; // Database client
  user: { id: number; role: string; email: string } | null; // Current user (from JWT)
};

/**
 * PERMISSION GUARD: Require Authentication
 * Throws error if user is not logged in (no JWT token)
 * Use this for any operation that requires login
 */
function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }
}

/**
 * PERMISSION GUARD: Require Director Role
 * Only the supreme admin (Director) can perform this action
 * Examples: Delete users, approve terminations, view all logs
 */
function requireDirector(ctx: Context) {
  requireAuth(ctx); // Must be logged in
  if (ctx.user!.role !== 'director') {
    throw new Error('Director only - highest level access required');
  }
}

/**
 * PERMISSION GUARD: Require Manager or Director
 * Mid-level and high-level admins can perform this action
 * Examples: Send notes, create review requests, approve leaves
 */
function requireManagerOrAbove(ctx: Context) {
  requireAuth(ctx);
  if (!['director', 'manager'].includes(ctx.user!.role)) {
    throw new Error('Manager or Director access required');
  }
}

/**
 * PERMISSION GUARD: Require Admin (Director, Manager, or legacy Admin role)
 * Most administrative actions require this level
 * Examples: Add employees, view access logs, manage leave requests
 */
function requireAdmin(ctx: Context) {
  requireAuth(ctx);
  if (!['director', 'manager', 'admin'].includes(ctx.user!.role)) {
    throw new Error('Admin access required');
  }
}

function getMessageVisibilityFilter(userId: number, role: string) {
  return [
    { senderId: userId },
    { recipientId: userId },
    {
      AND: [{ recipientId: null }, { recipientRole: role }],
    },
  ];
}

function stringifyAuditDetails(details: Record<string, unknown>): string {
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

async function findEmployeeByUser(ctx: Context, userId: number, email: string): Promise<Employee | null> {
  return ctx.prisma.employee.findFirst({
    where: {
      OR: [{ userId }, { email }],
    },
  });
}

async function getManagerTeamEmployeeIds(ctx: Context, managerUserId: number): Promise<number[]> {
  const teamMembers = await ctx.prisma.employee.findMany({
    where: { managerId: managerUserId },
    select: { id: true },
  });

  return teamMembers.map((member) => member.id);
}

async function getManagerTeamUserIds(ctx: Context, managerUserId: number): Promise<number[]> {
  const teamMembers = await ctx.prisma.employee.findMany({
    where: {
      managerId: managerUserId,
      userId: { not: null },
    },
    select: { userId: true },
  });

  return teamMembers
    .map((member) => member.userId)
    .filter((userId): userId is number => typeof userId === 'number');
}

function formatEmailLocalPartAsName(email: string): string {
  const localPart = email.split('@')[0] || '';
  const parts = localPart
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getSafeEmployeeName(name: string | null | undefined, email?: string | null, id?: number): string {
  const cleanedName = (name || '').replace(/\s+/g, ' ').trim();
  const hasLetters = /[a-zA-Z]/.test(cleanedName);

  if (cleanedName.length >= 2 && hasLetters) {
    return cleanedName;
  }

  if (email) {
    const emailName = formatEmailLocalPartAsName(email);
    if (emailName.length >= 2) {
      return emailName;
    }
  }

  if (cleanedName.length === 1) {
    return cleanedName.toUpperCase();
  }

  return typeof id === 'number' ? `Employee ${id}` : 'Employee';
}

/**
 * RESOLVERS EXPORT
 * This object contains all our GraphQL resolvers organized by type
 */
export const resolvers = {
  /**
   * THREAD TYPE RESOLVER
   * Adds computed fields to Thread objects
   * lastMessage: Returns the most recent message in a thread (for preview)
   */
  Thread: {
    lastMessage: async (parent: any) => {
      // If messages were already loaded (from include), use them
      if (parent.messages && parent.messages.length > 0) {
        return parent.messages[0]; // Already sorted desc, so first = latest
      }
      return null;
    },
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
    updatedAt: (parent: any) => {
      return parent.updatedAt ? parent.updatedAt.toISOString() : null;
    },
  },

  /**
   * REVIEW REQUEST TYPE RESOLVER
   * Adds computed fields to ReviewRequest objects
   * employee: Returns the full employee object being reviewed
   */
  ReviewRequest: {
    employee: async (parent: any, _: any, ctx: Context) => {
      // If employee was already loaded (from include), return it
      if (parent.employee) {
        return parent.employee;
      }
      // Otherwise fetch it from database
      return ctx.prisma.employee.findUnique({
        where: { id: parent.employeeId },
      });
    },
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
    updatedAt: (parent: any) => {
      return parent.updatedAt ? parent.updatedAt.toISOString() : null;
    },
    reviewedAt: (parent: any) => {
      return parent.reviewedAt ? parent.reviewedAt.toISOString() : null;
    },
  },

  /**
   * MESSAGE TYPE RESOLVER
   * Converts DateTime fields to ISO strings for GraphQL
   * createdAt, updatedAt, readAt: Properly serialize dates
   */
  Message: {
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
    updatedAt: (parent: any) => {
      return parent.updatedAt ? parent.updatedAt.toISOString() : null;
    },
    readAt: (parent: any) => {
      return parent.readAt ? parent.readAt.toISOString() : null;
    },
  },

  /**
   * EMPLOYEE TYPE RESOLVER
   * Converts DateTime fields to ISO strings for GraphQL
   */
  Employee: {
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
    updatedAt: (parent: any) => {
      return parent.updatedAt ? parent.updatedAt.toISOString() : null;
    },
  },

  /**
   * NOTIFICATION TYPE RESOLVER
   * Converts DateTime fields to ISO strings for GraphQL
   */
  Notification: {
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
    updatedAt: (parent: any) => {
      return parent.updatedAt ? parent.updatedAt.toISOString() : null;
    },
    readAt: (parent: any) => {
      return parent.readAt ? parent.readAt.toISOString() : null;
    },
  },

  /**
   * NOTE TYPE RESOLVER
   * Converts DateTime fields to ISO strings for GraphQL
   */
  Note: {
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
  },

  /**
   * THREAD TYPE RESOLVER
   * Converts DateTime fields to ISO strings for GraphQL
   */
  ThreadMessage: {
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
  },

  /**
   * LEAVE REQUEST TYPE RESOLVER
   * Converts DateTime fields to ISO strings for GraphQL
   */
  LeaveRequest: {
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
    updatedAt: (parent: any) => {
      return parent.updatedAt ? parent.updatedAt.toISOString() : null;
    },
  },

  /**
   * ACCESS LOG TYPE RESOLVER
   * Converts DateTime fields to ISO strings for GraphQL
   */
  AccessLog: {
    createdAt: (parent: any) => {
      return parent.createdAt ? parent.createdAt.toISOString() : null;
    },
  },

  /**
   * ======================
   * QUERY RESOLVERS
   * ======================
   * These fetch data - they don't modify anything (read-only)
   * Think of these as "GET" requests in REST
   */
  Query: {
    /**
     * GET EMPLOYEES WITH PAGINATION & FILTERING
     * Returns paginated list of employees with sorting and filtering
     *
     * Args:
     * - filter: Search by name, class, status, role
     * - page: Current page number (starts at 1)
     * - pageSize: How many employees per page (default 10)
     * - sortBy: Which field to sort by (NAME, AGE, ATTENDANCE, CREATED_AT)
     * - sortOrder: ASC (A→Z) or DESC (Z→A)
     *
     * Returns: { items: [], total, page, pageSize }
     */
    employees: async (_: any, args: any, ctx: Context) => {
      requireAuth(ctx); // Must be logged in to view employees
      const { prisma, user } = ctx;
      const { filter, page = 1, pageSize = 10, sortBy = 'CREATED_AT', sortOrder = 'DESC' } = args;

      const where: any = {};
      if (filter?.nameContains) {
        where.name = { contains: filter.nameContains, mode: 'insensitive' };
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
      if (filter?.emailContains) {
        where.email = { contains: filter.emailContains, mode: 'insensitive' };
      }
      if (filter?.role) {
        where.role = filter.role;
      }
      if (filter?.location) {
        where.location = { contains: filter.location, mode: 'insensitive' };
      }
      if (filter?.attendanceMin !== undefined) {
        where.attendance = { gte: filter.attendanceMin };
      }
      if (filter?.attendanceMax !== undefined) {
        where.attendance = { lte: filter.attendanceMax };
      }

      // Enforce role-scoped employee visibility.
      if (user!.role === 'manager') {
        const teamEmployeeIds = await getManagerTeamEmployeeIds(ctx, user!.id);
        where.AND = [
          ...(where.AND || []),
          {
            OR: [{ id: { in: teamEmployeeIds.length > 0 ? teamEmployeeIds : [-1] } }, { userId: user!.id }],
          },
        ];
      } else if (user!.role === 'employee') {
        const myEmployee = await findEmployeeByUser(ctx, user!.id, user!.email);
        if (!myEmployee) {
          where.AND = [...(where.AND || []), { userId: user!.id }];
        } else {
          const employeeScope: any[] = [{ id: myEmployee.id }];
          if (myEmployee.managerId) {
            employeeScope.push({ managerId: myEmployee.managerId });
            employeeScope.push({ userId: myEmployee.managerId });
          }
          where.AND = [...(where.AND || []), { OR: employeeScope }];
        }
      }

      const orderBy: any = {};
      if (sortBy === 'NAME') orderBy.name = sortOrder.toLowerCase();
      else if (sortBy === 'AGE') orderBy.age = sortOrder.toLowerCase();
      else if (sortBy === 'ATTENDANCE') orderBy.attendance = sortOrder.toLowerCase();
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

      const normalizedItems = items.map((employee) => ({
        ...employee,
        name: getSafeEmployeeName(employee.name, employee.email, employee.id),
      }));

      return {
        items: normalizedItems,
        total,
        page,
        pageSize,
      };
    },

    employee: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      const employee = await ctx.prisma.employee.findUnique({ where: { id } });
      if (!employee) {
        return null;
      }

      if (ctx.user!.role === 'manager') {
        const isSelf = employee.userId === ctx.user!.id;
        const isTeamMember = employee.managerId === ctx.user!.id;
        if (!isSelf && !isTeamMember) {
          throw new Error('Managers can only access team employee records');
        }
      }

      if (ctx.user!.role === 'employee') {
        const me = await findEmployeeByUser(ctx, ctx.user!.id, ctx.user!.email);
        if (!me) {
          if (employee.userId !== ctx.user!.id) {
            throw new Error('Employees can only access their own/team records');
          }
        } else {
          const sameManager = me.managerId && employee.managerId === me.managerId;
          const isManagerRecord = me.managerId && employee.userId === me.managerId;
          if (employee.id !== me.id && !sameManager && !isManagerRecord) {
            throw new Error('Employees can only access their own/team records');
          }
        }
      }

      return {
        ...employee,
        name: getSafeEmployeeName(employee.name, employee.email, employee.id),
      };
    },

    myProfile: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
      });
      if (!user) throw new Error('User not found');

      // Find or create employee record
      let employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [{ email: user.email }, { userId: ctx.user!.id }],
        },
      });

      if (!employee) {
        // Auto-create employee record
        employee = await ctx.prisma.employee.create({
          data: {
            name: getSafeEmployeeName(user.email.split('@')[0], user.email, user.id),
            email: user.email,
            userId: user.id,
            age: 25,
            className: 'N/A',
            subjects: [],
            attendance: 100,
            role: user.role,
            status: 'active',
            location: 'N/A',
            lastLogin: new Date().toISOString(),
          },
        });
      }

      return employee;
    },

    notes: async (_: any, { employeeId }: any, ctx: Context) => {
      requireAdmin(ctx);
      const where: any = employeeId ? { toEmployeeId: employeeId } : {};
      return ctx.prisma.note.findMany({ where, orderBy: { createdAt: 'desc' } });
    },

    myNotes: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      // Get current user email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
      });
      if (!user) return [];

      // Find employee by email or userId
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [{ email: user.email }, { userId: ctx.user!.id }],
        },
      });
      if (!employee) return [];

      return ctx.prisma.note.findMany({
        where: {
          OR: [{ toEmployeeId: employee.id }, { toAll: true }],
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    leaveRequests: async (_: any, { status }: any, ctx: Context) => {
      requireAdmin(ctx);
      const where: any = status ? { status } : {};

      if (ctx.user!.role === 'manager') {
        const teamEmployeeIds = await getManagerTeamEmployeeIds(ctx, ctx.user!.id);
        where.employeeId = { in: teamEmployeeIds.length > 0 ? teamEmployeeIds : [-1] };
      }

      const requests = await ctx.prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { employee: true },
      });
      return requests.map((r: any) => ({
        ...r,
        employeeName: r.employee.name,
      }));
    },

    myLeaveRequests: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      // Get current user email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
      });
      if (!user) return [];

      // Find employee by email or userId
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [{ email: user.email }, { userId: ctx.user!.id }],
        },
      });
      if (!employee) return [];

      return ctx.prisma.leaveRequest.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: 'desc' },
      });
    },

    accessLogs: async (_: any, { page = 1, pageSize = 50 }: any, ctx: Context) => {
      requireAdmin(ctx);
      return ctx.prisma.accessLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    },

    adminUsers: async (_: any, __: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      // Directors see all users, Managers see only managers and employees
      const where: any =
        ctx.user!.role === 'manager' ? { role: { in: ['manager', 'employee'] } } : {}; // Directors see everyone including other directors
      return ctx.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    allUsers: async (_: any, { searchTerm, roleFilter, statusFilter }: any, ctx: Context) => {
      requireAuth(ctx);
      const requesterRole = ctx.user!.role;
      const where: any = {};

      if (searchTerm) {
        where.email = { contains: searchTerm, mode: 'insensitive' };
      }

      if (statusFilter === 'active') {
        where.isActive = true;
      } else if (statusFilter === 'blocked') {
        where.isActive = false;
      }

      const applyRequestedRoleFilter = () => {
        if (!roleFilter || roleFilter === 'all') {
          return;
        }
        where.role = roleFilter;
      };

      if (requesterRole === 'director') {
        applyRequestedRoleFilter();
      } else if (requesterRole === 'manager') {
        const teamUserIds = await getManagerTeamUserIds(ctx, ctx.user!.id);
        const visibleUserIds = [ctx.user!.id, ...teamUserIds];

        if (roleFilter && roleFilter !== 'all') {
          if (roleFilter === 'director') {
            where.role = 'director';
          } else if (roleFilter === 'employee') {
            where.role = 'employee';
            where.id = { in: teamUserIds.length > 0 ? teamUserIds : [-1] };
          } else if (roleFilter === 'manager') {
            where.role = 'manager';
            where.id = ctx.user!.id;
          } else {
            return [];
          }
        } else {
          where.OR = [{ role: 'director' }, { id: { in: visibleUserIds } }];
        }
      } else {
        // Employees can only load managers for messaging.
        if (roleFilter && roleFilter !== 'all' && roleFilter !== 'manager') {
          return [];
        }
        where.role = 'manager';
      }

      return ctx.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    me: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.user.findUnique({ where: { id: ctx.user!.id } });
    },

    // New: Access Control Logs query
    accessControlLogs: async (_: any, { userId, limit = 50 }: any, ctx: Context) => {
      requireDirector(ctx);

      const where = userId ? { userId } : {};

      return ctx.prisma.accessControlLog.findMany({
        where,
        include: {
          user: true,
          admin: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    },

    // New: Dashboard Statistics
    dashboardStats: async (_: any, __: any, ctx: Context) => {
      requireDirector(ctx);

      const totalUsers = await ctx.prisma.user.count();
      const activeUsers = await ctx.prisma.user.count({ where: { isActive: true } });
      const blockedUsers = await ctx.prisma.user.count({ where: { isActive: false } });

      const directors = await ctx.prisma.user.count({ where: { role: 'director' } });
      const managers = await ctx.prisma.user.count({ where: { role: 'manager' } });
      const employees = await ctx.prisma.user.count({ where: { role: 'employee' } });

      const recentActions = await ctx.prisma.accessControlLog.findMany({
        include: {
          user: true,
          admin: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Count logins in last 24 hours (from AccessLog)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentLogins = await ctx.prisma.accessLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: yesterday },
        },
      });

      return {
        totalUsers,
        activeUsers,
        blockedUsers,
        recentActions,
        roleDistribution: {
          directors,
          managers,
          employees,
        },
        recentLogins,
      };
    },

    // New: User Statistics over time
    userStatistics: async (_: any, { days = 7 }: any, ctx: Context) => {
      requireDirector(ctx);

      return ctx.prisma.userStatistics.findMany({
        orderBy: { date: 'desc' },
        take: days,
      });
    },

    // Messaging System
    messages: async (_: any, { conversationId }: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;
      const visibilityFilter = getMessageVisibilityFilter(user!.id, user!.role);

      if (!conversationId) {
        return prisma.message.findMany({
          where: {
            OR: visibilityFilter,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
      }

      return prisma.message.findMany({
        where: {
          conversationId,
          OR: visibilityFilter,
        },
        orderBy: { createdAt: 'asc' },
      });
    },

    myMessages: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      return prisma.message.findMany({
        where: {
          OR: getMessageVisibilityFilter(user!.id, user!.role),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    },

    myConversations: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      const messages = await prisma.message.findMany({
        where: {
          OR: getMessageVisibilityFilter(user!.id, user!.role),
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by conversation and get stats
      const conversationMap = new Map<string, any>();

      messages.forEach((msg) => {
        const convId = msg.conversationId;
        const isUnread =
          !msg.isRead &&
          (msg.recipientId === user!.id ||
            (msg.recipientId === null && msg.recipientRole === user!.role && msg.senderId !== user!.id));

        if (!conversationMap.has(convId)) {
          let participant = 'Broadcast';
          let participantRole = 'all';

          if (msg.senderId === user!.id) {
            participant = msg.recipientEmail || `${msg.recipientRole || 'all'} group`;
            participantRole = msg.recipientRole || 'all';
          } else if (msg.recipientId === user!.id) {
            participant = msg.senderEmail;
            participantRole = msg.senderRole || 'all';
          } else if (msg.recipientId === null && msg.recipientRole === user!.role) {
            participant = `${msg.senderEmail} (broadcast)`;
            participantRole = msg.senderRole || 'all';
          }

          conversationMap.set(convId, {
            conversationId: convId,
            participant,
            participantRole,
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt.toISOString(),
            unreadCount: isUnread ? 1 : 0,
          });
        } else if (isUnread) {
          conversationMap.get(convId).unreadCount++;
        }
      });

      return Array.from(conversationMap.values());
    },

    messageStats: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      const visibilityFilter = getMessageVisibilityFilter(user!.id, user!.role);

      const [total, unread, messages] = await Promise.all([
        prisma.message.count({
          where: {
            OR: visibilityFilter,
          },
        }),
        prisma.message.count({
          where: {
            OR: [
              { recipientId: user!.id, isRead: false },
              { recipientId: null, recipientRole: user!.role, isRead: false },
            ],
            isRead: false,
          },
        }),
        prisma.message.findMany({
          where: {
            OR: visibilityFilter,
          },
          select: { conversationId: true },
          distinct: ['conversationId'],
        }),
      ]);

      return {
        total,
        unread,
        conversations: messages.length,
      };
    },

    // Notifications
    notifications: async (_: any, { type, isRead }: any, ctx: Context) => {
      requireAuth(ctx);
      const where: any = { userId: ctx.user!.id };
      if (type) {
        where.type = { equals: String(type), mode: 'insensitive' };
      }
      if (typeof isRead === 'boolean') {
        where.isRead = isRead;
      }
      return ctx.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    },

    unreadNotifications: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.notification.findMany({
        where: {
          userId: ctx.user!.id,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    notificationCount: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.notification.count({
        where: {
          userId: ctx.user!.id,
          isRead: false,
        },
      });
    },

    // Thread queries
    threads: async (_: any, __: any, ctx: Context) => {
      requireDirector(ctx);
      return ctx.prisma.thread.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    },

    thread: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      const thread = await ctx.prisma.thread.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Check if user is participant
      if (thread && !thread.participants.includes(ctx.user!.id) && ctx.user!.role !== 'director') {
        throw new Error('Access denied to this thread');
      }

      return thread;
    },

    myThreads: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      const threads = await ctx.prisma.thread.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      // Filter threads where user is participant or user is director
      return threads.filter(
        (t) => t.participants.includes(ctx.user!.id) || ctx.user!.role === 'director',
      );
    },

    // Review request queries
    reviewRequests: async (_: any, { status }: any, ctx: Context) => {
      requireDirector(ctx);
      const where: any = {};
      if (status) {
        where.status = status;
      }

      return ctx.prisma.reviewRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { employee: true },
      });
    },

    reviewRequest: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      const request = await ctx.prisma.reviewRequest.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!request) {
        return null;
      }

      // Check permissions
      const isDirector = ctx.user!.role === 'director';
      const isRequestManager = request.requestedByManagerId === ctx.user!.id;
      const isEmployee = request.employee.userId === ctx.user!.id;

      if (!isDirector && !isRequestManager && !isEmployee) {
        throw new Error('Access denied to this review request');
      }

      // Filter what employee sees
      if (isEmployee && !request.visibleToEmployee) {
        return null;
      }

      return request;
    },

    myReviewRequests: async (_: any, __: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      return ctx.prisma.reviewRequest.findMany({
        where: { requestedByManagerId: ctx.user!.id },
        orderBy: { createdAt: 'desc' },
        include: { employee: true },
      });
    },

    // Performance & Attendance Analytics
    employeePerformanceStats: async (_: any, { employeeId }: any, ctx: Context) => {
      requireAdmin(ctx);
      const employee = await ctx.prisma.employee.findUnique({ where: { id: employeeId } });
      if (!employee) throw new Error('Employee not found');
      // Example: Calculate average attendance, review requests, notes, etc.
      const attendance = employee.attendance;
      const notesCount = await ctx.prisma.note.count({ where: { toEmployeeId: employeeId } });
      const reviewCount = await ctx.prisma.reviewRequest.count({ where: { employeeId } });
      return {
        attendance,
        notesCount,
        reviewCount,
        status: employee.status,
        flagged: employee.flagged,
      };
    },

    attendanceTrends: async (_: any, { employeeId }: any, ctx: Context) => {
      requireAdmin(ctx);
      // Example: Return attendance history (stub)
      // Replace with real attendance log model if available
      return [
        { date: '2025-12-01', attendance: 100 },
        { date: '2025-12-02', attendance: 98 },
        { date: '2025-12-03', attendance: 97 },
      ];
    },
  },

  Mutation: {
    addEmployee: async (_: any, { input }: any, ctx: Context) => {
      requireDirector(ctx);
      const now = new Date().toISOString();
      const sanitizedInput = {
        ...input,
        name: getSafeEmployeeName(input.name, input.email),
      };
      const employee = await ctx.prisma.employee.create({
        data: {
          ...sanitizedInput,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        },
      } as any);
      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'ADD_EMPLOYEE',
          details: stringifyAuditDetails({
            employeeId: employee.id,
            createdBy: ctx.user!.email,
            new: {
              name: sanitizedInput.name,
              role: sanitizedInput.role,
              status: sanitizedInput.status,
              managerId: sanitizedInput.managerId ?? null,
            },
          }),
        },
      });
      return {
        ...employee,
        name: getSafeEmployeeName(employee.name, employee.email, employee.id),
      };
    },

    setup2FA: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      // Generate a new 2FA secret for the user
      const { otpauthUrl, qrCode } = await generate2FASecret(ctx.user!.id);
      // Secret is already stored in user by util
      return { otpauthUrl, qrCode };
    },

    verify2FA: async (_: any, { code }: any, ctx: Context) => {
      requireAuth(ctx);
      // Get user's 2FA secret
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
        select: { twoFASecret: true, twoFAEnabled: true },
      });
      const twoFASecret: string | undefined = user?.twoFASecret ?? undefined;
      if (!twoFASecret) {
        throw new Error('2FA not set up for this user');
      }
      // Verify code
      const valid = verify2FACode(twoFASecret, code);
      if (!valid) {
        return { success: false, message: 'Invalid 2FA code' };
      }
      // Mark 2FA as enabled
      await ctx.prisma.user.update({
        where: { id: ctx.user!.id },
        data: { twoFAEnabled: true },
      });
      return { success: true, message: '2FA verified and enabled' };
    },

    updateEmployee: async (_: any, { id, input }: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      const existingEmployee = await ctx.prisma.employee.findUnique({ where: { id } });
      if (!existingEmployee) {
        throw new Error('Employee not found');
      }

      if (ctx.user!.role === 'manager') {
        const managesEmployee = existingEmployee.managerId === ctx.user!.id;
        if (!managesEmployee) {
          throw new Error('Managers can only edit employees in their own team');
        }
        if (existingEmployee.role === 'director') {
          throw new Error('Managers cannot edit Director records');
        }
        if (Object.prototype.hasOwnProperty.call(input, 'role') || Object.prototype.hasOwnProperty.call(input, 'managerId')) {
          throw new Error('Managers cannot change role or team ownership');
        }
      }

      const nextInput: Record<string, any> = { ...input };
      if (typeof nextInput.name === 'string') {
        nextInput.name = getSafeEmployeeName(nextInput.name, nextInput.email);
      }

      // If role is being changed, also update the User table
      if (nextInput.role && ctx.user!.role === 'director') {
        if (existingEmployee.userId) {
          await ctx.prisma.user.update({
            where: { id: existingEmployee.userId },
            data: { role: nextInput.role },
          });
        }
      }

      const updated = await ctx.prisma.employee.update({
        where: { id },
        data: {
          ...nextInput,
          updatedAt: new Date(),
        } as any,
      });
      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'UPDATE_EMPLOYEE',
          details: stringifyAuditDetails({
            employeeId: id,
            updatedBy: ctx.user!.email,
            previous: {
              name: existingEmployee.name,
              role: existingEmployee.role,
              status: existingEmployee.status,
              location: existingEmployee.location,
              managerId: existingEmployee.managerId ?? null,
            },
            updated: {
              name: updated.name,
              role: updated.role,
              status: updated.status,
              location: updated.location,
              managerId: updated.managerId ?? null,
            },
          }),
        },
      });
      return updated;
    },

    updateMyProfile: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
      });
      if (!user) throw new Error('User not found');

      // Find employee record
      let employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [{ email: user.email }, { userId: ctx.user!.id }],
        },
      });

      if (!employee) {
        throw new Error('Employee profile not found');
      }

      // Update only allowed fields
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.name) {
        updateData.name = getSafeEmployeeName(input.name, input.email || user.email, ctx.user!.id);
      }
      if (input.email) {
        updateData.email = input.email;
        // Also update user email
        await ctx.prisma.user.update({
          where: { id: ctx.user!.id },
          data: { email: input.email },
        });
      }
      if (typeof input.age === 'number') updateData.age = input.age;
      if (typeof input.location === 'string') updateData.location = input.location;
      if (Object.prototype.hasOwnProperty.call(input, 'avatar')) {
        updateData.avatar = input.avatar ? String(input.avatar).trim() : null;
      }

      const updatedProfile = await ctx.prisma.employee.update({
        where: { id: employee.id },
        data: updateData,
      });

      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'UPDATE_MY_PROFILE',
          details: stringifyAuditDetails({
            employeeId: employee.id,
            updatedBy: ctx.user!.email,
            previous: {
              name: employee.name,
              email: employee.email,
              age: employee.age,
              location: employee.location,
              avatar: employee.avatar || null,
            },
            updated: {
              name: updatedProfile.name,
              email: updatedProfile.email,
              age: updatedProfile.age,
              location: updatedProfile.location,
              avatar: updatedProfile.avatar || null,
            },
          }),
        },
      });

      return updatedProfile;
    },

    deleteEmployee: async (_: any, { id }: any, ctx: Context) => {
      // Only Director can delete employees
      requireDirector(ctx);
      await ctx.prisma.employee.delete({ where: { id } });
      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'DELETE_EMPLOYEE',
          details: `Deleted employee ${id}`,
        },
      });
      return true;
    },

    deleteUser: async (_: any, { id }: any, ctx: Context) => {
      // Only Director can delete users (admins, managers, employees)
      requireDirector(ctx);
      await ctx.prisma.user.delete({ where: { id } });
      return true;
    },

    toggleUserAccess: async (_: any, { id, isActive, reason, blockedUntil }: any, ctx: Context) => {
      // Only Director can grant/deny user access (Enhanced Access Control Feature)
      requireDirector(ctx);

      const updateData: any = { isActive };

      // Handle temporary blocks
      if (blockedUntil && !isActive) {
        updateData.accessBlockedUntil = new Date(blockedUntil);
      } else {
        updateData.accessBlockedUntil = null;
      }

      // Add reason if provided
      if (reason) {
        updateData.accessBlockReason = reason;
      }

      await ctx.prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Create audit log entry
      await ctx.prisma.accessControlLog.create({
        data: {
          userId: id,
          adminId: ctx.user!.id,
          action: isActive ? 'GRANTED' : blockedUntil ? 'TEMP_BLOCK' : 'DENIED',
          reason: reason || null,
          blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
        },
      });

      return true;
    },

    // New: Bulk access control
    bulkToggleAccess: async (_: any, { userIds, isActive, reason }: any, ctx: Context) => {
      requireDirector(ctx);

      for (const userId of userIds) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: {
            isActive,
            accessBlockReason: reason || null,
          },
        });

        // Create audit log for each user
        await ctx.prisma.accessControlLog.create({
          data: {
            userId,
            adminId: ctx.user!.id,
            action: isActive ? 'GRANTED' : 'DENIED',
            reason: reason || null,
          },
        });
      }

      return true;
    },

    terminateEmployee: async (_: any, { id }: any, ctx: Context) => {
      requireDirector(ctx);
      const before = await ctx.prisma.employee.findUnique({ where: { id } });
      if (!before) {
        throw new Error('Employee not found');
      }
      const updated = await ctx.prisma.employee.update({
        where: { id },
        data: {
          status: 'terminated',
          updatedAt: new Date(),
        },
      });
      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'TERMINATE_EMPLOYEE',
          details: stringifyAuditDetails({
            employeeId: id,
            terminatedBy: ctx.user!.email,
            previousStatus: before.status,
            newStatus: 'terminated',
          }),
        },
      });
      return updated;
    },

    flagEmployee: async (_: any, { id, flagged }: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      const before = await ctx.prisma.employee.findUnique({ where: { id } });
      if (!before) {
        throw new Error('Employee not found');
      }
      if (ctx.user!.role === 'manager' && before.managerId !== ctx.user!.id) {
        throw new Error('Managers can only flag employees in their own team');
      }
      const updated = await ctx.prisma.employee.update({
        where: { id },
        data: {
          flagged,
          updatedAt: new Date(),
        },
      });
      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'FLAG_EMPLOYEE',
          details: stringifyAuditDetails({
            employeeId: id,
            flaggedBy: ctx.user!.email,
            previousFlagged: before.flagged,
            newFlagged: flagged,
          }),
        },
      });
      return updated;
    },

    generateEmployeeLogins: async (_: any, __: any, ctx: Context) => {
      requireDirector(ctx);

      let created = 0;
      let skipped = 0;
      let failed = 0;

      try {
        // Get all employees without userId
        const employeesWithoutLogin = await ctx.prisma.employee.findMany({
          where: {
            userId: null,
          },
        });

        for (const employee of employeesWithoutLogin) {
          try {
            // Generate deterministic, unique email from name:
            // "John Doe" -> "john.doe@gmail.com", then john.doe.2@gmail.com, etc.
            const displayName = getSafeEmployeeName(employee.name, employee.email, employee.id);
            const normalizedName = displayName
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .trim()
              .replace(/\s+/g, '.')
              .replace(/\.{2,}/g, '.')
              .replace(/^\.+|\.+$/g, '');

            const baseEmailName = normalizedName || `employee.${employee.id}`;
            const defaultPassword = 'employee123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            let attempt = 0;
            let resolved = false;

            while (!resolved && attempt < 100) {
              const candidateEmail =
                attempt === 0
                  ? `${baseEmailName}@gmail.com`
                  : `${baseEmailName}.${attempt + 1}@gmail.com`;

              const existingUser = await ctx.prisma.user.findUnique({
                where: { email: candidateEmail },
              });

              if (existingUser) {
                // If this user is not linked to another employee, reuse and link.
                const linkedEmployee = await ctx.prisma.employee.findFirst({
                  where: { userId: existingUser.id },
                });

                if (!linkedEmployee || linkedEmployee.id === employee.id) {
                  await ctx.prisma.employee.update({
                    where: { id: employee.id },
                    data: {
                      userId: existingUser.id,
                      email: candidateEmail,
                    },
                  });
                  skipped++;
                  resolved = true;
                  break;
                }

                attempt++;
                continue;
              }

              // Ensure we also don't collide with any prefilled employee email.
              const existingEmployeeEmail = await ctx.prisma.employee.findFirst({
                where: { email: candidateEmail },
              });
              if (existingEmployeeEmail && existingEmployeeEmail.id !== employee.id) {
                attempt++;
                continue;
              }

              // Create new local-login user and link.
              const newUser = await ctx.prisma.user.create({
                data: {
                  email: candidateEmail,
                  passwordHash: hashedPassword,
                  role: 'employee',
                  provider: 'local',
                },
              });

              await ctx.prisma.employee.update({
                where: { id: employee.id },
                data: {
                  userId: newUser.id,
                  email: candidateEmail,
                },
              });

              created++;
              resolved = true;
            }

            if (!resolved) {
              failed++;
            }
          } catch (error) {
            console.error(`Failed to create login for employee ${employee.name}:`, error);
            failed++;
          }
        }

        return {
          success: true,
          message: `Generated logins: ${created} created, ${skipped} linked, ${failed} failed`,
          created,
          skipped,
          failed,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to generate logins: ${error.message}`,
          created,
          skipped,
          failed,
        };
      }
    },

    sendNote: async (_: any, { input }: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      const { message, toEmployeeId, toUserId, toAll } = input;

      if (ctx.user!.role === 'manager') {
        if (toAll) {
          throw new Error('Managers cannot broadcast notes to all users');
        }

        if (toUserId) {
          const targetUser = await ctx.prisma.user.findUnique({ where: { id: toUserId } });
          if (!targetUser) {
            throw new Error('Recipient user not found');
          }
          if (targetUser.role === 'director') {
            // manager -> director allowed
          } else if (targetUser.role === 'employee') {
            const teamUserIds = await getManagerTeamUserIds(ctx, ctx.user!.id);
            if (!teamUserIds.includes(toUserId)) {
              throw new Error('Managers can only send notes to employees in their team');
            }
          } else {
            throw new Error('Managers can send notes only to their team employees or directors');
          }
        }

        if (toEmployeeId) {
          const targetEmployee = await ctx.prisma.employee.findUnique({ where: { id: toEmployeeId } });
          if (!targetEmployee || targetEmployee.managerId !== ctx.user!.id) {
            throw new Error('Managers can only send notes to employees in their team');
          }
        }
      }

      const createdNote = await ctx.prisma.note.create({
        data: {
          message,
          fromUserId: ctx.user!.id,
          toEmployeeId: toEmployeeId || null,
          toUserId: toUserId || null,
          toAll: toAll || false,
          isRead: false,
        },
      });

      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'SEND_NOTE',
          details: stringifyAuditDetails({
            toEmployeeId: toEmployeeId || null,
            toUserId: toUserId || null,
            toAll: Boolean(toAll),
          }),
        },
      });

      return createdNote;
    },

    markNoteAsRead: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.note.update({
        where: { id },
        data: { isRead: true },
      });
    },

    createLeaveRequest: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);

      // Get current user email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
      });
      if (!user) {
        throw new Error('User not found');
      }

      // Find employee by email or userId
      let employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [{ email: user.email }, { userId: ctx.user!.id }],
        },
      });

      // If no employee record exists, create one automatically
      if (!employee) {
        employee = await ctx.prisma.employee.create({
          data: {
            name: getSafeEmployeeName(user.email.split('@')[0], user.email, user.id),
            email: user.email,
            userId: user.id,
            age: 25,
            className: 'N/A',
            subjects: [],
            attendance: 100,
            role: user.role,
            status: 'active',
            location: 'N/A',
            lastLogin: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      const leaveRequest = await ctx.prisma.leaveRequest.create({
        data: {
          employee: { connect: { id: employee.id } },
          reason: input.reason,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          type: input.type || 'annual', // Default to 'annual' if not provided
          status: 'pending',
        },
      });
      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'CREATE_LEAVE_REQUEST',
          details: `Created leave request for employee ${employee.id}`,
        },
      });
      return leaveRequest;
    },

    updateLeaveRequestStatus: async (_: any, { id, status, adminNote }: any, ctx: Context) => {
      requireAdmin(ctx);
      const leaveReq = await ctx.prisma.leaveRequest.findUnique({
        where: { id },
        include: { employee: true },
      });
      if (!leaveReq) {
        throw new Error('Leave request not found');
      }

      const requestedStatus = String(status || '').toLowerCase();
      let normalizedStatus = requestedStatus;

      const leaveStart = new Date(leaveReq.startDate);
      const leaveEnd = new Date(leaveReq.endDate);
      const leaveDays = Math.max(1, Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const leaveType = String(leaveReq.type || 'annual').toLowerCase();
      const specialLeaveTypes = new Set(['special', 'sabbatical', 'maternity', 'paternity', 'medical-extended']);
      const requiresDirectorApproval = leaveDays > 5 || specialLeaveTypes.has(leaveType);

      if (ctx.user!.role === 'manager' && requestedStatus === 'approved' && requiresDirectorApproval) {
        normalizedStatus = 'pending_director';
      }

      const hasAdminNote = typeof adminNote === 'string';
      const normalizedAdminNote = hasAdminNote ? String(adminNote).trim() : null;

      const updated = await ctx.prisma.leaveRequest.update({
        where: { id },
        data: {
          status: normalizedStatus,
          ...(hasAdminNote ? { adminNote: normalizedAdminNote || null } : {}),
          updatedAt: new Date(),
        },
      });

      const approverEmployee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [{ userId: ctx.user!.id }, { email: ctx.user!.email }],
        },
      });
      const approverName =
        getSafeEmployeeName(approverEmployee?.name, ctx.user!.email, ctx.user!.id) || ctx.user!.email;
      const employeeName =
        leaveReq?.employee?.name || leaveReq?.employee?.email || `Employee #${leaveReq?.employeeId || 'unknown'}`;

      await ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: ctx.user!.email,
          action: 'UPDATE_LEAVE_REQUEST_STATUS',
          details: stringifyAuditDetails({
            leaveRequestId: id,
            employeeName,
            updatedBy: approverName,
            role: ctx.user!.role,
            requestedStatus,
            appliedStatus: normalizedStatus,
            leaveDays,
            leaveType,
            directorApprovalRequired: requiresDirectorApproval,
            adminNote: adminNote || null,
          }),
        },
      });

      if (
        leaveReq &&
        leaveReq.employee &&
        ['approved', 'rejected', 'pending_director'].includes(normalizedStatus) &&
        leaveReq.employee.userId &&
        leaveReq.employee.email
      ) {
        let employeeMessage = `Your leave request for ${employeeName} was ${normalizedStatus} by ${approverName}.`;
        if (normalizedStatus === 'pending_director') {
          employeeMessage = `Manager ${approverName} submitted your leave request for Director approval (${leaveType}, ${leaveDays} day${leaveDays === 1 ? '' : 's'}).`;
        }

        await ctx.prisma.notification.create({
          data: {
            userId: leaveReq.employee.userId,
            userEmail: leaveReq.employee.email,
            title: `Leave Request ${normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}`,
            message: `${employeeMessage} ${adminNote ? 'Note: ' + adminNote : ''}`.trim(),
            type: 'LEAVE',
            actionUrl: `/leaveRequests`,
            metadata: { leaveRequestId: leaveReq.id, status: normalizedStatus, approverName, employeeName },
          },
        });
        // Send Slack alert if webhook is configured
        const slackWebhook = process.env.SLACK_WEBHOOK_URL;
        if (slackWebhook) {
          const slackText = `Leave request for ${employeeName} (${leaveReq.startDate} to ${leaveReq.endDate}) was ${normalizedStatus} by ${approverName}. ${adminNote ? 'Note: ' + adminNote : ''}`;
          await sendSlackMessage(slackWebhook, slackText);
        }
      }

      // If a manager approves/rejects leave, notify all directors with manager + employee names.
      if (ctx.user!.role === 'manager' && leaveReq && ['approved', 'rejected', 'pending_director'].includes(normalizedStatus)) {
        const directors = await ctx.prisma.user.findMany({
          where: { role: 'director', id: { not: ctx.user!.id } },
          select: { id: true, email: true },
        });

        if (directors.length > 0) {
          await ctx.prisma.notification.createMany({
            data: directors.map((director) => ({
              userId: director.id,
              userEmail: director.email,
              title: `Manager ${approverName} set leave request to ${normalizedStatus}`,
              message: `${approverName} (${ctx.user!.email}) set leave for ${employeeName} to ${normalizedStatus} (${leaveType}, ${leaveDays} day${leaveDays === 1 ? '' : 's'}). ${adminNote ? `Note: ${adminNote}` : ''}`.trim(),
              type: 'APPROVAL',
              actionUrl: '/leaveRequests',
              metadata: {
                leaveRequestId: leaveReq.id,
                status: normalizedStatus,
                approverId: ctx.user!.id,
                approverName,
                employeeName,
                leaveType,
                leaveDays,
              },
            })),
          });
        }
      }

      return updated;
    },

    changePassword: async (_: any, { currentPassword, newPassword }: any, ctx: Context) => {
      requireAuth(ctx);
      const bcrypt = require('bcryptjs');

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await ctx.prisma.user.update({
        where: { id: ctx.user!.id },
        data: { passwordHash: newHash, updatedAt: new Date() },
      });

      return { success: true, message: 'Password changed successfully' };
    },

    logAccess: async (_: any, { action, details }: any, ctx: Context) => {
      requireAuth(ctx);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
      });

      return ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: user?.email || 'unknown',
          action,
          details: details || null,
          ipAddress: null,
        },
      });
    },

    // Messaging mutations
    sendMessage: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      const senderRole = user!.role;
      let recipient: any = null;
      let parentMsg: any = null;
      let resolvedRecipientId: number | null = input.recipientId || null;
      let resolvedRecipientRole: string | null = input.recipientRole || null;
      const managerTeamUserIds =
        senderRole === 'manager' ? await getManagerTeamUserIds(ctx, user!.id) : [];

      if (input.replyToId) {
        parentMsg = await prisma.message.findUnique({
          where: { id: input.replyToId },
        });
        if (!parentMsg) {
          throw new Error('Reply target message not found');
        }

        const canAccessParent =
          parentMsg.senderId === user!.id ||
          parentMsg.recipientId === user!.id ||
          (parentMsg.recipientId === null && parentMsg.recipientRole === user!.role);
        if (!canAccessParent) {
          throw new Error('You cannot reply to this conversation');
        }

        if (!resolvedRecipientId && !resolvedRecipientRole) {
          if (parentMsg.senderId !== user!.id) {
            resolvedRecipientId = parentMsg.senderId;
          } else if (parentMsg.recipientId) {
            resolvedRecipientId = parentMsg.recipientId;
          } else if (parentMsg.recipientRole) {
            resolvedRecipientRole = parentMsg.recipientRole;
          }
        }
      }

      if (resolvedRecipientId) {
        recipient = await prisma.user.findUnique({
          where: { id: resolvedRecipientId },
        });
        if (!recipient) {
          throw new Error('Recipient not found');
        }
        resolvedRecipientRole = recipient.role;
      }

      // Messaging role policy:
      // - Employee: direct to manager only
      // - Manager: direct to team employees or directors only
      // - Director: can direct/broadcast to anyone
      if (senderRole === 'employee') {
        if (!resolvedRecipientId || resolvedRecipientRole !== 'manager') {
          throw new Error('Employees can send direct messages to Managers only.');
        }
      }

      if (senderRole === 'manager') {
        if (!resolvedRecipientId) {
          throw new Error('Managers can send direct messages only. Select a team employee or a Director.');
        }
        if (resolvedRecipientRole === 'director') {
          // allowed
        } else if (resolvedRecipientRole === 'employee') {
          const isTeamEmployee = managerTeamUserIds.includes(resolvedRecipientId);
          if (!isTeamEmployee) {
            throw new Error('Managers can message only employees in their own team.');
          }
        } else {
          throw new Error('Managers can message team employees or Directors only.');
        }
      }

      let conversationId = '';
      if (parentMsg) {
        conversationId = parentMsg.conversationId;
      } else if (resolvedRecipientId) {
        const ids = [user!.id, resolvedRecipientId].sort();
        conversationId = `dm_${ids[0]}_${ids[1]}`;
      } else if (resolvedRecipientRole) {
        conversationId = `broadcast_${user!.id}_${Date.now()}`;
      } else {
        throw new Error('Please select a valid recipient');
      }

      let recipientEmail: string | null = null;
      if (recipient) {
        recipientEmail = recipient.email;
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: user!.id,
          senderEmail: user!.email,
          senderRole: user!.role,
          recipientId: resolvedRecipientId,
          recipientEmail,
          recipientRole: resolvedRecipientRole,
          subject: input.subject || null,
          message: input.message,
          messageType: resolvedRecipientId ? (input.replyToId ? 'reply' : 'direct') : 'broadcast',
          priority: input.priority || 'normal',
          replyToId: input.replyToId || null,
          isRead: false,
        },
      });

      // Create notification for recipient(s)
      if (resolvedRecipientId) {
        // Single recipient notification
        await prisma.notification.create({
          data: {
            userId: resolvedRecipientId,
            userEmail: recipientEmail!,
            title: `New message from ${user!.email}`,
            message: input.subject || input.message.substring(0, 100),
            type: 'MESSAGE',
            actionUrl: `/messages?conversation=${conversationId}`,
            metadata: { messageId: message.id, senderId: user!.id },
          },
        });
      } else if (resolvedRecipientRole) {
        // Broadcast to role - create notifications for all users of that role
        const recipients = await prisma.user.findMany({
          where: {
            role: resolvedRecipientRole,
            id: { not: user!.id }, // Don't notify sender
          },
        });

        const notifications = recipients.map((recipient) => ({
          userId: recipient.id,
          userEmail: recipient.email,
          title: `Broadcast from ${user!.role}: ${user!.email}`,
          message: input.subject || input.message.substring(0, 100),
          type: 'MESSAGE',
          actionUrl: `/messages?conversation=${conversationId}`,
          metadata: { messageId: message.id, senderId: user!.id },
        }));

        await prisma.notification.createMany({ data: notifications });
      }

      await prisma.accessLog.create({
        data: {
          userId: user!.id,
          userEmail: user!.email,
          action: 'SEND_MESSAGE',
          details: stringifyAuditDetails({
            senderRole,
            recipientId: resolvedRecipientId,
            recipientRole: resolvedRecipientRole,
            conversationId,
          }),
        },
      });

      return message;
    },

    markMessageAsRead: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      const message = await ctx.prisma.message.findFirst({
        where: {
          id,
          recipientId: ctx.user!.id,
        },
      });
      if (!message) {
        throw new Error('Not authorized to mark this message as read');
      }
      return ctx.prisma.message.update({
        where: { id: message.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    },

    markConversationAsRead: async (_: any, { conversationId }: any, ctx: Context) => {
      requireAuth(ctx);
      await ctx.prisma.message.updateMany({
        where: {
          conversationId,
          OR: [
            { recipientId: ctx.user!.id },
            { recipientId: null, recipientRole: ctx.user!.role },
          ],
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return true;
    },

    deleteMessage: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      // Only sender or director can delete
      const message = await ctx.prisma.message.findUnique({
        where: { id },
      });

      if (message && (message.senderId === ctx.user!.id || ctx.user!.role === 'director')) {
        await ctx.prisma.message.delete({ where: { id } });
        return true;
      }
      throw new Error('Not authorized to delete this message');
    },

    // Notification mutations
    markNotificationAsRead: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      const notification = await ctx.prisma.notification.findFirst({
        where: {
          id,
          userId: ctx.user!.id,
        },
      });
      if (!notification) {
        throw new Error('Not authorized to update this notification');
      }
      return ctx.prisma.notification.update({
        where: { id: notification.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    },

    markAllNotificationsAsRead: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      await ctx.prisma.notification.updateMany({
        where: {
          userId: ctx.user!.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return true;
    },

    deleteNotification: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      const result = await ctx.prisma.notification.deleteMany({
        where: {
          id,
          userId: ctx.user!.id,
        },
      });
      if (result.count === 0) {
        throw new Error('Not authorized to delete this notification');
      }
      return true;
    },

    // Create notification (Admin/Manager)
    createNotification: async (_: any, { input }: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      const { prisma } = ctx;
      const normalizedType = String(input.type || 'INFO')
        .trim()
        .toUpperCase();

      // Create notifications for recipients
      const notifications = [];

      if (input.recipientUserId) {
        // Single recipient
        const recipient = await prisma.user.findUnique({
          where: { id: input.recipientUserId },
        });

        if (!recipient) {
          throw new Error('Recipient user not found');
        }

        const notification = await prisma.notification.create({
          data: {
            userId: recipient.id,
            userEmail: recipient.email,
            title: input.title,
            message: input.message,
            type: normalizedType,
            linkTo: input.linkTo || null,
          },
        });
        notifications.push(notification);
      } else if (input.recipientRole) {
        // Broadcast to role
        const recipients = await prisma.user.findMany({
          where: { role: input.recipientRole },
        });
        if (recipients.length === 0) {
          throw new Error('No recipients found for this role');
        }

        for (const recipient of recipients) {
          const notification = await prisma.notification.create({
            data: {
              userId: recipient.id,
              userEmail: recipient.email,
              title: input.title,
              message: input.message,
              type: normalizedType,
              linkTo: input.linkTo || null,
            },
          });
          notifications.push(notification);
        }
      } else {
        throw new Error('Either recipientUserId or recipientRole is required');
      }

      return notifications[0]; // Return first notification created
    },

    // Send thread message
    sendThreadMessage: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      let threadId = input.threadId;

      // Create new thread if not provided
      if (!threadId) {
        const participants = input.recipientUserIds
          ? [user!.id, ...input.recipientUserIds]
          : [user!.id];

        const thread = await prisma.thread.create({
          data: {
            participants,
            linkedEmployeeId: input.linkedEmployeeId || null,
            linkedRequestId: input.linkedRequestId || null,
            title: input.title || null,
          },
        });
        threadId = thread.id;
      }

      // Create message in thread
      const message = await prisma.threadMessage.create({
        data: {
          threadId,
          senderId: user!.id,
          senderEmail: user!.email,
          senderRole: user!.role,
          body: input.body,
          type: 'USER',
        },
      });

      // Create notifications for other participants
      const thread = await prisma.thread.findUnique({
        where: { id: threadId },
      });

      if (thread) {
        const otherParticipants = thread.participants.filter((p) => p !== user!.id);

        for (const participantId of otherParticipants) {
          const participant = await prisma.user.findUnique({
            where: { id: participantId },
          });

          if (participant) {
            await prisma.notification.create({
              data: {
                userId: participant.id,
                userEmail: participant.email,
                title: `New message from ${user!.email}`,
                message: input.body.substring(0, 100),
                type: 'MESSAGE',
                linkTo: `/threads/${threadId}`,
                metadata: { threadId, messageId: message.id },
              },
            });
          }
        }
      }

      return message;
    },

    // Create review request (Flag/Terminate)
    createReviewRequest: async (_: any, { input }: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      const { prisma, user } = ctx;

      // Validate reason text length
      if (!input.managerReasonText || input.managerReasonText.trim().length < 20) {
        throw new Error('Reason details must be at least 20 characters');
      }

      // Get employee
      const employee = await prisma.employee.findUnique({
        where: { id: input.employeeId },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Determine new status
      const newStatus = input.type === 'FLAG' ? 'UNDER_REVIEW' : 'TERMINATION_REQUESTED';

      // Update employee status
      await prisma.employee.update({
        where: { id: input.employeeId },
        data: { status: newStatus },
      });

      // Create review request
      const request = await prisma.reviewRequest.create({
        data: {
          employeeId: input.employeeId,
          requestedByManagerId: user!.id,
          requestedByEmail: user!.email,
          type: input.type,
          status: 'PENDING',
          managerReasonType: input.managerReasonType,
          managerReasonText: input.managerReasonText,
          visibleToEmployee: input.visibleToEmployee,
        },
      });

      // Create thread for discussion
      const thread = await prisma.thread.create({
        data: {
          participants: [user!.id],
          linkedEmployeeId: input.employeeId,
          linkedRequestId: request.id,
          title: `${input.type} Request: ${employee.name}`,
        },
      });

      // Update request with thread ID
      await prisma.reviewRequest.update({
        where: { id: request.id },
        data: { threadId: thread.id },
      });

      // System message in thread
      await prisma.threadMessage.create({
        data: {
          threadId: thread.id,
          senderId: 0,
          senderEmail: 'system',
          senderRole: 'system',
          body: `Manager ${user!.email} created ${input.type} request.\nReason Type: ${input.managerReasonType}\nReason: ${input.managerReasonText}`,
          type: 'SYSTEM',
        },
      });

      // Notify all directors/admins
      const admins = await prisma.user.findMany({
        where: { role: 'director' },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            userEmail: admin.email,
            title: `${input.type} Request from ${user!.email}`,
            message: `Review needed for employee: ${employee.name}`,
            type: 'APPROVAL',
            linkTo: `/review-requests/${request.id}`,
            metadata: { requestId: request.id, employeeId: input.employeeId },
          },
        });
      }

      // Optionally notify employee
      if (input.visibleToEmployee && employee.userId) {
        const empUser = await prisma.user.findUnique({
          where: { id: employee.userId },
        });

        if (empUser) {
          await prisma.notification.create({
            data: {
              userId: empUser.id,
              userEmail: empUser.email,
              title: 'Your status is under review',
              message: 'A review has been initiated. You will be notified of the outcome.',
              type: 'WARNING',
              linkTo: '/my-profile',
            },
          });
        }
      }

      await ctx.prisma.accessLog.create({
        data: {
          userId: user!.id,
          userEmail: ctx.user!.email,
          action: 'CREATE_REVIEW_REQUEST',
          details: `Created ${input.type} review request for employee ${input.employeeId}`,
        },
      });
      return request;
    },

    // Admin review decision
    reviewDecision: async (_: any, { input }: any, ctx: Context) => {
      requireDirector(ctx);
      const { prisma, user } = ctx;

      // Get request
      const request = await prisma.reviewRequest.findUnique({
        where: { id: input.requestId },
        include: { employee: true },
      });

      if (!request) {
        throw new Error('Review request not found');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Request has already been reviewed');
      }

      // Validate admin comment
      if (!input.adminComment || input.adminComment.trim().length < 10) {
        throw new Error('Admin comment must be at least 10 characters');
      }

      // Determine new employee status
      let newEmployeeStatus = request.employee.status;

      if (input.decision === 'APPROVED') {
        newEmployeeStatus = request.type === 'FLAG' ? 'FLAGGED' : 'TERMINATED';
      } else {
        newEmployeeStatus = 'ACTIVE'; // Revert to active
      }

      // Update employee status
      await prisma.employee.update({
        where: { id: request.employeeId },
        data: {
          status: newEmployeeStatus,
          flagged: request.type === 'FLAG' && input.decision === 'APPROVED',
        },
      });

      // Update request
      const updatedRequest = await prisma.reviewRequest.update({
        where: { id: input.requestId },
        data: {
          status: input.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          adminComment: input.adminComment,
          reviewedByAdminId: user!.id,
          reviewedAt: new Date(),
        },
        include: { employee: true },
      });

      // System message in thread
      if (request.threadId) {
        await prisma.threadMessage.create({
          data: {
            threadId: request.threadId,
            senderId: 0,
            senderEmail: 'system',
            senderRole: 'system',
            body: `Admin ${user!.email} ${input.decision.toLowerCase()} this request.\nComment: ${input.adminComment}`,
            type: 'SYSTEM',
          },
        });
      }

      // Notify manager
      const manager = await prisma.user.findUnique({
        where: { id: request.requestedByManagerId },
      });

      if (manager) {
        await prisma.notification.create({
          data: {
            userId: manager.id,
            userEmail: manager.email,
            title: `Your ${request.type} request was ${input.decision.toLowerCase()}`,
            message: `For employee: ${request.employee.name}. Comment: ${input.adminComment}`,
            type: 'APPROVAL',
            linkTo: `/review-requests/${request.id}`,
            metadata: { requestId: request.id, decision: input.decision },
          },
        });
      }

      // Notify employee if visible
      if (request.visibleToEmployee && request.employee.userId) {
        const empUser = await prisma.user.findUnique({
          where: { id: request.employee.userId },
        });

        if (empUser) {
          const title =
            input.decision === 'APPROVED'
              ? `Your status is now ${newEmployeeStatus}`
              : 'Review completed - no change to your status';

          await prisma.notification.create({
            data: {
              userId: empUser.id,
              userEmail: empUser.email,
              title,
              message:
                input.decision === 'APPROVED'
                  ? 'Please contact your manager for details.'
                  : 'Your employment status remains unchanged.',
              type: input.decision === 'APPROVED' ? 'CRITICAL' : 'INFO',
              linkTo: '/my-profile',
            },
          });
        }
      }

      await prisma.accessLog.create({
        data: {
          userId: user!.id,
          userEmail: ctx.user!.email,
          action: 'REVIEW_DECISION',
          details: `Review decision ${input.decision} for request ${input.requestId}`,
        },
      });
      return updatedRequest;
    },

    sendSlackNotification: async (_: any, { webhookUrl, text }: any, ctx: Context) => {
      requireAdmin(ctx);
      await sendSlackMessage(webhookUrl, text);
      return { success: true };
    },
  },
};
