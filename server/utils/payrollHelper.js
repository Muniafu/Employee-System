/**
 * =====================================================
 * Kenya Payroll Utility Functions
 * =====================================================
 */

const PAYE_BANDS = [
  { limit: 24000, rate: 0.10 },
  { limit: 32333, rate: 0.25 },
  { limit: 500000, rate: 0.30 },
  { limit: 800000, rate: 0.325 },
  { limit: Infinity, rate: 0.35 },
];

const DEFAULT_PERSONAL_RELIEF = 2400;

const NHIF_RATES = [
  { limit: 5999, amount: 150 },
  { limit: 7999, amount: 300 },
  { limit: 11999, amount: 400 },
  { limit: 14999, amount: 500 },
  { limit: 19999, amount: 600 },
  { limit: 24999, amount: 750 },
  { limit: 29999, amount: 850 },
  { limit: 34999, amount: 900 },
  { limit: 39999, amount: 950 },
  { limit: 44999, amount: 1000 },
  { limit: 49999, amount: 1100 },
  { limit: 59999, amount: 1200 },
  { limit: 69999, amount: 1300 },
  { limit: 79999, amount: 1400 },
  { limit: 89999, amount: 1500 },
  { limit: 99999, amount: 1600 },
  { limit: Infinity, amount: 1700 },
];

const toNumber = (value) => Number(value) || 0;

const round = (value = 0) =>
  Number(
    (toNumber(value)).toFixed(2)
  );

/**
 * Calculates PAYE using Kenya KRA tax bands.
 *
 * @param {number} taxableIncome
 * @param {number} personalRelief
 * @returns {number}
 */

const computePAYE = (
  taxableIncome,
  personalRelief = DEFAULT_PERSONAL_RELIEF
) => {
  taxableIncome = Math.max(
    0,
    toNumber(taxableIncome)
  );

  let tax = 0;
  let previousLimit = 0;

  for (const band of PAYE_BANDS) {
    if (taxableIncome <= previousLimit) {
      break;
    }

    const taxableAmount = Math.min(
      taxableIncome,
      band.limit
    ) - previousLimit;

    tax += taxableAmount * band.rate;

    previousLimit = band.limit;
  }

  return Math.max(
    0,
    round(tax - personalRelief)
  );
};

/*
=====================================================
NHIF
=====================================================
*/

const computeNHIF = (grossPay) => {
  grossPay = toNumber(grossPay);

  const band =
    NHIF_RATES.find(
      item => grossPay <= item.limit
    );

  return band ? band.amount : 1700;
};

/*
=====================================================
NSSF
=====================================================
*/

const computeNSSF = (
  pensionablePay,
  rate = 0.06,
  ceiling = 18000
) => {
  pensionablePay = Math.min(
    toNumber(pensionablePay),
    ceiling
  );

  return round(
    pensionablePay * rate
  );
};

/*
=====================================================
Housing Levy
=====================================================
*/

const computeHousingLevy = (
  grossPay,
  rate = 0.015
) => {
  return round(
    toNumber(grossPay) * rate
  );
};

/*
=====================================================
Overtime
=====================================================
*/

const computeOvertimePay = (
  hourlyRate,
  overtimeHours,
  multiplier = 1.5
) => {
  return round(
    toNumber(hourlyRate) *
      toNumber(overtimeHours) *
      multiplier
  );
};

/*
=====================================================
Employer Contributions
=====================================================
*/

const computeEmployerContributions = ({
  grossPay,
  payrollSettings,
}) => {
  
  const employerNSSF =
  computeNSSF(
    grossPay,
    payrollSettings.statutoryRates.employerNSSFRate
  );

  const employerHousingLevy = 
  computeHousingLevy(
    grossPay,
    payrollSettings.statutoryRates.employerHousingLevyRate
  );

  return {
    employerNSSF,
    employerHousingLevy,
    total:
      employerNSSF +
      employerHousingLevy,
  };
};

/*
=====================================================
Combined Statutory Deductions
=====================================================
*/

const computeStatutoryDeductions = ({
  grossPay,
  payrollSettings,
}) => {
  const nssf = payrollSettings.deductions.nssf.enabled
    ? computeNSSF(grossPay)
    : 0;


  const taxableIncome =
    grossPay - nssf;

  const paye = payrollSettings.deductions.paye.enabled
    ? computePAYE(taxableIncome, payrollSettings.taxReliefs?.personalRelief)
    : 0;

  const nhif = payrollSettings.deductions.nhif.enabled
    ? computeNHIF(grossPay)
    : 0;

  const housingLevy =
    payrollSettings.deductions.housingLevy.enabled
      ? computeHousingLevy(
          grossPay,
          payrollSettings.statutoryRates.housingLevyRate
        )
      : 0;
  

  return {
    taxableIncome: round(
      taxableIncome
    ),
    paye,
    nhif,
    nssf,
    housingLevy,
    total:
      paye +
      nhif +
      nssf +
      housingLevy,
  };
};

module.exports = {
  computePAYE,
  computeNHIF,
  computeNSSF,
  computeHousingLevy,
  computeOvertimePay,
  computeEmployerContributions,
  computeStatutoryDeductions,
};