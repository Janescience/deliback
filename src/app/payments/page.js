'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import PaymentTable from '@/components/Tables/PaymentTable';
import { ChevronUp, ChevronDown, Angry, ArrowRightLeft, Search, CheckSquare, User, FileText, Activity, CreditCard } from 'lucide-react';

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

  // สำหรับ paid orders search
  const [paidSearchForm, setPaidSearchForm] = useState({
    customerId: '',
    month: ''
  });
  const [paidOrders, setPaidOrders] = useState([]);
  const [selectedPaidOrders, setSelectedPaidOrders] = useState([]);
  const [loadingPaidOrders, setLoadingPaidOrders] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('outstanding'); // outstanding, payment-history, activity-history

  // สำหรับ activity history tab
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activitySearchForm, setActivitySearchForm] = useState({
    action: '',
    customerId: ''
  });

  useEffect(() => {
    fetchPaymentData();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity-history') {
      fetchActivityHistory();
    }
  }, [activeTab]);

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

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchActivityHistory = async (params = {}) => {
    try {
      setLoadingActivity(true);

      // สร้าง query parameters
      const queryParams = new URLSearchParams({
        limit: '20', // ลดจาก 50 เป็น 20
        ...params
      });

      const response = await axios.get(`/api/payments/history?${queryParams}`);
      setActivityLogs(response.data.logs || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดประวัติการเคลื่อนไหวได้');
    } finally {
      setLoadingActivity(false);
    }
  };


  const searchActivityHistory = async () => {
    const params = {};
    if (activitySearchForm.action) params.action = activitySearchForm.action;
    if (activitySearchForm.customerId) params.customer_id = activitySearchForm.customerId;

    await fetchActivityHistory(params);
  };


  const getActionText = (action) => {
    if (action === 'mark_paid') {
      return 'ชำระเงิน';
    }
    if (action === 'revert_payment' || action === 'undo_payment') {
      return 'ยกเลิกการชำระ';
    }
    return action;
  };

  const searchPaidOrders = async () => {
    if (!paidSearchForm.customerId || !paidSearchForm.month) {
      toast.error('กรุณาเลือกลูกค้าและเดือนที่ต้องการค้นหา');
      return;
    }

    try {
      setLoadingPaidOrders(true);
      const response = await axios.get('/api/payments/paid', {
        params: {
          customerId: paidSearchForm.customerId,
          month: paidSearchForm.month
        }
      });
      setPaidOrders(response.data.orders || []);
      setSelectedPaidOrders([]);
    } catch (error) {
      toast.error('ไม่สามารถค้นหาข้อมูลได้');
      setPaidOrders([]);
    } finally {
      setLoadingPaidOrders(false);
    }
  };

  const handlePaidOrderToggle = (orderId) => {
    setSelectedPaidOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleRevertPayment = async () => {
    if (selectedPaidOrders.length === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการแก้ไข');
      return;
    }

    if (!confirm(`คุณต้องการยกเลิกการชำระเงินของ ${selectedPaidOrders.length} รายการใช่หรือไม่?`)) {
      return;
    }

    try {
      await axios.post('/api/payments/revert', {
        orderIds: selectedPaidOrders
      });
      toast.success('ยกเลิกการชำระเงินสำเร็จ');
      searchPaidOrders(); // Refresh paid orders
      fetchPaymentData(); // Refresh main data

      // Refresh activity history if we're on that tab
      if (activeTab === 'activity-history') {
        fetchActivityHistory();
      }
    } catch (error) {
      toast.error('ไม่สามารถยกเลิกการชำระเงินได้');
    }
  };

  const handlePaymentUpdate = async (orderIds, customerId = null, actionType = 'selected') => {
    try {
      const orderIdsArray = Array.isArray(orderIds) ? orderIds : [orderIds];

      // Create confirmation message based on action type
      let confirmMessage = '';
      if (actionType === 'all') {
        confirmMessage = 'คุณต้องการชำระหนี้ทั้งหมดของลูกค้านี้ใช่หรือไม่?';
      } else if (actionType === 'cycle') {
        confirmMessage = 'คุณต้องการชำระหนี้รอบบิลนี้ใช่หรือไม่?';
      } else {
        confirmMessage = `คุณต้องการชำระรายการที่เลือก ${orderIdsArray.length} รายการใช่หรือไม่?`;
      }

      // Show confirmation dialog
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return; // User cancelled
      }

      await axios.put('/api/payments', {
        orderIds: orderIdsArray,
        customerId,
        actionType
      });

      toast.success('อัปเดตสถานะการชำระเงินสำเร็จ');

      // Remove paid orders from state instead of fetching all data
      removePaidOrdersFromState(orderIdsArray);

      // Refresh activity history if we're on that tab
      if (activeTab === 'activity-history') {
        fetchActivityHistory();
      }

    } catch (error) {
      toast.error('ไม่สามารถอัปเดตสถานะการชำระเงินได้');
    }
  };

  const removePaidOrdersFromState = (paidOrderIds) => {
    // Helper function to remove orders from customer data
    const removeOrdersFromCustomer = (customers) => {
      return customers.map(customerData => {
        const filteredOrders = customerData.unpaidOrders?.filter(
          order => !paidOrderIds.includes(order._id)
        ) || [];

        // For cash customers, filter orders array
        const filteredCashOrders = customerData.orders?.filter(
          order => !paidOrderIds.includes(order._id)
        ) || [];

        // For credit customers, also update billing cycles
        const updatedBillingCycles = {};
        if (customerData.billingCycles) {
          Object.keys(customerData.billingCycles).forEach(cycle => {
            const cycleOrders = customerData.billingCycles[cycle].orders.filter(
              order => !paidOrderIds.includes(order._id)
            );
            if (cycleOrders.length > 0) {
              updatedBillingCycles[cycle] = {
                ...customerData.billingCycles[cycle],
                orders: cycleOrders,
                total: cycleOrders.reduce((sum, order) => sum + (order.total || 0), 0)
              };
            }
          });
        }

        // Calculate new total
        const newTotal = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const newCashTotal = filteredCashOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        // Return updated customer data
        return {
          ...customerData,
          unpaidOrders: filteredOrders,
          orders: filteredCashOrders,
          billingCycles: updatedBillingCycles,
          totalUnpaid: newTotal,
          totalCash: newCashTotal
        };
      }).filter(customerData => {
        // Remove customers with no remaining unpaid orders
        return (customerData.unpaidOrders?.length > 0) ||
               (customerData.orders?.length > 0) ||
               (Object.keys(customerData.billingCycles || {}).length > 0);
      });
    };

    // Update all customer states
    setCreditCustomers(prevCustomers => removeOrdersFromCustomer(prevCustomers));
    setTransferCustomers(prevCustomers => removeOrdersFromCustomer(prevCustomers));
    setCashCustomers(prevCustomers => removeOrdersFromCustomer(prevCustomers));
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const getSummaryData = (customers) => {
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
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-extralight text-black">การชำระเงิน</h1>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-6">
          <h1 className="text-2xl font-light text-black">การชำระเงิน</h1>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            {/* Desktop Tabs */}
            <nav className="hidden lg:flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('outstanding')}
                className={`py-2 px-1 border-b-2 font-light transition-colors ${
                  activeTab === 'outstanding'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Angry size={16} />
                  หนี้คงค้าง
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payment-history')}
                className={`py-2 px-1 border-b-2 font-light  transition-colors ${
                  activeTab === 'payment-history'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search size={16} />
                  ประวัติการชำระ
                </div>
              </button>
              <button
                onClick={() => setActiveTab('activity-history')}
                className={`py-2 px-1 border-b-2 font-light  transition-colors ${
                  activeTab === 'activity-history'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity size={16} />
                  ประวัติการเคลื่อนไหว
                </div>
              </button>
            </nav>

            {/* Mobile Tabs */}
            <nav className="lg:hidden -mb-px flex">
              <button
                onClick={() => setActiveTab('outstanding')}
                className={`flex-1 py-3 px-2 border-b-2 font-light text-sm transition-colors ${
                  activeTab === 'outstanding'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Angry size={16} />
                  <span>หนี้คงค้าง</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payment-history')}
                className={`flex-1 py-3 px-2 border-b-2 font-light text-sm transition-colors ${
                  activeTab === 'payment-history'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Search size={16} />
                  <span>การชำระ</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('activity-history')}
                className={`flex-1 py-3 px-2 border-b-2 font-light text-sm transition-colors ${
                  activeTab === 'activity-history'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Activity size={16} />
                  <span>การเคลื่อนไหว</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
        ) : (
          <>
            {/* Tab 1: Outstanding Debts */}
            {activeTab === 'outstanding' && (
              <>
                {/* Summary Cards - Responsive */}
                <div className="mb-6">
              {/* Mobile Summary - Compact */}
              <div className="lg:hidden mb-4 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">เครดิต</div>
                    <div className="text-lg font-medium text-black">
                      {formatMoney(getSummaryData(creditCustomers).totalAmount)} บ.
                    </div>
                    <div className="text-sm text-gray-600">
                      {getSummaryData(creditCustomers).customerCount} ลูกค้า
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">โอนเงิน</div>
                    <div className="text-lg font-medium text-black">
                      {formatMoney(getSummaryData(transferCustomers).totalAmount)} บ.
                    </div>
                    <div className="text-sm text-gray-600">
                      {getSummaryData(transferCustomers).customerCount} ลูกค้า
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Summary - Full */}
              <div className="hidden lg:block">
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
            </div>

                {/* Credit and Transfer Sections */}
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
                            key={`credit-${creditCustomers.length}`}
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
                            key={`transfer-${transferCustomers.length}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

        {/* Tab 2: Payment History */}
            {activeTab === 'payment-history' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                  <div className="p-6">
                    <h3 className="text-lg text-black mb-4">ค้นหารายการที่ชำระแล้ว</h3>

                    {/* Search Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เลือกลูกค้า
                        </label>
                        <select
                          value={paidSearchForm.customerId}
                          onChange={(e) => setPaidSearchForm(prev => ({ ...prev, customerId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors text-black text-sm"
                        >
                          <option value="">-- เลือกลูกค้า --</option>
                          {customers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เลือกเดือน
                        </label>
                        <input
                          type="month"
                          value={paidSearchForm.month}
                          onChange={(e) => setPaidSearchForm(prev => ({ ...prev, month: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors text-black text-sm"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={searchPaidOrders}
                          disabled={loadingPaidOrders}
                          className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          {loadingPaidOrders ? 'กำลังค้นหา...' : 'ค้นหา'}
                        </button>
                      </div>
                    </div>

                    {/* Results */}
                    {paidOrders.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-gray-900">
                            พบ {paidOrders.length} รายการที่ชำระแล้ว
                          </h4>
                          {selectedPaidOrders.length > 0 && (
                            <button
                              onClick={handleRevertPayment}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                            >
                              <CheckSquare className="w-4 h-4 mr-2" />
                              ยกเลิกการชำระ ({selectedPaidOrders.length})
                            </button>
                          )}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  <input
                                    type="checkbox"
                                    checked={selectedPaidOrders.length === paidOrders.length && paidOrders.length > 0}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedPaidOrders(paidOrders.map(order => order._id));
                                      } else {
                                        setSelectedPaidOrders([]);
                                      }
                                    }}
                                    className="rounded"
                                  />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  วันที่ส่ง
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  รายการสินค้า
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  จำนวนเงิน
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  สถานะ
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paidOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <input
                                      type="checkbox"
                                      checked={selectedPaidOrders.includes(order._id)}
                                      onChange={() => handlePaidOrderToggle(order._id)}
                                      className="rounded"
                                    />
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(order.delivery_date).toLocaleDateString('th-TH')}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-900">
                                    {order.items?.map((item, idx) => (
                                      <div key={idx}>
                                        {item.name} ({item.quantity} {item.unit})
                                      </div>
                                    ))}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatMoney(order.total)} บาท
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                      ชำระแล้ว
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-4">
                          {paidOrders.map((order) => (
                            <div key={order._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedPaidOrders.includes(order._id)}
                                    onChange={() => handlePaidOrderToggle(order._id)}
                                    className="rounded"
                                  />
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    ชำระแล้ว
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(order.delivery_date).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm">
                                  <span className="text-gray-500">รายการสินค้า:</span>
                                  <div className="mt-1">
                                    {order.items?.map((item, idx) => (
                                      <div key={idx} className="text-gray-700">
                                        {item.name} ({item.quantity} {item.unit})
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                  <span className="text-sm text-gray-500">ยอดเงิน</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatMoney(order.total)} บาท
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {paidOrders.length === 0 && paidSearchForm.customerId && paidSearchForm.month && !loadingPaidOrders && (
                      <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>ไม่พบรายการที่ชำระแล้วในเดือนที่เลือก</p>
                      </div>
                    )}

                    {!paidSearchForm.customerId && !paidSearchForm.month && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>กรุณาเลือกลูกค้าและเดือนเพื่อค้นหารายการที่ชำระแล้ว</p>
                        <p className="text-sm mt-2">สามารถแก้ไขรายการที่ชำระเงินผิดได้</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Activity History */}
            {activeTab === 'activity-history' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                  <div className="p-6">
                    

                    {/* Search Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          การดำเนินการ
                        </label>
                        <select
                          value={activitySearchForm.action}
                          onChange={(e) => setActivitySearchForm(prev => ({ ...prev, action: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors text-black text-sm"
                        >
                          <option value="">-- ทั้งหมด --</option>
                          <option value="mark_paid">ชำระเงิน</option>
                          <option value="revert_payment">ยกเลิกการชำระ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เลือกลูกค้า
                        </label>
                        <select
                          value={activitySearchForm.customerId}
                          onChange={(e) => setActivitySearchForm(prev => ({ ...prev, customerId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors text-black text-sm"
                        >
                          <option value="">-- ทั้งหมด --</option>
                          {customers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={searchActivityHistory}
                          disabled={loadingActivity}
                          className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          {loadingActivity ? 'กำลังค้นหา...' : 'ค้นหา'}
                        </button>
                      </div>
                    </div>

                    {loadingActivity ? (
                      <div className="text-center py-8 text-gray-500">กำลังโหลดประวัติ...</div>
                    ) : activityLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>ยังไม่มีประวัติการเคลื่อนไหว</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-hidden border border-gray-200 rounded-lg">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  วันที่/เวลาดำเนินการ
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  การดำเนินการ
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ลูกค้า
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  วันที่จัดส่ง
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  รายการ
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ยอดเงิน
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {activityLogs.map((log) => {
                                const createdAt = log.created_at || log.createdAt;
                                const customer = log.customer || log.customer_id;
                                const totalAmount = log.total_amount || 0;
                                const orderCount = log.order_count || (log.orders ? log.orders.length : 0);
                                const orders = log.orders || [];

                                // หาช่วงวันที่จัดส่ง
                                const deliveryDates = orders.map(order => new Date(order.delivery_date)).filter(date => !isNaN(date));
                                deliveryDates.sort((a, b) => a - b);

                                let deliveryDateText = 'ไม่ระบุ';
                                if (deliveryDates.length > 0) {
                                  const firstDate = deliveryDates[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                                  const lastDate = deliveryDates[deliveryDates.length - 1].toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                                  deliveryDateText = deliveryDates.length === 1 ? firstDate : `${firstDate} - ${lastDate}`;
                                }

                                return (
                                  <tr key={log._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {createdAt ? new Date(createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'ไม่ระบุวันที่'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        log.action === 'mark_paid'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {getActionText(log.action)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                      <div>
                                        <div className="font-medium">{customer?.name || 'ไม่ระบุ'}</div>
                                        {customer?.company_name && (
                                          <div className="text-gray-500 text-xs">{customer.company_name}</div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {deliveryDateText}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                      {orders.length > 0 ? (
                                        <div className="space-y-1">
                                          {orders.slice(0, 3).map((order, idx) => (
                                            <div key={idx} className="text-xs">
                                              {order.items?.map((item, itemIdx) => (
                                                <span key={itemIdx} className="block">
                                                  {item.name} ({item.quantity} {item.unit})
                                                </span>
                                              )) || `Order ${new Date(order.delivery_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}
                                            </div>
                                          ))}
                                          {orders.length > 3 && (
                                            <div className="text-xs text-gray-500">
                                              และอีก {orders.length - 3} รายการ
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-500">{orderCount} รายการ</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatMoney(totalAmount)} บาท
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-4">
                          {activityLogs.map((log) => {
                            const createdAt = log.created_at || log.createdAt;
                            const customer = log.customer || log.customer_id;
                            const totalAmount = log.total_amount || 0;
                            const orderCount = log.order_count || (log.orders ? log.orders.length : 0);
                            const orders = log.orders || [];

                            // หาช่วงวันที่จัดส่ง
                            const deliveryDates = orders.map(order => new Date(order.delivery_date)).filter(date => !isNaN(date));
                            deliveryDates.sort((a, b) => a - b);

                            let deliveryDateText = 'ไม่ระบุ';
                            if (deliveryDates.length > 0) {
                              const firstDate = deliveryDates[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                              const lastDate = deliveryDates[deliveryDates.length - 1].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                              deliveryDateText = deliveryDates.length === 1 ? firstDate : `${firstDate} - ${lastDate}`;
                            }

                            return (
                              <div key={log._id} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    log.action === 'mark_paid'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {getActionText(log.action)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {createdAt ? new Date(createdAt).toLocaleDateString('th-TH', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'ไม่ระบุ'}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900">{customer?.name || 'ไม่ระบุ'}</span>
                                    {customer?.company_name && (
                                      <span className="text-gray-500 text-xs block">{customer.company_name}</span>
                                    )}
                                  </div>

                                  <div className="text-sm">
                                    <span className="text-gray-500">วันที่จัดส่ง: </span>
                                    <span className="text-gray-700">{deliveryDateText}</span>
                                  </div>

                                  <div className="text-sm">
                                    <span className="text-gray-500">รายการสินค้า: </span>
                                    {orders.length > 0 ? (
                                      <div className="mt-1 space-y-1">
                                        {orders.slice(0, 2).map((order, idx) => (
                                          <div key={idx}>
                                            {order.items?.map((item, itemIdx) => (
                                              <div key={itemIdx} className="text-gray-700 text-xs">
                                                {item.name} ({item.quantity} {item.unit})
                                              </div>
                                            )) || (
                                              <div className="text-gray-700 text-xs">
                                                Order {new Date(order.delivery_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {orders.length > 2 && (
                                          <div className="text-xs text-gray-500">
                                            และอีก {orders.length - 2} รายการ
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-700">{orderCount} รายการ</span>
                                    )}
                                  </div>

                                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span className="text-gray-500">ยอดเงิน</span>
                                    <span className="font-medium text-gray-900">{formatMoney(totalAmount)} บาท</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {activityLogs.length >= 20 && (
                          <div className="text-center py-4 border-t border-gray-200 mt-6">
                            <p className="text-sm text-gray-500 mb-2">แสดงสูงสุด 20 รายการ</p>
                            <Link
                              href="/payments/history"
                              target="_blank"
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              ดูประวัติทั้งหมดในหน้าใหม่
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}