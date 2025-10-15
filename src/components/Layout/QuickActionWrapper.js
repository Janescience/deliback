'use client';

import { usePathname } from 'next/navigation';
import QuickAction from './QuickAction';

export default function QuickActionWrapper() {
  const pathname = usePathname();

  // Show QuickAction only on home page
  if (pathname !== '/') {
    return null;
  }

  return <QuickAction />;
}