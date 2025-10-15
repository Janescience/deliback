'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function CashTable({ customers }) {
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const toggleExpanded = (customerId) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const getVegetableColor = (vegetableName) => {
    const colors = [
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800', 
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800'
    ];
    
    let hash = 0;
    if (vegetableName) {
      for (let i = 0; i < vegetableName.length; i++) {
        const char = vegetableName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-3">
        {customers.map((customerData) => (
          <div key={customerData.customer._id} className="bg-white border border-minimal rounded-lg overflow-hidden">
            {/* Main Customer Info - Clickable */}
            <div 
              className="p-3 hover-minimal cursor-pointer"
              onClick={() => toggleExpanded(customerData.customer._id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-black font-light text-sm">
                    {customerData.customer.name}
                  </div>
                  <div className="text-minimal-gray text-xs">
                    {customerData.orders.length} คำสั่งซื้อ • {formatMoney(customerData.totalCash)} บาท
                  </div>
                </div>
                <div className="text-minimal-gray text-xs">
                  {expandedCustomer === customerData.customer._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </div>
            </div>

            {/* Collapsible Order Details */}
            {expandedCustomer === customerData.customer._id && (
              <div className="border-t border-minimal bg-minimal-gray p-3">
                <div className="space-y-2">
                  {customerData.orders.map((order) => (
                    <div key={order._id} className="bg-white rounded p-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-xs font-light text-black">
                            {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-xs text-minimal-gray">
                            ยังไม่ชำระ
                          </div>
                        </div>
                        <div className="text-xs font-light text-black">
                          {formatMoney(order.total)} บาท
                        </div>
                      </div>
                      
                      {/* Vegetables */}
                      <div className="flex flex-wrap gap-1">
                        {order.details?.map((detail, index) => (
                          <span 
                            key={index}
                            className={`px-1 py-1 rounded text-xs font-light ${getVegetableColor(detail.vegetable_id?.name_eng || 'ผักไม่ระบุ')}`}
                          >
                            {detail.vegetable_id?.name_eng || 'ผักไม่ระบุ'} {detail.quantity}กก.
                          </span>
                        )) || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full bg-white border border-minimal rounded-lg overflow-hidden">
          <thead className="bg-minimal-gray">
            <tr>
              <th className="px-4 py-3 border-b border-minimal text-left text-sm font-light text-black">ลูกค้า</th>
              <th className="px-4 py-3 border-b border-minimal text-center text-sm font-light text-black">คำสั่งซื้อ</th>
              <th className="px-4 py-3 border-b border-minimal text-right text-sm font-light text-black">ยอดรวม/บาท</th>
              <th className="px-4 py-3 border-b border-minimal text-center text-sm font-light text-black"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customerData) => (
              <>
                <tr 
                  key={customerData.customer._id} 
                  className="hover-minimal border-b border-minimal cursor-pointer"
                  onClick={() => toggleExpanded(customerData.customer._id)}
                >
                  <td className="px-4 py-3 text-black font-light">
                    {customerData.customer.name}
                    <div className="text-xs text-minimal-gray">
                      {customerData.customer.company_name || customerData.customer.telephone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-black font-light">
                    {customerData.orders.length} คำสั่ง
                  </td>
                  <td className="px-4 py-3 text-right text-black font-light">
                    {formatMoney(customerData.totalCash)}
                  </td>
                  <td className="px-4 py-3 text-center text-minimal-gray text-xs">
                    {expandedCustomer === customerData.customer._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </td>
                </tr>
                
                {/* Collapsible Order Details */}
                {expandedCustomer === customerData.customer._id && (
                  <tr>
                    <td colSpan="4" className="px-4 py-0 bg-minimal-gray">
                      <div className="py-4">
                        <h4 className="font-light text-black mb-3">รายการคำสั่งซื้อ</h4>
                        <div className="bg-white rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-minimal-gray">
                              <tr>
                                <th className="px-3 py-2 text-left text-black font-light">วันที่จัดส่ง</th>
                                <th className="px-3 py-2 text-left text-black font-light">รายการสินค้า</th>
                                <th className="px-3 py-2 text-center text-black font-light">สถานะ</th>
                                <th className="px-3 py-2 text-right text-black font-light">ยอดรวม</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customerData.orders.map((order) => (
                                <tr key={order._id} className="border-t border-minimal">
                                  <td className="px-3 py-2 text-black font-light">
                                    {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                      {order.details?.map((detail, index) => (
                                        <span 
                                          key={index}
                                          className={`px-2 py-1 rounded text-xs font-light ${getVegetableColor(detail.vegetable_id?.name_eng || 'ผักไม่ระบุ')}`}
                                        >
                                          {detail.vegetable_id?.name_eng || 'ผักไม่ระบุ'} {detail.quantity}กก.
                                        </span>
                                      )) || '-'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-light ${
                                      order.paid_status
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {order.paid_status ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right text-black font-light">
                                    {formatMoney(order.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}