import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>Employee System</h2>
      </div>

      <div className="navbar-right">
        <span>{user?.name} ({user?.role})</span>

        <button onClick={toggleTheme}>Theme</button>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;