'use client';

import React, { useEffect, useState } from 'react';

interface WebsiteBrandTitleProps {
  /** 'navbar' uses the 2nd picture (/moritako-title.png); 'login' uses the 3rd picture (/jmaa-moritako-logo.png) */
  variant?: 'navbar' | 'login';
  /** Tailwind classes for the <img> element */
  imgClassName?: string;
  /** Tailwind classes for the fallback text <span> when offline, weak internet, or image fails */
  fallbackClassName?: string;
  /** Fallback text when internet is weak or offline (defaults to "JMAA-MoritAko") */
  fallbackText?: string;
}

const BRAND_CACHE_NAME = 'jmaa-brand-assets-v1';

function isWeakConnection(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!navigator.onLine) return true;
  const conn = (navigator as unknown as {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
      downlink?: number;
    };
  }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;
  if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.4) return true;
  return false;
}

export default function WebsiteBrandTitle({
  variant = 'navbar',
  imgClassName = 'h-9 sm:h-10 w-auto object-contain select-none',
  fallbackClassName = 'bg-[#dfd4b8] border border-[#ccbf99] text-[#126b38] px-3.5 py-1 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-2xs font-mono inline-block',
  fallbackText = 'JMAA-MoritAko',
}: WebsiteBrandTitleProps) {
  const assetUrl = variant === 'login' ? '/jmaa-moritako-logo.png' : '/moritako-title.png';
  const lsCacheKey = variant === 'login' ? 'jmaa_cache_brand_login_v1' : 'jmaa_cache_brand_navbar_v1';

  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string>(assetUrl);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;
    let objectUrlToRevoke: string | null = null;

    // 1. Load cached data URL immediately if available in localStorage
    try {
      const cachedDataUrl = localStorage.getItem(lsCacheKey);
      if (cachedDataUrl && cachedDataUrl.startsWith('data:image/')) {
        setImgSrc(cachedDataUrl);
      }
    } catch {
      // Ignore storage access errors
    }

    // 2. Automatically store and serve the image via Browser Cache Storage API + localStorage
    const cacheAndLoadImage = async () => {
      try {
        if ('caches' in window) {
          const cache = await window.caches.open(BRAND_CACHE_NAME);
          let response = await cache.match(assetUrl);
          if (!response && navigator.onLine) {
            const fetched = await fetch(assetUrl, { cache: 'force-cache' });
            if (fetched.ok) {
              await cache.put(assetUrl, fetched.clone());
              response = fetched;
            }
          }
          if (response && active) {
            const blob = await response.blob();
            objectUrlToRevoke = URL.createObjectURL(blob);
            setImgSrc(objectUrlToRevoke);

            // Also persist base64 data URL in localStorage for instant synchronous cache access
            try {
              if (!localStorage.getItem(lsCacheKey)) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    try {
                      localStorage.setItem(lsCacheKey, reader.result);
                    } catch {
                      // Ignore quota error
                    }
                  }
                };
                reader.readAsDataURL(blob);
              }
            } catch {
              // Ignore localStorage error
            }
          }
        }
      } catch {
        // Fallback handled by network status / onError
      }
    };

    const updateConnectionState = () => {
      if (!active) return;
      if (isWeakConnection()) {
        setUseFallback(true);
      } else {
        setUseFallback(false);
      }
    };

    updateConnectionState();
    cacheAndLoadImage();

    window.addEventListener('online', updateConnectionState);
    window.addEventListener('offline', updateConnectionState);

    const conn = (navigator as unknown as {
      connection?: EventTarget;
    }).connection;
    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', updateConnectionState);
    }

    return () => {
      active = false;
      window.removeEventListener('online', updateConnectionState);
      window.removeEventListener('offline', updateConnectionState);
      if (conn && typeof conn.removeEventListener === 'function') {
        conn.removeEventListener('change', updateConnectionState);
      }
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [assetUrl, lsCacheKey]);

  if (useFallback) {
    return <span className={fallbackClassName}>{fallbackText}</span>;
  }

  return (
    <img
      src={imgSrc}
      alt={fallbackText}
      decoding="async"
      fetchPriority="high"
      onError={() => setUseFallback(true)}
      className={imgClassName}
    />
  );
}
