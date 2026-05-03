import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, List, MessageSquare, ShoppingBag, 
  Settings, PlusCircle, ChevronRight, TrendingUp, Users, Globe,
  Briefcase, LifeBuoy, Heart, DollarSign, BarChart3, User
} from 'lucide-react';
import { cn } from '../lib/utils';

// Sub-pages
import DashboardHome from './dashboard/DashboardHome';
import MyListings from './dashboard/MyListings';
import CreateListing from './dashboard/CreateListing';
import MyPurchases from './dashboard/MyPurchases';
import UserSettings from './dashboard/UserSettings';
import Messages from './dashboard/Messages';
import MyGigs from './dashboard/MyGigs';
import Favorites from './dashboard/Favorites';
import MySales from './dashboard/MySales';
import Statistics from './Statistics';

export default function Dashboard() {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: `/profile/${profile?.username}`, icon: User },
    { label: 'My Statistics', path: `/statistics/${profile?.uid}`, icon: BarChart3 },
    { label: 'My Favorites', path: '/dashboard/favorites', icon: Heart },
    { label: 'My Listings', path: '/dashboard/listings', icon: List },
    { label: 'My Gigs', path: '/dashboard/gigs', icon: Briefcase },
    { label: 'My Sales', path: '/dashboard/sales', icon: DollarSign },
    { label: 'My Orders', path: '/dashboard/purchases', icon: ShoppingBag },
    { label: 'Messages', path: '/dashboard/messages', icon: MessageSquare },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
    { label: 'Support', path: '/support', icon: LifeBuoy },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-50">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                {profile?.name?.[0] || 'U'}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 line-clamp-1">{profile?.name}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{profile?.role}</div>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                      isActive 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-indigo-600"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-8 border-t border-gray-50">
              <Link
                to="/dashboard/listings/new"
                className="w-full bg-indigo-50 text-indigo-600 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                New Listing
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="listings" element={<MyListings />} />
            <Route path="listings/new" element={<CreateListing />} />
            <Route path="listings/edit/:id" element={<CreateListing />} />
            <Route path="purchases" element={<MyPurchases />} />
            <Route path="sales" element={<MySales />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="gigs" element={<MyGigs />} />
            <Route path="settings" element={<UserSettings />} />
            <Route path="messages" element={<Messages />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
