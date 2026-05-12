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
import MyGigs from './dashboard/MyGigs';
import Favorites from './dashboard/Favorites';
import MySales from './dashboard/MySales';
import Statistics from './Statistics';

export default function Dashboard() {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Listings', path: '/dashboard/listings', icon: List },
    { label: 'Orders', path: '/dashboard/purchases', icon: ShoppingBag },
    { label: 'My Blogs', path: '/dashboard/blogs', icon: MessageSquare }, // Assuming blogs uses something similar or a generic icon
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
    { label: 'Profile', path: `/profile/${profile?.username}`, icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar Navigation - Precisely 260px as requested */}
          <aside className="w-full md:w-[260px] flex-shrink-0 md:sticky md:top-24">
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm pb-4">
              {/* Profile Box - Precisely Match Deelzo UI */}
              <div className="p-4">
                <div className="bg-emerald-50/40 rounded-3xl p-4 border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white overflow-hidden">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                          profile?.name?.[0] || 'U'
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-black text-gray-900 truncate tracking-tight">{profile?.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest leading-none">
                          {profile?.role || 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-3 pb-2">
                <div className="h-px bg-gray-50 mx-2 mb-4" />
                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all group",
                          isActive 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 scale-[1.02]" 
                            : "text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn(
                            "w-4.5 h-4.5 transition-transform group-hover:scale-110",
                            isActive ? "text-white" : "text-gray-400 group-hover:text-emerald-500"
                          )} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-4 px-6">
                <div className="flex items-center gap-2 opacity-30 justify-center">
                  <div className="w-1 h-1 rounded-full bg-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Deelzo Pro</span>
                  <div className="w-1 h-1 rounded-full bg-gray-400" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow min-h-[600px]">
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
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
