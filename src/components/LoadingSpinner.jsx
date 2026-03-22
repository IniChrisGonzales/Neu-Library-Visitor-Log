import React from 'react';
import { Loader } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-950">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader className="w-12 h-12 text-neu-blue animate-spin" />
        </div>
        <p className="text-dark-400">Loading...</p>
      </div>
    </div>
  );
}
