require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollSettings = require('../models/PayrollSettings');

const {
  computePAYE,
  computeNHIF,
  computeStatutoryDeductions,
} = require('../utils/payrollHelper');

/*
|--------------------------------------------------------------------------
| PAYROLL SETTINGS (one active record required by the unique index)
|--------------------------------------------------------------------------
*/
const seedPayrollSettings = async () => {
  let settings = await PayrollSettings.findOne({ active: true });

  if (settings) {
    console.log('PayrollSettings already exists — skipping.');
    return settings;
  }

  settings = await PayrollSettings.create({
    companyName: 'Acme Employee System',
    companyCode: 'ACME',
    currency: 'KES',
    payrollFrequency: 'monthly',
    payDay: 28,
    workingDaysPerMonth: 22,
    workingHoursPerDay: 8,
    deductions: {
      paye: { enabled: true },
      nhif: { enabled: true },
      nssf: { enabled: true },
      housingLevy: { enabled: true },
    },
    active: true,
  });

  console.log('PayrollSettings created.');
  return settings;
};

/*
|--------------------------------------------------------------------------
| PAYROLL PERIOD (current month)
|--------------------------------------------------------------------------
*/
const seedPayrollPeriod = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let period = await PayrollPeriod.findOne({ year, month });

  if (period) {
    console.log('PayrollPeriod already exists — skipping.');
    return period;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month
  const payDate = new Date(year, month, 3); // a few days into next month

  period = await PayrollPeriod.create({
    name: `${startDate.toLocaleString('default', { month: 'long' })} ${year}`,
    year,
    month,
    payrollFrequency: 'monthly',
    startDate,
    endDate,
    payDate,
    status: 'attendance_locked',
    attendanceLocked: true,
    periodNumber: month,
    fiscalYear: year,
  });

  console.log('PayrollPeriod created:', period.name);
  return period;
};

/*
|--------------------------------------------------------------------------
| ATTENDANCE — last 10 weekdays per active employee
|--------------------------------------------------------------------------
*/
const seedAttendance = async (employees) => {
  const days = [];
  const cursor = new Date();

  while (days.length < 10) {
    cursor.setDate(cursor.getDate() - 1);
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(cursor));
    }
  }

  let created = 0;

  for (const employee of employees) {
    for (const day of days) {
      const dateOnly = new Date(day);
      dateOnly.setHours(0, 0, 0, 0);

      const exists = await Attendance.findOne({
        employee: employee._id,
        date: dateOnly,
      });
      if (exists) continue;

      const isLate = Math.random() < 0.2;
      const clockIn = new Date(dateOnly);
      clockIn.setHours(8, isLate ? 25 : Math.floor(Math.random() * 10), 0, 0);

      const clockOut = new Date(dateOnly);
      clockOut.setHours(17, Math.floor(Math.random() * 30), 0, 0);

      const record = new Attendance({
        employee: employee._id,
        date: dateOnly,
        clockIn,
        clockOut,
        status: 'present',
        lateMinutes: isLate ? 25 : 0,
        location: 'office',
      });

      record.calculateHours();
      await record.save();
      created++;
    }
  }

  console.log(`Attendance records created: ${created}`);
};

/*
|--------------------------------------------------------------------------
| LEAVE — one approved (past), one pending (upcoming)
|--------------------------------------------------------------------------
*/
const seedLeave = async (employeesByEmail, hrUser) => {
  const brian = employeesByEmail['brian.kiptoo@example.com'];
  const faith = employeesByEmail['faith.achieng@example.com'];

  if (brian) {
    const exists = await Leave.findOne({ employee: brian._id, status: 'approved' });
    if (!exists) {
      const start = new Date();
      start.setDate(start.getDate() - 5);
      const end = new Date();
      end.setDate(end.getDate() - 3);

      await Leave.create({
        employee: brian._id,
        leaveType: 'annual',
        startDate: start,
        endDate: end,
        reason: 'Family event',
        status: 'approved',
        approvedBy: hrUser._id,
        approvedAt: new Date(),
      });
      console.log('Approved leave created for Brian.');
    }
  }

  if (faith) {
    const exists = await Leave.findOne({ employee: faith._id, status: 'pending' });
    if (!exists) {
      const start = new Date();
      start.setDate(start.getDate() + 7);
      const end = new Date();
      end.setDate(end.getDate() + 9);

      await Leave.create({
        employee: faith._id,
        leaveType: 'sick',
        startDate: start,
        endDate: end,
        reason: 'Medical appointment',
        status: 'pending',
      });
      console.log('Pending leave request created for Faith.');
    }
  }
};

