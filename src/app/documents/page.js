'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Calendar, Users, X, Printer, AlertCircle, History } from 'lucide-react';
import { getThailandTodayString } from '@/lib/thailand-time-client';



export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('delivery');

  // Delivery Notes Tab States
  const [selectedDate, setSelectedDate] = useState(getThailandTodayString());
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupedOrders, setGroupedOrders] = useState({});

  // Billing Tab States
  const [billingData, setBillingData] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);


  useEffect(() => {
    if (activeTab === 'delivery') {
      fetchOrdersForDate();
    }
  }, [selectedDate, activeTab]);

  useEffect(() => {
    // Set default period to current month for billing
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(defaultPeriod);
  }, []);

  useEffect(() => {
    if (activeTab === 'billing' && selectedPeriod) {
      fetchBillingData();
    }
  }, [selectedPeriod, activeTab]);


  const fetchOrdersForDate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/orders?delivery_date_from=${selectedDate}&delivery_date_to=${selectedDate}`);
      const todayOrders = response.data.allOrders || response.data.orders || [];

      // Group orders by customer and payment method
      const grouped = {};
      todayOrders.forEach(order => {
        const customer = order.customer_id;
        if (!customer || !customer.is_print) return; // Skip if customer doesn't want documents

        const key = `${customer._id}_${customer.pay_method}`;
        if (!grouped[key]) {
          grouped[key] = {
            customer,
            orders: [],
            totalAmount: 0,
            payMethod: customer.pay_method
          };
        }

        grouped[key].orders.push(order);
        grouped[key].totalAmount += order.total || 0;
      });

      setGroupedOrders(grouped);
      setSelectedOrders([]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const url = selectedPeriod
        ? `/api/documents/billing?period=${selectedPeriod}`
        : '/api/documents/billing';
      const response = await axios.get(url);
      setBillingData(response.data);
      // Auto-select all customers by default
      setSelectedCustomers(response.data.customers.map((_, index) => index));
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (index, checked) => {
    if (checked) {
      setSelectedCustomers(prev => [...prev, index]);
    } else {
      setSelectedCustomers(prev => prev.filter(i => i !== index));
    }
  };

  const handleSelectAllCustomers = (checked) => {
    if (checked && billingData) {
      setSelectedCustomers(billingData.customers.map((_, index) => index));
    } else {
      setSelectedCustomers([]);
    }
  };

  const generatePeriodOptions = () => {
    const options = [];
    const today = new Date();

    // Generate options for current month and 11 previous months (12 months total)
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });

      options.push({ value, label });
    }

    return options;
  };

  const handleGenerateBilling = async () => {
    if (selectedCustomers.length === 0) {
      alert('กรุณาเลือกลูกค้าที่ต้องการสร้างใบวางบิล');
      return;
    }

    try {
      setLoading(true);

      const selectedData = selectedCustomers.map(index => billingData.customers[index]);

      const response = await axios.post('/api/documents/billing', {
        selectedCustomers: selectedData,
        selectedPeriod: selectedPeriod
      });

      // Directly print without preview
      const printResponse = await axios.post('/api/documents/print', {
        documents: response.data.documents,
        userId: 'default'
      });

      // Open new window with print-ready HTML
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printResponse.data.html);
      printWindow.document.close();

      // Auto-trigger print dialog
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('Failed to generate billing documents:', error);
      alert('เกิดข้อผิดพลาดในการสร้างใบวางบิล');
    } finally {
      setLoading(false);
    }
  };



  const handleSelectOrder = (key, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, key]);
    } else {
      setSelectedOrders(prev => prev.filter(k => k !== key));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(Object.keys(groupedOrders));
    } else {
      setSelectedOrders([]);
    }
  };


  const getDocumentColor = (payMethod) => {
    switch (payMethod) {
      case 'credit': return 'bg-blue-100 text-blue-800';
      case 'cash': return 'bg-green-100 text-green-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };




  const handlePrintAllWithConfirm = async () => {
    const confirmed = window.confirm(`คุณต้องการปริ้นเอกสารทั้งหมด ${selectedOrders.length} รายการใช่หรือไม่?\n\nหมายเหตุ: ใบส่งสินค้าจะปริ้น 2 ใบ, ใบเสร็จจะปริ้น 1 ใบ`);
    if (confirmed) {
      await generateAndPrintAll();
    }
  };


  const generateAndPrintAll = async () => {
    try {
      setLoading(true);
      
      // Generate documents first
      const response = await axios.post('/api/documents/generate', {
        date: selectedDate,
        selectedOrders: selectedOrders.map(orderKey => groupedOrders[orderKey])
      });

      if (response.data.success) {
        // Prepare documents for printing with correct copies
        const documentsToprint = [];
        
        response.data.documents.forEach(doc => {
          if (doc.docType === 'delivery_note') {
            // Add 2 copies for delivery notes (ใบส่งสินค้า)
            documentsToprint.push(doc, doc);
          } else {
            // Add 1 copy for receipts (ใบเสร็จ)
            documentsToprint.push(doc);
          }
        });
        
        const printResponse = await axios.post('/api/documents/print', {
          documents: documentsToprint,
          userId: 'default'
        });
        
        const htmlContent = printResponse.data.html;

        // Use helper function to handle printing
        handlePrint(htmlContent);
      }
    } catch (error) {
      console.error('Failed to generate and print documents:', error);
      alert('เกิดข้อผิดพลาดในการสร้างและปริ้นเอกสาร');
    } finally {
      setLoading(false);
    }
  };




  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to handle printing across different devices
  const handlePrint = (htmlContent) => {
    // Use popup window for all devices to ensure consistent behavior
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('กรุณาอนุญาตให้เปิด popup ในเบราว์เซอร์เพื่อใช้งานการปริ้น\n\nหมายเหตุ: หากต้องการไม่แสดงเลขหน้า กรุณาไปที่ Print Settings > More settings > Headers and footers (ปิด)');
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Use setTimeout to ensure content is loaded
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();

      // Don't auto-close on mobile to allow user to see the document
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) {
        printWindow.close();
      }
    }, 500);
  };

  const fetchBillingHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get('/api/billing-history?limit=10');
      setBillingHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    if (billingHistory.length === 0) {
      fetchBillingHistory();
    }
  };

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-1.5 z-40 border-b border-gray-200">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-gray-600 mr-2" />
          <h1 className="text-lg font-light text-black">เอกสาร</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:pt-8 lg:pt-0">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-light text-black">เอกสาร</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'delivery'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ใบส่งสินค้า
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'billing'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ใบวางบิล
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'delivery' && (
          <div>
            {/* Date Picker for Delivery Tab */}
            <div className="hidden lg:flex justify-end items-center mb-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

        {/* Orders List */}
        {Object.keys(groupedOrders).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-4">
            {/* Mobile: Date picker at top-right */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-600 mr-2" />
                <h2 className="text-base font-light text-black">รายการเอกสาร</h2>
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {Object.keys(groupedOrders).length}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Desktop: Document list header */}
            <div className="hidden lg:block">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mr-2" />
                  <h2 className="text-base sm:text-lg font-light text-black">รายการเอกสาร</h2>
                  <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {Object.keys(groupedOrders).length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrintAllWithConfirm}
                      disabled={selectedOrders.length === 0 || loading}
                      className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center"
                    >
                      <Printer className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">พิมพ์ ({selectedOrders.length})</span>
                    </button>
                    
                    <button
                      onClick={handlePrintAllWithConfirm}
                      disabled={selectedOrders.length === 0 || loading}
                      className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">ดาวน์โหลด ({selectedOrders.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile buttons */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === Object.keys(groupedOrders).length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="mr-2"
                  />
                  เลือกทั้งหมด
                </label>
                
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintAllWithConfirm}
                    disabled={selectedOrders.length === 0 || loading}
                    className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:opacity-50 text-xs flex items-center justify-center"
                  >
                    <Printer className="w-3 h-3" />
                  </button>
                  
                  <button
                    onClick={handlePrintAllWithConfirm}
                    disabled={selectedOrders.length === 0 || loading}
                    className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 disabled:opacity-50 text-xs flex items-center justify-center"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Header Row */}
            <div className="border-b border-gray-300 pb-2 mb-2 hidden sm:block">
              <div className="grid grid-cols-13 gap-2 text-sm font-light text-gray-700">
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === Object.keys(groupedOrders).length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="col-span-1 text-center">ลำดับ</div>
                <div className="col-span-2">เลขที่เอกสาร</div>
                <div className="col-span-2">ชื่อร้าน</div>
                <div className="col-span-2">บริษัท</div>
                <div className="col-span-1 text-center">ประเภท</div>
                <div className="col-span-1 text-center">รายการ</div>
                <div className="col-span-1 text-center">จำนวนรวม/กก.</div>
                <div className="col-span-2 text-right">ยอดรวม/บ.</div>
              </div>
            </div>
            
            <div className="space-y-1">
              {Object.entries(groupedOrders)
                .sort(([, a], [, b]) => {
                  // Sort by document type first (credit = ใบส่งสินค้า comes first)
                  if (a.payMethod !== b.payMethod) {
                    if (a.payMethod === 'credit') return -1;
                    if (b.payMethod === 'credit') return 1;
                  }

                  // Then sort by document number
                  const docNumberA = a.orders.find(order => order.docnumber)?.docnumber || 'ยังไม่สร้าง';
                  const docNumberB = b.orders.find(order => order.docnumber)?.docnumber || 'ยังไม่สร้าง';
                  return docNumberA.localeCompare(docNumberB);
                })
                .map(([key, group], sortedIndex) => {
                const hasWarnings = !group.customer.tax_id || !group.customer.address;
                const totalItems = group.orders.reduce((sum, order) => {
                  return sum + (order.details?.reduce((detailSum, detail) => detailSum + detail.quantity, 0) || 0);
                }, 0);
                const docNumber = group.orders.find(order => order.docnumber)?.docnumber || 'ยังไม่สร้าง';
                
                return (
                  <div key={key} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
                    {/* Mobile Layout (2 rows) */}
                    <div className="block sm:hidden">
                      {/* Warning banner for mobile */}
                      {hasWarnings && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-1 mb-2 text-xs">
                          <div className="flex items-center text-yellow-800">
                            <span className="font-light">⚠️ ข้อมูลไม่ครบ:</span>
                            <span className="ml-1">
                              {!group.customer.tax_id && 'เลขภาษี'} 
                              {!group.customer.tax_id && !group.customer.address && ' และ '}
                              {!group.customer.address && 'ที่อยู่'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Row 1: Checkbox, Sequence, Doc Number, Store Name, Type */}
                      <div className="grid grid-cols-13 gap-1 items-center text-xs mb-1">
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(key)}
                            onChange={(e) => handleSelectOrder(key, e.target.checked)}
                            className="w-3 h-3"
                          />
                        </div>

                        <div className="col-span-1">
                          <div className="text-center text-gray-600 font-light text-xs">
                            {sortedIndex + 1}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="font-light text-black truncate" title={docNumber}>
                            {docNumber}
                          </div>
                        </div>

                        <div className="col-span-6">
                          <div className="font-light text-black truncate" title={group.customer.name}>
                            {group.customer.name}
                          </div>
                        </div>

                        <div className="col-span-3">
                          <span className={`text-[10px] px-1 py-1 rounded block text-center ${getDocumentColor(group.payMethod)}`}>
                            {group.payMethod === 'credit' ? 'ใบส่งสินค้า' : 'ใบเสร็จ'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Row 2: Company, Vegetable Count, Weight, Total Price */}
                      <div className="grid grid-cols-13 gap-1 items-center text-xs">
                        <div className="col-span-2"></div>

                        <div className="col-span-4">
                          <div className="font-light text-black truncate" title={group.customer.company_name || '-'}>
                            {group.customer.company_name || '-'}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="font-light text-black text-center">
                            {group.orders.reduce((sum, order) => sum + (order.details?.length || 0), 0)}
                          </div>
                          <div className="text-[10px] text-gray-500 text-center">รายการ</div>
                        </div>

                        <div className="col-span-2">
                          <div className="font-light text-black text-center">
                            {totalItems.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-gray-500 text-center">กก.</div>
                        </div>

                        <div className="col-span-3">
                          <div className="font-light text-green-600 text-right">
                            {formatMoney(group.totalAmount)}
                          </div>
                          <div className="text-[10px] text-gray-500 text-right">บาท</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Layout (1 row) */}
                    <div className="hidden sm:grid sm:grid-cols-13 gap-2 items-center text-sm">
                      {/* Checkbox + Warning */}
                      <div className="col-span-1 flex flex-col items-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(key)}
                          onChange={(e) => handleSelectOrder(key, e.target.checked)}
                          className="w-4 h-4"
                        />
                        {hasWarnings && (
                          <span className="text-yellow-600 text-xs mt-1" title="ข้อมูลไม่ครบ">⚠️</span>
                        )}
                      </div>

                      {/* Sequence Number */}
                      <div className="col-span-1">
                        <div className="text-center text-gray-600 font-light">
                          {sortedIndex + 1}
                        </div>
                      </div>

                      {/* Document Number */}
                      <div className="col-span-2">
                        <div className="font-light text-black truncate" title={docNumber}>
                          {docNumber}
                        </div>
                      </div>

                      {/* Store Name */}
                      <div className="col-span-2">
                        <div className="font-light text-black truncate" title={group.customer.name}>
                          {group.customer.name}
                        </div>
                      </div>

                      {/* Company */}
                      <div className="col-span-2">
                        <div className="font-light text-black truncate" title={group.customer.company_name || '-'}>
                          {group.customer.company_name || '-'}
                        </div>
                      </div>

                      {/* Document Type */}
                      <div className="col-span-1">
                        <span className={`text-xs px-2 py-1 rounded block text-center ${getDocumentColor(group.payMethod)}`}>
                          {group.payMethod === 'credit' ? 'ส่ง' : 'เสร็จ'}
                        </span>
                      </div>

                      {/* Vegetable Count */}
                      <div className="col-span-1">
                        <div className="font-light text-black text-center">
                          {group.orders.reduce((sum, order) => sum + (order.details?.length || 0), 0)}
                        </div>
                      </div>

                      {/* Total Weight */}
                      <div className="col-span-1">
                        <div className="font-light text-black text-center">
                          {totalItems.toFixed(1)}
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="col-span-2">
                        <div className="font-light text-green-600 text-right">
                          {formatMoney(group.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && Object.keys(groupedOrders).length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-4">
            {/* Mobile: Date picker at top-right */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-600 mr-2" />
                <h2 className="text-base font-light text-black">รายการเอกสาร</h2>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Desktop: Empty message header */}
            <div className="hidden lg:block">
              <div className="flex items-center mb-4">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mr-2" />
                <h2 className="text-base sm:text-lg font-light text-black">รายการเอกสาร</h2>
              </div>
            </div>

            <div className="py-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-light text-gray-900 mb-2">ไม่มีรายการที่ต้องสร้างเอกสาร</h3>
              <p className="text-gray-500">
                {selectedDate === new Date().toISOString().split('T')[0]
                  ? 'วันนี้ยังไม่มีคำสั่งซื้อที่ต้องการปริ้นเอกสาร'
                  : `วันที่ ${formatDate(selectedDate)} ไม่มีคำสั่งซื้อที่ต้องการปริ้นเอกสาร`}
              </p>
            </div>
          </div>
        )}

        </div>
        )}

        {/* Billing Tab Content */}
        {activeTab === 'billing' && (
          <div>
            {/* Billing Period Info */}
            {billingData && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
                {/* Mobile period selector */}
                <div className="lg:hidden mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={handleShowHistory}
                      className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <History className="w-3 h-3 mr-1" />
                      ประวัติ
                    </button>
                    <h2 className="text-lg font-light text-black">เลือกรอบบิล</h2>
                  </div>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    {generatePeriodOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desktop header with history button and period selector */}
                <div className="hidden lg:flex justify-between items-center mb-4">
                  <button
                    onClick={handleShowHistory}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <History className="w-4 h-4 mr-2" />
                    ประวัติการวางบิล
                  </button>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      {generatePeriodOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-gray-600 mb-1">วันที่เริ่มต้น</div>
                    <div className="font-light text-black">{formatDate(billingData.billingPeriod.startDate)}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-gray-600 mb-1">วันที่สิ้นสุด</div>
                    <div className="font-light text-black">{formatDate(billingData.billingPeriod.endDate)}</div>
                  </div>
                  <div className="bg-blue-50 rounded p-3">
                    <div className="text-blue-600 mb-1">วันที่วางบิล</div>
                    <div className="font-light text-blue-800">{formatDate(billingData.billingPeriod.billingDate)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Customers List */}
            {billingData && billingData.customers.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
                {/* Desktop Header */}
                <div className="hidden sm:flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-600 mr-2" />
                    <h2 className="text-lg font-light text-black">รายการลูกค้าเครดิต</h2>
                    <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {billingData.totalCustomers}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === billingData.customers.length}
                        onChange={(e) => handleSelectAllCustomers(e.target.checked)}
                        className="mr-2"
                      />
                      เลือกทั้งหมด
                    </label>

                    <button
                      onClick={handleGenerateBilling}
                      disabled={selectedCustomers.length === 0 || loading}
                      className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 text-sm flex items-center"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      สร้างใบวางบิล ({selectedCustomers.length})
                    </button>
                  </div>
                </div>

                {/* Mobile Header */}
                <div className="sm:hidden space-y-3 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-600 mr-2" />
                    <h2 className="text-base font-light text-black">รายการลูกค้าเครดิต</h2>
                    <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {billingData.totalCustomers}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === billingData.customers.length}
                        onChange={(e) => handleSelectAllCustomers(e.target.checked)}
                        className="mr-2"
                      />
                      เลือกทั้งหมด
                    </label>

                    <button
                      onClick={handleGenerateBilling}
                      disabled={selectedCustomers.length === 0 || loading}
                      className="bg-black text-white px-3 py-2 rounded hover:bg-gray-800 disabled:opacity-50 text-sm flex items-center justify-center w-full"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      สร้างใบวางบิล ({selectedCustomers.length})
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {billingData.customers.map((customerData, index) => (
                    <div key={customerData.customer._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      {/* Customer Header - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(index)}
                            onChange={(e) => handleSelectCustomer(index, e.target.checked)}
                            className="w-4 h-4 mt-1 flex-shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <h3 className="font-light text-black text-base sm:text-lg truncate">{customerData.customer.name}</h3>
                            {customerData.customer.company_name && (
                              <p className="text-gray-600 text-xs sm:text-sm truncate">({customerData.customer.company_name})</p>
                            )}
                            {!customerData.customer.tax_id && (
                              <div className="flex items-center text-yellow-600 text-xs mt-1">
                                <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                                ไม่มีเลขภาษี
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 sm:ml-4">
                          <div className="font-light text-black text-base sm:text-lg">{formatMoney(customerData.totalAmount)} บาท</div>
                          <div className="text-gray-500 text-xs sm:text-sm">{customerData.deliveryNotes.length} ใบส่งสินค้า</div>
                        </div>
                      </div>

                      {/* Delivery Notes Table */}
                      <div className="hidden sm:block">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 text-gray-600 font-normal">วันที่</th>
                                <th className="text-left py-2 text-gray-600 font-normal">เลขที่เอกสาร</th>
                                <th className="text-right py-2 text-gray-600 font-normal">ยอดรวม</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customerData.deliveryNotes.map((note, noteIndex) => (
                                <tr key={noteIndex} className="border-b border-gray-100 last:border-b-0">
                                  <td className="py-2 text-gray-700">{formatDate(note.date)}</td>
                                  <td className="py-2 text-gray-700">{note.docNumber}</td>
                                  <td className="py-2 text-right font-light">{formatMoney(note.amount)} บาท</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile Layout for Delivery Notes */}
                      <div className="sm:hidden space-y-2">
                        {customerData.deliveryNotes.map((note, noteIndex) => (
                          <div key={noteIndex} className="bg-white rounded p-2 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-xs text-gray-500">วันที่</div>
                                <div className="text-sm text-gray-700 mb-1">{formatDate(note.date)}</div>
                                <div className="text-xs text-gray-500">เลขที่เอกสาร</div>
                                <div className="text-sm text-gray-700">{note.docNumber}</div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <div className="text-xs text-gray-500 mb-1">ยอดรวม</div>
                                <div className="text-sm font-light text-gray-700">{formatMoney(note.amount)} บาท</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {billingData && billingData.customers.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-light text-gray-900 mb-2">ไม่มีรายการวางบิล</h3>
                <p className="text-gray-500">
                  ไม่มีลูกค้าเครดิตที่มีใบส่งสินค้าในรอบบิลนี้
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && !billingData && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
              </div>
            )}

          </div>
        )}

        {/* Billing History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <History className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-xl font-light text-black">ประวัติการวางบิล</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {historyLoading ? (
                  <div className="p-8 text-center">
                    <div className="text-gray-500">กำลังโหลดประวัติ...</div>
                  </div>
                ) : billingHistory.length === 0 ? (
                  <div className="p-8 text-center">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-light text-gray-900 mb-2">ไม่มีประวัติการวางบิล</h3>
                    <p className="text-gray-500 mb-4">ยังไม่มีการสร้างใบวางบิลในระบบ</p>
                    <p className="text-blue-600 text-sm">
                      💡 เมื่อคุณสร้างใบวางบิลแล้ว ระบบจะเก็บประวัติไว้ให้ดูที่นี่
                    </p>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="space-y-4">
                      {billingHistory.map((history) => (
                        <div key={history._id} className="border border-gray-200 rounded-lg p-4">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <div>
                              <h4 className="font-light text-black text-lg">รอบบิล {history.billing_period}</h4>
                              <p className="text-gray-600 text-sm">{formatDate(history.created_date)}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-light text-black">{formatMoney(history.total_amount)} บาท</div>
                              <div className="text-gray-500 text-sm">{history.total_customers} ลูกค้า</div>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded p-3">
                              <div className="text-gray-600 text-sm mb-1">จำนวนลูกค้า</div>
                              <div className="font-light text-black">{history.total_customers} ราย</div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                              <div className="text-gray-600 text-sm mb-1">จำนวนใบวางบิล</div>
                              <div className="font-light text-black">{history.total_invoices} ใบ</div>
                            </div>
                            <div className="bg-green-50 rounded p-3">
                              <div className="text-green-600 text-sm mb-1">ยอดรวมทั้งหมด</div>
                              <div className="font-light text-green-800">{formatMoney(history.total_amount)} บาท</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  {billingHistory.length > 0 && `แสดง ${billingHistory.length} รายการล่าสุด`}
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}