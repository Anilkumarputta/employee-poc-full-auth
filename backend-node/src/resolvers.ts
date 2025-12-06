import { PrismaClient, Employee as PrismaEmployee } from "@prisma/client";
import * as bcrypt from "bcryptjs";

type Context = {
  prisma: PrismaClient;
  user: { id: number; role: string } | null;
};

function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new Error("Not authenticated");
  }
}

function requireDirector(ctx: Context) {
  requireAuth(ctx);
  if (ctx.user!.role !== "director") {
    throw new Error("Director only - highest level access required");
  }
}

function requireManagerOrAbove(ctx: Context) {
  requireAuth(ctx);
  if (!["director", "manager"].includes(ctx.user!.role)) {
    throw new Error("Manager or Director access required");
  }
}

function requireAdmin(ctx: Context) {
  requireAuth(ctx);
  if (!["director", "manager", "admin"].includes(ctx.user!.role)) {
    throw new Error("Admin access required");
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

    myProfile: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id }
      });
      if (!user) throw new Error("User not found");
      
      // Find or create employee record
      let employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [
            { email: user.email },
            { userId: ctx.user!.id }
          ]
        }
      });
      
      if (!employee) {
        // Auto-create employee record
        employee = await ctx.prisma.employee.create({
          data: {
            name: user.email.split('@')[0],
            email: user.email,
            userId: user.id,
            age: 25,
            className: "N/A",
            subjects: [],
            attendance: 100,
            role: user.role,
            status: "active",
            location: "N/A",
            lastLogin: new Date().toISOString()
          }
        });
      }
      
      return employee;
    },

    notes: async (_: any, { employeeId }: any, ctx: Context) => {
      requireAdmin(ctx);
      const where: any = employeeId ? { toEmployeeId: employeeId } : {};
      return ctx.prisma.note.findMany({ where, orderBy: { createdAt: "desc" } });
    },

    myNotes: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      // Get current user email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id }
      });
      if (!user) return [];
      
      // Find employee by email or userId
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [
            { email: user.email },
            { userId: ctx.user!.id }
          ]
        }
      });
      if (!employee) return [];
      
      return ctx.prisma.note.findMany({
        where: {
          OR: [
            { toEmployeeId: employee.id },
            { toAll: true }
          ]
        },
        orderBy: { createdAt: "desc" }
      });
    },

    leaveRequests: async (_: any, { status }: any, ctx: Context) => {
      requireAdmin(ctx);
      const where: any = status ? { status } : {};
      const requests = await ctx.prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { employee: true }
      });
      return requests.map((r: any) => ({
        ...r,
        employeeName: r.employee.name
      }));
    },

    myLeaveRequests: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      // Get current user email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id }
      });
      if (!user) return [];
      
      // Find employee by email or userId
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [
            { email: user.email },
            { userId: ctx.user!.id }
          ]
        }
      });
      if (!employee) return [];
      
      return ctx.prisma.leaveRequest.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: "desc" }
      });
    },

    accessLogs: async (_: any, { page = 1, pageSize = 50 }: any, ctx: Context) => {
      requireAdmin(ctx);
      return ctx.prisma.accessLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      });
    },

    adminUsers: async (_: any, __: any, ctx: Context) => {
      requireManagerOrAbove(ctx);
      // Directors see all users, Managers see only managers and employees
      const where: any = ctx.user!.role === "manager" 
        ? { role: { in: ["manager", "employee"] } }
        : {}; // Directors see everyone including other directors
      return ctx.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" }
      });
    },
    
    allUsers: async (_: any, __: any, ctx: Context) => {
      requireDirector(ctx);
      return ctx.prisma.user.findMany({
        orderBy: { createdAt: "desc" }
      });
    },

    me: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.user.findUnique({ where: { id: ctx.user!.id } });
    },

    // Messaging System
    messages: async (_: any, { conversationId }: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      return prisma.message.findMany({
        where: {
          conversationId,
          OR: [
            { senderId: user!.id },
            { recipientId: user!.id },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
    },

    myMessages: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      return prisma.message.findMany({
        where: {
          OR: [
            { senderId: user!.id },
            { recipientId: user!.id },
            { AND: [{ recipientId: null }, { recipientRole: user!.role }] },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    },

    myConversations: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user!.id },
            { recipientId: user!.id },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      // Group by conversation and get stats
      const conversationMap = new Map<string, any>();
      
      messages.forEach((msg) => {
        const convId = msg.conversationId;
        const isUnread = !msg.isRead && msg.recipientId === user!.id;
        
        if (!conversationMap.has(convId)) {
          const otherPersonEmail = msg.senderId === user!.id ? msg.recipientEmail : msg.senderEmail;
          const otherPersonRole = msg.senderId === user!.id ? msg.recipientRole : msg.senderRole;
          
          conversationMap.set(convId, {
            conversationId: convId,
            participant: otherPersonEmail || "Broadcast",
            participantRole: otherPersonRole || "all",
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt,
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

      const [total, unread, messages] = await Promise.all([
        prisma.message.count({
          where: {
            OR: [
              { senderId: user!.id },
              { recipientId: user!.id },
            ],
          },
        }),
        prisma.message.count({
          where: {
            recipientId: user!.id,
            isRead: false,
          },
        }),
        prisma.message.findMany({
          where: {
            OR: [
              { senderId: user!.id },
              { recipientId: user!.id },
            ],
          },
          select: { conversationId: true },
          distinct: ["conversationId"],
        }),
      ]);

      return {
        total,
        unread,
        conversations: messages.length,
      };
    },

    // Notifications
    notifications: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.notification.findMany({
        where: { userId: ctx.user!.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },

    unreadNotifications: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.notification.findMany({
        where: {
          userId: ctx.user!.id,
          isRead: false,
        },
        orderBy: { createdAt: "desc" },
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

    updateMyProfile: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);
      
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id }
      });
      if (!user) throw new Error("User not found");
      
      // Find employee record
      let employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [
            { email: user.email },
            { userId: ctx.user!.id }
          ]
        }
      });
      
      if (!employee) {
        throw new Error("Employee profile not found");
      }
      
      // Update only allowed fields
      const updateData: any = {
        updatedAt: new Date()
      };
      
      if (input.name) updateData.name = input.name;
      if (input.email) {
        updateData.email = input.email;
        // Also update user email
        await ctx.prisma.user.update({
          where: { id: ctx.user!.id },
          data: { email: input.email }
        });
      }
      if (input.age) updateData.age = input.age;
      if (input.location) updateData.location = input.location;
      
      return ctx.prisma.employee.update({
        where: { id: employee.id },
        data: updateData
      });
    },

    deleteEmployee: async (_: any, { id }: any, ctx: Context) => {
      // Only Director can delete employees
      requireDirector(ctx);
      await ctx.prisma.employee.delete({ where: { id } });
      return true;
    },
    
    deleteUser: async (_: any, { id }: any, ctx: Context) => {
      // Only Director can delete users (admins, managers, employees)
      requireDirector(ctx);
      await ctx.prisma.user.delete({ where: { id } });
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

    flagEmployee: async (_: any, { id, flagged }: any, ctx: Context) => {
      requireAdmin(ctx);
      return ctx.prisma.employee.update({
        where: { id },
        data: {
          flagged,
          updatedAt: new Date(),
        },
      });
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
            userId: null
          }
        });

        for (const employee of employeesWithoutLogin) {
          try {
            // Generate email from name: "John Doe" -> "john.doe@gmail.com"
            const emailName = employee.name.toLowerCase().replace(/\s+/g, '.');
            const generatedEmail = `${emailName}@gmail.com`;
            
            // Check if email already exists
            const existingUser = await ctx.prisma.user.findUnique({
              where: { email: generatedEmail }
            });
            
            if (existingUser) {
              // If user exists, just link it to the employee
              await ctx.prisma.employee.update({
                where: { id: employee.id },
                data: {
                  userId: existingUser.id,
                  email: generatedEmail
                }
              });
              skipped++;
              continue;
            }
            
            // Create new user with password "employee123"
            const hashedPassword = await bcrypt.hash("employee123", 10);
            const newUser = await ctx.prisma.user.create({
              data: {
                email: generatedEmail,
                passwordHash: hashedPassword,
                role: "employee"
              }
            });
            
            // Link employee to user
            await ctx.prisma.employee.update({
              where: { id: employee.id },
              data: {
                userId: newUser.id,
                email: generatedEmail
              }
            });
            
            created++;
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
          failed
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to generate logins: ${error.message}`,
          created,
          skipped,
          failed
        };
      }
    },

    sendNote: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);
      const { message, toEmployeeId, toAll } = input;
      
      return ctx.prisma.note.create({
        data: {
          message,
          fromUserId: ctx.user!.id,
          toEmployeeId: toEmployeeId || null,
          toAll: toAll || false,
          isRead: false
        }
      });
    },

    markNoteAsRead: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.note.update({
        where: { id },
        data: { isRead: true }
      });
    },

    createLeaveRequest: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);
      
      // Get current user email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id }
      });
      if (!user) {
        throw new Error("User not found");
      }
      
      // Find employee by email or userId
      let employee = await ctx.prisma.employee.findFirst({
        where: {
          OR: [
            { email: user.email },
            { userId: ctx.user!.id }
          ]
        }
      });
      
      // If no employee record exists, create one automatically
      if (!employee) {
        employee = await ctx.prisma.employee.create({
          data: {
            name: user.email.split('@')[0], // Use email prefix as name
            email: user.email,
            userId: user.id,
            age: 25,
            className: "N/A",
            subjects: [],
            attendance: 100,
            role: user.role,
            status: "active",
            location: "N/A",
            lastLogin: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      return ctx.prisma.leaveRequest.create({
        data: {
          employeeId: employee.id,
          reason: input.reason,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "pending"
        }
      });
    },

    updateLeaveRequestStatus: async (_: any, { id, status, adminNote }: any, ctx: Context) => {
      requireAdmin(ctx);
      return ctx.prisma.leaveRequest.update({
        where: { id },
        data: {
          status,
          adminNote: adminNote || null,
          updatedAt: new Date()
        }
      });
    },

    changePassword: async (_: any, { currentPassword, newPassword }: any, ctx: Context) => {
      requireAuth(ctx);
      const bcrypt = require("bcryptjs");
      
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id }
      });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return { success: false, message: "Current password is incorrect" };
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await ctx.prisma.user.update({
        where: { id: ctx.user!.id },
        data: { passwordHash: newHash, updatedAt: new Date() }
      });

      return { success: true, message: "Password changed successfully" };
    },

    logAccess: async (_: any, { action, details }: any, ctx: Context) => {
      requireAuth(ctx);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id }
      });

      return ctx.prisma.accessLog.create({
        data: {
          userId: ctx.user!.id,
          userEmail: user?.email || "unknown",
          action,
          details: details || null,
          ipAddress: null
        }
      });
    },

    // Messaging mutations
    sendMessage: async (_: any, { input }: any, ctx: Context) => {
      requireAuth(ctx);
      const { prisma, user } = ctx;

      // Validate hierarchical permissions
      const senderRole = user!.role;
      const recipientRole = input.recipientRole;

      // Employees cannot message Directors directly
      if (senderRole === "employee" && recipientRole === "director") {
        throw new Error("Employees cannot message Directors directly. Please contact your Manager or email the Director.");
      }

      // Generate conversation ID
      let conversationId = "";
      if (input.replyToId) {
        // Get conversation ID from parent message
        const parentMsg = await prisma.message.findUnique({
          where: { id: input.replyToId },
        });
        conversationId = parentMsg?.conversationId || "";
      } else if (input.recipientId) {
        // Direct message: sort IDs for consistent conversation ID
        const ids = [user!.id, input.recipientId].sort();
        conversationId = `dm_${ids[0]}_${ids[1]}`;
      } else {
        // Broadcast message
        conversationId = `broadcast_${user!.id}_${Date.now()}`;
      }

      // Get recipient details if specified
      let recipientEmail = input.recipientId ? null : null;
      let resolvedRecipientRole = input.recipientRole || null;
      
      if (input.recipientId) {
        const recipient = await prisma.user.findUnique({
          where: { id: input.recipientId },
        });
        if (recipient) {
          recipientEmail = recipient.email;
          resolvedRecipientRole = recipient.role;
        }
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: user!.id,
          senderEmail: user!.email,
          senderRole: user!.role,
          recipientId: input.recipientId || null,
          recipientEmail,
          recipientRole: resolvedRecipientRole,
          subject: input.subject || null,
          message: input.message,
          messageType: input.recipientId ? "direct" : input.replyToId ? "reply" : "broadcast",
          priority: input.priority || "normal",
          replyToId: input.replyToId || null,
          isRead: false,
        },
      });

      // Create notification for recipient(s)
      if (input.recipientId) {
        // Single recipient notification
        await prisma.notification.create({
          data: {
            userId: input.recipientId,
            userEmail: recipientEmail!,
            title: `New message from ${user!.email}`,
            message: input.subject || input.message.substring(0, 100),
            type: "message",
            actionUrl: `/messages?conversation=${conversationId}`,
            metadata: { messageId: message.id, senderId: user!.id },
          },
        });
      } else if (input.recipientRole) {
        // Broadcast to role - create notifications for all users of that role
        const recipients = await prisma.user.findMany({
          where: { 
            role: input.recipientRole,
            id: { not: user!.id } // Don't notify sender
          },
        });

        const notifications = recipients.map((recipient) => ({
          userId: recipient.id,
          userEmail: recipient.email,
          title: `Broadcast from ${user!.role}: ${user!.email}`,
          message: input.subject || input.message.substring(0, 100),
          type: "message",
          actionUrl: `/messages?conversation=${conversationId}`,
          metadata: { messageId: message.id, senderId: user!.id },
        }));

        await prisma.notification.createMany({ data: notifications });
      }

      return message;
    },

    markMessageAsRead: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.message.update({
        where: { id },
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
          recipientId: ctx.user!.id,
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

      if (message && (message.senderId === ctx.user!.id || ctx.user!.role === "director")) {
        await ctx.prisma.message.delete({ where: { id } });
        return true;
      }
      throw new Error("Not authorized to delete this message");
    },

    // Notification mutations
    markNotificationAsRead: async (_: any, { id }: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.notification.update({
        where: { id },
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
      await ctx.prisma.notification.delete({
        where: { id },
      });
      return true;
    },
  },
};
