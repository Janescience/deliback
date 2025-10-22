'use client';

import Avatar from '../Avatar';
import { Check, X, Edit2, Trash2,PrinterCheck } from 'lucide-react';
import { format, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

export default function CustomerTable({ customers, onEdit, onDelete, selectedCustomers, onCustomerSelection, onSelectAll, onToggleActive }) {
  // Sort customers by latest order date ascending (oldest first)
  const sortedCustomers = customers.slice().sort((a, b) => {
    const dateA = a.latest_order_date ? new Date(a.latest_order_date) : new Date(0);
    const dateB = b.latest_order_date ? new Date(b.latest_order_date) : new Date(0);
    return dateB - dateA;
  });

  const getPayMethodText = (method) => {
    switch (method) {
      case 'cash': return 'เงินสด';
      case 'transfer': return 'โอนเงิน';
      case 'credit': return 'เครดิต';
      default: return method;
    }
  };

  const getPayMethodStyle = (method) => {
    switch (method) {
      case 'cash':
        return 'bg-black text-white';
      case 'credit':
        return 'bg-gray-100 text-black';
      default:
        return 'bg-gray-300 text-black';
    }
  };

  // Calculate summary stats
  const totalCustomers = customers.length;
  const cashCustomers = customers.filter(c => c.pay_method === 'cash').length;
  const creditCustomers = customers.filter(c => c.pay_method === 'credit').length;
  const transferCustomers = customers.filter(c => c.pay_method === 'transfer').length;
  const printCustomers = customers.filter(c => c.is_print).length;
  
  // Count customers with orders in last month
  const recentCustomers = customers.filter(c => {
    if (!c.latest_order_date) return false;
    const orderDate = new Date(c.latest_order_date);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return orderDate >= oneMonthAgo;
  }).length;

  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yy');
  };

  const formatRelativeDate = (date) => {
    if (!date) return '-';
    
    const now = new Date();
    const targetDate = new Date(date);
    
    const years = differenceInYears(now, targetDate);
    const months = differenceInMonths(now, targetDate) % 12;
    const days = differenceInDays(now, targetDate) % 30;
    
    if (years > 0) {
      if (months > 0) {
        return `${years} ปี ${months} เดือนก่อน`;
      }
      return `${years} ปีก่อน`;
    }
    
    if (months > 0) {
      if (days > 0) {
        return `${months} เดือน ${days} วันก่อน`;
      }
      return `${months} เดือนก่อน`;
    }
    
    if (days > 0) {
      return `${days} วันก่อน`;
    }
    
    return 'วันนี้';
  };

  return (
    <>
      {/* Summary Section */}
      {customers.length > 0 && (
        <div className="border border-gray-200 rounded mb-3 p-3 bg-gray-100">
            {/* Desktop Layout */}
            <div className="hidden font-light lg:flex justify-between items-center">
              {/* Section 1: Basic Stats */}
              <div className="flex items-center space-x-6">
                <span className="text-black">
                  <strong className="">{totalCustomers}</strong> ลูกค้า
                </span>
                <span className="text-black">
                  พิมพ์เอกสาร <strong className="">{printCustomers}</strong> ราย
                </span>
                <span className="text-black">
                  สั่งซื้อเดือนนี้ <strong className="">{recentCustomers}</strong> ราย
                </span>
              </div>

              {/* Section 2: Payment Methods */}
              <div className="flex items-center space-x-6 text-gray-600">
                <span>
                  เงินสด <strong className="text-black">{cashCustomers}</strong>
                </span>
                <span>
                  เครดิต <strong className="text-black">{creditCustomers}</strong>
                </span>
                <span>
                  โอนเงิน <strong className="text-black">{transferCustomers}</strong>
                </span>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
              <div className="font-light text-center">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    <span>{totalCustomers} ลูกค้า</span>
                    <span>พิมพ์เอกสาร {printCustomers} ราย</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>สั่งซื้อเดือนนี้ {recentCustomers} ราย</span>
                  </div>
                </div>
                <div className="flex justify-center mt-2 space-x-2 text-gray-600">
                  <span>เงินสด <strong className="text-black">{cashCustomers}</strong></span>
                  <span>เครดิต <strong className="text-black">{creditCustomers}</strong></span>
                  <span>โอนเงิน <strong className="text-black">{transferCustomers}</strong></span>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {sortedCustomers.map((customer) => (
          <div key={customer._id} className="bg-white border border-gray-200 rounded overflow-hidden">
            {/* Main Customer Info */}
            <div className="p-3">
              {/* First line: Name • Company • Payment Method */}
              <div className="flex justify-between items-center">
                <div className="text-black font-light flex items-center gap-2">
                  <div className="flex text-lg items-center gap-2">
                    <Avatar username={customer.name} size={28} />
                    <span>{customer.name}</span>
                  </div>
                  <span className="text-gray-300"> - </span>
                  <span className={`p-1 text-xs font-light rounded ${getPayMethodStyle(customer.pay_method)}`}>
                    {getPayMethodText(customer.pay_method)}
                  </span>
                  {customer.is_print && (
                    <PrinterCheck size={14} className="text-black" />
                  )}
                  {customer.active !== false ? (
                    <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">ใช้งาน</span>
                  ) : (
                    <span className="px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">ปิด</span>
                  )}
                </div>
                <div className="text-gray-600 text-xs">
                  {formatRelativeDate(customer.latest_order_date).replace('ก่อน', '').replace('วันนี้', 'วันนี้')}
                </div>
              </div>

              {/* Second line: Company, Tax ID */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="text-gray-600 text-xs ">
                    {customer.company_name || '-'}
                  </div>
                  {customer.tax_id && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="text-gray-600 text-xs ">
                        {customer.tax_id}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(customer)}
                    className="text-black hover:bg-gray-100 p-1 rounded transition-colors"
                    title="แก้ไข"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(customer._id)}
                    className="text-black hover:bg-gray-100 p-1 rounded transition-colors"
                    title="ลบ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto border border-gray-200">
          <table className="w-full bg-white" style={{ minWidth: '1000px' }}>
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap w-[50px]">ลำดับ</th>
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap w-[50px]">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedCustomers?.length === customers.length}
                    onChange={onSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap w-[200px]">ชื่อลูกค้า</th>
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap w-[200px]">บริษัท</th>
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap w-[100px]">วิธีชำระเงิน</th>
                <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap w-[100px]">พิมพ์เอกสาร</th>
                <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap w-[80px]">สถานะ</th>
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap w-[120px]">เลขภาษี</th>
                <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap w-[100px]">สั่งซื้อล่าสุด</th>
                <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap w-[100px]">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer, index) => (
                <tr key={customer._id} className="hover:bg-gray-100 border-b border-gray-200">
                  <td className="px-3 py-3 text-center text-black">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCustomers?.includes(customer._id) || false}
                      onChange={() => onCustomerSelection?.(customer._id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-3 text-black font-light">
                    <div className="flex items-center">
                      <Avatar username={customer.name} size={30} className="mr-2" />
                      <span className="truncate">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-black">
                    <div className="truncate" title={customer.company_name || '-'}>
                      {customer.company_name || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-1 py-0.5 text-sm font-light rounded whitespace-nowrap ${getPayMethodStyle(customer.pay_method)}`}>
                      {getPayMethodText(customer.pay_method)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="whitespace-nowrap flex justify-center">
                      {customer.is_print ?
                        <Check size={14} className="text-green-700" /> :
                        <X size={14} className="text-black" />
                      }
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="whitespace-nowrap flex justify-center">
                      <button
                        onClick={() => onToggleActive?.(customer._id, customer.active !== false)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors hover:opacity-80 ${
                          customer.active !== false
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title="คลิกเพื่อเปลี่ยนสถานะ"
                      >
                        {customer.active !== false ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-black">
                    <div className="truncate" title={customer.tax_id || '-'}>
                      {customer.tax_id || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="whitespace-nowrap text-sm" title={formatDate(customer.latest_order_date)}>
                      {formatRelativeDate(customer.latest_order_date)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center items-center space-x-1">
                      <button
                        onClick={() => onEdit(customer)}
                        className="text-black hover:text-gray-600 p-0.5 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} className="text-blue-600"/>
                      </button>
                      <button
                        onClick={() => onDelete(customer._id)}
                        className="text-black hover:text-gray-600 ml-2 p-0.5 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Empty State */}
      {customers.length === 0 && (
        <div className="text-center py-12 bg-white">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <Edit2 className="mx-auto h-8 w-8" />
            </div>
            <p className="font-light text-black mb-2">ไม่พบข้อมูลลูกค้า</p>
            <p className="text-sm">กรุณาเพิ่มลูกค้าใหม่หรือลองค้นหาด้วยคำอื่น</p>
          </div>
        </div>
      )}
    </>
  );
}