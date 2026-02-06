'use client';

import { useState, useEffect } from 'react';

export default function CompanyLogo({ size = 28, className = '' }) {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState({ width: 64, height: 64 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyLogo();
  }, []);

  const fetchCompanyLogo = async () => {
    try {
      const response = await fetch('/api/company-settings');
      const data = await response.json();

      if (data.success && data.settings?.logo?.url) {
        setLogoUrl(data.settings.logo.url);
        setLogoSize({
          width: data.settings.logo.width || 64,
          height: data.settings.logo.height || 64
        });
      }
    } catch (error) {
      console.error('Failed to fetch company logo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={{ width: size, height: size }} />;
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Company Logo"
        className={`object-contain ${className}`}
        style={{
          width: size,
          height: size,
          maxWidth: size,
          maxHeight: size
        }}
        onError={() => setLogoUrl('')}
      />
    );
  }

  // Fallback to project logo
  return (
    <img
      src="/boxes.svg"
      alt="Ordix"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}