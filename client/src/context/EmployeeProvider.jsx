import { useState, useCallback } from 'react';
import { getMyProfile } from '../services/employeeService';
import EmployeeContext from './EmployeeContext';

export default function EmployeeProvider({ children }) {
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await getMyProfile();

      setProfile(data.data);
    } catch (err) {
      console.error('Failed to fetch employee profile:', err);
    }
  }, []);

  return (
    <EmployeeContext.Provider
      value={{
        profile,
        fetchProfile,
        setProfile,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}