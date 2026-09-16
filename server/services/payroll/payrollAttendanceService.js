const Attendance = require('../../models/Attendance');

class PayrollAttendanceService {

    static async getSummary(
        employee,
        payrollPeriod,
        payrollSettings
    ) {

        const attendanceRecords =
            await Attendance.find({

                employee: employee._id,

                date: {
                    $gte: payrollPeriod.startDate,
                    $lte: payrollPeriod.endDate,
                },

            }).lean();

        let daysWorked = 0;
        let halfDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        let overtimeHours = 0;

        for (const record of attendanceRecords) {

            switch (record.status) {

                case 'present':
                    daysWorked++;
                    break;

                case 'half_day':
                    halfDays++;
                    daysWorked += 0.5;
                    break;

                case 'late':
                    daysWorked++;
                    lateDays++;
                    break;

                case 'absent':
                    absentDays++;
                    break;

                case 'on_leave':
                    break;

                default:
                    break;

            }

            overtimeHours +=
                Number(record.overtimeHours || 0);

        }

        const configuredWorkingDays =
            payrollSettings.workingDaysPerMonth;

        return {

            workingDays:
                configuredWorkingDays,

            attendanceRecords:
                attendanceRecords.length,

            daysWorked,
            halfDays,
            absentDays,
            lateDays,
            overtimeHours:
                Number(
                    overtimeHours.toFixed(2)
                ),
        };
    }
}

module.exports = PayrollAttendanceService;