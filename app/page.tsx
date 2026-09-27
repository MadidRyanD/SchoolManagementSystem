'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (AuthService.isAuthenticated()) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-base font-bold text-white">جامعة منيب الكزبري العربية</h2>
        <p className="text-xs text-emerald-300 font-mono">JMAA-MoritAko &bull; Portal Loading...</p>
        <div className="pt-2">
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Click here if not redirected automatically
          </a>
        </div>
      </div>
    </div>
  );
}
