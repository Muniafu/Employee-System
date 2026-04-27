const Dashboard = ({ title, children, loading }) => {
  return (
    <div className="dashboard">
      <h1>{title}</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="dashboard-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default Dashboard;