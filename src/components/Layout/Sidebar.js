'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChartArea, ShoppingCart, Angry, User, Carrot, Calendar, Settings, ChevronDown, Printer, LeafyGreen } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const mainMenuItems = [
    { 
      href: '/', 
      label: 'หน้าหลัก',
      shortLabel: 'หน้าหลัก',
      icon: <ChartArea size={22} />
    },
    { 
      href: '/orders', 
      label: 'คำสั่งซื้อ',
      shortLabel: 'คำสั่งซื้อ',
      icon: <ShoppingCart size={22} />
    },
    { 
      href: '/payments', 
      label: 'หนี้คงค้าง',
      shortLabel: 'หนี้คงค้าง',
      icon: <Angry size={22} />
    },
    {
      href: '/documents',
      label: 'เอกสาร',
      shortLabel: 'เอกสาร',
      icon: <Printer size={22} />
    },
  ];

  const settingsMenuItems = [
    { 
      href: '/customers', 
      label: 'ลูกค้า',
      icon: <User size={22} />
    },
    { 
      href: '/vegetables', 
      label: 'รายการผัก',
      icon: <Carrot size={22} />
    },
    { 
      href: '/holidays', 
      label: 'วันหยุด',
      icon: <Calendar size={22} />
    },
  ];

  const settingsIcon = <Settings size={22} />;

  // Check if current path is in settings section
  const isInSettingsSection = ['/customers', '/vegetables', '/holidays'].includes(pathname);

  return (
    <>
      {/* Desktop Navbar */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="w-full px-8">
          <div className="flex items-center h-16">
            {/* Logo - Left */}
            <div className="flex-shrink-0 flex items-center space-x-2">
              <LeafyGreen size={28}  />
              <h2 className="text-3xl font-light text-black">Veggie</h2>
            </div>
            
            {/* Navigation - Center */}
            <div className="flex-1 flex justify-center">
              <nav>
                <ul className="flex items-center gap-2">
                  {mainMenuItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2  transition-all duration-200 ${
                          pathname === item.href
                            ? 'border-b-2 border-gray-700 text-black'
                            : 'text-gray-500 hover:bg-gray-100 rounded'
                        }`}
                      >
                        {item.icon}
                        <span className="font-light">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="relative">
                    <button
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
                        isInSettingsSection
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {settingsIcon}
                      <span className="font-light">ตั้งค่า</span>
                      <ChevronDown size={12} className={`transition-transform duration-200 ${showSettingsMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSettingsMenu && (
                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-40 min-w-[150px]">
                        <ul className="py-1">
                          {settingsMenuItems.map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setShowSettingsMenu(false)}
                                className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${
                                  pathname === item.href
                                    ? 'bg-black text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {item.icon}
                                <span className="font-light">{item.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                </ul>
              </nav>
            </div>
            
            {/* Right space for balance */}
            <div className="flex-shrink-0 w-20"></div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Light Minimal */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white text-black border-t border-gray-200 z-50">
        <nav className="px-1 py-1">
          <ul className="flex justify-around">
            {/* Main Menu Items */}
            {mainMenuItems.map((item) => (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center px-1 py-2  transition-all duration-200 ${
                    pathname === item.href
                      ? 'border-b-2 border-gray-700 text-black'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center mb-1">{item.icon}</span>
                  <span className="text-xs font-light">{item.shortLabel}</span>
                </Link>
              </li>
            ))}
            
            {/* Settings Menu Mobile */}
            <li className="flex-1 relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`w-full flex flex-col items-center px-1 py-2 transition-all duration-200 ${
                  isInSettingsSection
                      ? 'border-b-2 border-gray-700 text-black'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center mb-1">{settingsIcon}</span>
                <span className="text-xs font-light">ตั้งค่า</span>
              </button>
              
              {/* Settings Dropdown Mobile */}
              {showSettingsMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-md shadow-lg min-w-32 z-[60]">
                  <ul className="py-1">
                    {settingsMenuItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setShowSettingsMenu(false)}
                          className={`flex items-center space-x-2 px-4 py-3 text-sm transition-all duration-200 ${
                            pathname === item.href
                              ? 'bg-black text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>
                          <span className="font-light">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>

      {/* Mobile Top Header - Only for homepage */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-minimal">
        {/* Header content will be provided by individual pages */}
      </div>
    </>
  );
}