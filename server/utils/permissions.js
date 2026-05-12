const PERMISSIONS = {
  VIEW_SELF_PROFILE: 'view_self_profile',
  VIEW_EMPLOYEES: 'view_employees',
  MANAGE_EMPLOYEES: 'manage_employees',

  VIEW_PAYROLL: 'view_payroll',
  MANAGE_PAYROLL: 'manage_payroll',

  VIEW_ANALYTICS: 'view_analytics',

  MANAGE_POLICIES: 'manage_policies',

  MANAGE_SYSTEM: 'manage_system',

  MANAGE_ROLES: 'manage_roles',

  ACCESS_AUDIT_LOGS: 'access_audit_logs',
};

const ROLE_PERMISSIONS = {
  employee: [
    PERMISSIONS.VIEW_SELF_PROFILE,
  ],

  manager: [
    PERMISSIONS.VIEW_SELF_PROFILE,
    PERMISSIONS.VIEW_EMPLOYEES,
  ],

  hr: [
    PERMISSIONS.VIEW_SELF_PROFILE,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_PAYROLL,
  ],

  admin: [
    ...Object.values(PERMISSIONS),
  ],

  superuser: [
    ...Object.values(PERMISSIONS),
  ],
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
};