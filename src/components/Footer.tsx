import { Link } from 'react-router-dom';
import { 
  Globe, Twitter, Github, Linkedin, 
  Mail, Phone, MapPin, Shield, CheckCircle2,
  MessageCircle
} from 'lucide-react';
import Logo from './Logo';

import footerLogo from '../assets/images/regenerated_image_1781182009119.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="hover:opacity-90 transition-opacity block -ml-2">
              <Logo size="lg" className="origin-left" src={footerLogo} imgClassName="w-[350px] h-[180px]" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              The world's most trusted manual escrow marketplace for buying and selling digital assets. Secure, fast, and transparent.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Marketplace</h3>
            <ul className="space-y-4">
              {['Browse Websites', 'Featured Listings', 'New Arrivals', 'Success Stories'].map(item => (
                <li key={item}>
                  <Link to="/browse" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Support</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/contact" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Help Center</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">How it Works</Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Disclaimer</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Refund & Escrow Policy</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span>support@nextflippers.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <div className="p-1 bg-green-50 rounded flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <a 
                  href="https://wa.me/923330758018" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-600 font-medium"
                >
                  +92 333 0758018 (WhatsApp)
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span>Digital City, Pakistan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-gray-400">
            © {currentYear} Next Flippers. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Shield className="w-4 h-4 text-green-500" />
              SSL SECURED
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              ESCROW PROTECTED
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
