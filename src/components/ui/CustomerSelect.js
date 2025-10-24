'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function CustomerSelect({
  label,
  value,
  onChange,
  customers,
  placeholder = "เลือกลูกค้า",
  allOption = true,
  allOptionText = "ทุกลูกค้า"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState(customers || []);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter customers based on search term and active status, then sort by latest order date
  useEffect(() => {
    if (!customers) return;

    // First filter only active customers
    const activeCustomers = customers.filter(customer => customer.active !== false);

    let filteredCustomers;
    if (searchTerm.trim() === '') {
      filteredCustomers = activeCustomers;
    } else {
      const searchLower = searchTerm.toLowerCase();
      filteredCustomers = activeCustomers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(searchLower);
        const companyMatch = customer.company_name && customer.company_name.toLowerCase().includes(searchLower);
        const phoneMatch = customer.telephone && customer.telephone.includes(searchTerm);
        return nameMatch || companyMatch || phoneMatch;
      });
    }

    // Sort by latest order date (newest first), then by name
    const sortedCustomers = filteredCustomers.sort((a, b) => {
      const dateA = a.latest_order_date ? new Date(a.latest_order_date) : new Date(0);
      const dateB = b.latest_order_date ? new Date(b.latest_order_date) : new Date(0);

      // If dates are different, sort by date (newest first)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB - dateA;
      }

      // If dates are same, sort by name
      return a.name.localeCompare(b.name, 'th');
    });

    setFilteredCustomers(sortedCustomers);
  }, [searchTerm, customers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (customerId) => {
    onChange({ target: { value: customerId } });
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    const allOptions = allOption ? [{ _id: '', name: allOptionText }] : [];
    const options = [...allOptions, ...filteredCustomers];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelect(options[highlightedIndex]._id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const getDisplayValue = () => {
    if (!value) return allOption ? allOptionText : placeholder;
    const customer = customers?.find(c => c._id === value);
    return customer ? customer.name : placeholder;
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    handleSelect('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block font-light mb-1 text-black">
          {label}
        </label>
      )}

      <div className="relative">
        <div
          className={`w-full px-0 py-2 bg-transparent border-0 border-b transition-colors text-black cursor-pointer flex items-center justify-between ${
            isOpen ? 'border-black' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`${!value && allOption ? 'text-gray-500' : 'text-black'}`}>
            {getDisplayValue()}
          </span>
          <div className="flex items-center space-x-1">
            {value && (
              <button
                onClick={clearSelection}
                className="p-1 hover:bg-gray-100 rounded"
                type="button"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ค้นหาลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {allOption && (
              <div
                onClick={() => handleSelect('')}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                  !value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                {allOptionText}
              </div>
            )}

            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <div
                  key={customer._id}
                  onClick={() => handleSelect(customer._id)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                    value === customer._id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{customer.name}</div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                ไม่พบลูกค้าที่ตรงกับคำค้นหา
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}