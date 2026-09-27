'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 font-medium">Loading School Management System...</p>
      </div>
    </div>
  );
}
