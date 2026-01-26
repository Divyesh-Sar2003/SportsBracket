import React, { useEffect, useState } from 'react';
import { fetchUsersWithRoles, updateUserRole, UserWithRole, updateAdminPermissions } from '@/services/firestore/users';
import { useAuth } from '@/contexts/AuthContext';
import { AdminPermissions } from '@/types/tournament';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import './UsersManagement.css';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { isAdmin, isSuperAdmin } = useAuth();

  // Permissions states
  const [permsDialogOpen, setPermsDialogOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserWithRole | null>(null);
  const [editingParams, setEditingParams] = useState<AdminPermissions>({
    registrations: false,
    participants: false,
    tournaments: false,
    games: false,
    teams: false,
    schedule: false,
    matches: false,
    leaderboard: false,
    audit: false,
  });

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
    if (!isSuperAdmin) {
      toast.error('Only a Super Admin can change user roles.');
      return;
    }

    try {
      setUpdatingUserId(userId);
      setError(null);

      // Update role in Firestore
      await updateUserRole(userId, [newRole]);
      toast.success(`Role updated to ${newRole}`);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, roles: [newRole] } : user
        )
      );
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error('Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleOpenPerms = (user: UserWithRole) => {
    setSelectedUserForPerms(user);
    setEditingParams({
      registrations: user.permissions?.registrations ?? true,
      participants: user.permissions?.participants ?? true,
      tournaments: user.permissions?.tournaments ?? true,
      games: user.permissions?.games ?? true,
      teams: user.permissions?.teams ?? true,
      schedule: user.permissions?.schedule ?? true,
      matches: user.permissions?.matches ?? true,
      leaderboard: user.permissions?.leaderboard ?? true,
      audit: user.permissions?.audit ?? true,
    });
    setPermsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForPerms) return;

    try {
      setLoading(true);
      await updateAdminPermissions(selectedUserForPerms.id, editingParams);
      toast.success("Admin permissions updated successfully");
      setPermsDialogOpen(false);
      loadUsers();
    } catch (err) {
      toast.error("Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeClass = (roles: string[]) => {
    if (roles.includes('super_admin')) return 'role-badge super-admin';
    if (roles.includes('admin')) return 'role-badge admin';
    return 'role-badge player';
  };

  const getRoleDisplay = (roles: string[]) => {
    if (roles.includes('super_admin')) return 'Super Admin';
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
              {users.filter(u => u.roles.includes('admin') || u.roles.includes('super_admin')).length}
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

      {loading && !users.length ? (
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
                <th>Dept</th>
                <th>Current Role</th>
                <th>Change Role</th>
                <th>Rights</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">
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
                        <span className="truncate max-w-[120px]">{user.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="truncate max-w-[150px]">{user.email || 'N/A'}</td>
                    <td>{user.department || 'N/A'}</td>
                    <td>
                      <span className={getRoleBadgeClass(user.roles)}>
                        {getRoleDisplay(user.roles)}
                      </span>
                    </td>
                    <td>
                      <div className="role-selector">
                        <select
                          value={user.roles.includes('super_admin') ? 'super_admin' : (user.roles.includes('admin') ? 'admin' : 'player')}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingUserId === user.id || !isSuperAdmin || user.roles.includes('super_admin')}
                          className="role-select"
                        >
                          <option value="player">Player</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin" disabled>Super Admin</option>
                        </select>
                        {updatingUserId === user.id && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      </div>
                    </td>
                    <td>
                      {user.roles.includes('admin') && !user.roles.includes('super_admin') ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                          disabled={!isSuperAdmin}
                          onClick={() => handleOpenPerms(user)}
                        >
                          <Settings2 className="h-4 w-4" />
                          Set Rights
                        </Button>
                      ) : user.roles.includes('super_admin') ? (
                        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                          <ShieldCheck className="h-4 w-4" />
                          FULL ACCESS
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">N/A (Player)</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Permissions Dialog */}
      <Dialog open={permsDialogOpen} onOpenChange={setPermsDialogOpen}>
        <DialogContent className="max-w-md bg-card border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <ShieldAlert className="h-6 w-6 text-primary" />
              Admin Access Rights
            </DialogTitle>
            <p className="text-muted-foreground mt-1">
              Set which modules <span className="text-foreground font-semibold">{selectedUserForPerms?.name}</span> can manage.
            </p>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto pr-1 py-2 border-y border-border">
            <div className="grid gap-2">
              {[
                { id: 'registrations', label: 'Registrations Management', desc: 'Approve & reject participation' },
                { id: 'participants', label: 'Participants List', desc: 'View global participants list' },
                { id: 'tournaments', label: 'Tournaments Management', desc: 'Create & edit tournaments' },
                { id: 'games', label: 'Games Configuration', desc: 'Manage game rules & types' },
                { id: 'teams', label: 'Teams Management', desc: 'Add teams & manage players' },
                { id: 'schedule', label: 'Match Schedule', desc: 'Manual match scheduling' },
                { id: 'matches', label: 'Bracket / Results', desc: 'Manage bracket & submit results' },
                { id: 'leaderboard', label: 'Leaderboard Access', desc: 'Recalculate & view leaderboard' },
                { id: 'audit', label: 'Audit Logs', desc: 'View administrative activity trail' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className="space-y-0.5">
                    <Label htmlFor={`perm-${item.id}`} className="font-bold text-sm cursor-pointer">{item.label}</Label>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    id={`perm-${item.id}`}
                    checked={editingParams[item.id as keyof AdminPermissions]}
                    onCheckedChange={(checked) => setEditingParams(prev => ({ ...prev, [item.id]: checked }))}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 mt-2">
            <Button variant="ghost" onClick={() => setPermsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSavePermissions} className="rounded-xl px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
