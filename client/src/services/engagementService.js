import api from './api';

const engagementService = {
  getSurveys: () =>
    api.get('/engagement'),

  submitSurvey: (data) =>
    api.post('/engagement', data), // { surveyId, answers }

  getResults: () =>
    api.get('/engagement/results')
};

export default engagementService;