import { useEffect, useState } from 'react';
import employeeService from '../../services/employeeService';

const EmployeeProfile = () => {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    employeeService.getProfile()
      .then(res => setEmployee(res.data.data));
  }, []);

  if (!employee) return <p>Loading...</p>;

  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {employee.name}</p>
      <p>Email: {employee.email}</p>
      <p>Role: {employee.role}</p>
    </div>
  );
};

export default EmployeeProfile;