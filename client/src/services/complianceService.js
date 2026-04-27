import api from './api';

const complianceService = {
  getPolicies: () =>
    api.get('/compliance'),

  acknowledgePolicy: (policyId) =>
    api.post(`/compliance/${policyId}/acknowledge`)
};

export default complianceService;