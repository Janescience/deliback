'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PaymentTable from '@/components/Tables/PaymentTable';
import { ChevronUp, ChevronDown, CreditCard, ArrowRightLeft, Calendar, Users, TrendingDown } from 'lucide-react';

export default function PaymentsPage() {
  const [creditCustomers, setCreditCustomers] = useState([]);
  const [transferCustomers, setTransferCustomers] = useState([]);
  const [cashCustomers, setCashCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [searchTerms, setSearchTerms] = useState({
    credit: '',
    transfer: '',
    cash: ''
  });

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payments');
      setCreditCustomers(response.data.credit || []);
      setTransferCustomers(response.data.transfer || []);
      setCashCustomers(response.data.cash || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (orderIds, customerId = null) => {
    try {
      await axios.put('/api/payments', { 
        orderIds: Array.isArray(orderIds) ? orderIds : [orderIds],
        customerId 
      });
      toast.success('อัปเดตสถานะการชำระเงินสำเร็จ');
      fetchPaymentData();
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตสถานะการชำระเงินได้');
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const formatMoneyShort = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K`;
    }
    return Math.round(amount).toLocaleString();
  };

  const getSummaryData = (customers, type) => {
    if (!customers || customers.length === 0) {
      return {
        totalAmount: 0,
        customerCount: 0,
        oldestDate: null,
        newestDate: null,
        totalBillingCycles: 0
      };
    }

    let totalAmount = 0;
    let allDates = [];
    let totalBillingCycles = 0;

    customers.forEach(customerData => {
      totalAmount += customerData.totalUnpaid;

      // รวบรวมวันที่จากทุก unpaid orders
      customerData.unpaidOrders?.forEach(order => {
        allDates.push(new Date(order.delivery_date));
      });

      // นับจำนวน billing cycles
      if (customerData.billingCycles) {
        totalBillingCycles += Object.keys(customerData.billingCycles).length;
      }
    });

    allDates.sort((a, b) => a - b);

    return {
      totalAmount,
      customerCount: customers.length,
      oldestDate: allDates.length > 0 ? allDates[0] : null,
      newestDate: allDates.length > 0 ? allDates[allDates.length - 1] : null,
      totalBillingCycles
    };
  };

  const handleSearchChange = (section, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const filterCustomers = (customers, searchTerm) => {
    if (!searchTerm) return customers;
    
    return customers.filter(customerData => {
      const customer = customerData.customer;
      return (
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.company_name && customer.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.telephone && customer.telephone.includes(searchTerm))
      );
    });
  };

  const getFilteredCustomers = (section) => {
    const searchTerm = searchTerms[section];
    switch (section) {
      case 'credit':
        return filterCustomers(creditCustomers, searchTerm);
      case 'transfer':
        return filterCustomers(transferCustomers, searchTerm);
      case 'cash':
        return filterCustomers(cashCustomers, searchTerm);
      default:
        return [];
    }
  };

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-200">
        <div className="flex items-center">
          <h1 className="text-xl font-extralight text-black">หนี้คงค้าง</h1>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
        ) : (
          <>
            {/* Summary Cards - Desktop Only */}
            <div className="hidden lg:block mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Credit Summary */}
                <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CreditCard className="w-6 h-6 text-gray-700 mr-3" />
                      <h3 className="text-lg font-extralight text-black">สรุปเครดิต</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">ยอดค้างทั้งหมด</span>
                      <span className="text-xl font-extralight text-black">
                        {formatMoney(getSummaryData(creditCustomers).totalAmount)} บาท
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">จำนวนลูกค้า</span>
                      <span className="text-lg font-extralight text-black">
                        {getSummaryData(creditCustomers).customerCount} ลูกค้า
                      </span>
                    </div>
                    {getSummaryData(creditCustomers).oldestDate && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">ค้างตั้งแต่</span>
                          <span className="text-sm font-extralight text-black">
                            {getSummaryData(creditCustomers).oldestDate.toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">ถึงวันที่</span>
                          <span className="text-sm font-extralight text-black">
                            {getSummaryData(creditCustomers).newestDate?.toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">จำนวนรอบบิล</span>
                          <span className="text-sm font-extralight text-black">
                            {getSummaryData(creditCustomers).totalBillingCycles} รอบ
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Transfer Summary */}
                <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <ArrowRightLeft className="w-6 h-6 text-gray-700 mr-3" />
                      <h3 className="text-lg font-extralight text-black">สรุปเงินโอน</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">ยอดค้างทั้งหมด</span>
                      <span className="text-xl font-extralight text-black">
                        {formatMoney(getSummaryData(transferCustomers).totalAmount)} บาท
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">จำนวนลูกค้า</span>
                      <span className="text-lg font-extralight text-black">
                        {getSummaryData(transferCustomers).customerCount} ลูกค้า
                      </span>
                    </div>
                    {getSummaryData(transferCustomers).oldestDate && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">ค้างตั้งแต่</span>
                          <span className="text-sm font-extralight text-black">
                            {getSummaryData(transferCustomers).oldestDate.toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">ถึงวันที่</span>
                          <span className="text-sm font-extralight text-black">
                            {getSummaryData(transferCustomers).newestDate?.toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">จำนวนรอบบิล</span>
                          <span className="text-sm font-extralight text-black">
                            {getSummaryData(transferCustomers).totalBillingCycles} รอบ
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && (
          <div className="space-y-3">
            {/* Credit Section */}
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                onClick={() => toggleSection('credit')}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-gray-700">
                    {expandedSection === 'credit' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                  <h3 className="text-lg font-extralight text-black">เครดิต</h3>
                  <span className="ml-3 px-3 py-1 bg-gray-100 text-black rounded-full text-sm font-extralight">
                    {creditCustomers.length} ลูกค้า • {formatMoney(creditCustomers.reduce((total, customer) => total + customer.totalUnpaid, 0))} บาท
                  </span>
                </div>
              </div>
              {expandedSection === 'credit' && (
                <div>
                  {/* Search for Credit */}
                  <div className="p-4 pt-0 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="ค้นหาลูกค้า (ชื่อ, บริษัท, เบอร์โทร)"
                          value={searchTerms.credit}
                          onChange={(e) => handleSearchChange('credit', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors text-black text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <PaymentTable
                    customers={getFilteredCustomers('credit')}
                    onPaymentUpdate={handlePaymentUpdate}
                  />
                </div>
              )}
            </div>

            {/* Transfer Section */}
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                onClick={() => toggleSection('transfer')}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-gray-700">
                    {expandedSection === 'transfer' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                  <h3 className="text-lg font-extralight text-black">เงินโอน</h3>
                  <span className="ml-3 px-3 py-1 bg-gray-100 text-black rounded-full text-sm font-extralight">
                    {transferCustomers.length} ลูกค้า • {formatMoney(transferCustomers.reduce((total, customer) => total + customer.totalUnpaid, 0))} บาท
                  </span>
                </div>
              </div>
              {expandedSection === 'transfer' && (
                <div>
                  {/* Search for Transfer */}
                  <div className="p-4 pt-0 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="ค้นหาลูกค้า (ชื่อ, บริษัท, เบอร์โทร)"
                          value={searchTerms.transfer}
                          onChange={(e) => handleSearchChange('transfer', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors text-black text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <PaymentTable
                    customers={getFilteredCustomers('transfer')}
                    onPaymentUpdate={handlePaymentUpdate}
                  />
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}