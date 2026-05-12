const ROLE_PERMISSIONS = {
  employee: [],

  manager: [
    'manage_employees',
  ],

  hr: [
    'manage_employees',
    'view_analytics',
  ],

  admin: ['*'],

  superuser: ['*'],
};

export const hasPermission = (
  user,
  permission
) => {
  if (!user) return false;

  const permissions =
    ROLE_PERMISSIONS[user.role] || [];

  return (
    permissions.includes('*') ||
    permissions.includes(permission)
  );
};