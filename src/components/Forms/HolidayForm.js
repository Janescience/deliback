'use client';

import { useState, useEffect } from 'react';

export default function HolidayForm({ holiday, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    day: '',
    description: '',
    active: true
  });

  useEffect(() => {
    if (holiday) {
      setFormData({
        day: holiday.day ? holiday.day.split('T')[0] : '',
        description: holiday.description || '',
        active: holiday.active !== undefined ? holiday.active : true
      });
    }
  }, [holiday]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6 text-black">
        {holiday ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุดใหม่'}
      </h2>

      <div>
        <label className="block text-sm font-light mb-2 text-black">
          วันที่ *
        </label>
        <input
          type="date"
          name="day"
          value={formData.day}
          onChange={handleChange}
          required
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-light mb-2 text-black">
          คำอธิบาย
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="เช่น วันปีใหม่, วันสงกรานต์"
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="active"
          checked={formData.active}
          onChange={handleChange}
          className="mr-3 w-4 h-4 sm:w-5 sm:h-5"
        />
        <label className="text-sm sm:text-base font-light text-black">
          ใช้งาน
        </label>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-minimal">
        <button
          type="button"
          onClick={onCancel}
          className="btn-minimal-secondary px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-light text-sm sm:text-base order-2 sm:order-1"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="btn-minimal-primary px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-light text-sm sm:text-base order-1 sm:order-2"
        >
          {holiday ? 'อัปเดต' : 'เพิ่ม'}
        </button>
      </div>
    </form>
  );
}