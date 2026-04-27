import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import Table from '../Table';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = () =>
    adminService.getUsers()
      .then(res => setUsers(res.data.data));

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (id, role) => {
    await adminService.updateRole(id, role);
    fetchUsers();
  };

  const deactivate = async (id) => {
    await adminService.deactivate(id);
    fetchUsers();
  };

  return (
    <div>
      <h2>User Management</h2>

      <Table
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Email', accessor: 'email' },
          { header: 'Role', accessor: 'role' },
          {
            header: 'Actions',
            accessor: row => (
              <>
                <button onClick={() => changeRole(row._id, 'admin')}>
                  Make Admin
                </button>
                <button onClick={() => deactivate(row._id)}>
                  Deactivate
                </button>
              </>
            )
          }
        ]}
        data={users}
      />
    </div>
  );
};

export default AdminPanel;