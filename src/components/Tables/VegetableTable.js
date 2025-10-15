'use client';

import { Edit2, Trash2, Leaf } from 'lucide-react';

export default function VegetableTable({ vegetables, onEdit, onDelete, onQuickStatusUpdate }) {
  // Check if we have revenue data
  const hasRevenueData = vegetables.length > 0 && vegetables[0].totalRevenue !== undefined;

  // Get ranking color based on position
  const getRankingColor = (ranking) => {
    if (!ranking) return '';
    if (ranking <= 3) return 'bg-yellow-50 border-yellow-200';
    if (ranking <= 5) return 'bg-green-50 border-green-200';
    if (ranking <= 10) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  // Get badge color based on ranking
  const getBadgeColor = (ranking) => {
    if (!ranking) return '';
    if (ranking === 1) return 'bg-yellow-500 text-white';
    if (ranking === 2) return 'bg-gray-400 text-white';
    if (ranking === 3) return 'bg-orange-600 text-white';
    if (ranking <= 5) return 'bg-green-500 text-white';
    if (ranking <= 10) return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };
  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'พร้อมขาย';
      case 'out_of_stock': return 'หมด';
      case 'discontinued': return 'ยกเลิก';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-black text-white';
      case 'out_of_stock': return 'bg-minimal-gray text-black border border-minimal';
      case 'discontinued': return 'bg-minimal-gray text-minimal-gray border border-minimal';
      default: return 'bg-minimal-gray text-black border border-minimal';
    }
  };

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-2">
        {vegetables.map((vegetable) => (
          <div
            key={vegetable._id}
            className={`relative bg-white border rounded overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              hasRevenueData ? getRankingColor(vegetable.ranking) : 'border-gray-200'
            }`}
            onClick={() => onEdit(vegetable)}
          >
            {/* Ranking Badge */}
            {hasRevenueData && vegetable.ranking && (
              <div className={`absolute top-0 left-0 w-6 h-6 flex items-center justify-center text-xs font-bold rounded-br-lg z-10 ${
                getBadgeColor(vegetable.ranking)
              }`}>
                {vegetable.ranking}
              </div>
            )}

            <div className="p-2">
              <div className="flex items-center gap-2">
                {/* Photo */}
                <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {vegetable.photo ? (
                    <img
                      src={vegetable.photo}
                      alt={vegetable.name_th}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      •
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-light text-black text-sm truncate">{vegetable.name_th}</h3>
                  <div className="text-gray-600 text-xs truncate">
                    {hasRevenueData ? `${vegetable.name_eng || '-'}` : (vegetable.name_eng || '-')}
                  </div>
                </div>

                {hasRevenueData ? (
                  /* Revenue Data */
                  <div className="text-right">
                    <div className="text-black font-light text-xs">
                      {parseFloat(vegetable.totalQuantity || 0).toFixed(1)} กก.
                    </div>
                    <div className="text-black font-light text-xs">
                      {formatMoney(vegetable.totalRevenue)}฿
                    </div>
                  </div>
                ) : (
                  /* Normal Mode */
                  <>
                    {/* Price */}
                    <div className="text-black font-light text-xs">
                      {vegetable.price}฿
                    </div>

                    {/* Status */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickStatusUpdate(vegetable._id, vegetable.status);
                      }}
                      className={`px-1.5 py-0.5 rounded text-xs font-light flex-shrink-0 transition-all hover:opacity-80 ${getStatusColor(vegetable.status)}`}
                      title="คลิกเพื่อเปลี่ยนสถานะ"
                    >
                      {getStatusText(vegetable.status)}
                    </button>
                  </>
                )}
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
                {hasRevenueData && (
                  <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap">ลำดับ</th>
                )}
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap">รูปภาพ</th>
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap">ชื่อไทย</th>
                <th className="px-3 py-3 text-left text-sm font-light whitespace-nowrap">ชื่ออังกฤษ</th>
                {!hasRevenueData && (
                  <th className="px-3 py-3 text-right text-sm font-light whitespace-nowrap">ราคา (บาท)</th>
                )}
                {hasRevenueData && (
                  <th className="px-3 py-3 text-right text-sm font-light whitespace-nowrap">จำนวน (กก.)</th>
                )}
                {hasRevenueData && (
                  <th className="px-3 py-3 text-right text-sm font-light whitespace-nowrap">รายได้รวม (บาท)</th>
                )}
                {!hasRevenueData && (
                  <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap">สถานะ</th>
                )}
                {!hasRevenueData && (
                  <th className="px-3 py-3 text-center text-sm font-light whitespace-nowrap">การจัดการ</th>
                )}
              </tr>
            </thead>
          <tbody>
            {vegetables.map((vegetable) => (
              <tr key={vegetable._id} className={`hover:bg-gray-100 border-b ${
                hasRevenueData ? getRankingColor(vegetable.ranking) : 'border-gray-200'
              }`}>
                {hasRevenueData && (
                  <td className="px-3 py-3 text-center relative">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      getBadgeColor(vegetable.ranking)
                    }`}>
                      {vegetable.ranking}
                    </div>
                  </td>
                )}
                <td className="px-3 py-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    {vegetable.photo ? (
                      <img
                        src={vegetable.photo}
                        alt={vegetable.name_th}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        ไม่มี
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-black font-light">{vegetable.name_th}</td>
                <td className="px-3 py-3 text-gray-600">
                  {vegetable.name_eng || '-'}
                </td>
                {!hasRevenueData && (
                  <td className="px-3 py-3 text-right text-black font-light">
                    {vegetable.price}
                  </td>
                )}
                {hasRevenueData && (
                  <td className="px-3 py-3 text-right text-black font-light">
                    {parseFloat(vegetable.totalQuantity || 0).toFixed(1)}
                  </td>
                )}
                {hasRevenueData && (
                  <td className="px-3 py-3 text-right text-black font-light">
                    {formatMoney(vegetable.totalRevenue)}
                  </td>
                )}
                {!hasRevenueData && (
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => onQuickStatusUpdate(vegetable._id, vegetable.status)}
                      className={`px-2 py-1 rounded text-xs font-light transition-all hover:opacity-80 ${getStatusColor(vegetable.status)}`}
                      title="คลิกเพื่อเปลี่ยนสถานะ"
                    >
                      {getStatusText(vegetable.status)}
                    </button>
                  </td>
                )}
                {!hasRevenueData && (
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center items-center space-x-1">
                      <button
                        onClick={() => onEdit(vegetable)}
                        className="text-black hover:text-gray-600 p-0.5 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} className="text-blue-600"/>
                      </button>
                      <button
                        onClick={() => onDelete(vegetable._id)}
                        className="text-black hover:text-gray-600 ml-2 p-0.5 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
      
      {/* Empty State */}
      {vegetables.length === 0 && (
        <div className="text-center py-12 bg-white">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <Leaf className="mx-auto h-8 w-8" />
            </div>
            <p className="font-light text-black mb-2">ไม่พบข้อมูลผัก</p>
            <p className="text-sm">กรุณาเพิ่มผักใหม่หรือลองค้นหาด้วยคำอื่น</p>
          </div>
        </div>
      )}
    </>
  );
}