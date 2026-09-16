// Universal base tasks (existing onboarding DEFAULT_TASKS, unchanged) live in onboardingController.
// This file adds department-specific overlays for both onboarding and offboarding.

const DEPARTMENT_ONBOARDING_TASKS = {
  engineering: [
    { title: 'Provision dev environment & repo access', category: 'it_setup', assignedTo: 'it', required: true },
    { title: 'VPN & production access review', category: 'it_setup', assignedTo: 'it', required: false },
  ],
  finance: [
    { title: 'Financial systems access & compliance briefing', category: 'policy', assignedTo: 'hr', required: true },
  ],
  sales: [
    { title: 'CRM account setup', category: 'it_setup', assignedTo: 'it', required: true },
    { title: 'Territory / quota assignment', category: 'meeting', assignedTo: 'manager', required: true },
  ],
  legal: [
    { title: 'Confidentiality & compliance acknowledgment', category: 'policy', assignedTo: 'employee', required: true },
  ],
  marketing: [
    { title: 'Brand & marketing tools access', category: 'it_setup', assignedTo: 'it', required: false },
  ],
  hr: [],
  operations: [],
  other: [],
};

const DEPARTMENT_OFFBOARDING_TASKS = {
  engineering: [
    { title: 'Revoke repository & production access', category: 'access_revocation', assignedTo: 'it', required: true },
  ],
  sales: [
    { title: 'CRM account & pipeline handover', category: 'knowledge_transfer', assignedTo: 'employee', required: true },
  ],
  finance: [
    { title: 'Financial systems access revocation', category: 'access_revocation', assignedTo: 'it', required: true },
  ],
  legal: [
    { title: 'Re-acknowledge post-employment confidentiality/NDA obligations', category: 'documentation', assignedTo: 'hr', required: true },
  ],
  marketing: [],
  hr: [],
  operations: [],
  other: [],
};

const getDepartmentTasks = (templateMap, department) => {
  const key = (department || '').toLowerCase().trim();
  return templateMap[key] || [];
};

module.exports = {
  DEPARTMENT_ONBOARDING_TASKS,
  DEPARTMENT_OFFBOARDING_TASKS,
  getDepartmentTasks,
};