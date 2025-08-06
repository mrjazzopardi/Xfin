import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import UserTable from './components/UserTable';
import UserDetailPanel from './components/UserDetailPanel';
import FilterToolbar from './components/FilterToolbar';
import BulkActions from './components/BulkActions';
import AddUserModal from './components/AddUserModal';
import AuditLogModal from './components/AuditLogModal';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    permission: 'all',
    status: 'all'
  });

  // Data states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = userProfile ? {
    name: userProfile?.full_name,
    email: userProfile?.email,
    role: userProfile?.role,
    avatar: userProfile?.avatar_url
  } : {
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Partner"
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await userService?.getUsers(filters);
      
      if (result?.success) {
        // Transform data to match existing component expectations
        const transformedUsers = result?.users?.map(user => ({
          id: user?.id,
          name: user?.full_name,
          email: user?.email,
          role: capitalizeRole(user?.role),
          permissions: user?.permissions || [],
          status: user?.is_active ? 'Active' : 'Inactive',
          lastActivity: new Date(user.updated_at || user.created_at),
          avatar: user?.avatar_url || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(Math.random() * 50) + 1}.jpg`,
          phone: user?.phone || 'N/A',
          department: user?.department || 'N/A',
          joinDate: new Date(user.created_at),
          loginHistory: [], // This would need separate API call
          activityLog: []   // This would need separate API call
        }));

        setUsers(transformedUsers);
      } else {
        setError(result?.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const capitalizeRole = (role) => {
    const roleMap = {
      partner: 'Partner',
      staff: 'Staff',
      freelancer: 'Freelancer',
      client: 'Client'
    };
    return roleMap?.[role] || role;
  };

  // Filter users based on current filters
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
                         user?.email?.toLowerCase()?.includes(filters?.search?.toLowerCase());
    const matchesRole = filters?.role === 'all' || user?.role === filters?.role;
    const matchesStatus = filters?.status === 'all' || user?.status === filters?.status;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev?.includes(userId) 
        ? prev?.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers?.length === filteredUsers?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers?.map(user => user?.id));
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleAddUser = async (userData) => {
    try {
      // In a real implementation, you would call authService.signUp here
      // For now, we'll reload the users list
      await loadUsers();
      setShowAddUserModal(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (updatedUserData) => {
    try {
      const result = await userService?.updateUser(updatedUserData?.id, {
        full_name: updatedUserData?.name,
        role: updatedUserData?.role?.toLowerCase(),
        department: updatedUserData?.department,
        phone: updatedUserData?.phone,
        is_active: updatedUserData?.status === 'Active'
      });

      if (result?.success) {
        await loadUsers(); // Reload users list
        setSelectedUser(updatedUserData); // Update selected user
      } else {
        setError(result?.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user.');
    }
  };

  const handleBulkAction = async (action) => {
    try {
      let updates = {};
      
      switch (action) {
        case 'activate':
          updates = { is_active: true };
          break;
        case 'deactivate':
          updates = { is_active: false };
          break;
        case 'delete':
          // Handle delete action
          console.log('Delete action for users:', selectedUsers);
          break;
        default:
          return;
      }

      if (Object.keys(updates)?.length > 0) {
        const result = await userService?.bulkUpdateUsers(selectedUsers, updates);
        
        if (result?.success) {
          await loadUsers();
          setSelectedUsers([]);
        } else {
          setError(result?.error);
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action.');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={currentUser} 
        onMenuToggle={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        onLogout={handleLogout}
      />
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        userRole="partner"
      />
      <main className={`pt-header-height nav-transition ${
        sidebarCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar-width'
      }`}>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">User Management</h1>
                <p className="text-text-secondary">Manage team members, roles, and permissions across your organization</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
                <button
                  onClick={() => setShowAuditLogModal(true)}
                  className="px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background nav-transition flex items-center space-x-2"
                >
                  <Icon name="FileText" size={16} color="var(--color-text-primary)" />
                  <span>Audit Log</span>
                </button>
                
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition flex items-center space-x-2"
                >
                  <Icon name="UserPlus" size={16} color="white" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <Icon name="AlertCircle" size={20} color="#EF4444" />
                  <p className="ml-2 text-red-700">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <Icon name="X" size={16} color="#EF4444" />
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Total Users</p>
                    <p className="text-2xl font-bold text-text-primary">{users?.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon name="Users" size={20} color="var(--color-primary)" />
                  </div>
                </div>
              </div>
              
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Active Users</p>
                    <p className="text-2xl font-bold text-success">{users?.filter(u => u?.status === 'Active')?.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <Icon name="UserCheck" size={20} color="var(--color-success)" />
                  </div>
                </div>
              </div>
              
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Partners</p>
                    <p className="text-2xl font-bold text-accent">{users?.filter(u => u?.role === 'Partner')?.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <Icon name="Crown" size={20} color="var(--color-accent)" />
                  </div>
                </div>
              </div>
              
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Online Now</p>
                    <p className="text-2xl font-bold text-secondary">
                      {users?.filter(u => Date.now() - u?.lastActivity?.getTime() < 900000)?.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <Icon name="Wifi" size={20} color="var(--color-secondary)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <FilterToolbar 
            filters={filters}
            onFiltersChange={setFilters}
            userCount={filteredUsers?.length}
          />

          {/* Bulk Actions */}
          {selectedUsers?.length > 0 && (
            <BulkActions 
              selectedCount={selectedUsers?.length}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedUsers([])}
            />
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* User Table */}
            <div className="xl:col-span-2">
              <UserTable 
                users={filteredUsers}
                selectedUsers={selectedUsers}
                onUserSelect={handleUserSelect}
                onSelectAll={handleSelectAll}
                onUserClick={handleUserClick}
                selectedUser={selectedUser}
              />
            </div>

            {/* User Detail Panel */}
            <div className="xl:col-span-1">
              <UserDetailPanel 
                user={selectedUser}
                onUpdateUser={handleUpdateUser}
              />
            </div>
          </div>
        </div>
      </main>
      {/* Modals */}
      {showAddUserModal && (
        <AddUserModal 
          onClose={() => setShowAddUserModal(false)}
          onAddUser={handleAddUser}
        />
      )}
      {showAuditLogModal && (
        <AuditLogModal 
          onClose={() => setShowAuditLogModal(false)}
          users={users}
        />
      )}
    </div>
  );
};

export default UserManagement;