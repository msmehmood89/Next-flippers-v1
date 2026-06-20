import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Notification } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import ListingDetails from './pages/ListingDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import PaymentInstructions from './pages/PaymentInstructions';
import AdminDashboard from './pages/AdminDashboard';
import FreelanceMarketplace from './pages/FreelanceMarketplace';
import CreateGig from './pages/dashboard/CreateGig';
import GigDetails from './pages/GigDetails';
import SetupUsername from './pages/SetupUsername';
import Support from './pages/Support';
import Receipt from './pages/Receipt';
import Statistics from './pages/Statistics';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Disclaimer from './pages/Disclaimer';
import RefundPolicy from './pages/RefundPolicy';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import ReportBug from './pages/ReportBug';
import RequestImprovement from './pages/RequestImprovement';
import { CartProvider } from './contexts/CartContext';
import Cart from './pages/Cart';
import ProfileView from './pages/ProfileView';

// Auth Context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  notifications: Notification[];
  unreadCount: number;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  notifications: [],
  unreadCount: 0,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    // Fallback timeout to ensure the application doesn't stay stuck
    // if the connection to Firebase is delayed or blocked (e.g., by ad-blockers).
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading timed out. This often indicates Firestore reachability issues.");
        setLoading(false);
      }
    }, 15000); // Increased to 15s to allow for slow connections before failing over

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Fast initial load
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        setLoading(false);
      }
    }).catch(err => {
      console.warn("Initial profile fetch failed:", err);
    });

    // Listen to profile changes
    const unsubProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setLoading(false);
    });

    return () => unsubProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Listen to notifications
    const notificationTargets = [user.uid];
    const isUserAdmin = profile?.role === 'admin' || profile?.isAdmin || user.email === 'ms.mehmood749@gmail.com';
    
    if (isUserAdmin) {
      notificationTargets.push('admin');
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', notificationTargets),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubNotifs = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
    }, (error) => {
      console.error("Notifications snapshot error:", error);
    });

    return () => unsubNotifs();
  }, [user, profile]);

  // Update lastActiveAt on route changes
  const location = useLocation();
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { lastActiveAt: serverTimestamp() }).catch(console.error);
    }
  }, [location.pathname, user]);

  const logout = async () => {
    await signOut(auth);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin: !!profile?.isAdmin || profile?.role === 'admin' || user?.email === 'ms.mehmood749@gmail.com', 
      notifications,
      unreadCount,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Route Guards
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}

function UsernameGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  const isProfileIncomplete = !loading && user && profile && (profile as any).needsProfileSetup === true;

  if (isProfileIncomplete && location.pathname !== '/setup-username') {
    return <Navigate to="/setup-username" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
          <Navbar />
          <main className="flex-grow">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/freelancers" element={<FreelanceMarketplace />} />
                <Route path="/gig/:id" element={<GigDetails />} />
                <Route path="/community" element={<Navigate to="/chat/community" replace />} />
                <Route path="/listing/:id" element={<ListingDetails />} />
                <Route path="/support" element={<Support />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/report-bug" element={<ReportBug />} />
                <Route path="/request-improvement" element={<RequestImprovement />} />
                <Route path="/profile/:username" element={<ProfileView />} />
                <Route path="/statistics/:userId" element={<Statistics />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/setup-username" element={
                  <ProtectedRoute>
                    <SetupUsername />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <UsernameGuard>
                    <Cart />
                  </UsernameGuard>
                } />
                
                {/* Protected Routes */}
                <Route path="/dashboard/*" element={
                  <UsernameGuard>
                    <Dashboard />
                  </UsernameGuard>
                } />
                <Route path="/dashboard/gigs/new" element={
                  <UsernameGuard>
                    <CreateGig />
                  </UsernameGuard>
                } />
                <Route path="/dashboard/gigs/edit/:id" element={
                  <UsernameGuard>
                    <CreateGig />
                  </UsernameGuard>
                } />
                <Route path="/chat" element={
                  <UsernameGuard>
                    <ChatPage />
                  </UsernameGuard>
                } />
                <Route path="/chat/:id" element={
                  <UsernameGuard>
                    <ChatPage />
                  </UsernameGuard>
                } />
                <Route path="/payment/:listingId" element={
                  <UsernameGuard>
                    <PaymentInstructions />
                  </UsernameGuard>
                } />
                <Route path="/payment/gig/:gigId" element={
                  <UsernameGuard>
                    <PaymentInstructions />
                  </UsernameGuard>
                } />
                <Route path="/payment/instructions" element={
                  <UsernameGuard>
                    <PaymentInstructions />
                  </UsernameGuard>
                } />
                <Route path="/receipt/:transactionId" element={
                  <UsernameGuard>
                    <Receipt />
                  </UsernameGuard>
                } />

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  </Router>
);
}
