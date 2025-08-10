import React from 'react';
import { Home, Book, BookOpen, Archive, Users, Map, Clock, Menu, X, LogIn, LogOut, Settings, Shield, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentSection: string;
  onNavigate: (section: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onAuthModalOpen: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentSection,
  onNavigate,
  mobileMenuOpen,
  setMobileMenuOpen,
  onAuthModalOpen
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'reader', label: 'Read', icon: BookOpen },
    { id: 'chapters', label: 'Chapters', icon: Book },
    { id: 'lore', label: 'Lore', icon: Archive },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'timeline', label: 'Timeline', icon: Clock },
  ];

  // Add conditional nav items based on user role
  const conditionalNavItems = [];
  if (isAuthenticated && user?.role === 'member') {
    conditionalNavItems.push({ id: 'member', label: 'Member Area', icon: Crown });
  }
  if (isAuthenticated && user?.role === 'admin') {
    conditionalNavItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }
  if (isAuthenticated) {
    conditionalNavItems.push({ id: 'settings', label: 'Settings', icon: Settings });
  }

  const allNavItems = [...navItems, ...conditionalNavItems];

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
    setMobileMenuOpen(false);
  };
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-20 lg:bg-gray-800/90 lg:backdrop-blur-sm lg:border-r lg:border-blue-500/30 lg:flex lg:flex-col lg:items-center lg:z-40">
        {/* Fixed Logo Section */}
        <div className="flex-shrink-0 py-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center font-orbitron font-bold text-white text-xl">
            SP
          </div>
        </div>
        
        {/* Scrollable Navigation Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="flex flex-col space-y-3 py-2">
            {allNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`p-3 rounded-lg transition-all duration-300 group relative ${
                  currentSection === id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                }`}
                title={label}
              >
                <Icon size={24} />
                <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Auth Section */}
        <div className="flex-shrink-0 pt-6 pb-8 px-2 border-t border-gray-700">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="text-sm font-semibold text-blue-300">{user?.username}</p>
                {user?.role === 'admin' && (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">Admin</span>
                )}
                {user?.role === 'member' && (
                  <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">Member</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full p-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-all duration-300 group"
                title="Logout"
              >
                <LogOut size={24} className="mx-auto" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthModalOpen}
              className="w-full p-3 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-all duration-300 group"
              title="Sign In"
            >
              <LogIn size={24} className="mx-auto" />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-b border-blue-500/30 px-4 py-3 flex items-center justify-between z-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center font-orbitron font-bold text-white text-sm">
              SP
            </div>
            <div>
              <span className="font-orbitron text-lg font-bold text-blue-300">The Silent Prison</span>
              {isAuthenticated && (
                <p className="text-xs text-gray-400">Welcome, {user?.username}</p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800 border-l border-blue-500/30 transform transition-transform duration-300 z-50 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6 pt-20">
            <nav className="space-y-4">
              {allNavItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    currentSection === id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
              
              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-700">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-400/20 transition-all duration-300"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onAuthModalOpen();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-blue-400 hover:bg-blue-400/20 transition-all duration-300"
                  >
                    <LogIn size={20} />
                    <span className="font-medium">Sign In</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;