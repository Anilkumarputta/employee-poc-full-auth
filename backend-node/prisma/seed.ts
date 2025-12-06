import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create director user
  const directorPassword = await bcrypt.hash("director123", 10);
  
  const director = await prisma.user.upsert({
    where: { email: "director@example.com" },
    update: {},
    create: {
      email: "director@example.com",
      passwordHash: directorPassword,
      role: "director",
    },
  });

  console.log("✅ Director user created:", director.email);

  // Create manager user
  const managerPassword = await bcrypt.hash("manager123", 10);
  
  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      passwordHash: managerPassword,
      role: "manager",
    },
  });

  console.log("✅ Manager user created:", manager.email);

  // Create employee user
  const employeePassword = await bcrypt.hash("employee123", 10);
  
  const employee = await prisma.user.upsert({
    where: { email: "employee@example.com" },
    update: {},
    create: {
      email: "employee@example.com",
      passwordHash: employeePassword,
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
