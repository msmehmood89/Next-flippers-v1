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
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
    { label: 'Profile', path: `/profile/${profile?.username}`, icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar Navigation - Precisely 260px as requested */}
          <aside className="w-full md:w-[260px] flex-shrink-0 md:sticky md:top-24">
            <div className="bg-[#8ecae6] rounded-[2rem] border border-[#7dbcd6] overflow-hidden shadow-sm pb-4">
              {/* Profile Box */}
              <div className="p-4">
                <div className="bg-white/20 rounded-3xl p-4 border border-white/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-[#000000] rounded-full flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white overflow-hidden">
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
                      <div className="text-[14px] font-black text-black truncate tracking-tight">{profile?.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-black/70 font-extrabold uppercase tracking-widest leading-none">
                          {profile?.role || 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-3 pb-2">
                <div className="h-px bg-black/5 mx-2 mb-4" />
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
                            ? "bg-black text-white shadow-lg shadow-black/20 scale-[1.02]" 
                            : "text-black hover:bg-white/30 hover:text-black"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn(
                            "w-4.5 h-4.5 transition-transform group-hover:scale-110",
                            isActive ? "text-white" : "text-black group-hover:text-black"
                          )} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                      </Link>
                    );
                  })}
                </nav>
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
