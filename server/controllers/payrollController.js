const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

const PayrollEngine = require('../services/payroll/payrollEngine');
const PayrollBatchService = require('../services/payroll/payrollBatchService');

const asyncHandler = require('../middleware/asyncHandler');
const Response = require('../utils/responseHandler');

class PayrollController {

    /*
    =====================================================
    Preview Payroll
    =====================================================
    */

    static preview = asyncHandler(async (req, res) => {

        const {
            payrollPeriodId,
            employeeId,
        } = req.body;

        const result =
            await PayrollBatchService.preview(
                payrollPeriodId,
                employeeId
            );

        return Response.success(
            res,
            result,
            'Payroll preview generated successfully.'
        );

    });

    /*
    =====================================================
    Finalize Payroll
    =====================================================
    */

    static finalize = asyncHandler(async (req, res) => {

        const {
            payrollPeriodId,
        } = req.body;

        const result =
            await PayrollBatchService.finalize(
                payrollPeriodId,
                req.user.id
            );

        return Response.created(
            res,
            result,
            'Payroll generated successfully.'
        );

    });

    /*
    =====================================================
    Logged In Employee Payroll
    =====================================================
    */

    static getMyPayroll = asyncHandler(async (req, res) => {

        const employee =
            await Employee.findOne({
                user: req.user.id,
            });

        if (!employee) {
            return Response.notFound(
                res,
                'Employee profile not found.'
            );
        }

        const payrolls =
            await Payroll.find({

                employee:
                    employee._id,

            })

            .populate(
                'payrollPeriod'
            )

            .sort({
                createdAt: -1,
            });

        return Response.success(
            res,
            payrolls
        );

    });

    /*
    =====================================================
    All Payroll
    =====================================================
    */

    static getAll = asyncHandler(async (req, res) => {

        const payrolls =
            await Payroll.find()

            .populate({

                path: 'employee',

                populate: {
                    path: 'user',
                    select:
                        'firstName lastName email',
                },

            })

            .populate('payrollPeriod')

            .sort({
                createdAt: -1,
            });

        return Response.success(
            res,
            payrolls
        );

    });

    /*
    =====================================================
    Single Payroll
    =====================================================
    */

