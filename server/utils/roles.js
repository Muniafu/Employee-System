const ROLES = {
  SUPERUSER: 'superuser',
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};;

const ROLE_HIERARCHY = {
  employee: 1,
  manager: 2,
  hr: 3,
  admin: 4,
  superuser: 5,
};

const PRIVILEGED = [ROLES.SUPERUSER, ROLES.ADMIN, ROLES.HR];
const MANAGEMENT = [ROLES.SUPERUSER, ROLES.ADMIN, ROLES.HR, ROLES.MANAGER];

const hasRole = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

const hasMinRole = (userRole, minRole) => {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
};

module.exports = { ROLES, ROLE_HIERARCHY, PRIVILEGED, MANAGEMENT, hasRole, hasMinRole };