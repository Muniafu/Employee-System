import { useEffect, useState } from 'react';
import employeeService from '../../services/employeeService';
import Table from '../../components/Table';
import Dashboard from '../../components/Dashboard';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employeeService.getAll()
      .then(res => setEmployees(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Dashboard title="Employees" loading={loading}>
      <Table
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Email', accessor: 'email' },
          { header: 'Role', accessor: 'role' }
        ]}
        data={employees}
      />
    </Dashboard>
  );
};

export default EmployeeList;