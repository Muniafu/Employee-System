require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

/*
|--------------------------------------------------------------------------
| DEPARTMENTS
|--------------------------------------------------------------------------
*/
const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG' },
  { name: 'HR', code: 'HR' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Marketing', code: 'MKT' },
  { name: 'Legal', code: 'LEG' },
  { name: 'Other', code: 'OTH' },
];

const seedDepartments = async () => {
  for (const dept of DEPARTMENTS) {
    await Department.updateOne(
      { name: dept.name },
      { $setOnInsert: dept },
      { upsert: true }
    );
  }
  console.log(`Departments seeded (${DEPARTMENTS.length}).`);
};

/*
|--------------------------------------------------------------------------
| USERS + EMPLOYEES
|--------------------------------------------------------------------------
| Bypasses the HTTP layer entirely — creates User/Employee docs directly,
| same shape createUserWithEmployee() would produce, but pre-approved,
| pre-verified, and with department/position/manager already set (as if
| an admin had already run them through approveUser + onboarding).
|
| Passwords are plain here — User's pre('save') hook hashes them.
| Default password for every seeded account: "Password123!"
|--------------------------------------------------------------------------
*/

const DEFAULT_PASSWORD = 'Password123!';

// Order matters: managers/HR before the employees that report to them.
const SEED_USERS = [
  {
    key: 'hr1',
    firstName: 'Amina',
    lastName: 'Wanjiru',
    email: 'hr1@example.com',
    role: 'hr',
    department: 'HR',
    position: 'HR Manager',
  },
  {
    key: 'eng_manager',
    firstName: 'David',
    lastName: 'Otieno',
    email: 'eng.manager@example.com',
    role: 'manager',
    department: 'Engineering',
    position: 'Engineering Manager',
  },
  {
    key: 'mkt_manager',
    firstName: 'Grace',
    lastName: 'Njeri',
    email: 'mkt.manager@example.com',
    role: 'manager',
    department: 'Marketing',
    position: 'Marketing Manager',
  },
  {
    key: 'eng1',
    firstName: 'Brian',
    lastName: 'Kiptoo',
    email: 'brian.kiptoo@example.com',
    role: 'employee',
    department: 'Engineering',
    position: 'Backend Developer',
    managerKey: 'eng_manager',
  },
  {
    key: 'eng2',
    firstName: 'Faith',
    lastName: 'Achieng',
    email: 'faith.achieng@example.com',
    role: 'employee',
    department: 'Engineering',
    position: 'Frontend Developer',
    managerKey: 'eng_manager',
  },
  {
    key: 'mkt1',
    firstName: 'Peter',
    lastName: 'Mwangi',
    email: 'peter.mwangi@example.com',
    role: 'employee',
    department: 'Marketing',
    position: 'Content Strategist',
    managerKey: 'mkt_manager',
  },
  {
    key: 'fin1',
    firstName: 'Lucy',
    lastName: 'Chebet',
    email: 'lucy.chebet@example.com',
    role: 'employee',
    department: 'Finance',
    position: 'Accountant',
    // No manager assigned — exercises the "no manager" edge case in
    // views that expect employee.manager to sometimes be null.
  },
  {
    key: 'pending1',
    firstName: 'Samuel',
    lastName: 'Kariuki',
    email: 'pending.user@example.com',
    role: 'employee',
    // Deliberately left PENDING + no Employee department/position set,
    // to test the admin approval queue end-to-end.
    pending: true,
  },
];

const seedUsers = async () => {
  const createdByKey = {};

  for (const spec of SEED_USERS) {
    const existing = await User.findOne({ email: spec.email });

    if (existing) {
      console.log(`Skipping ${spec.email} — already exists.`);
      createdByKey[spec.key] = existing;
      continue;
    }

    const user = await User.create({
      firstName: spec.firstName,
      lastName: spec.lastName,
      email: spec.email,
      password: DEFAULT_PASSWORD,
      role: spec.pending ? 'employee' : spec.role,
      status: spec.pending ? 'PENDING' : 'APPROVED',
      isActive: true,
      emailVerified: true, // skip the email-click step for seeded accounts
    });

    const managerUser = spec.managerKey
      ? createdByKey[spec.managerKey]
      : undefined;

    await Employee.create({
      user: user._id,
      department: spec.pending ? '' : spec.department,
      position: spec.pending ? '' : spec.position,
      manager: managerUser?._id,
      status: spec.pending ? 'pending' : 'active',
    });

    createdByKey[spec.key] = user;
    console.log(`Created ${spec.role}: ${spec.email}`);
  }
};

/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    await seedDepartments();
    await seedUsers();

    console.log('\nSeed complete.');
    console.log(`All seeded accounts use password: ${DEFAULT_PASSWORD}`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
})();