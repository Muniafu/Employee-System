import { useEffect, useState } from 'react';
import payrollService from '../../services/payrollService';
import Table from '../../components/Table';

const PayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState([]);

  useEffect(() => {
    payrollService.getMyPayroll()
      .then(res => setPayrolls(res.data.data));
  }, []);

  return (
    <Table
      columns={[
        {
          header: 'Month',
          accessor: row => `${row.period.month}/${row.period.year}`
        },
        {
          header: 'Net Salary',
          accessor: row => row.netpay
        },
        {
          header: 'Base Salary',
          accessor: row => row.baseSalary
        }
      ]}
      data={payrolls}
    />
  );
};

export default PayrollDashboard;