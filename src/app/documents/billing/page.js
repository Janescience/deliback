'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Calendar, Users, AlertCircle, X, Printer, Eye } from 'lucide-react';

export default function BillingPage() {
  const [billingData, setBillingData] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    // Set default period to current month
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(defaultPeriod);
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchBillingData();
    }
  }, [selectedPeriod]);

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

  const handleSelectAll = (checked) => {
    if (checked && billingData) {
      setSelectedCustomers(billingData.customers.map((_, index) => index));
    } else {
      setSelectedCustomers([]);
    }
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
        selectedPeriod: selectedPeriod // ส่ง period ที่เลือกไปด้วย
      });

      console.log('Billing documents generated:', response.data);
      setPreviewData(response.data);
      setShowPreview(true);

    } catch (error) {
      console.error('Failed to generate billing documents:', error);
      alert('เกิดข้อผิดพลาดในการสร้างใบวางบิล');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!previewData) return;

    try {
      setLoading(true);

      const response = await axios.post('/api/documents/download', {
        documents: previewData.documents
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const dateStr = new Date(previewData.actualBillingDate).toLocaleDateString('th-TH').replace(/\//g, '');
      link.setAttribute('download', `ใบวางบิล_${dateStr}.zip`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download billing documents:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAll = async () => {
    if (!previewData) return;

    try {
      setLoading(true);

      const response = await axios.post('/api/documents/print', {
        documents: previewData.documents
      });

      const htmlContent = response.data.html;

      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert('กรุณาอนุญาตให้เปิด popup ในเบราว์เซอร์เพื่อใช้งานการปริ้น');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);

    } catch (error) {
      console.error('Failed to print billing documents:', error);
      alert('เกิดข้อผิดพลาดในการปริ้น');
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

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-2 z-40 border-b border-gray-200">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-gray-600 mr-2" />
          <h1 className="text-lg font-light text-black">ใบวางบิล</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 ">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-light text-black">ใบวางบิล</h1>

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

        {/* Billing Period Info */}
        {billingData && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
            {/* Mobile period selector */}
            <div className="lg:hidden mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-light text-black">เลือกรอบบิล</h2>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {generatePeriodOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
{/* 
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-light text-black">รอบบิลที่เลือก</h2>
            </div> */}

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
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="mr-2"
                  />
                  เลือกทั้งหมด
                </label>

                <button
                  onClick={handleGenerateBilling}
                  disabled={selectedCustomers.length === 0 || loading}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 text-sm flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
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

              <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0 md:space-x-2">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === billingData.customers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="mr-2"
                  />
                  เลือกทั้งหมด
                </label>

                <button
                  onClick={handleGenerateBilling}
                  disabled={selectedCustomers.length === 0 || loading}
                  className="bg-black text-white px-3 py-2 rounded hover:bg-gray-800 disabled:opacity-50 text-sm flex items-center justify-center md:w-auto w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
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

                  {/* Delivery Notes - Table Format */}
                  <div className="">
                    {/* <div className="text-sm text-gray-600 mb-3">ใบส่งสินค้าในรอบนี้:</div> */}

                    {/* Desktop Table */}
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

                    {/* Mobile Layout */}
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

        {/* Preview Modal */}
        {showPreview && previewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex flex-col w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-light text-black">ตัวอย่างใบวางบิล</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                <div className="space-y-6">
                  {previewData.documents.map((doc, index) => {
                    const billingDateFormat = new Date(doc.actualBillingDate).toLocaleDateString('th-TH');
                    const dueDateFormat = new Date(doc.dueDate).toLocaleDateString('th-TH');

                    return (
                      <div key={index} className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
                        {/* Document Header */}
                        <div className="bg-gray-50 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-lg font-light text-black">{doc.customer.name}</h4>
                              {doc.customer.companyName && (
                                <p className="text-gray-600 text-sm">({doc.customer.companyName})</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">เลขที่เอกสาร</div>
                              <div className="font-light text-black">{doc.docNumber}</div>
                            </div>
                          </div>
                        </div>

                        {/* Document Content */}
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-600">รอบบิล</div>
                              <div className="font-light text-black">{doc.periodDisplay}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">วันที่วางบิล</div>
                              <div className="font-light text-black">{billingDateFormat}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">กำหนดชำระ</div>
                              <div className="font-light text-black">{dueDateFormat}</div>
                            </div>
                          </div>

                          {/* Delivery Notes Table */}
                          <div className="bg-gray-50 rounded p-3 mb-4">
                            <div className="text-sm text-gray-600 mb-3">ใบส่งสินค้าในรอบนี้:</div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 text-gray-600 font-normal">รายการ</th>
                                    <th className="text-center py-2 text-gray-600 font-normal">จำนวน</th>
                                    <th className="text-right py-2 text-gray-600 font-normal">ยอดรวม</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {doc.deliveryNotes.map((note, noteIndex) => (
                                    <tr key={noteIndex} className="border-b border-gray-100 last:border-b-0">
                                      <td className="py-2 text-gray-700">{note.description}</td>
                                      <td className="py-2 text-center text-gray-700">{note.quantity.toFixed(1)} กก.</td>
                                      <td className="py-2 text-right font-light">{formatMoney(note.amount)} บาท</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="text-right">
                            <div className="text-lg font-light text-black">
                              ยอดรวมทั้งสิ้น: {formatMoney(doc.totalAmount)} บาท
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  รวม {previewData.documents.length} ใบวางบิล
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    ปิด
                  </button>

                  <button
                    onClick={handlePrintAll}
                    disabled={loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 flex items-center"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    พิมพ์ทั้งหมด
                  </button>

                  <button
                    onClick={handleDownloadAll}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}