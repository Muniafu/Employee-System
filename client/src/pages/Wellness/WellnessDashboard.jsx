import { useEffect, useState } from 'react';
import wellnessService from '../../services/wellnessService';

const WellnessDashboard = () => {
  const [programs, setPrograms] = useState([]);

  const load = () => {
    wellnessService.getPrograms()
      .then(res => setPrograms(res.data.data));
  };

  useEffect(() => { load(); }, []);

  const enroll = async (id) => {
    await wellnessService.enroll(id);
    load();
  };

  return (
    <div>
      <h2>Wellness Programs</h2>

      {programs.length === 0 && <p>No programs available</p>}

      {programs.map(p => (
        <div key={p._id}>
          <h4>{p.title}</h4>
          <p>{p.type}</p>
          <button onClick={() => enroll(p._id)}>Enroll</button>
        </div>
      ))}
    </div>
  );
};

export default WellnessDashboard;