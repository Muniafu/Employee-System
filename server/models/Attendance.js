const mongoose = require('mongoose');
const {
    ATTENDANCE_STATUS,
} = require('../constants/payrollConstants');

const attendanceSchema = new mongoose.Schema(
{
    employee:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Employee',
        required:true,
        index:true,
    },
    
    date:{
        type:Date,
        required:true,
        index:true,
    },
    
    clockIn:Date,
    
    clockOut:Date,
    
    hoursWorked:{
        type:Number,
        default:0,
        min:0,
    },

    overtimeHours:{
        type:Number,
        default:0,
        min:0,
    },

    lateMinutes:{
        type:Number,
        default:0,
        min:0,
    },

    status:{
        type:String,
        enum:Object.values(
            ATTENDANCE_STATUS
        ),
        default:
            ATTENDANCE_STATUS.PRESENT,
    },

    location:{
        type:String,
        trim:true,
        default:'office',
    },

    approvedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },

    source:{
        type:String,
        enum:[
            'manual',
            'biometric',
            'mobile',
            'import',
        ],
        default:'manual',
    },

    approvedAt:Date,

    note:{
        type:String,
        default:'',
    },
},{
    timestamps:true,
});

attendanceSchema.index({
    employee:1,
    date:1,
},{
    unique:true,
});

attendanceSchema.index({
    status:1,
});

attendanceSchema.pre(
'validate',
function(next){
    if(
        this.clockIn &&
        this.clockOut &&
        this.clockOut < this.clockIn
    ){
        return next(
            new Error(
                'Clock-out cannot be earlier than clock-in.'
            )
        );
    }
    next();
});

attendanceSchema.methods.calculateHours = function () {

    if (!this.clockIn || !this.clockOut) {
        return;
    }

    const totalHours =
        (this.clockOut - this.clockIn) /
        (1000 * 60 * 60);

    const standardHours = 8;

    this.hoursWorked = Number(
        Math.min(totalHours, standardHours).toFixed(2)
    );

    this.overtimeHours = Number(
        Math.max(0, totalHours - standardHours).toFixed(2)
    );

};


module.exports= mongoose.model( 'Attendance', attendanceSchema );