const mongoose = require('mongoose');

const Payroll = require('../../models/Payroll');
const Employee = require('../../models/Employee');
const PayrollPeriod = require('../../models/PayrollPeriod');

const PayrollEngine = require('../payroll/payrollEngine');
const PayrollPeriodService = require('./payrollPeriodService');

class PayrollBatchService {

    /*
    =====================================================
    LOAD ELIGIBLE EMPLOYEES
    =====================================================
    */

    static async loadEligibleEmployees() {

        return Employee.find({

            status: 'active',

            'payrollProfile.eligible': true,

        })

        .select({
            employeeId: 1,
            user: 1,
            payrollProfile: 1,
            salary: 1,
            currency: 1,
            department: 1,
            position: 1,
            bankDetails: 1,
            tacpin: 1,
            hifNumber: 1,
            nssfNumber: 1,
        })
        .populate({
            path: 'user',

            select:
                'firstName lastName email',
        })

        .lean();

    }

    /*
    =====================================================
    BUILD PAYROLL DOCUMENTS
    =====================================================
    */

    static async generatePayrollDocuments(
      employees,
      payrollPeriodId,
      generatedBy
  ) {

      /*
      =====================================================
      LOAD EXISTING PAYROLLS
      =====================================================
      */

      const existingPayrolls =
          await Payroll.find(
              {
                  payrollPeriod: payrollPeriodId,
              },
              {
                  employee: 1,
              }
          ).lean();

      const existingEmployeeIds =
          new Set(
              existingPayrolls.map(item =>
                  item.employee.toString()
              )
          );

      const payrollDocuments = [];
      const skipped = [];
      const failed = [];
      for (const employee of employees) {

          try {

              if (
                  existingEmployeeIds.has(
                      employee._id.toString()
                  )
              ) {

                  skipped.push({

                      employeeId:
                          employee.employeeId,

                      reason:
                          'Payroll already exists.',

                  });

                  continue;
              }

              const payroll =
                  await PayrollEngine.generate(

                      employee._id,

                      payrollPeriodId

                  );

              payroll.workflow.generatedBy =
                  generatedBy;

              payroll.workflow.generatedAt =
                  new Date();

              if (
                  payroll.auditTrail.length
              ) {

                  payroll.auditTrail[0].performedBy =
                      generatedBy;

              }

              payrollDocuments.push(payroll);

          }

          catch (error) {

              failed.push({

                  employeeId:
                      employee.employeeId,

                  message:
                      error.message,

              });
          }
      }

      return {
          payrollDocuments,
          skipped,
          failed,
      };
  }

    /*
    =====================================================
    PREVIEW PAYROLL
    =====================================================
    */

    static async preview(
        payrollPeriodId
    ) {

        const employees =
            await this.loadEligibleEmployees();

        const {

            payrollDocuments,

            skipped,

            failed,

        } = await this.generatePayrollDocuments(

            employees,

            payrollPeriodId,

            null

        );

        return {

            payrollPeriodId,

            totalEmployees:
                employees.length,

            previewPayrolls:
                payrollDocuments.length,

            skipped:
                skipped.length,

            failed:
                failed.length,

            payrolls:
                payrollDocuments,

            skippedEmployees:
                skipped,

            errors:
                failed,

        };

    }

    /*
    =====================================================
    FINALIZE PAYROLL
    =====================================================
    */

    static async finalize(
        payrollPeriodId,
        generatedBy
    ) {

        const session =
            await mongoose.startSession();

        session.startTransaction();

        try {

            const payrollPeriod =
                await PayrollPeriod.findById(
                    payrollPeriodId
                ).session(session);

            if (!payrollPeriod) {

                throw new Error(
                    'Payroll period not found.'
                );

            }

            if (
                payrollPeriod.status === 'paid' ||
                payrollPeriod.status === 'closed'
            ) {

                throw new Error(
                    'Payroll period is already finalized.'
                );

            }

            const employees =
                await this.loadEligibleEmployees();

            const {

                payrollDocuments,

                skipped,

                failed,

            } = await this.generatePayrollDocuments(

                employees,

                payrollPeriodId,

                generatedBy

            );

            let insertedPayrolls = [];

            if (payrollDocuments.length) {

                insertedPayrolls =
                    await Payroll.insertMany(

                        payrollDocuments,

                        {

                            session,

                            ordered: true,

                        }

                    );

            }

            payrollPeriod.payrollCalculated = true;

            payrollPeriod.calculatedBy =
                generatedBy;

            payrollPeriod.calculatedAt =
                new Date();

            if (
                payrollPeriod.status === 'attendance_locked'
            ) {

                payrollPeriod.status =
                    'processing';

            }

            await payrollPeriod.save({

                session,

            });

            await session.commitTransaction();

            session.endSession();

            await PayrollPeriodService.updateStatistics(
                payrollPeriodId
            );

            const summary =
                await this.buildSummary(
                    payrollPeriodId
                );

            return {

                message:
                    'Payroll generated successfully.',

                summary,

                payrolls:
                    insertedPayrolls,

                skippedEmployees:
                    skipped,

                failedEmployees:
                    failed,

            };

        }

        catch (error) {

            await session.abortTransaction();

            session.endSession();

            throw error;

        }

    }

    /*
    =====================================================
    BUILD SUMMARY
    =====================================================
    */

    static async buildSummary(
        payrollPeriodId
    ) {

        const payrolls =
            await Payroll.find({

                payrollPeriod:
                    payrollPeriodId,

            });

        let gross = 0;

        let net = 0;

        let paye = 0;

        let nhif = 0;

        let nssf = 0;

        let housingLevy = 0;

        payrolls.forEach(payroll => {

            gross +=
                payroll.totals.grossPay || 0;

            net +=
                payroll.totals.netPay || 0;

            paye +=
                payroll.statutory.paye || 0;

            nhif +=
                payroll.statutory.nhif || 0;

            nssf +=
                payroll.statutory.nssf || 0;

            housingLevy +=
                payroll.statutory.housingLevy || 0;

        });

        return {

            payrollPeriodId,

            employeesProcessed:
                payrolls.length,

            totalGrossPay:
                gross,

            totalNetPay:
                net,

            totalPAYE:
                paye,

            totalNHIF:
                nhif,

            totalNSSF:
                nssf,

            totalHousingLevy:
                housingLevy,

        };
    }
}

module.exports = PayrollBatchService;