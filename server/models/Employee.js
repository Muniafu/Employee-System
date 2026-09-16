const mongoose = require('mongoose');

const {
    EMPLOYMENT_TYPE,
    EMPLOYEE_PAYMENT_METHOD,
} = require('../constants/payrollConstants');

const allowanceSchema = new mongoose.Schema(
  {
    housing: {
      type: Number,
      default: 0,
      min: 0,
    },

    transport: {
      type: Number,
      default: 0,
      min: 0,
    },

    medical: {
      type: Number,
      default: 0,
      min: 0,
    },

    communication: {
      type: Number,
      default: 0,
      min: 0,
    },

    hardship: {
      type: Number,
      default: 0,
      min: 0,
    },

    other: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const deductionSchema = new mongoose.Schema(
  {
    loan: {
      type: Number,
      default: 0,
      min: 0,
    },

    salaryAdvance: {
      type: Number,
      default: 0,
      min: 0,
    },

    sacco: {
      type: Number,
      default: 0,
      min: 0,
    },

    pension: {
      type: Number,
      default: 0,
      min: 0,
    },

    insurance: {
      type: Number,
      default: 0,
      min: 0,
    },

    other: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const payrollProfileSchema = new mongoose.Schema(
  {
    eligible: {
      type: Boolean,
      default: true,
    },

    employmentType: {
        type: String,
        enum: Object.values(
            EMPLOYMENT_TYPE
        ),
        default:
            EMPLOYMENT_TYPE.PERMANENT,
    },

    paymentMethod: {
        type: String,
        enum: Object.values(
            EMPLOYEE_PAYMENT_METHOD
        ),
        default:
            EMPLOYEE_PAYMENT_METHOD.BANK,
    },

    basicSalary:{
        type:Number,
        required:true,
        min:0,
        default:0,
    },

    effectiveDate: {
      type: Date,
      default: Date.now,
    },

    allowances: {
      type: allowanceSchema,
      default: () => ({}),
    },

    deductions: {
      type: deductionSchema,
      default: () => ({}),
    },

    taxRelief: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const bankSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      trim: true,
      default: '',
    },

    accountNumber: {
      type: String,
      trim: true,
      default: '',
    },

    accountName: {
      type: String,
      trim: true,
      default: '',
    },

    branchCode: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    employeeId: {
      type: String,
      unique: true,
    },

    department: {
      type: String,
      default: '',
    },

    position: {
      type: String,
      default: '',
    },

    phone: {
      type: String,
      default: '',
      trim: true,
    },

    address: {
      type: String,
      default: '',
    },

    dateOfBirth: Date,

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: Date,

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    status: {
      type: String,
      enum: [
        'pending',
        'onboarding',
        'active',
        'probation',
        'on_leave',
        'suspended',
        'offboarding',
        'terminated',
      ],
      default: 'pending',
    },

    salary: {
      type: Number,
      default: 0,
    },

    currency:{
        type:String,
        uppercase:true,
        trim:true,
        default:'KES',
        minlength:3,
        maxlength:3,
    },

    payrollProfile: {
      type: payrollProfileSchema,
      default: () => ({}),
    },

    profileImage: {
      type: String,
      default: '',
    },

    leaveBalance: {
      annual: {
        type: Number,
        default: 21,
      },

      sick: {
        type: Number,
        default: 10,
      },

      maternity: {
        type: Number,
        default: 90,
      },

      paternity: {
        type: Number,
        default: 14,
      },
    },

    emergencyContact: {
      name: {
        type: String,
        default: '',
      },

      phone: {
        type: String,
        default: '',
      },

      relationship: {
        type: String,
        default: '',
      },
    },

    bankDetails: {
      type: bankSchema,
      default: () => ({}),
    },

    taxPin: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },

    nssfNumber: {
      type: String,
      trim: true,
      default: '',
    },

    nhifNumber: {
      type: String,
      default: '',
    },

    housingLevyNumber: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.methods.isPayrollEligible = function () {
  return this.payrollProfile?.eligible !== false;
};

employeeSchema.pre('save', function (next) {
  if (!this.employeeId) {
    this.employeeId = `EMP${Date.now()}`;
  }

  if (
    this.salary !== this.payrollProfile.basicSalary
  ) {
    this.payrollProfile.basicSalary =
      this.salary;
  }

  next();
});


employeeSchema.index({
  department: 1,
  status: 1,
});

module.exports = mongoose.model( 'Employee', employeeSchema );