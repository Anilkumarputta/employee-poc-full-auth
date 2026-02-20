import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create director user
  const directorPassword = await bcrypt.hash('director123', 10);

  // Always update director password and role
  const director = await prisma.user.upsert({
    where: { email: 'director@example.com' },
    update: {
      passwordHash: directorPassword,
      role: 'director',
    },
    create: {
      email: 'director@example.com',
      passwordHash: directorPassword,
      role: 'director',
    },
  });

  console.log('✅ Director user created:', director.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      passwordHash: managerPassword,
      role: 'manager',
    },
  });

  console.log('✅ Manager user created:', manager.email);

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 10);

  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      email: 'employee@example.com',
      passwordHash: employeePassword,
      role: 'employee',
    },
  });

  console.log('✅ Employee user created:', employee.email);

  // Keep employee profiles for auth users human-friendly and linked to User IDs
  const accountEmployeeProfiles = [
    {
      userId: director.id,
      email: director.email,
      name: 'Olivia Carter',
      age: 44,
      className: 'Executive',
      subjects: ['Operations', 'Leadership'],
      attendance: 100,
      role: 'Director',
      status: 'active',
      location: 'Head Office',
      managerId: null as number | null,
      lastLogin: new Date().toISOString(),
    },
    {
      userId: manager.id,
      email: manager.email,
      name: 'Daniel Brooks',
      age: 38,
      className: 'Management',
      subjects: ['Team Leadership', 'Planning'],
      attendance: 99,
      role: 'Manager',
      status: 'active',
      location: 'Building M',
      managerId: null as number | null,
      lastLogin: new Date().toISOString(),
    },
    {
      userId: employee.id,
      email: employee.email,
      name: 'Nora Evans',
      age: 29,
      className: 'Operations',
      subjects: ['Support'],
      attendance: 96,
      role: 'Employee',
      status: 'active',
      location: 'Building E',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
  ];

  for (const profile of accountEmployeeProfiles) {
    await prisma.employee.upsert({
      where: { email: profile.email },
      update: profile,
      create: profile,
    });
  }

  // Create sample employee records
  const employees = [
    {
      name: 'John Smith',
      email: 'john.smith@school.local',
      age: 28,
      className: '10-A',
      subjects: ['Math', 'Physics'],
      attendance: 95,
      role: 'Teacher',
      status: 'active',
      location: 'Building A',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@school.local',
      age: 32,
      className: '9-B',
      subjects: ['English', 'History'],
      attendance: 98,
      role: 'Teacher',
      status: 'active',
      location: 'Building B',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Michael Chen',
      email: 'michael.chen@school.local',
      age: 45,
      className: 'Admin',
      subjects: ['Management'],
      attendance: 100,
      role: 'Principal',
      status: 'active',
      location: 'Main Office',
      managerId: null,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@school.local',
      age: 26,
      className: '8-C',
      subjects: ['Science', 'Biology'],
      attendance: 92,
      role: 'Teacher',
      status: 'active',
      location: 'Building A',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Robert Wilson',
      email: 'robert.wilson@school.local',
      age: 38,
      className: '11-A',
      subjects: ['Computer Science'],
      attendance: 88,
      role: 'Teacher',
      status: 'on-leave',
      location: 'Building C',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    // Additional sample employees
    {
      name: 'Jessica Lee',
      email: 'jessica.lee@school.local',
      age: 29,
      className: '10-B',
      subjects: ['Math', 'English'],
      attendance: 97,
      role: 'Teacher',
      status: 'active',
      location: 'Building B',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'David Brown',
      email: 'david.brown@school.local',
      age: 41,
      className: 'Admin',
      subjects: ['Management'],
      attendance: 100,
      role: 'Vice Principal',
      status: 'active',
      location: 'Main Office',
      managerId: null,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@school.local',
      age: 34,
      className: '12-A',
      subjects: ['Chemistry', 'Physics'],
      attendance: 93,
      role: 'Teacher',
      status: 'active',
      location: 'Building D',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Ahmed Khan',
      email: 'ahmed.khan@school.local',
      age: 30,
      className: '7-A',
      subjects: ['Geography', 'History'],
      attendance: 90,
      role: 'Teacher',
      status: 'active',
      location: 'Building E',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Maria Garcia',
      email: 'maria.garcia@school.local',
      age: 27,
      className: '9-C',
      subjects: ['Spanish', 'Art'],
      attendance: 96,
      role: 'Teacher',
      status: 'active',
      location: 'Building F',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Liam Thompson',
      email: 'liam.thompson@school.local',
      age: 33,
      className: '6-A',
      subjects: ['Mathematics'],
      attendance: 94,
      role: 'Teacher',
      status: 'active',
      location: 'Building A',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Ava Martinez',
      email: 'ava.martinez@school.local',
      age: 31,
      className: '7-B',
      subjects: ['English Literature'],
      attendance: 95,
      role: 'Teacher',
      status: 'active',
      location: 'Building B',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Noah Robinson',
      email: 'noah.robinson@school.local',
      age: 37,
      className: '8-A',
      subjects: ['Physics'],
      attendance: 91,
      role: 'Teacher',
      status: 'active',
      location: 'Building C',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Sophia Nguyen',
      email: 'sophia.nguyen@school.local',
      age: 35,
      className: '9-A',
      subjects: ['Biology'],
      attendance: 97,
      role: 'Teacher',
      status: 'active',
      location: 'Building D',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Ethan Wright',
      email: 'ethan.wright@school.local',
      age: 40,
      className: '10-C',
      subjects: ['Computer Science'],
      attendance: 89,
      role: 'Teacher',
      status: 'active',
      location: 'Building E',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Grace Kim',
      email: 'grace.kim@school.local',
      age: 28,
      className: '11-B',
      subjects: ['History'],
      attendance: 96,
      role: 'Teacher',
      status: 'active',
      location: 'Building F',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Benjamin Clark',
      email: 'benjamin.clark@school.local',
      age: 36,
      className: '12-B',
      subjects: ['Chemistry'],
      attendance: 92,
      role: 'Teacher',
      status: 'active',
      location: 'Building G',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Chloe Anderson',
      email: 'chloe.anderson@school.local',
      age: 30,
      className: '6-C',
      subjects: ['Art', 'Design'],
      attendance: 98,
      role: 'Teacher',
      status: 'active',
      location: 'Building H',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Nathan Rivera',
      email: 'nathan.rivera@school.local',
      age: 34,
      className: '7-C',
      subjects: ['Geography'],
      attendance: 90,
      role: 'Teacher',
      status: 'active',
      location: 'Building I',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
    {
      name: 'Isabella Moore',
      email: 'isabella.moore@school.local',
      age: 27,
      className: '8-B',
      subjects: ['Language Arts'],
      attendance: 97,
      role: 'Teacher',
      status: 'active',
      location: 'Building J',
      managerId: manager.id,
      lastLogin: new Date().toISOString(),
    },
  ];

  for (const emp of employees) {
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [{ email: emp.email }, { name: emp.name }],
      },
    });

    if (existing) {
      await prisma.employee.update({
        where: { id: existing.id },
        data: emp,
      });
      continue;
    }

    await prisma.employee.create({
      data: emp,
    });
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
