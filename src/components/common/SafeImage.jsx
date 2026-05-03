import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { tokenStore } from '../../utils/constants';

/**
 * SafeImage — A component that fetches images with necessary headers 
 * to bypass ngrok browser warnings and handle authenticated access.
 */
const SafeImage = ({ src, alt, className, fallback, ...props }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setImgUrl(null);
      return;
    }

    // If the image is already a blob/data URL or not an ngrok URL, use it directly
    // However, to be safe with ngrok, we fetch everything from the API domain
    const isNgrok = src.includes('ngrok-free.dev');
    const isAbsolute = src.startsWith('http');

    if (!isNgrok && isAbsolute && !src.includes('localhost')) {
      setImgUrl(src);
      return;
    }

    let isMounted = true;
    const fetchImage = async () => {
      setLoading(true);
      setError(false);

      try {
        const { accessToken } = tokenStore.get();
        const headers = {
          'ngrok-skip-browser-warning': '69420',
        };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(src, { headers });
        if (!response.ok) throw new Error('Failed to fetch image');

        const blob = await response.blob();
        if (blob.size === 0) throw new Error('Empty blob');

        const objectUrl = URL.createObjectURL(blob);
        
        if (isMounted) {
          // Cleanup old blob URL
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          blobUrlRef.current = objectUrl;
          setImgUrl(objectUrl);
          setLoading(false);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('SafeImage fetch error:', err, src);
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  if (!src || error) {
    return fallback || (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-white/5 ${className}`}>
        <BookOpen className="text-gray-400/50" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-white/5 ${className}`}>
        <Loader2 className="animate-spin text-library-accent/30" size={20} />
      </div>
    );
  }

  return (
    <img 
      src={imgUrl || src} 
      alt={alt} 
      className={className} 
      {...props} 
      onError={() => setError(true)}
    />
  );
};

export default SafeImage;
