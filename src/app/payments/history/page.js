'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async (offset = 0) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/payments/history?limit=20&offset=${offset}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('ไม่สามารถโหลดประวัติการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (logId) => {
    const reason = prompt('เหตุผลในการย้อนคืน (ไม่บังคับ):');
    if (reason === null) return; // User cancelled

    try {
      await axios.post('/api/payments/undo', {
        logId,
        reason: reason || 'ผู้ใช้ขอย้อนคืน'
      });

      toast.success('ย้อนคืนการชำระเงินสำเร็จ');
      fetchPaymentHistory(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.error || 'ไม่สามารถย้อนคืนการชำระเงินได้');
    }
  };

  const getActionText = (action, actionType) => {
    const actionTexts = {
      mark_paid: 'ชำระเงิน',
      mark_unpaid: 'ย้อนคืนการชำระ'
    };

    const typeTexts = {
      all: 'ทั้งหมด',
      cycle: 'รอบบิล',
      selected: 'รายการที่เลือก'
    };

    return `${actionTexts[action] || action} (${typeTexts[actionType] || actionType})`;
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  if (loading) {
    return (
      <>
        {/* Mobile Fixed Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-200">
          <div className="flex items-center justify-between w-full">
            <Link
              href="/payments"
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={18} />
              กลับ
            </Link>
            <h1 className="text-xl font-extralight text-black">ประวัติการชำระเงิน</h1>
            <div className="w-12"></div> {/* Spacer for balance */}
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center gap-4 mb-6">
            <Link
              href="/payments"
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={20} />
              กลับ
            </Link>
            <h1 className="text-2xl font-light text-black">ประวัติการชำระเงิน</h1>
          </div>

          <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-200">
        <div className="flex items-center justify-between w-full">
          <Link
            href="/payments"
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={18} />
            กลับ
          </Link>
          <h1 className="text-xl font-extralight text-black">ประวัติการชำระเงิน</h1>
          <div className="w-12"></div> {/* Spacer for balance */}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-4 mb-6">
          <Link
            href="/payments"
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={20} />
            กลับ
          </Link>
          <h1 className="text-2xl font-light text-black">ประวัติการชำระเงิน</h1>
        </div>

        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-3">
          {logs.map((log) => (
            <div key={log._id} className={`bg-white border border-gray-200 rounded-lg p-4 ${log.is_undone ? 'bg-red-50 border-red-200' : ''}`}>
              {/* Header Row */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-black font-light">
                    {log.action === 'mark_unpaid' && (
                      <RotateCcw size={14} className="text-orange-500" />
                    )}
                    <span className="text-sm">{getActionText(log.action, log.action_type)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: th })}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-black">
                    {formatMoney(log.total_amount)} บาท
                  </div>
                  <div className="text-xs text-gray-500">
                    {log.order_count} รายการ
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-3">
                <div className="text-sm text-black font-light">{log.customer?.name}</div>
                {log.customer?.company_name && (
                  <div className="text-xs text-gray-500">{log.customer.company_name}</div>
                )}
                {log.billing_cycle && (
                  <div className="text-xs text-gray-500">รอบบิล: {log.billing_cycle}</div>
                )}
              </div>

              {/* Status and Actions */}
              <div className="flex justify-between items-center">
                <div>
                  {log.is_undone ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        <AlertTriangle size={12} />
                        ย้อนคืนแล้ว
                      </span>
                      {log.undone_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          ย้อนคืน: {format(new Date(log.undone_at), 'dd/MM HH:mm')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      สำเร็จ
                    </span>
                  )}
                </div>

                <div>
                  {log.can_undo && !log.is_undone && (
                    <button
                      onClick={() => handleUndo(log._id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-xs"
                    >
                      <RotateCcw size={12} />
                      ย้อนคืน
                    </button>
                  )}
                  {!log.can_undo && !log.is_undone && log.action === 'mark_paid' && (
                    <span className="text-xs text-gray-500">เกินเวลาย้อนคืน</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
              ไม่พบประวัติการชำระเงิน
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">วันที่/เวลา</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">การดำเนินการ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">ลูกค้า</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">จำนวนรายการ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">จำนวนเงิน</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">ผู้ดำเนินการ</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">สถานะ</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className={`hover:bg-gray-50 ${log.is_undone ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: th })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {log.action === 'mark_unpaid' && (
                          <RotateCcw size={14} className="text-orange-500" />
                        )}
                        {getActionText(log.action, log.action_type)}
                      </div>
                      {log.billing_cycle && (
                        <div className="text-xs text-gray-500">
                          รอบบิล: {log.billing_cycle}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{log.customer?.name}</div>
                      {log.customer?.company_name && (
                        <div className="text-xs text-gray-500">{log.customer.company_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {log.order_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatMoney(log.total_amount)} บาท
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.user}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {log.is_undone ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          <AlertTriangle size={12} />
                          ย้อนคืนแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          สำเร็จ
                        </span>
                      )}
                      {log.is_undone && log.undone_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          ย้อนคืน: {format(new Date(log.undone_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {log.can_undo && !log.is_undone && (
                        <button
                          onClick={() => handleUndo(log._id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-xs"
                        >
                          <RotateCcw size={12} />
                          ย้อนคืน
                        </button>
                      )}
                      {!log.can_undo && !log.is_undone && log.action === 'mark_paid' && (
                        <span className="text-xs text-gray-500">เกินเวลาย้อนคืน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบประวัติการชำระเงิน
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.has_more && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchPaymentHistory(pagination.offset + pagination.limit)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              โหลดเพิ่มเติม
            </button>
          </div>
        )}
      </div>
    </>
  );
}