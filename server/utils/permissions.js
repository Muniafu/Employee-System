const PERMISSIONS={

VIEW_SELF_PROFILE:
'view_self_profile',

VIEW_OWN_PAYROLL:
'view_own_payroll',

VIEW_PAYROLL:
'view_payroll',

FINALIZE_PAYROLL:
'finalize_payroll',

EXPORT_PAYROLL:
'export_payroll',

MANAGE_EMPLOYEES:
'manage_employees',

};

const ROLE_PERMISSIONS={

employee:[
PERMISSIONS
.VIEW_SELF_PROFILE,

PERMISSIONS
.VIEW_OWN_PAYROLL,
],

manager:[
PERMISSIONS
.VIEW_SELF_PROFILE,
],

hr:[
PERMISSIONS
.VIEW_PAYROLL,

PERMISSIONS
.FINALIZE_PAYROLL,
],

admin:
Object
.values(
PERMISSIONS
),

superuser:
Object
.values(
PERMISSIONS
),

};

module.exports={
PERMISSIONS,
ROLE_PERMISSIONS,
};