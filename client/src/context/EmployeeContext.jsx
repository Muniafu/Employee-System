import { createContext, useState, useEffect, useCallback } from 'react';
import employeeService from '../services/employeeService';

export const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAll();
      setEmployees(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeById = async (id) => {
    try {
      setLoading(true);
      const res = await employeeService.getById(id);
      setSelectedEmployee(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employee');
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (data) => {
    const res = await employeeService.create(data);
    await fetchEmployees();
    return res;
  };

  const updateEmployee = async (id, data) => {
    const res = await employeeService.update(id, data);
    await fetchEmployees();
    return res;
  };

  const deleteEmployee = async (id) => {
    await employeeService.delete(id);
    await fetchEmployees();
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        selectedEmployee,
        loading,
        error,
        fetchEmployees,
        fetchEmployeeById,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        setSelectedEmployee
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};