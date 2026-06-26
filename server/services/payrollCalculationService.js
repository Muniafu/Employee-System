const Attendance = require('../models/Attendance');
const { buildPayrollPreview } = require('../utils/payrollHelper');

const getPeriodRange = (period) => {
const [year, month] =
period.split('-').map(Number);

return {
start:
new Date(
year,
month - 1,
1
),

end:
  month === 12
    ? new Date(
        year + 1,
        0,
        1
      )
    : new Date(
        year,
        month,
        1
      ),

};
};

const calculatePayroll =
async (
employee,
period
) => {

const { start, end } =
getPeriodRange(period);

const attendance =
await Attendance.find({
employee:
employee._id,

status:
'present',

date:{
$gte:start,
$lt:end,
},
});

const daysWorked =
attendance.length;

const overtimeHours =
attendance.reduce(
(sum,row)=>
sum+(row.overtime||0),
0
);

const preview =
buildPayrollPreview(
employee,
daysWorked,
overtimeHours
);

return {
attendance,
daysWorked,
overtimeHours,
preview,
};

};

module.exports={ calculatePayroll, getPeriodRange };