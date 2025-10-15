'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { getThailandTodayString } from '@/lib/thailand-time-client';

export default function OrderForm({ order, onSubmit, onCancel }) {
  const [customers, setCustomers] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [selectedVegetables, setSelectedVegetables] = useState([]);
  const [availableVegetables, setAvailableVegetables] = useState([]);
  const [formData, setFormData] = useState({
    delivery_date: getThailandTodayString(), // Default to today in Thailand timezone
    customer_id: '',
    user: 'admin',
    details: []
  });
  const [holidays, setHolidays] = useState([]);
  const [isHolidayWarning, setIsHolidayWarning] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchVegetables();
    fetchHolidays();
    
    if (order) {
      setFormData(prev => ({
        ...prev,
        delivery_date: order.delivery_date?.split('T')[0] || '',
        customer_id: order.customer_id?._id || order.customer_id || '',
        user: order.user || 'admin',
        details: [] // Reset details, will be populated by the vegetables useEffect
      }));
    }
  }, [order]);

  // Initialize selected vegetables and available vegetables when vegetables are loaded
  useEffect(() => {
    if (vegetables.length > 0) {
      if (order && order.details) {
        // For editing: populate selected vegetables from existing order
        const selectedVegList = order.details
          .filter(detail => detail.quantity > 0)
          .map(detail => {
            const vegetable = vegetables.find(v => 
              v._id === (detail.vegetable_id?._id || detail.vegetable_id)
            );
            return {
              vegetable_id: detail.vegetable_id?._id || detail.vegetable_id,
              vegetable: vegetable,
              quantity: detail.quantity,
              price: detail.price
            };
          })
          .filter(item => item.vegetable);

        setSelectedVegetables(selectedVegList);
        
        // Set available vegetables (exclude selected ones)
        const selectedIds = selectedVegList.map(item => item.vegetable_id);
        setAvailableVegetables(vegetables.filter(v => !selectedIds.includes(v._id)));
      } else {
        // For new order: all vegetables are available
        setSelectedVegetables([]);
        setAvailableVegetables(vegetables);
      }
    }
  }, [vegetables, order]);

  // Check holiday when holidays data is loaded
  useEffect(() => {
    if (holidays.length > 0 && formData.delivery_date) {
      const isHoliday = checkIfHoliday(formData.delivery_date);
      setIsHolidayWarning(isHoliday);
    }
  }, [holidays, formData.delivery_date]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers');
    }
  };

  const fetchVegetables = async () => {
    try {
      const response = await axios.get('/api/vegetables');
      setVegetables(response.data);
    } catch (error) {
      console.error('Failed to fetch vegetables');
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await axios.get('/api/holidays');
      setHolidays(response.data.holidays);
    } catch (error) {
      console.error('Failed to fetch holidays');
    }
  };

  const checkIfHoliday = (dateString) => {
    if (!dateString || !holidays.length) return false;
    
    const selectedDate = new Date(dateString);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    const holiday = holidays.find(h => h.day_of_week === dayOfWeek);
    return holiday ? holiday.is_holiday : false;
  };


  const addVegetable = (vegetableId) => {
    const vegetable = availableVegetables.find(v => v._id === vegetableId);
    if (!vegetable) return;

    const newSelectedVeg = {
      vegetable_id: vegetableId,
      vegetable: vegetable,
      quantity: 1,
      price: vegetable.price || 0
    };

    setSelectedVegetables(prev => [...prev, newSelectedVeg]);
    setAvailableVegetables(prev => prev.filter(v => v._id !== vegetableId));
  };

  const removeVegetable = (vegetableId) => {
    const removedVeg = selectedVegetables.find(item => item.vegetable_id === vegetableId);
    if (!removedVeg) return;

    setSelectedVegetables(prev => prev.filter(item => item.vegetable_id !== vegetableId));
    setAvailableVegetables(prev => [...prev, removedVeg.vegetable].sort((a, b) => a.name_th.localeCompare(b.name_th)));
  };

  const updateSelectedVegetable = (vegetableId, field, value) => {
    setSelectedVegetables(prev => 
      prev.map(item => 
        item.vegetable_id === vegetableId 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert selected vegetables to details format
    const details = selectedVegetables
      .filter(item => item.quantity > 0)
      .map(item => ({
        vegetable_id: item.vegetable_id,
        quantity: item.quantity,
        price: item.price
      }));
    
    const submitData = {
      ...formData,
      details: details
    };
    
    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Check if selected date is holiday
    if (name === 'delivery_date') {
      const isHoliday = checkIfHoliday(newValue);
      setIsHolidayWarning(isHoliday);
    }
  };

  const getTotalAmount = () => {
    return selectedVegetables
      .filter(item => item.quantity > 0)
      .reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const getTotalQuantity = () => {
    return selectedVegetables
      .filter(item => item.quantity > 0)
      .reduce((total, item) => total + (item.quantity || 0), 0).toFixed(2);
  };

  const getActiveDetailsCount = () => {
    return selectedVegetables.filter(item => item.quantity > 0).length;
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <h2 className="text-lg sm:text-xl font-light mb-3 sm:mb-4 text-black">
        {order ? 'แก้ไขคำสั่งซื้อ' : 'สร้างคำสั่งซื้อใหม่'}
      </h2>

      {/* Non-editable Order Info Section - Only for editing - Compact text display */}
      {order && (
        <div className="bg-minimal-gray border border-minimal rounded-lg p-2">
          <div className="flex items-center justify-between text-xs text-black">
            <div className="flex items-center space-x-4">
              {order.customer_id?.pay_method !== 'cash' && (
                <span>เอกสาร: <strong>{order.docnumber || '-'}</strong></span>
              )}
              <span>สร้าง: <strong>
                {order.createdAt ? new Date(order.createdAt).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-'}
              </strong></span>
              <span>โดย: <strong>{order.user || 'admin'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Single row for date and customer - More space for delivery date */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2">
          <Input
            type="date"
            label="วันที่จัดส่ง *"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={handleChange}
            required
            className={`${
              isHolidayWarning ? 'border-red-500' : ''
            }`}
          />
          {isHolidayWarning && (
            <div className="mt-1 p-1 bg-red-50 border border-red-200 rounded">
              <div className="text-red-600 text-xs">⚠️ วันหยุดฟาร์ม</div>
            </div>
          )}
        </div>

        <div className="col-span-3">
          <Select
            label="ลูกค้า *"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            required
          >
            <option value="">เลือกลูกค้า</option>
            {customers.map(customer => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Order Details Section */}
      <div>
        <div className="mb-2 sm:mb-3">
          <label className="block text-xs sm:text-sm font-light text-black">
            รายการสินค้า
          </label>
        </div>

        {/* Vegetable Selection Dropdown */}
        {availableVegetables.length > 0 && (
          <div className="mb-4">
            <Select
              onChange={(e) => {
                if (e.target.value) {
                  addVegetable(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">เลือกสินค้า...</option>
              {availableVegetables.map(vegetable => (
                <option key={vegetable._id} value={vegetable._id}>
                  {vegetable.name_eng}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Selected Vegetables List */}
        {selectedVegetables.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-minimal-gray text-xs sm:text-sm">
            ยังไม่ได้เลือกสินค้า
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {selectedVegetables.map((item) => {
              const vegetable = item.vegetable;
              if (!vegetable) return null;
              
              return (
                <div key={item.vegetable_id} className="border border-minimal rounded-lg p-2 sm:p-3 bg-gray-50">
                  {/* Mobile Layout - Stacked */}
                  <div className="sm:hidden">
                    <div className="flex items-center mb-2">
                      {vegetable.photo ? (
                        <img 
                          src={vegetable.photo} 
                          alt={vegetable.name_th}
                          className="w-8 h-8 object-contain rounded mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-minimal-gray rounded mr-2 flex items-center justify-center">
                          <span className="text-xs text-minimal-gray">No</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-light text-black text-xs">
                          {vegetable.name_th}
                        </div>
                        <div className="text-xs text-minimal-gray">
                          ({vegetable.name_eng})
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVegetable(item.vegetable_id)}
                        className="ml-2 text-gray-600 hover:text-gray-800 text-xs"
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-light mb-1 text-black">
                          จำนวน (กก.)
                        </label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateSelectedVegetable(item.vegetable_id, 'quantity', parseInt(e.target.value) || 0)}
                          min="0"
                          className="text-xs"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-light mb-1 text-black">
                          ราคา/กก.
                        </label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateSelectedVegetable(item.vegetable_id, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-xs"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-light mb-1 text-black">
                          ยอดรวม
                        </label>
                        <div className="px-1 py-1 rounded text-xs text-center font-light bg-gray-100 text-gray-800">
                          {formatMoney(item.quantity * item.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop/Tablet Layout - Grid */}
                  <div className="hidden sm:block">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-1">
                        {vegetable.photo ? (
                          <img 
                            src={vegetable.photo} 
                            alt={vegetable.name_th}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-minimal-gray rounded-lg flex items-center justify-center">
                            <span className="text-xs text-minimal-gray">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-3">
                        <div className="font-light text-black text-xs sm:text-sm">
                          {vegetable.name_th}
                        </div>
                        <div className="text-xs text-minimal-gray">
                          ({vegetable.name_eng})
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs font-light mb-1 text-black">
                          จำนวน (กก.)
                        </label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateSelectedVegetable(item.vegetable_id, 'quantity', parseInt(e.target.value) || 0)}
                          min="0"
                          className="text-xs"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs font-light mb-1 text-black">
                          ราคา/กก.
                        </label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateSelectedVegetable(item.vegetable_id, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-xs"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <label className="block text-xs font-light mb-1 text-black">
                          ยอดรวม
                        </label>
                        <div className="px-2 py-2 rounded-lg text-xs text-center font-light bg-gray-100 text-gray-800">
                          {formatMoney(item.quantity * item.price)}
                        </div>
                      </div>
                      
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVegetable(item.vegetable_id)}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Total Summary - Single row */}
      <div className="bg-black text-white p-3 rounded-md">
        <div className="flex justify-between items-center text-sm font-light">
          <div className="flex items-center space-x-4">
            <span>{getActiveDetailsCount()} รายการ</span>
            <span>{getTotalQuantity()} กก.</span>
          </div>
          <div className="text-lg">
            {formatMoney(getTotalAmount())} บ.
          </div>
        </div>
      </div>

      {/* Single row buttons - Update button on right */}
      <div className="flex justify-between pt-3 border-t border-minimal">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          className="text-xs"
        >
          ยกเลิก
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={getActiveDetailsCount() === 0}
          className="text-xs"
        >
          {order ? 'อัปเดต' : 'สร้าง'}
        </Button>
      </div>
    </form>
  );
}