import { useEffect, useState } from 'react';
import attendanceService from '../../services/attendanceService';
import Table from '../../components/Table';

const AttendanceTracker = () => {
  const [records, setRecords] = useState([]);

  const fetchData = () =>
    attendanceService.getMyAttendance()
      .then(res => setRecords(res.data.data));

  useEffect(() => { fetchData(); }, []);

  const formatDate = (date) => 
    date ? new Date(date).toLocaleString() : '-';

  const clockIn = async () => {
    await attendanceService.clockIn();
    fetchData();
  };

  const clockOut = async () => {
    await attendanceService.clockOut();
    fetchData();
  };

  return (
    <div>
      <button onClick={clockIn}>Clock In</button>
      <button onClick={clockOut}>Clock Out</button>

      <Table
        columns={[
          { header: 'Date', accessor: row => formatDate(row.date) },
          { header: 'Clock In', accessor: row => formatDate(row.clockIn) },
          { header: 'Clock Out', accessor: row => formatDate(row.clockOut) },
          { header: 'Total Hours', accessor: row => row.totalHours.toFixed(2) }
        ]}
        data={records}
      />
    </div>
  );
};

export default AttendanceTracker;