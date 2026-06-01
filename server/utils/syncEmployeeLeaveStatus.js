const Employee =
require('../models/Employee');

const Leave =
require('../models/Leave');

module.exports =
async function syncEmployeeLeaveStatus(
employeeId
){

const today =
new Date();

today.setHours(
0,
0,
0,
0
);

const activeLeave =
await Leave.findOne({
employee:
employeeId,
status:
'approved',
startDate:
{ $lte: today },
endDate:
{ $gte: today },
});

await Employee.updateOne(
{
_id:
employeeId,
},
{
status:
activeLeave
? 'on_leave'
: 'active',
}
);

};