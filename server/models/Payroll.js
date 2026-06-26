const mongoose =
require('mongoose');

const payrollSchema =
new mongoose.Schema({

employee:{
type:
mongoose.Schema.Types.ObjectId,
ref:'Employee',
required:true,
},

employeeSnapshot:{
employeeId:String,

firstName:String,

lastName:String,

department:String,

position:String,

salary:Number,

currency:String,
},

period:{
type:String,
required:true,
},

basicSalary:{
type:Number,
required:true,
},

allowances:{
housing:{type:Number,default:0},
transport:{type:Number,default:0},
medical:{type:Number,default:0},
other:{type:Number,default:0},
},

deductions:{
paye:{type:Number,default:0},
nhif:{type:Number,default:0},
nssf:{type:Number,default:0},
loan:{type:Number,default:0},
other:{type:Number,default:0},
},

grossPay:Number,

netPay:Number,

daysWorked:Number,

overtimeHours:Number,

overtimePay:Number,

status:{
type:String,

enum:[
'draft',
'review',
'approved',
'finalized',
'paid',
],

default:'draft',
},

finalizedBy:{
type:
mongoose.Schema.Types.ObjectId,
ref:'User',
},

finalizedAt:Date,

paymentDate:Date,

notes:String,

},{
timestamps:true
});

payrollSchema.index(
{
employee:1,
period:1,
},
{
unique:true,
}
);

payrollSchema.pre(
'save',
function(next){

const totalAllowances=
Object.values(
this.allowances
)
.reduce(
(a,b)=>
a+b,
0
);

const totalDeductions=
Object.values(
this.deductions
)
.reduce(
(a,b)=>
a+b,
0
);

this.grossPay=
this.basicSalary+
totalAllowances+
this.overtimePay;

this.netPay=
Math.max(
0,
this.grossPay-
totalDeductions
);

next();

}
);

module.exports= mongoose.model( 'Payroll', payrollSchema );