import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Check if it's a Firestore error
    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.error && parsedError.authInfo) {
        this.setState({ errorInfo: JSON.stringify(parsedError, null, 2) });
      }
    } catch (e) {
      // Not a JSON error
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl shadow-indigo-100 p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-8">
              <ShieldAlert className="w-10 h-10" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Something went wrong</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              We encountered an unexpected error. Our team has been notified.
            </p>

            {this.state.error && (
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left overflow-hidden">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Error Details
                </div>
                <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-all">
                  {this.state.errorInfo || this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <RefreshCcw className="w-5 h-5" />
                Reload Page
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
