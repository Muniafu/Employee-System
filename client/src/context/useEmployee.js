import { useContext } from 'react';
import EmployeeContext from './EmployeeContext';

export const useEmployee = () => {
  const ctx = useContext(EmployeeContext);

  if (!ctx) {
    throw new Error('useEmployee must be used inside EmployeeProvider');
  }

  return ctx;
};