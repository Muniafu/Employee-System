import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  return (
    <aside className="sidebar">
      <NavLink to="/dashboard">Dashboard</NavLink>

      {(user?.role === 'admin' || user?.role === 'employer') && (
        <>
          <NavLink to="/employees">Employees</NavLink>
          <NavLink to="/payroll">Payroll</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </>
      )}

      <NavLink to="/attendance">Attendance</NavLink>
      <NavLink to="/leave">Leave</NavLink>
      <NavLink to="/profile">Profile</NavLink>
    </aside>
  );
};

export default Sidebar;