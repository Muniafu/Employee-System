import { useEffect, useState } from 'react';
import complianceService from '../../services/complianceService';

const PolicyAcknowledgment = () => {
  const [policies, setPolicies] = useState([]);

  const fetchPolicies = async () => {
    complianceService.getPolicies()
      .then(res => setPolicies(res.data.data));
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const acknowledge = async (id) => {
    await complianceService.acknowledgePolicy(id);
    alert('Acknowledged successfully');
  };

  return (
    <div>
      {policies.map(p => (
        <div key={p._id}>
          <h4>{p.title}</h4>
          <p>{p.content}</p>
          <button onClick={() => acknowledge(p._id)}>
            Acknowledge
          </button>
        </div>
      ))}
    </div>
  );
};

export default PolicyAcknowledgment;