'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Check, ChevronUp, ChevronDown } from 'lucide-react';

export default function PaymentTable({ customers, onPaymentUpdate }) {
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState({});

  const toggleExpanded = (customerId) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const getVegetableColor = () => {
    // All vegetable tags use consistent gray theme
    return 'bg-gray-100 text-black';
  };

  const handleCustomerPayment = (customerId) => {
    const customer = customers.find(c => c.customer._id === customerId);
    if (!customer) return;
    
    const orderIds = customer.unpaidOrders.map(order => order._id);
    onPaymentUpdate(orderIds, customerId);
  };

  const handleBillingCyclePayment = (customerId, billingCycle) => {
    const customer = customers.find(c => c.customer._id === customerId);
    if (!customer || !customer.billingCycles[billingCycle]) return;
    
    const orderIds = customer.billingCycles[billingCycle].orders.map(order => order._id);
    onPaymentUpdate(orderIds, customerId);
  };

  const formatBillingCycle = (cycle) => {
    const [year, month] = cycle.split('-');
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  const handleOrderSelection = (orderId, customerId) => {
    const key = `${customerId}-${orderId}`;
    setSelectedOrders(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectedPayment = (customerId) => {
    const customer = customers.find(c => c.customer._id === customerId);
    if (!customer) return;

    const selectedOrderIds = customer.unpaidOrders
      .filter(order => selectedOrders[`${customerId}-${order._id}`])
      .map(order => order._id);
    
    if (selectedOrderIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการชำระเงิน');
      return;
    }

    onPaymentUpdate(selectedOrderIds, customerId);
    
    // Clear selections after payment
    const clearedSelections = { ...selectedOrders };
    selectedOrderIds.forEach(orderId => {
      delete clearedSelections[`${customerId}-${orderId}`];
    });
    setSelectedOrders(clearedSelections);
  };

  const getSelectedCount = (customerId) => {
    const customer = customers.find(c => c.customer._id === customerId);
    if (!customer) return 0;
    
    return customer.unpaidOrders.filter(order => 
      selectedOrders[`${customerId}-${order._id}`]
    ).length;
  };

  const getSelectedTotal = (customerId) => {
    const customer = customers.find(c => c.customer._id === customerId);
    if (!customer) return 0;
    
    return customer.unpaidOrders
      .filter(order => selectedOrders[`${customerId}-${order._id}`])
      .reduce((total, order) => total + (order.total || 0), 0);
  };

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {customers.map((customerData) => (
          <div key={customerData.customer._id} className="bg-white border border-gray-100 rounded overflow-hidden">
            {/* Main Customer Info - Clickable */}
            <div 
              className="p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleExpanded(customerData.customer._id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-black font-extralight text-sm">
                    {customerData.customer.name}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {customerData.payMethod === 'credit' ? (
                      <>
                        {Object.keys(customerData.billingCycles || {}).length} รอบบิล • {formatMoney(customerData.totalUnpaid)} บาท
                      </>
                    ) : (
                      <>
                        {customerData.unpaidOrders.length} งวดค้าง • {formatMoney(customerData.totalUnpaid)} บาท
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCustomerPayment(customerData.customer._id);
                    }}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    title="ชำระทั้งหมด"
                  >
                    ชำระทั้งหมด
                  </button>
                  <div className="text-gray-500 text-xs">
                    {expandedCustomer === customerData.customer._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Order Details */}
            {expandedCustomer === customerData.customer._id && (
              <div className="border-t border-gray-100 bg-gray-50 p-3">
                {/* Selected Orders Summary */}
                {getSelectedCount(customerData.customer._id) > 0 && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex justify-between items-center text-xs">
                      <span>เลือกแล้ว {getSelectedCount(customerData.customer._id)} รายการ ({formatMoney(getSelectedTotal(customerData.customer._id))} บาท)</span>
                      <button
                        onClick={() => handleSelectedPayment(customerData.customer._id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        ชำระที่เลือก
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Different layout for credit vs transfer */}
                {customerData.payMethod === 'credit' ? (
                  <div className="space-y-3">
                    {Object.values(customerData.billingCycles || {}).map((billingCycle) => (
                      <div key={billingCycle.cycle} className="bg-white rounded p-2">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                          <div>
                            <div className="text-xs font-extralight text-black">
                              รอบบิล {formatBillingCycle(billingCycle.cycle)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {billingCycle.orders.length} รายการ
                              {billingCycle.overdueDays > 0 && (
                                <span className="text-red-600 ml-1 font-extralight">
                                  เกิน {billingCycle.overdueDays} วัน
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs font-extralight text-black">
                              {formatMoney(billingCycle.total)} บาท
                            </div>
                            <button
                              onClick={() => handleBillingCyclePayment(customerData.customer._id, billingCycle.cycle)}
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                            >
                              ชำระรอบนี้
                            </button>
                          </div>
                        </div>
                        
                        {/* Orders in this billing cycle */}
                        <div className="space-y-1">
                          {billingCycle.orders.map((order) => (
                            <div key={order._id} className="text-xs">
                              <div className="flex justify-between items-center">
                                <span>{format(new Date(order.delivery_date), 'dd/MM')}</span>
                                <span>{formatMoney(order.total)}บ.</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {order.details?.map((detail, index) => (
                                  <span 
                                    key={index}
                                    className={`px-1 py-0.5 rounded text-xs font-extralight ${getVegetableColor(detail.vegetable_id?.name_eng || 'ผักไม่ระบุ')}`}
                                  >
                                    {detail.vegetable_id?.name_eng || 'ผักไม่ระบุ'} {detail.quantity}กก.
                                  </span>
                                )) || '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerData.unpaidOrders.map((order) => (
                      <div key={order._id} className="bg-white rounded p-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedOrders[`${customerData.customer._id}-${order._id}`] || false}
                              onChange={() => handleOrderSelection(order._id, customerData.customer._id)}
                              className="rounded"
                            />
                            <div>
                              <div className="text-xs font-extralight text-black">
                                {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                              </div>
                              <div className="text-xs text-gray-500">
                                เอกสาร: {order.docnumber || '-'}
                                {order.overdueDays > 0 && (
                                  <span className="text-red-600 ml-2 font-extralight">
                                    เกิน {order.overdueDays} วัน
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-extralight text-black">
                            {formatMoney(order.total)} บาท
                          </div>
                        </div>
                        
                        {/* Vegetables */}
                        <div className="flex flex-wrap gap-1">
                          {order.details?.map((detail, index) => (
                            <span 
                              key={index}
                              className={`px-1 py-1 rounded text-xs font-extralight ${getVegetableColor(detail.vegetable_id?.name_eng || 'ผักไม่ระบุ')}`}
                            >
                              {detail.vegetable_id?.name_eng || 'ผักไม่ระบุ'} {detail.quantity}กก.
                            </span>
                          )) || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-100 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 border-b border-gray-100 text-left text-sm font-extralight text-black">ลูกค้า</th>
              <th className="px-4 py-3 border-b border-gray-100 text-center text-sm font-extralight text-black">งวดค้าง</th>
              <th className="px-4 py-3 border-b border-gray-100 text-right text-sm font-extralight text-black">ยอดรวม/บาท</th>
              <th className="px-4 py-3 border-b border-gray-100 text-center text-sm font-extralight text-black">การดำเนินการ</th>
              <th className="px-4 py-3 border-b border-gray-100 text-center text-sm font-extralight text-black"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customerData) => (
              <>
                <tr 
                  key={customerData.customer._id} 
                  className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                  onClick={() => toggleExpanded(customerData.customer._id)}
                >
                  <td className="px-4 py-3 text-black font-extralight">
                    {customerData.customer.name}
                    <div className="text-xs text-gray-500">
                      {customerData.customer.company_name || customerData.customer.telephone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-black font-extralight">
                    {customerData.payMethod === 'credit' ? 
                      `${Object.keys(customerData.billingCycles || {}).length} รอบบิล` :
                      `${customerData.unpaidOrders.length} งวด`
                    }
                  </td>
                  <td className="px-4 py-3 text-right text-black font-extralight">
                    {formatMoney(customerData.totalUnpaid)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomerPayment(customerData.customer._id);
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      title="ชำระทั้งหมด"
                    >
                      ชำระทั้งหมด
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {expandedCustomer === customerData.customer._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </td>
                </tr>
                
                {/* Collapsible Order Details */}
                {expandedCustomer === customerData.customer._id && (
                  <tr>
                    <td colSpan="5" className="px-4 py-0 bg-gray-50">
                      <div className="py-4">
                        {/* Selected Orders Summary */}
                        {getSelectedCount(customerData.customer._id) > 0 && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-extralight text-blue-800">
                                เลือกแล้ว {getSelectedCount(customerData.customer._id)} รายการ 
                                ({formatMoney(getSelectedTotal(customerData.customer._id))} บาท)
                              </span>
                              <button
                                onClick={() => handleSelectedPayment(customerData.customer._id)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                              >
                                ชำระที่เลือก
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Different desktop layout for credit vs transfer */}
                        {customerData.payMethod === 'credit' ? (
                          <>
                            <h4 className="font-extralight text-black mb-3">รายการค้างชำระ (แยกตามรอบบิล)</h4>
                            <div className="space-y-4">
                              {Object.values(customerData.billingCycles || {}).map((billingCycle) => (
                                <div key={billingCycle.cycle} className="bg-white rounded-lg overflow-hidden border border-gray-100">
                                  <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                                    <div>
                                      <span className="font-extralight text-black">รอบบิล {formatBillingCycle(billingCycle.cycle)}</span>
                                      <span className="text-sm text-gray-500 ml-2">({billingCycle.orders.length} รายการ)</span>
                                      {billingCycle.overdueDays > 0 && (
                                        <span className="text-sm text-red-600 ml-2 font-extralight">
                                          เกินกำหนด {billingCycle.overdueDays} วัน
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <span className="font-extralight text-black">{formatMoney(billingCycle.total)} บาท</span>
                                      <button
                                        onClick={() => handleBillingCyclePayment(customerData.customer._id, billingCycle.cycle)}
                                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                      >
                                        ชำระรอบนี้
                                      </button>
                                    </div>
                                  </div>
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-black font-extralight">วันที่จัดส่ง</th>
                                        <th className="px-3 py-2 text-left text-black font-extralight">รายการผัก</th>
                                        <th className="px-3 py-2 text-center text-black font-extralight">เอกสาร</th>
                                        <th className="px-3 py-2 text-right text-black font-extralight">ยอดรวม</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {billingCycle.orders.map((order) => (
                                        <tr key={order._id} className="border-t border-gray-100">
                                          <td className="px-3 py-2 text-black font-extralight">
                                            {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-1">
                                              {order.details?.map((detail, index) => (
                                                <span 
                                                  key={index}
                                                  className={`px-2 py-1 rounded text-xs font-extralight ${getVegetableColor(detail.vegetable_id?.name_eng || 'ผักไม่ระบุ')}`}
                                                >
                                                  {detail.vegetable_id?.name_eng || 'ผักไม่ระบุ'} {detail.quantity}กก.
                                                </span>
                                              )) || '-'}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 text-center text-black">
                                            {order.docnumber || '-'}
                                          </td>
                                          <td className="px-3 py-2 text-right text-black font-extralight">
                                            {formatMoney(order.total)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            <h4 className="font-extralight text-black mb-3">รายการค้างชำระ</h4>
                            <div className="bg-white rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-black font-extralight">
                                      <input
                                        type="checkbox"
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          const newSelections = { ...selectedOrders };
                                          customerData.unpaidOrders.forEach(order => {
                                            const key = `${customerData.customer._id}-${order._id}`;
                                            if (isChecked) {
                                              newSelections[key] = true;
                                            } else {
                                              delete newSelections[key];
                                            }
                                          });
                                          setSelectedOrders(newSelections);
                                        }}
                                        checked={customerData.unpaidOrders.length > 0 && 
                                          customerData.unpaidOrders.every(order => 
                                            selectedOrders[`${customerData.customer._id}-${order._id}`]
                                          )
                                        }
                                      />
                                    </th>
                                    <th className="px-3 py-2 text-left text-black font-extralight">วันที่จัดส่ง</th>
                                    <th className="px-3 py-2 text-left text-black font-extralight">รายการผัก</th>
                                    <th className="px-3 py-2 text-center text-black font-extralight">เอกสาร</th>
                                    <th className="px-3 py-2 text-right text-black font-extralight">ยอดรวม</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customerData.unpaidOrders.map((order) => (
                                    <tr key={order._id} className="border-t border-gray-100">
                                      <td className="px-3 py-2">
                                        <input
                                          type="checkbox"
                                          checked={selectedOrders[`${customerData.customer._id}-${order._id}`] || false}
                                          onChange={() => handleOrderSelection(order._id, customerData.customer._id)}
                                          className="rounded"
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-black font-extralight">
                                        {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                                        {order.overdueDays > 0 && (
                                          <div className="text-xs text-red-600 font-extralight">
                                            เกิน {order.overdueDays} วัน
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex flex-wrap gap-1">
                                          {order.details?.map((detail, index) => (
                                            <span 
                                              key={index}
                                              className={`px-2 py-1 rounded text-xs font-extralight ${getVegetableColor(detail.vegetable_id?.name_eng || 'ผักไม่ระบุ')}`}
                                            >
                                              {detail.vegetable_id?.name_eng || 'ผักไม่ระบุ'} {detail.quantity}กก.
                                            </span>
                                          )) || '-'}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-center text-black">
                                        {order.docnumber || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-right text-black font-extralight">
                                        {formatMoney(order.total)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
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