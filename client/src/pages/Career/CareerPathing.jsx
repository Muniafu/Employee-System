import { useEffect, useState } from "react";
import careerService from "../../services/careerService";

const CareerPathing = () => {
  const [path, setPath] = useState(null);

  useEffect(() => {
    careerService.getMyPath()
      .then(res => setPath(res.data.data));
  }, []);

  if (!path) return <div>No career path defined.</div>

  return (
    <div>
      <h2>Career Path</h2>

      <p><strong>Current Role:</strong>{path.currentRole}</p>
      <p><strong>Target Role:</strong>{path.targetRole}</p>
      <p><strong>Readiness Role:</strong>{path.readinessScore}%</p>

      <h4>Required Skills</h4>
      <ul>
        {path.requiredSkills.map((skill, i) =>
          <li key={i}>{skill}</li>
        )}
      </ul>

      <h4>Completed Skills</h4>
      <ul>
        {path.completedSkills.map((skill, i) =>
          <li key={i}>{skill}</li>
        )}
      </ul>
    </div>
  );
};

export default CareerPathing;