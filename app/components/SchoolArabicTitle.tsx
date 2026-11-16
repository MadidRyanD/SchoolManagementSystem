'use client';

import React, { useEffect, useState } from 'react';

interface SchoolArabicTitleProps {
  /** 'light' for dark backgrounds (white calligraphy), 'dark' for light backgrounds (inverted to dark ink) */
  variant?: 'light' | 'dark';
  /** Tailwind classes for the <img> element */
  imgClassName?: string;
  /** Tailwind classes for the fallback text <span> when offline or image fails */
  fallbackClassName?: string;
  /** Optional custom fallback text (defaults to the original Arabic school name) */
  text?: string;
}

const DEFAULT_ARABIC_NAME = 'جامعة منيب الكزبري العربية';

export default function SchoolArabicTitle({
  variant = 'light',
  imgClassName = 'h-10 w-auto object-contain',
  fallbackClassName = 'font-serif font-bold text-lg',
  text = DEFAULT_ARABIC_NAME,
}: SchoolArabicTitleProps) {
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      if (!navigator.onLine) {
        setUseFallback(true);
      } else {
        setUseFallback(false);
      }
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (useFallback) {
    return (
      <span dir="rtl" className={fallbackClassName}>
        {text}
      </span>
    );
  }

  return (
    <img
      src="/school-title-ar.png"
      alt={text}
      onError={() => setUseFallback(true)}
      className={`${variant === 'dark' ? 'invert ' : ''}${imgClassName}`}
    />
  );
}
