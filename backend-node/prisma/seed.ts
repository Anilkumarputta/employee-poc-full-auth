import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create employee user
  const hashedPassword2 = await bcrypt.hash("employee123", 10);
  
  const employee = await prisma.user.upsert({
    where: { email: "employee@example.com" },
    update: {},
    create: {
      email: "employee@example.com",
      passwordHash: hashedPassword2,
      role: "employee",
    },
  });

  console.log("✅ Employee user created:", employee.email);

  // Create sample employee records
  const employees = [
    {
      name: "John Smith",
      age: 28,
      className: "10-A",
      subjects: ["Math", "Physics"],
      attendance: 95,
      role: "Teacher",
      status: "active",
      location: "Building A",
      lastLogin: new Date().toISOString(),
    },
    {
      name: "Sarah Johnson",
      age: 32,
      className: "9-B",
      subjects: ["English", "History"],
      attendance: 98,
      role: "Teacher",
      status: "active",
      location: "Building B",
      lastLogin: new Date().toISOString(),
    },
    {
      name: "Michael Chen",
      age: 45,
      className: "Admin",
      subjects: ["Management"],
      attendance: 100,
      role: "Principal",
      status: "active",
      location: "Main Office",
      lastLogin: new Date().toISOString(),
    },
    {
      name: "Emily Davis",
      age: 26,
      className: "8-C",
      subjects: ["Science", "Biology"],
      attendance: 92,
      role: "Teacher",
      status: "active",
      location: "Building A",
      lastLogin: new Date().toISOString(),
    },
    {
      name: "Robert Wilson",
      age: 38,
      className: "11-A",
      subjects: ["Computer Science"],
      attendance: 88,
      role: "Teacher",
      status: "on-leave",
      location: "Building C",
      lastLogin: new Date().toISOString(),
    },
  ];

  for (const emp of employees) {
    const existing = await prisma.employee.findFirst({
      where: { name: emp.name }
    });
    
    if (!existing) {
      await prisma.employee.create({
        data: emp,
      });
    }
  }

  console.log(`✅ Created ${employees.length} employee records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
