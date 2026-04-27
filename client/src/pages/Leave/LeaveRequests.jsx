import { useEffect, useState } from 'react';
import leaveService from '../../services/leaveService';
import Table from '../../components/Table';

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({
    type: 'sick',
    startDate: '',
    endDate: ''
  });

  const fetchData = () => leaveService.getMyLeaves()
    .then(res => setLeaves(res.data.data));

    useEffect(() => {
      fetchData();
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      await leaveService.requestLeave(form);
      fetchData();
    };

    const formatDate = (date) => 
      new Date(date).toLocaleDateString();
    
  return (
    <div>
      <h2>Request Leave</h2>

      <form onSubmit={handleSubmit}>
        <select
          value={form.type}
          onChange={e =>
            setForm({ ...form, type: e.target.value })
          }
        >
          <option value="sick">Sick</option>
          <option value="vacation">Vacation</option>
          <option value="personal">Personal</option>
          <option value="maternity">Maternity</option>
          <option value="paternity">Paternity</option>
          <option value="unpaid">Unpaid</option>
          <option value="other">Other</option>
        </select>

        <input
          type="date"
          onChange={e =>
            setForm({ ...form, startDate: e.target.value })
          }
          required
        />

        <input
          type="date"
          onChange={e =>
            setForm({ ...form, endDate: e.target.value })
          }
          required
        />

        <button type="submit">Submit</button>
      </form>

      <Table
        columns={[
          { header: 'Type', accessor: 'type' },
          { header: 'Start', accessor: row => formatDate(row.startDate) },
          { header: 'End', accessor: row => formatDate(row.endDate) },
          { header: 'Status', accessor: 'status' }
        ]}
        data={leaves}
      />
    </div>
  );
};

export default LeaveRequests;