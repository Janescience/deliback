'use client';

import { format } from 'date-fns';

export default function HolidayTable({ holidays, onEdit, onDelete, onQuickStatusToggle }) {
  return (
    <>
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {holidays.map((holiday) => (
          <div key={holiday._id} className="bg-white border border-minimal rounded-lg p-4 hover-minimal">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-light text-black text-base">
                  {format(new Date(holiday.day), 'dd/MM/yyyy')}
                </h3>
                <p className="text-minimal-gray text-sm">
                  {holiday.description || '-'}
                </p>
              </div>
              <button
                onClick={() => onQuickStatusToggle(holiday._id, holiday.active)}
                className={`px-3 py-1 rounded-full text-xs font-light transition-all hover:opacity-80 ${
                  holiday.active 
                    ? 'bg-black text-white' 
                    : 'bg-minimal-gray text-black border border-minimal'
                }`}
                title="คลิกเพื่อเปลี่ยนสถานะ"
              >
                {holiday.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
              </button>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-minimal">
              <div className="text-sm text-minimal-gray">
                อัปเดต: {format(new Date(holiday.updatedAt), 'dd/MM/yyyy HH:mm')}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(holiday)}
                  className="text-black hover:bg-minimal-gray px-3 py-2 rounded-md transition-all font-light text-sm"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => onDelete(holiday._id)}
                  className="text-minimal-gray hover:text-black hover:bg-minimal-gray px-3 py-2 rounded-md transition-all font-light text-sm"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full bg-white border border-minimal rounded-lg overflow-hidden">
          <thead className="bg-minimal-gray">
            <tr>
              <th className="px-4 py-3 border-b border-minimal text-left text-sm font-light text-black">วันที่</th>
              <th className="px-4 py-3 border-b border-minimal text-left text-sm font-light text-black">คำอธิบาย</th>
              <th className="px-4 py-3 border-b border-minimal text-center text-sm font-light text-black">สถานะ</th>
              <th className="px-4 py-3 border-b border-minimal text-left text-sm font-light text-black">อัปเดตล่าสุด</th>
              <th className="px-4 py-3 border-b border-minimal text-center text-sm font-light text-black">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday) => (
              <tr key={holiday._id} className="hover-minimal border-b border-minimal">
                <td className="px-4 py-3 text-black font-light">
                  {format(new Date(holiday.day), 'dd/MM/yyyy')}
                </td>
                <td className="px-4 py-3 text-black">
                  {holiday.description || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onQuickStatusToggle(holiday._id, holiday.active)}
                    className={`px-3 py-1 rounded-full text-xs font-light transition-all hover:opacity-80 ${
                      holiday.active 
                        ? 'bg-black text-white' 
                        : 'bg-minimal-gray text-black border border-minimal'
                    }`}
                    title="คลิกเพื่อเปลี่ยนสถานะ"
                  >
                    {holiday.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </button>
                </td>
                <td className="px-4 py-3 text-minimal-gray">
                  {format(new Date(holiday.updatedAt), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onEdit(holiday)}
                    className="text-black hover:bg-minimal-gray px-3 py-1 rounded-md mr-2 transition-all font-light"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => onDelete(holiday._id)}
                    className="text-minimal-gray hover:text-black hover:bg-minimal-gray px-3 py-1 rounded-md transition-all font-light"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}