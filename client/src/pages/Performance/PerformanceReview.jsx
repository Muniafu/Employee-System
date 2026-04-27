import { useEffect, useState } from 'react';
import performanceService from '../../services/performanceService';
import Table from '../../components/Table';

const PerformanceReview = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    performanceService.getMy()
      .then(res => setReviews(res.data.data));
  }, []);

  return (
    <div>
      <h2>My Performance Reviews</h2>

      <Table
        columns={[
          {
            header: 'Quarter',
            accessor: row =>
              `Q${row.period?.quarter} ${row.period?.year}`
          },
          { header: 'Rating', accessor: 'rating' },
          { header: 'Status', accessor: 'status' }
        ]}
        data={reviews}
      />
    </div>
  );
};

export default PerformanceReview;