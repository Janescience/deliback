'use client';

import { useState, useEffect } from 'react';

export default function VegetableForm({ vegetable, onSubmit, onCancel, onDelete, isMobile = false }) {
  const [formData, setFormData] = useState({
    name_th: '',
    name_eng: '',
    price: '',
    status: 'available',
    photo: ''
  });

  useEffect(() => {
    if (vegetable) {
      setFormData({
        name_th: vegetable.name_th || '',
        name_eng: vegetable.name_eng || '',
        price: vegetable.price || '',
        status: vegetable.status || 'available',
        photo: vegetable.photo || ''
      });
    }
  }, [vegetable]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert price to number and validate
    const cleanedData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      name_eng: formData.name_eng.trim() || undefined,
      photo: formData.photo.trim() || undefined
    };

    onSubmit(cleanedData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData({
        ...formData,
        price: value
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
      <h2 className="text-lg sm:text-2xl font-light mb-3 sm:mb-6 text-black">
        {vegetable ? 'แก้ไขผัก' : 'เพิ่มผักใหม่'}
      </h2>

      {/* Thai Name - Required */}
      <div>
        <label className="block text-sm font-light mb-1 sm:mb-2 text-black">
          ชื่อไทย *
        </label>
        <input
          type="text"
          name="name_th"
          value={formData.name_th}
          onChange={handleChange}
          required
          placeholder="กรอกชื่อผักภาษาไทย"
          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      {/* English Name */}
      <div>
        <label className="block text-sm font-light mb-1 sm:mb-2 text-black">
          ชื่ออังกฤษ
        </label>
        <input
          type="text"
          name="name_eng"
          value={formData.name_eng}
          onChange={handleChange}
          placeholder="English name (ถ้ามี)"
          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
      </div>

      {/* Price and Status Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Price - Required */}
        <div>
          <label className="block text-sm font-light mb-1 sm:mb-2 text-black">
            ราคา (บาท) *
          </label>
          <input
            type="text"
            name="price"
            value={formData.price}
            onChange={handlePriceChange}
            required
            placeholder="0.00"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-light mb-1 sm:mb-2 text-black">
            สถานะ *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
          >
            <option value="available">พร้อมขาย</option>
            <option value="out_of_stock">หมด</option>
            <option value="discontinued">ยกเลิก</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-minimal-gray -mt-1 sm:hidden">
        กรอกราคาเป็นตัวเลข เช่น 25 หรือ 25.50
      </p>

      {/* Photo URL */}
      <div>
        <label className="block text-sm font-light mb-1 sm:mb-2 text-black">
          รูปภาพ (URL)
        </label>
        <input
          type="url"
          name="photo"
          value={formData.photo}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg (ถ้ามี)"
          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-minimal rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base"
        />
        <p className="text-xs text-minimal-gray mt-1 sm:block hidden">
          ใส่ URL ของรูปภาพ หรือเว้นว่างไว้หากไม่มี
        </p>

        {/* Photo Preview - Smaller on mobile */}
        {formData.photo && (
          <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-minimal-gray rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={formData.photo}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full flex items-center justify-center text-minimal-gray text-xs" style={{display: 'none'}}>
                ไม่โหลดได้
              </div>
            </div>
            <p className="text-xs sm:text-sm text-black">ตัวอย่างรูปภาพ</p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-row justify-between pt-3 sm:pt-4 border-t border-minimal">
        {/* Delete button - only show in mobile edit mode */}
        {isMobile && vegetable && onDelete ? (
          <button
            type="button"
            onClick={() => {
              if (confirm('คุณต้องการลบผักนี้ใช่หรือไม่?')) {
                onDelete(vegetable._id);
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-light text-sm sm:text-base transition-all"
          >
            ลบผัก
          </button>
        ) : (
          <div></div>
        )}

        <div className="flex space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-minimal-secondary px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-light text-sm sm:text-base"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            className="bg-black hover:bg-gray-800 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-light text-sm sm:text-base transition-all"
          >
            {vegetable ? 'อัปเดต' : 'เพิ่มผัก'}
          </button>
        </div>
      </div>
    </form>
  );
}