    static getOne = asyncHandler(async (req, res) => {

        const payroll =
            await Payroll.findById(
                req.params.id
            )

            .populate({

                path: 'employee',

                populate: {
                    path: 'user',
                },

            })

            .populate(
                'payrollPeriod'
            );

        if (!payroll) {

            return Response.notFound(
                res,
                'Payroll not found.'
            );

        }

        /* Employees may only view their own payslips.
           HR/admin are already gated by the route. */
        if (req.user.role === 'employee') {

            const ownerId =
                payroll.employee?.user?._id ||
                payroll.employee?.user;

            if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
                return Response.forbidden(
                    res,
                    'You can only view your own payslips.'
                );
            }

        }

        return Response.success(
            res,
            payroll
        );

    });

    /*
    =====================================================
    Review Payroll
    =====================================================
    */

    static review = asyncHandler(async (req, res) => {

        const payroll =
            await Payroll.findById(
                req.params.id
            );

        if (!payroll) {

            return Response.notFound(
                res,
                'Payroll not found.'
            );

        }

        payroll.workflow.employeeStatus =
            'review';

        payroll.workflow.reviewedBy =
            req.user.id;

        payroll.workflow.reviewedAt =
            new Date();

        payroll.auditTrail.push({

            action:
                'Payroll Reviewed',

            performedBy:
                req.user.id,

            remarks:
                req.body.remarks || '',

        });

        await payroll.save();

        return Response.success(
            res,
            payroll,
            'Payroll moved for review.'
        );

    });

    /*
    =====================================================
    Approve Payroll
    =====================================================
    */

    static approve = asyncHandler(async (req, res) => {

        const payroll =
            await Payroll.findById(
                req.params.id
            );

        if (!payroll) {

            return Response.notFound(
                res,
                'Payroll not found.'
            );

        }

        payroll.workflow.employeeStatus =
            'approved';

        payroll.workflow.approvedBy =
            req.user.id;

        payroll.workflow.approvedAt =
            new Date();

        payroll.auditTrail.push({

            action:
                'Payroll Approved',

            performedBy:
                req.user.id,

            remarks:
                req.body.remarks || '',

        });

        await payroll.save();

        return Response.success(
            res,
            payroll,
            'Payroll approved.'
        );

    });

    /*
    =====================================================
    Lock Payroll
    =====================================================
    */

    static lock = asyncHandler(async (req, res) => {

        const payroll =
            await Payroll.findById(
                req.params.id
            );

        if (!payroll) {

            return Response.notFound(
                res,
                'Payroll not found.'
            );

        }

        payroll.workflow.employeeStatus =
            'locked';

        payroll.workflow.lockedBy =
            req.user.id;

        payroll.workflow.lockedAt =
            new Date();

        payroll.auditTrail.push({

            action:
                'Payroll Locked',

            performedBy:
                req.user.id,

        });

        await payroll.save();

        return Response.success(
            res,
            payroll,
            'Payroll locked.'
        );

    });

    /*
    =====================================================
    Mark Paid
    =====================================================
    */

    static markPaid = asyncHandler(async (req, res) => {

        const payroll =
            await Payroll.findById(
                req.params.id
            );

        if (!payroll) {

            return Response.notFound(
                res,
                'Payroll not found.'
            );

        }

        payroll.workflow.employeeStatus =
            'paid';

        payroll.payment.paymentStatus =
            'paid';

        payroll.payment.paymentMethod =
            req.body.paymentMethod;

        payroll.payment.paymentReference =
            req.body.paymentReference;

        payroll.payment.paymentDate =
            new Date();

        payroll.auditTrail.push({

            action:
                'Payroll Paid',

            performedBy:
                req.user.id,

        });

        await payroll.save();

        return Response.success(
            res,
            payroll,
            'Payroll marked as paid.'
        );

    });



    /*
    =====================================================
    Reject Payroll
    =====================================================
    */
   static reject = asyncHandler(async (req, res) => {

        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return Response.notFound(
                res,
                "Payroll not found."
            );
        }

        payroll.workflow.employeeStatus = "rejected";
        payroll.workflow.rejectedBy = req.user.id;
        payroll.workflow.rejectedAt = new Date();

        payroll.auditTrail.push({
            action: "Payroll Rejected",
            performedBy: req.user.id,
            remarks: req.body.remarks || "",
        });

        await payroll.save();

        return Response.success(
            res,
            payroll,
            "Payroll rejected."
        );

    });

    /*
    =====================================================
    Delete Draft Payroll
    =====================================================
    */

    static remove = asyncHandler(async (req, res) => {

        const payroll =
            await Payroll.findById(
                req.params.id
            );

        if (!payroll) {

            return Response.notFound(
                res,
                'Payroll not found.'
            );

        }

        if (
            payroll.workflow.employeeStatus !==
            'draft'
        ) {

            return Response.badRequest(
                res,
                'Only draft payroll can be deleted.'
            );

        }

        await payroll.deleteOne();

        return Response.success(
            res,
            null,
            'Payroll deleted.'
        );

    });


    /*
    =====================================================
    Bulk Generate Payroll
    =====================================================
    */

   static bulkGenerate = asyncHandler(async (req, res) => {

        const { payrollPeriodId } = req.body;

        const result =
            await PayrollBatchService.finalize(

                payrollPeriodId,

                req.user.id

            );

        return Response.success(

            res,

            result,

            'Bulk payroll generated.'

        );

    });

    /*
    =====================================================
    Statistics
    =====================================================
    */
   static statistics = asyncHandler(async (req, res) => {

        const summary =
            await Payroll.aggregate([

            {
                $group:{
                    _id:null,
                    
                    payrolls:{
                        $sum:1
                    },
                    gross:{
                        $sum:'$totals.grossPay'
                    },
                    net:{
                        $sum:'$totals.netPay'
                    },
                    deductions:{
                        $sum:'$totals.totalDeductions'
                    }
                }
            }
        ]);

        return Response.success(
            res,
            summary[0] || {
                payrolls:0,
                gross:0,
                net:0,
                deductions:0,
            }
        );
    });
}


module.exports = PayrollController;