import { useEffect, useState } from 'react';
import engagementService from '../../services/engagementService';

const EngagementSurvey = () => {
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    engagementService.getSurveys()
      .then(res => setSurveys(res.data.data));
  }, []);

  const submit = async (surveyId, questions) => {
    const answers = questions.map(q => ({
      questionId: q.id,
      value: 5 // placeholder (replace with UI input)
    }));

    await engagementService.submitSurvey({ surveyId, answers });
    alert('Submitted');
  };

  return (
    <div>
      <h2>Engagement Surveys</h2>

      {surveys.map(s => (
        <div key={s._id} style={{ marginBottom: 20 }}>
          <h4>{s.title}</h4>

          {s.questions.map(q => (
            <p key={q.id}>{q.text}</p>
          ))}

          <button onClick={() => submit(s._id, s.questions)}>
            Submit Survey
          </button>
        </div>
      ))}
    </div>
  );
};

export default EngagementSurvey;