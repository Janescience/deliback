'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, FileText, ChevronUp, ChevronDown, Check, X  } from 'lucide-react';
import Avatar from '../Avatar';

export default function OrderTable({ orders, onEdit, onDelete }) {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleExpanded = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const getVegetableColor = () => {
    // All vegetable tags are now black background with white text
    return 'bg-gray-100 text-black ';
  };
  return (
    <>
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4 w-full">
        {orders.map((order) => (
          <div key={order._id} className={`bg-white border border-gray-200 rounded overflow-hidden w-full ${order.isNewOrder ? 'order-highlight-new' : ''}`}>
            {/* Main Order Info - Clickable - Compact 2-line layout */}
            <div
              className="p-3 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => toggleExpanded(order._id)}
            >
              {/* First line: Date • Customer  Weight Price */}
              <div className="flex justify-between items-center">
                <div className="text-black font-light flex items-center gap-2">
                  <span className="text-gray-500">{format(new Date(order.delivery_date), 'dd/MM')}</span>
                  <span className="text-gray-300"> - </span>
                  <div className="flex text-lg items-center gap-2">
                    <Avatar username={order.customer_id?.name} size={28} />
                    <span>{order.customer_id?.name || '-'}</span>
                  </div>
                  <span className={`p-1 text-xs font-light rounded ${
                    order.customer_id?.pay_method === 'cash'
                      ? 'bg-black text-white'
                      : order.customer_id?.pay_method === 'credit'
                      ? 'bg-gray-100 text-black'
                      : 'bg-gray-300 text-black'
                  }`}>
                    {order.customer_id?.pay_method === 'cash' ? 'เงินสด'
                     : order.customer_id?.pay_method === 'credit' ? 'เครดิต'
                     : 'เงินโอน'}
                  </span>
                </div>

              </div>

              {/* Second line: Vegetables count, Payment method & status, Expand indicator */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-600">
                     {order.details?.length || 0} รายการ
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="text-black font-light ">
                    {(order.details?.reduce((total, detail) => total + (detail.quantity || 0), 0) || 0).toFixed(2)} กก. <span className="text-gray-300">•</span> {formatMoney(order.total)} บ.
                  </div>
                </div>
                <div className="text-gray-600 ">
                  {expandedOrder === order._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </div>
            </div>

            {/* Collapsible Details */}
            {expandedOrder === order._id && (
              <div className="border-t border-black bg-gray-100">
                <div className="p-2">
                  {order.details?.length > 0 ? (
                    <div className="bg-white border border-minimal overflow-hidden mb-2 rounded">
                      <table className="w-full text-xs">
                        <thead className="bg-black text-white">
                          <tr>
                            <th className="px-2 py-1.5 text-left font-light">รายการสินค้า</th>
                            <th className="px-2 py-1.5 text-right font-light">จำนวน(กก.)</th>
                            <th className="px-2 py-1.5 text-right font-light">ราคา</th>
                            <th className="px-2 py-1.5 text-right font-light">รวม</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.details.map((detail, index) => (
                            <tr key={index} className={index !== 0 ? 'border-t border-minimal' : ''}>
                              <td className="px-2 py-1.5 text-black font-light">
                                {detail.vegetable_id?.name_th || 'ไม่ระบุ'}
                              </td>
                              <td className="px-2 py-1.5 text-right text-minimal-gray">
                                {parseFloat(detail.quantity).toFixed(1)}
                              </td>
                              <td className="px-2 py-1.5 text-right text-minimal-gray">
                                {formatMoney(detail.price)}
                              </td>
                              <td className="px-2 py-1.5 text-right text-black font-light">
                                {formatMoney(detail.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs mb-2">ไม่มีรายละเอียดสินค้า</p>
                  )}

                  {/* Action buttons - Compact */}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(order);
                      }}
                      className="flex-1 bg-black text-white hover:bg-white hover:text-black px-2 py-1 transition-all border border-black flex items-center justify-center"
                      title="แก้ไข"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(order._id);
                      }}
                      className="flex-1 bg-white text-black hover:bg-black hover:text-white px-2 py-1 transition-all border border-black flex items-center justify-center"
                      title="ลบ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden border border-gray-200 rounded lg:block overflow-hidden">
        <div className="overflow-x-auto ">
          <table className="w-full bg-white" style={{ minWidth: '1000px' }}>
          <thead className="bg-gray-100 rounded text-black">
            <tr>
              <th className="px-3 py-3  text-left  font-light whitespace-nowrap w-[90px]">วันที่จัดส่ง</th>
              <th className="px-3 py-3  text-left font-light whitespace-nowrap w-[180px]">ลูกค้า</th>
              <th className="px-3 py-3  text-left  font-light whitespace-nowrap w-[250px]">รายการสินค้า</th>
              <th className="px-3 py-3  text-right  font-light whitespace-nowrap w-[80px]">จำนวน/กก.</th>
              <th className="px-3 py-3  text-right font-light whitespace-nowrap w-[100px]">ยอดรวม/บ.</th>
              <th className="px-3 py-3  text-center font-light whitespace-nowrap w-[70px]">ประเภทการชำระ</th>
              <th className="px-3 py-3  text-left font-light whitespace-nowrap w-[80px]">เอกสาร</th>
              <th className="px-3 py-3  text-center  font-light whitespace-nowrap w-[60px]">สถานะการชำระ</th>
              <th className="px-3 py-3  text-center font-light whitespace-nowrap w-[70px]">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <>
                <tr 
                  key={order._id} 
                  className={`hover:bg-gray-100 border-b border-gray-200 rounded transition-colors ${order.isNewOrder ? 'order-highlight-new' : ''}`}
                >
                  <td className="px-3 py-3  text-black text-sm w-[90px]">
                    <div className="whitespace-nowrap">
                      {format(new Date(order.delivery_date), 'dd/MM/yy')}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-black font-light w-[180px]">
                    <div className="whitespace-nowrap flex items-center gap-2" title={order.customer_id?.name || '-'}>
                      <Avatar username={order.customer_id?.name} size={32} />
                      <span className="text-sm">{order.customer_id?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 w-[250px]">
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                      {order.details?.map((detail, index) => (
                        <span
                          key={index}
                          className={`px-1 py-0.5 font-light rounded whitespace-nowrap text-xs ${getVegetableColor()}`}
                        >
                          {detail.vegetable_id?.name_eng || 'ไม่ระบุ'}
                        </span>
                      )) || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-3  text-right text-black font-light w-[80px]">
                    <div className="whitespace-nowrap">
                      {(order.details?.reduce((total, detail) => total + (detail.quantity || 0), 0) || 0).toFixed(1)}
                    </div>
                  </td>
                  <td className="px-3 py-3  text-right text-black font-light w-[100px]">
                    <div className="whitespace-nowrap">
                      {formatMoney(order.total)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center w-[70px]">
                    <span className={`px-1 py-0.5 text-xs font-light rounded whitespace-nowrap ${
                      order.customer_id?.pay_method === 'cash'
                        ? 'bg-black text-white'
                        : order.customer_id?.pay_method === 'credit'
                        ? 'bg-gray-100 text-black'
                        : 'bg-gray-300 text-black'
                    }`}>
                      {order.customer_id?.pay_method === 'cash' ? 'เงินสด'
                       : order.customer_id?.pay_method === 'credit' ? 'เครดิต'
                       : 'เงินโอน'}
                    </span>
                  </td>
                  <td className="px-3 py-3  text-black w-[80px]">
                    <div className="whitespace-nowrap text-sm overflow-hidden text-ellipsis" title={order.docnumber || '-'}>
                      {order.docnumber || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center w-[60px]">
                    <div className="whitespace-nowrap flex justify-center">
                      {(order.customer_id?.pay_method === 'cash' || order.paid_status) ?
                        <Check size={14} className="text-green-700" /> :
                        <X size={14} className="text-black" />
                      }
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center w-[70px]">
                    <div className="flex justify-center items-center space-x-1 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(order);
                        }}
                        className="text-black hover:text-gray-600 p-0.5 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={14} className="text-blue-600"/>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(order._id);
                        }}
                        className="text-black hover:text-gray-600 ml-2 p-0.5 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
                
              </>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      
      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12 bg-white ">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <FileText className="mx-auto h-8 w-8 " />
            </div>
            <p className="font-light text-black mb-2">ไม่พบรายการสั่งซื้อ</p>

          </div>
        </div>
      )}
    </>
  );
}