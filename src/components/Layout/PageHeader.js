'use client';

import CompanyLogo from './CompanyLogo';

export default function PageHeader({
  title,
  children,
  mobileClassName = "text-xl font-light text-black",
  desktopClassName = "text-2xl sm:text-3xl font-light text-black",
  logoSize = { mobile: 20, desktop: 24 }
}) {
  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-300">
        <div className="flex items-center space-x-2">
          <h1 className={mobileClassName}>{title}</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center space-x-3">
          <h1 className={desktopClassName}>{title}</h1>
        </div>
        {children && <div className="flex items-center">{children}</div>}
      </div>
    </>
  );
}