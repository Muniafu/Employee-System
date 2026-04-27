import { useEffect, useState } from 'react';
import learningService from '../../services/learningService';

const TrainingModules = () => {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    learningService.getAllModules()
      .then(res => setModules(res.data.data));
  }, []);

  const enroll = async (id) => {
    await learningService.enroll(id);
    alert('Enrolled successfully');
  };

  return (
    <div>
      <h2>Training Modules</h2>

      {modules.map(m => (
        <div key={m._id} style={{ marginBottom: 20 }}>
          <h4>{m.title}</h4>
          <p>{m.description}</p>

          <button onClick={() => enroll(m._id)}>
            Enroll
          </button>
        </div>
      ))}
    </div>
  );
};

export default TrainingModules;