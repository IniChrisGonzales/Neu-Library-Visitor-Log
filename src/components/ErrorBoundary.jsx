import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (event) => {
      setHasError(true);
      setError(event.error);
      console.error('Error caught by boundary:', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      fallback || (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-red-500 rounded-lg p-8 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            </div>
            <p className="text-dark-300 mb-4 text-sm">{error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-neu-blue hover:opacity-90 text-white font-semibold py-2 rounded-lg transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    );
  }

  return children;
}
