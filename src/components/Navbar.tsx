import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useCart } from '../contexts/CartContext';
import { 
  Menu, X, LogOut, LayoutDashboard, 
  MessageSquare, ShoppingBag, Settings, Shield,
  Search, PlusCircle, Globe, ChevronDown, Bell, Briefcase,
  ShoppingCart, User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ProfileAvatar from './ProfileAvatar';
import Logo from './Logo';

export default function Navbar() {
  const { user, profile, logout, isAdmin, notifications, unreadCount } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const navLinks = [
    { label: 'Marketplace', path: '/browse' },
    { label: 'Freelancers', path: '/freelancers' },
    { label: 'Community', path: '/community' },
    { label: 'Support', path: '/support' },
  ];

  const profilePath = profile?.username ? `/profile/${profile.username}` : '/setup-username';

  return (
    <nav className={cn(
      "sticky top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
      isScrolled 
        ? "bg-white/95 backdrop-blur-md shadow-2xl py-2 border-indigo-100" 
        : "bg-white py-4 border-gray-100"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 transition-all duration-300">
          {/* Logo */}
          <Link to="/" className="hover:opacity-90 transition-opacity flex-shrink-0">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center lg:gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-[13px] lg:text-[14px] font-black transition-all uppercase tracking-[0.1em] px-4 lg:px-5 py-3 rounded-2xl",
                  location.pathname === link.path 
                    ? "text-indigo-600 bg-indigo-50 shadow-inner" 
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 ml-2">
            <Link 
              to="/dashboard/listings/new"
              className="hidden xl:flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Sell Asset
            </Link>
            {user ? (
              <div className="flex items-center gap-3 md:gap-5">
                {/* Shopping Cart */}
                <div className="relative flex-shrink-0">
                  <Link
                    to="/cart"
                    className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-50 text-gray-600 rounded-full hover:bg-amber-50 hover:text-amber-600 transition-all duration-300 relative group shadow-sm hover:shadow-md"
                  >
                    <ShoppingCart className="w-[18px] h-[18px] md:w-5 md:h-5 transition-transform group-hover:scale-110" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 md:min-w-[20px] md:h-5 px-1 bg-amber-500 text-white text-[8px] md:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm transition-all group-hover:scale-110">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>

                {/* Notifications */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-50 text-gray-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300 relative group shadow-sm hover:shadow-md"
                  >
                    <Bell className="w-[18px] h-[18px] md:w-5 md:h-5 transition-transform group-hover:scale-110" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 md:min-w-[20px] md:h-5 px-1 bg-indigo-600 text-white text-[8px] md:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm transition-all group-hover:scale-110">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 py-4 overflow-hidden z-50"
                      >
                        <div className="px-6 py-2 border-b border-gray-50 mb-2 flex items-center justify-between">
                          <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Notifications</span>
                          {unreadCount > 0 && <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{unreadCount} New</span>}
                        </div>
                        
                        <div className="max-h-[400px] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                              <p className="text-xs text-gray-400 font-bold">No notifications yet.</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <button
                                key={notif.id}
                                onClick={() => {
                                  markAsRead(notif.id);
                                  if (notif.link) navigate(notif.link);
                                  setIsNotificationsOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 relative",
                                  !notif.isRead && "bg-indigo-50/30"
                                )}
                              >
                                {!notif.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                                <div className="text-xs font-black text-gray-900 mb-1">{notif.title}</div>
                                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
                                <div className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-wider">
                                  {notif.createdAt?.toDate().toLocaleDateString()}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 pr-2 md:pr-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ProfileAvatar 
                      src={user?.photoURL || undefined} 
                      gender={profile?.gender} 
                      size="sm" 
                    />
                    <ChevronDown className={cn("w-3 h-3 md:w-4 h-4 text-gray-500 transition-transform", isUserMenuOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-50 mb-2">
                          <div className="text-sm font-bold text-gray-900 truncate">@{profile?.username || profile?.name}</div>
                          <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{profile?.role || 'User'}</div>
                        </div>
                        
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 font-bold hover:bg-purple-50">
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        
                        <Link to={profilePath} className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 font-bold hover:bg-indigo-50">
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        
                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link to="/chat" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                          <MessageSquare className="w-4 h-4" />
                          Chat & Community
                        </Link>
                        <Link to="/dashboard/sales" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                          <PlusCircle className="w-4 h-4" />
                          My Sales
                        </Link>
                        <Link to="/dashboard/purchases" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                          <ShoppingBag className="w-4 h-4" />
                          My Orders
                        </Link>
                        <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <div className="border-t border-gray-50 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link to="/login" className="hidden sm:block text-[13px] md:text-sm font-black text-gray-600 hover:text-indigo-600 uppercase tracking-widest px-2">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-3.5 sm:px-8 py-2.5 sm:py-3.5 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Join Now
                </Link>
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden shadow-xl"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-gray-50" />
              {user ? (
                <div className="space-y-4">
                  <Link to={profilePath} className="block text-lg font-bold text-indigo-600 hover:text-indigo-700 transition-colors">My Profile</Link>
                  <Link to="/dashboard" className="block text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors">Dashboard</Link>
                  <Link to="/chat" className="block text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors">Chat & Community</Link>
                  <button onClick={handleLogout} className="block text-lg font-bold text-red-600">Logout</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/login" className="flex items-center justify-center py-3 rounded-xl font-bold text-gray-900 border border-gray-200">Login</Link>
                  <Link to="/register" className="flex items-center justify-center py-3 rounded-xl font-bold text-white bg-indigo-600">Join Now</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
