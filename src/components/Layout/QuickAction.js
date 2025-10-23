'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBasket, PackageOpen,Truck, FileText, ChevronRight, ChevronLeft } from 'lucide-react';

export default function QuickAction() {
  const [isOpen, setIsOpen] = useState(false);
  const [todayVegetableSummary, setTodayVegetableSummary] = useState([]);
  const [todayCustomerSummary, setTodayCustomerSummary] = useState([]);
  const [expandedCard, setExpandedCard] = useState('vegetable');

  useEffect(() => {
    fetchTodayOrdersSummary();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTodayOrdersSummary();
    }, 30000);
    
    // Listen for custom order update events
    const handleOrderUpdate = () => {
      fetchTodayOrdersSummary();
    };
    
    window.addEventListener('orderUpdated', handleOrderUpdate);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
    };
  }, []);

  const fetchTodayOrdersSummary = async () => {
    try {
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      const response = await axios.get(`/api/orders?delivery_date_from=${today}&delivery_date_to=${today}`);
      const todayOrders = response.data.orders;

      // Process vegetable summary
      const vegetableSummary = {};
      const customerSummary = {};

      todayOrders.forEach(order => {
        const customerId = order.customer_id?._id;
        const customerName = order.customer_id?.name || 'ไม่ระบุ';
        const payMethod = order.customer_id?.pay_method || 'cash';

        // Initialize customer summary
        if (!customerSummary[customerId]) {
          customerSummary[customerId] = {
            name: customerName,
            payMethod: payMethod,
            isPrint: order.customer_id?.is_print || false,
            totalAmount: 0,
            totalWeight: 0,
            vegetables: []
          };
        }

        // Process order details
        order.details?.forEach(detail => {
          const vegetableName = detail.vegetable_id?.name_eng || detail.vegetable_id?.name_th || 'ผักไม่ระบุ';
          const quantity = detail.quantity || 0;
          const subtotal = detail.subtotal || 0;

          // Vegetable summary
          if (!vegetableSummary[vegetableName]) {
            vegetableSummary[vegetableName] = {
              name: vegetableName,
              photo: detail.vegetable_id?.photo || null,
              totalWeight: 0,
              totalAmount: 0
            };
          }
          vegetableSummary[vegetableName].totalWeight += quantity;
          vegetableSummary[vegetableName].totalAmount += subtotal;

          // Customer vegetable details
          customerSummary[customerId].totalAmount += subtotal;
          customerSummary[customerId].totalWeight += quantity;
          customerSummary[customerId].vegetables.push({
            name: vegetableName,
            weight: quantity,
            amount: subtotal
          });
        });
      });

      // Convert to arrays and sort
      const vegetableArray = Object.values(vegetableSummary)
        .sort((a, b) => b.totalWeight - a.totalWeight);
      
      const customerArray = Object.values(customerSummary)
        .sort((a, b) => b.totalAmount - a.totalAmount);

      setTodayVegetableSummary(vegetableArray);
      setTodayCustomerSummary(customerArray);

    } catch (error) {
      console.error('Failed to fetch today orders summary:', error);
    }
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const formatWeight = (weight) => {
    return weight % 1 === 0 ? weight.toString() : weight.toFixed(2);
  };

  const toggleCard = (cardName) => {
    setExpandedCard(expandedCard === cardName ? null : cardName);
  };

  // Don't show if no data
  if (todayVegetableSummary.length === 0 && todayCustomerSummary.length === 0) {
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-32 right-4 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-black text-white px-3 py-3 rounded-full shadow-lg hover:bg-gray-800 transition-all"
          >
            <ShoppingBasket className="w-5 h-5" />
            {/* Customer Count Badge */}
            {todayCustomerSummary.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {todayCustomerSummary.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Slide Panel */}
      <div className={`fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-300 rounded-lg shadow-xl transform transition-transform duration-300 z-50 max-h-[70vh] ${
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center">
            <ShoppingBasket className="w-5 h-5 text-gray-700 mr-2" />
            <h2 className="text-base font-light text-black">สรุปคำสั่งซื้อวันนี้</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3" style={{ maxHeight: 'calc(70vh - 60px)' }}>
          {/* Vegetable Summary Section */}
          {todayVegetableSummary.length > 0 && (
            <div className="mb-4">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleCard('vegetable')}
              >
                <div className="flex items-center">
                  <PackageOpen className="w-4 h-4 text-gray-700 mr-2" />
                  <h3 className="font-light text-black">รายการเตรียมสินค้า</h3>
                  {expandedCard !== 'vegetable' && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-800 rounded-full text-xs">
                      {todayVegetableSummary.length}
                    </span>
                  )}
                </div>
                <div>
                  {expandedCard === 'vegetable' ? (
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
              
              {expandedCard === 'vegetable' && (
                <div>
                  <div className="space-y-1">
                    {/* Header Row */}
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-200 bg-gray-50 rounded px-2">
                      <span className="font-light text-gray-600 text-sm">รายการสินค้า</span>
                      <span className="font-light text-gray-600 text-sm">จำนวน/กก.</span>
                    </div>
                    
                    {todayVegetableSummary.map((veg, index) => (
                      <div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-2">
                          {veg.photo && (
                            <img 
                              src={veg.photo} 
                              alt={veg.name}
                              className="w-5 h-5 object-cover rounded"
                            />
                          )}
                          <span className="font-light text-black text-sm">{veg.name}</span>
                        </div>
                        <span className="font-light text-black text-sm">{formatWeight(veg.totalWeight)}</span>
                      </div>
                    ))}
                    
                    {/* Vegetable Total Summary */}
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-light text-black text-sm">รวม</span>
                        <span className="font-light text-black text-sm">
                          {formatWeight(todayVegetableSummary.reduce((sum, veg) => sum + veg.totalWeight, 0))} กก.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Summary Section */}
          {todayCustomerSummary.length > 0 && (
            <div>
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleCard('customer')}
              >
                <div className="flex items-center">
                  <Truck className="w-4 h-4 text-gray-700 mr-2" />
                  <h3 className="font-light text-black">รายการส่งลูกค้า</h3>
                  {expandedCard !== 'customer' && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-800 rounded-full text-xs">
                      {todayCustomerSummary.length}
                    </span>
                  )}
                </div>
                <div>
                  {expandedCard === 'customer' ? (
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
              
              {expandedCard === 'customer' && (
                <div>
                  <div className="space-y-2">
                    {todayCustomerSummary.map((customer, index) => (
                      <div key={index} className="border border-gray-100 rounded-lg p-2">
                        {/* Customer Header */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-1">
                            <span className="font-light text-black text-sm">{customer.name}</span>
                            <span className={`text-xs px-1 py-1 rounded ${
                              customer.payMethod === 'cash' 
                                ? 'bg-gray-100 text-gray-800'
                                : customer.payMethod === 'credit'
                                ? 'bg-gray-200 text-gray-900'
                                : 'bg-gray-150 text-gray-800'
                            }`}>
                              {customer.payMethod === 'cash' ? 'เงินสด' 
                               : customer.payMethod === 'credit' ? 'เครดิต' 
                               : 'เงินโอน'}
                            </span>
                            {customer.isPrint && (
                              <div className="flex items-center bg-gray-100 text-gray-700 px-1 py-1 rounded text-xs">
                                <FileText className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="text-right flex space-x-2 text-xs">
                            <span className="font-light text-black">{formatWeight(customer.totalWeight)} กก.</span>
                            <span className="text-gray-300">•</span>
                            <span className="font-light text-black">{formatMoney(customer.totalAmount)} บ.</span>
                          </div>
                        </div>
                        
                        {/* Customer's vegetables */}
                        <div className="bg-gray-50 rounded p-1">
                          <div className="grid grid-cols-1 gap-1">
                            {customer.vegetables.map((veg, vegIndex) => (
                              <div key={vegIndex} className="flex justify-between items-center text-xs">
                                <span className="font-light text-black">- {veg.name}</span>
                                <span className="font-light text-black">{formatWeight(veg.weight)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Customer Total Summary */}
                    <div className="mt-3 border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-black text-sm">รวมลูกค้า</span>
                        <div className="text-right flex space-x-2 text-sm">
                          <span className="font-light text-black">{formatWeight(todayCustomerSummary.reduce((sum, customer) => sum + customer.totalWeight, 0))} กก.</span>
                          <span className="font-light text-black">{formatMoney(todayCustomerSummary.reduce((sum, customer) => sum + customer.totalAmount, 0))} บ.</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Payment Method Totals */}
                    <div className="mt-2 border-t border-gray-200 pt-2">
                      <div className="space-y-1 text-sm">
                        {['cash', 'credit', 'transfer'].map(method => {
                          const methodCustomers = todayCustomerSummary.filter(c => c.payMethod === method);
                          const methodTotal = methodCustomers.reduce((sum, c) => sum + c.totalAmount, 0);
                          
                          if (methodTotal > 0) {
                            return (
                              <div key={method} className="flex justify-between">
                                <span>
                                  {method === 'cash' ? 'เงินสด' : method === 'credit' ? 'เครดิต' : 'เงินโอน'}
                                </span>
                                <span className="font-light text-black">{formatMoney(methodTotal)} บ.</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop with blur only */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}