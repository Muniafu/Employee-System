const mongoose = require('mongoose');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { calculatePayroll } = require('../services/payrollCalculationService');
const { dispatchNotification } = require('../services/notificationOrchestrator');
const { templates } = require('../utils/emailService');

const currentPeriod =
() => {

const d =
new Date();

return `${d.getFullYear()}-${String(
d.getMonth()+1
).padStart(
2,
'0'
)}`;

};

const snapshot =
(employee)=>({

employeeId:
employee.employeeId,

firstName:
employee.user.firstName,

lastName:
employee.user.lastName,

department:
employee.department,

position:
employee.position,

salary:
employee.salary,

currency:
employee.currency,

});

// PREVIEW

exports.preview =
async(
req,
res,
next
)=>{

try{

const {
employeeId,
period,
}=req.body;

const target=
period||
currentPeriod();

const employee=
await Employee
.findById(
employeeId
)
.populate(
'user',
'firstName lastName email status'
);

if(
!employee
){

return res
.status(404)
.json({
success:false,
message:
'Employee not found',
});

}

if(
employee.status===
'terminated'
){

return res
.status(409)
.json({
success:false,
message:
'Employee inactive',
});

}

const result=
await calculatePayroll(
employee,
target
);

return res
.status(200)
.json({

success:true,

data:{

employee:{

id:
employee._id,

employeeId:
employee.employeeId,

name:
`${employee.user.firstName} ${employee.user.lastName}`,

department:
employee.department,

position:
employee.position,

},

period:
target,

...result.preview,

},

});

}
catch(err){

next(err);

}

};

// FINALIZE

exports.finalize =
async(
req,
res,
next
)=>{

const session=
await mongoose
.startSession();

try{

await session
.withTransaction(
async()=>{

const {
employeeId,
period,
}=req.body;

const target=
period||
currentPeriod();

const employee=
await Employee
.findById(
employeeId
)
.populate(
'user'
)
.session(
session
);

if(
!employee
){

throw new Error(
'Employee not found'
);

}

if(
employee.status===
'terminated'
){

throw new Error(
'Cannot process payroll'
);

}

const existing=
await Payroll
.findOne({

employee:
employee._id,

period:
target,

})
.session(
session
);

if(
existing
){

throw new Error(
'Payroll already exists'
);

}

const result=
await calculatePayroll(
employee,
target
);

const payroll=
await Payroll
.create(
[{

employee:
employee._id,

employeeSnapshot:
snapshot(
employee
),

period:
target,

...result.preview,

status:
'finalized',

finalizedBy:
req.user._id,

finalizedAt:
new Date(),

}],
{
session,
}
);

try{

await dispatchNotification({
  recipient: employee.user._id,
  
  email: employee.user.email,
  channels: ['inApp', 'email'],

  title: 'Payslip Ready',

  message: `Payroll finalized for ${target}`,

  emailContent:
    templates.payrollFinalized(
      employee.user.firstName,
      target,
      result.preview.netPay
    ),
});

}
catch(e){

console.error(
e
);

}

return res
.status(
201
)
.json({

success:true,

data:
payroll[0],

});

});

}
catch(
err
){

next(
err
);

}
finally{

session
.endSession();

}

};

// MY PAYROLL

exports.getMyPayroll =
async(
req,
res,
next
)=>{

try{

const employee=
await Employee
.findOne({

user:
req.user._id,

});

if(
!employee
){

return res
.status(404)
.json({
success:false,
});

}

const payrolls=
await Payroll
.find({

employee:
employee._id,

})
.sort({

period:-1,

createdAt:-1,

});

res
.status(200)
.json({

success:true,

count:
payrolls.length,

data:
payrolls,

});

}
catch(
err
){

next(
err
);

}

};

// ALL

exports.getAll =
async(
req,
res,
next
)=>{

try{

const {

page=1,

limit=20,

status,

period,

}=req.query;

const filter={};

if(
status
){

filter.status=
status;

}

if(
period
){

filter.period=
period;

}

const payrolls=
await Payroll
.find(
filter
)

.populate({

path:
'employee',

populate:{

path:
'user',

select:
'firstName lastName email',

},

})

.sort({

period:-1,

})

.skip(
(
page-1
)
*
limit
)

.limit(
Number(
limit
)
);

const total=
await Payroll
.countDocuments(
filter
);

res
.status(200)
.json({

success:true,

total,

page:
Number(
page
),

data:
payrolls,

});

}
catch(
err
){

next(
err
);

}

};

// ONE

exports.getOne =
async(
req,
res,
next
)=>{

try{

const payroll=
await Payroll
.findById(
req.params.id
)

.populate({

path:
'employee',

populate:{
path:
'user',
select:
'firstName lastName email',
},

});

if(
!payroll
){

return res
.status(404)
.json({
success:false,
});

}

if(
req.user.role === 'employee'
&&
String(
payroll.employee.user._id
)
!==
String(
req.user._id
)
){

return res
.status(403)
.json({

success:false,

message:
'Access denied',

});

}

res
.status(200)
.json({

success:true,

data:
payroll,

});

}
catch(
err
){

next(
err
);

}

};