'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/holidays');
      console.log('Fetched holidays:', response.data.holidays);
      setHolidays(response.data.holidays);
    } catch (error) {
      console.error('Fetch holidays error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลวันหยุดได้');
    } finally {
      setLoading(false);
    }
  };

  const handleHolidayToggle = async (dayOfWeek, currentStatus) => {
    console.log('handleHolidayToggle called:', { dayOfWeek, currentStatus, newStatus: !currentStatus });
    
    try {
      const response = await axios.put('/api/holidays', { 
        day_of_week: dayOfWeek, 
        is_holiday: !currentStatus 
      });
      console.log('API response:', response.data);
      
      toast.success(currentStatus ? 'เปลี่ยนเป็นวันทำงาน' : 'เปลี่ยนเป็นวันหยุด');
      await fetchHolidays();
      console.log('Data refreshed after toggle');
    } catch (error) {
      console.error('Holiday toggle error:', error);
      toast.error('ไม่สามารถอัปเดตวันหยุดได้');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-light text-black mb-2">จัดการวันหยุดประจำสัปดาห์</h1>
        <p className="text-minimal-gray">กำหนดวันหยุดประจำสัปดาห์โดยการติ๊กเลือกวันที่ต้องการหยุด</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-minimal-gray">กำลังโหลด...</div>
      ) : (
        <>
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-3">
            {holidays.map((holiday) => (
              <div key={holiday.day_of_week} className="bg-white border border-minimal rounded-lg p-4 hover-minimal">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-light text-black text-base">{holiday.day_name}</h3>
                    <p className="text-minimal-gray text-sm">
                      {holiday.is_holiday ? 'วันหยุด' : 'วันทำงาน'}
                    </p>
                  </div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={holiday.is_holiday}
                      onChange={(e) => {
                        console.log('Checkbox clicked:', { 
                          day: holiday.day_name, 
                          day_of_week: holiday.day_of_week,
                          currentStatus: holiday.is_holiday,
                          checked: e.target.checked 
                        });
                        handleHolidayToggle(holiday.day_of_week, holiday.is_holiday);
                      }}
                    />
                    <span className="ml-2 text-sm font-light text-black">
                      หยุด
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="bg-white border border-minimal rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-minimal-gray">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-light text-black">วัน</th>
                    <th className="px-6 py-4 text-center text-sm font-light text-black">สถานะ</th>
                    <th className="px-6 py-4 text-center text-sm font-light text-black">หยุด/ทำงาน</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((holiday, index) => (
                    <tr key={holiday.day_of_week} className={`hover-minimal ${index !== holidays.length - 1 ? 'border-b border-minimal' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-light text-black text-lg">{holiday.day_name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-light ${
                          holiday.is_holiday 
                            ? 'bg-black text-white' 
                            : 'bg-minimal-gray text-black'
                        }`}>
                          {holiday.is_holiday ? 'วันหยุด' : 'วันทำงาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={holiday.is_holiday}
                            onChange={(e) => {
                              console.log('Desktop checkbox clicked:', { 
                                day: holiday.day_name, 
                                day_of_week: holiday.day_of_week,
                                currentStatus: holiday.is_holiday,
                                checked: e.target.checked 
                              });
                              handleHolidayToggle(holiday.day_of_week, holiday.is_holiday);
                            }}
                          />
                          <span className="ml-2 text-sm font-light text-black">
                            หยุด
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 p-4 bg-minimal-gray rounded-lg">
            <p className="text-sm text-minimal-gray">
              💡 <strong>เคล็ดลับ:</strong> ติ๊กช่อง "หยุด" เพื่อกำหนดให้วันนั้นเป็นวันหยุด ระบบจะใช้ข้อมูลนี้ในการคำนวณวันจัดส่ง
            </p>
          </div>
        </>
      )}
    </div>
  );
}