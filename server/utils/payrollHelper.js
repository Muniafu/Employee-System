/**
 * Kenya payroll computations (2024 KRA rates)
 */

// PAYE brackets (monthly)
const PAYE_BANDS = [
  { limit: 24000,  rate: 0.10 },
  { limit: 32333,  rate: 0.25 },
  { limit: 500000, rate: 0.30 },
  { limit: 800000, rate: 0.325 },
  { limit: Infinity, rate: 0.35 },
];

const PERSONAL_RELIEF = 2400; // KES/month
const NHIF_RATES = [
  { limit: 5999,   amount: 150 },
  { limit: 7999,   amount: 300 },
  { limit: 11999,  amount: 400 },
  { limit: 14999,  amount: 500 },
  { limit: 19999,  amount: 600 },
  { limit: 24999,  amount: 750 },
  { limit: 29999,  amount: 850 },
  { limit: 34999,  amount: 900 },
  { limit: 39999,  amount: 950 },
  { limit: 44999,  amount: 1000 },
  { limit: 49999,  amount: 1100 },
  { limit: 59999,  amount: 1200 },
  { limit: 69999,  amount: 1300 },
  { limit: 79999,  amount: 1400 },
  { limit: 89999,  amount: 1500 },
  { limit: 99999,  amount: 1600 },
  { limit: Infinity, amount: 1700 },
];
const NSSF_TIER1 = 360;  // 6% of 6000
const NSSF_TIER2 = 720;  // 6% of 12000 (Tier II)

const computePAYE = (taxableIncome) => {
  let tax = 0;
  let remaining = taxableIncome;
  let prev = 0;

  for (const band of PAYE_BANDS) {
    const slice = Math.min(remaining, band.limit - prev);
    if (slice <= 0) break;
    tax += slice * band.rate;
    remaining -= slice;
    prev = band.limit;
    if (remaining <= 0) break;
  }

  return Math.max(0, tax - PERSONAL_RELIEF);
};

const computeNHIF = (grossPay) => {
  for (const band of NHIF_RATES) {
    if (grossPay <= band.limit) return band.amount;
  }
  return 1700;
};

const computeNSSF = (grossPay) => {
  // New NSSF Act 2022: 6% of pensionable pay, capped at Tier I + II
  return Math.min(NSSF_TIER1 + NSSF_TIER2, Math.round(grossPay * 0.06));
};

const computeOvertimePay = (hourlyRate, overtimeHours, multiplier = 1.5) => {
  return Math.round(hourlyRate * overtimeHours * multiplier);
};

const computeDeductions = (grossPay) => {
  const nssf = computeNSSF(grossPay);
  const taxable = grossPay - nssf;
  const paye = computePAYE(taxable);
  const nhif = computeNHIF(grossPay);
  return { paye: Math.round(paye), nhif, nssf };
};

const buildPayrollPreview = (employee, daysWorked, overtimeHours, workingDays = 22) => {
  const dailyRate = employee.salary / workingDays;
  const hourlyRate = employee.salary / (workingDays * 8);
  const basicSalary = Math.round(dailyRate * daysWorked);
  const overtimePay = computeOvertimePay(hourlyRate, overtimeHours);
  const grossPay = basicSalary + overtimePay;
  const { paye, nhif, nssf } = computeDeductions(grossPay);
  const netPay = grossPay - paye - nhif - nssf;

  return {
    basicSalary,
    daysWorked,
    overtimeHours,
    overtimePay,
    grossPay,
    deductions: { paye, nhif, nssf, loan: 0, other: 0 },
    netPay: Math.max(0, netPay),
  };
};

module.exports = { computePAYE, computeNHIF, computeNSSF, computeDeductions, computeOvertimePay, buildPayrollPreview };