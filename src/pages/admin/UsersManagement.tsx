import React, { useEffect, useState } from 'react';
import { fetchUsersWithRoles, updateUserRole, UserWithRole } from '@/services/firestore/users';
import { useAuth } from '@/contexts/AuthContext';
import './UsersManagement.css';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await fetchUsersWithRoles();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      setError(null);

      // Update role in Firestore
      await updateUserRole(userId, [newRole]);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, roles: [newRole] } : user
        )
      );
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role. Please try again.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeClass = (roles: string[]) => {
    if (roles.includes('admin')) return 'role-badge admin';
    return 'role-badge player';
  };

  const getRoleDisplay = (roles: string[]) => {
    if (roles.includes('admin')) return 'Admin';
    return 'Player';
  };

  if (!isAdmin) {
    return (
      <div className="users-management">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="users-header">
        <div className="header-content">
          <h1>Users Management</h1>
          <p className="subtitle">Manage user roles and permissions</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {users.filter(u => u.roles.includes('admin')).length}
            </span>
            <span className="stat-label">Admins</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {users.filter(u => u.roles.includes('player')).length}
            </span>
            <span className="stat-label">Players</span>
          </div>
        </div>
      </div>

      <div className="users-controls">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={loadUsers} className="refresh-btn" disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Gender</th>
                <th>Current Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">
                    {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="user-name">
                      <div className="name-cell">
                        <div className="avatar">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span>{user.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>{user.department || 'N/A'}</td>
                    <td className="gender-cell">
                      {user.gender ? (
                        <span className="gender-badge">{user.gender}</span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <span className={getRoleBadgeClass(user.roles)}>
                        {getRoleDisplay(user.roles)}
                      </span>
                    </td>
                    <td>
                      <div className="role-selector">
                        <select
                          value={user.roles.includes('admin') ? 'admin' : 'player'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingUserId === user.id}
                          className="role-select"
                        >
                          <option value="player">Player</option>
                          <option value="admin">Admin</option>
                        </select>
                        {updatingUserId === user.id && (
                          <div className="updating-indicator">
                            <div className="mini-spinner"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
