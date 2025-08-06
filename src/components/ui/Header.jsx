import React, { useState } from 'react';
import Icon from '../AppIcon';

const Header = ({ user, onMenuToggle, sidebarCollapsed }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    // Logout logic here
    console.log('Logging out...');
  };

  const notifications = [
  { id: 1, message: 'Bank reconciliation completed', time: '5 min ago', type: 'success' },
  { id: 2, message: 'Tax filing deadline approaching', time: '1 hour ago', type: 'warning' },
  { id: 3, message: 'New client portal access request', time: '2 hours ago', type: 'info' }];


  return (
    <header className="fixed top-0 left-0 right-0 h-header-height bg-surface border-b border-border z-header shadow-card">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Logo and Menu Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-primary-50 nav-transition"
            aria-label="Toggle menu">

            <Icon name="Menu" size={20} color="#283593" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-heading font-bold text-primary">Xfinity</h1>
              <p className="text-xs text-text-secondary font-medium">Accounting Dashboard</p>
            </div>
          </div>
        </div>

        {/* Right Section - Search, Notifications, User */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <div className="hidden md:flex items-center bg-background rounded-xl px-4 py-2.5 w-64 border border-border">
            <Icon name="Search" size={16} color="#757575" />
            <input
              type="text"
              placeholder="Search transactions, clients..."
              className="ml-2 bg-transparent text-sm text-text-primary placeholder-text-secondary outline-none flex-1" />

          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-primary-50 nav-transition"
              aria-label="Notifications">

              <Icon name="Bell" size={20} color="#283593" />
              {notifications?.length > 0 &&
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {notifications?.length}
                </span>
              }
            </button>

            {showNotifications &&
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl shadow-floating border border-border z-dropdown">
                <div className="p-4 border-b border-border">
                  <h3 className="font-heading font-semibold text-text-primary">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications?.map((notification) =>
                <div key={notification?.id} className="p-4 border-b border-border last:border-b-0 hover:bg-background nav-transition">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification?.type === 'success' ? 'bg-success' :
                    notification?.type === 'warning' ? 'bg-warning' : 'bg-secondary'}`
                    } />
                        <div className="flex-1">
                          <p className="text-sm text-text-primary font-medium">{notification?.message}</p>
                          <p className="text-xs text-text-secondary mt-1">{notification?.time}</p>
                        </div>
                      </div>
                    </div>
                )}
                </div>
                <div className="p-3 border-t border-border">
                  <button className="text-sm text-secondary hover:text-secondary-700 nav-transition font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            }
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-primary-50 nav-transition"
              aria-label="User menu">

              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-card">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-text-primary">{user?.name || 'User Name'}</p>
                <p className="text-xs text-text-secondary">{user?.role || 'Staff Member'}</p>
              </div>
              <Icon name="ChevronDown" size={16} color="#757575" />
            </button>

            {showUserDropdown &&
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-floating border border-border z-dropdown">
                <div className="p-4 border-b border-border">
                  <p className="font-semibold text-text-primary">{user?.name || 'User Name'}</p>
                  <p className="text-sm text-text-secondary">{user?.email || 'user@company.com'}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full font-medium">
                    {user?.role || 'Staff Member'}
                  </span>
                </div>
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-background nav-transition flex items-center space-x-3">
                    <Icon name="User" size={16} color="#757575" />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-background nav-transition flex items-center space-x-3">
                    <Icon name="Settings" size={16} color="#757575" />
                    <span>Preferences</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-background nav-transition flex items-center space-x-3">
                    <Icon name="HelpCircle" size={16} color="#757575" />
                    <span>Help & Support</span>
                  </button>
                </div>
                <div className="border-t border-border py-2">
                  <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error-50 nav-transition flex items-center space-x-3">

                    <Icon name="LogOut" size={16} color="#F44336" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </header>);

};

export default Header;