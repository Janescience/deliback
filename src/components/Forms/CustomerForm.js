'use client';

import { useState, useEffect } from 'react';

export default function CustomerForm({ customer, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    telephone: '',
    line_id: '',
    line_name: '',
    pay_method: 'cash',
    tax_id: '',
    address: '',
    is_print: false,
    active: true
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        company_name: customer.company_name || '',
        telephone: customer.telephone || '',
        line_id: customer.line_id || '',
        line_name: customer.line_name || '',
        pay_method: customer.pay_method || 'cash',
        tax_id: customer.tax_id || '',
        address: customer.address || '',
        is_print: customer.is_print || false,
        active: customer.active !== undefined ? customer.active : true
      });
    }
  }, [customer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Remove empty strings to avoid validation issues
    const cleanedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key, 
        typeof value === 'string' ? (value.trim() || undefined) : value
      ])
    );
    onSubmit(cleanedData);
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
        {customer ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}
      </h2>

      {/* Name - Required */}
      <div>
        <label className="block text-sm font-light mb-2 text-black">
          ชื่อลูกค้า *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="กรอกชื่อลูกค้า"
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      {/* Telephone - Required */}
      <div>
        <label className="block text-sm font-light mb-2 text-black">
          เบอร์โทร
        </label>
        <input
          type="tel"
          name="telephone"
          value={formData.telephone}
          onChange={handleChange}
          placeholder="08x-xxx-xxxx"
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-light mb-2 text-black">
          ชื่อบริษัท
        </label>
        <input
          type="text"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          placeholder="ชื่อบริษัท (ถ้ามี)"
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-light mb-2 text-black">
          วิธีชำระเงิน *
        </label>
        <select
          name="pay_method"
          value={formData.pay_method}
          onChange={handleChange}
          required
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        >
          <option value="cash">เงินสด</option>
          <option value="transfer">โอนเงิน</option>
          <option value="credit">เครดิต</option>
        </select>
      </div>

      {/* Print Document */}
      <div>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            name="is_print"
            checked={formData.is_print}
            onChange={handleChange}
            className="w-4 h-4 text-black bg-white border border-minimal rounded focus:ring-black focus:ring-2"
          />
          <span className="font-light text-black">ต้องการเอกสารส่งผัก (ใบวางบิล/ใบเสร็จ)</span>
        </label>
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            name="active"
            checked={formData.active}
            onChange={handleChange}
            className="w-4 h-4 text-black bg-white border border-minimal rounded focus:ring-black focus:ring-2"
          />
          <span className="font-light text-black">ลูกค้าใช้งาน (แสดงในรายการสร้างคำสั่งซื้อ)</span>
        </label>
      </div>

      {/* Line Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-light mb-2 text-black">
            Line ID
          </label>
          <input
            type="text"
            name="line_id"
            value={formData.line_id}
            onChange={handleChange}
            placeholder="Line ID (ถ้ามี)"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-2 text-black">
            ชื่อ Line
          </label>
          <input
            type="text"
            name="line_name"
            value={formData.line_name}
            onChange={handleChange}
            placeholder="ชื่อแสดงใน Line (ถ้ามี)"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Tax ID */}
      <div>
        <label className="block text-sm font-light mb-2 text-black">
          เลขประจำตัวผู้เสียภาษี
        </label>
        <input
          type="text"
          name="tax_id"
          value={formData.tax_id}
          onChange={handleChange}
          placeholder="เลขภาษี 13 หลัก (ถ้ามี)"
          maxLength="13"
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-light mb-2 text-black">
          ที่อยู่
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="ที่อยู่สำหรับจัดส่ง (ถ้ามี)"
          rows="3"
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base resize-none"
        />
      </div>

      {/* Form Actions */}
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
          {customer ? 'อัปเดต' : 'เพิ่มลูกค้า'}
        </button>
      </div>
    </form>
  );
}