/*
|--------------------------------------------------------------------------
| PAYROLL — one finalized record per active employee for the seeded period
|--------------------------------------------------------------------------
*/
const seedPayroll = async (employees, period, settings) => {
  for (const employee of employees) {
    const exists = await Payroll.findOne({
      employee: employee._id,
      payrollPeriod: period._id,
    });
    if (exists) continue;

    const user = employee.user; // populated
    const basicSalary = employee.salary || 50000;
    const allowances = employee.payrollProfile?.allowances || {};
    const allowanceTotal = Object.values(allowances.toObject?.() || allowances)
      .reduce((sum, v) => sum + (Number(v) || 0), 0);

    const grossPay = basicSalary + allowanceTotal;

    const statutory = computeStatutoryDeductions({ grossPay, payrollSettings: settings });

    const employeeDeductions = employee.payrollProfile?.deductions || {};
    const deductionTotal =
      (employeeDeductions.loan || 0) +
      (employeeDeductions.pension || 0) +
      (employeeDeductions.insurance || 0) +
      (employeeDeductions.other || 0);

    const totalDeductions = statutory.total + deductionTotal;
    const netPay = grossPay - totalDeductions;

    await Payroll.create({
      employee: employee._id,
      payrollPeriod: period._id,
      employeeSnapshot: {
        employeeId: employee.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: employee.department,
        designation: employee.position,
        employmentType: employee.payrollProfile?.employmentType || 'permanent',
        currency: employee.currency || 'KES',
        salary: {
          basic: basicSalary,
          dailyRate: Math.round(basicSalary / 22),
          hourlyRate: Math.round(basicSalary / 22 / 8),
          payFrequency: 'monthly',
        },
        bankDetails: employee.bankDetails,
        statutory: {
          taxPin: employee.taxPin,
          nhifNumber: employee.nhifNumber,
          nssfNumber: employee.nssfNumber,
        },
        allowances,
        deductions: employeeDeductions,
      },
      earnings: {
        basicSalary,
        allowances,
        grossPay,
      },
      statutory: {
        paye: statutory.paye,
        nhif: statutory.nhif,
        nssf: statutory.nssf,
        housingLevy: statutory.housingLevy,
      },
      deductions: employeeDeductions,
      totals: {
        taxableIncome: statutory.taxableIncome,
        totalStatutory: statutory.total,
        totalEmployeeDeductions: deductionTotal,
        totalDeductions,
        grossPay,
        netPay,
      },
      workflow: {
        status: 'approved',
        generatedAt: new Date(),
        approvedAt: new Date(),
      },
      payment: {
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        paymentDate: period.payDate,
      },
    });

    console.log(`Payroll created for ${user.firstName} ${user.lastName} — net pay ${netPay}`);
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

    const settings = await seedPayrollSettings();
    const period = await seedPayrollPeriod();

    const employees = await Employee.find({ status: 'active' }).populate('user');
    const hrUser = await User.findOne({ email: 'hr1@example.com' });

    const employeesByEmail = {};
    employees.forEach((e) => {
      if (e.user?.email) employeesByEmail[e.user.email] = e;
    });

    await seedAttendance(employees);
    await seedLeave(employeesByEmail, hrUser);
    await seedPayroll(employees, period, settings);

    console.log('\nActivity seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
})();