'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CustomerTable from '@/components/Tables/CustomerTable';
import CustomerForm from '@/components/Forms/CustomerForm';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/customers?search=${searchTerm}`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลลูกค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('คุณต้องการลบลูกค้านี้ใช่หรือไม่?')) {
      try {
        await axios.delete(`/api/customers?id=${id}`);
        toast.success('ลบลูกค้าสำเร็จ');
        fetchCustomers();
      } catch (error) {
        toast.error('ไม่สามารถลบลูกค้าได้');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('กรุณาเลือกลูกค้าที่ต้องการลบ');
      return;
    }

    if (confirm(`คุณต้องการลบลูกค้า ${selectedCustomers.length} รายการ ใช่หรือไม่?`)) {
      try {
        await axios.delete('/api/customers/bulk', { data: { ids: selectedCustomers } });
        toast.success(`ลบลูกค้า ${selectedCustomers.length} รายการสำเร็จ`);
        setSelectedCustomers([]);
        fetchCustomers();
      } catch (error) {
        toast.error('ไม่สามารถลบลูกค้าได้');
      }
    }
  };

  const handleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingCustomer) {
        await axios.put('/api/customers', { id: editingCustomer._id, ...formData });
        toast.success('อัปเดตลูกค้าสำเร็จ');
      } else {
        await axios.post('/api/customers', formData);
        toast.success('สร้างลูกค้าสำเร็จ');
      }
      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      toast.error('ไม่สามารถบันทึกลูกค้าได้');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleActive = async (customerId, currentActive) => {
    try {
      await axios.put('/api/customers', {
        id: customerId,
        active: !currentActive
      });

      // Update local state instead of fetching all data
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer._id === customerId
            ? { ...customer, active: !currentActive }
            : customer
        )
      );

      toast.success(currentActive ? 'ปิดใช้งานลูกค้าแล้ว' : 'เปิดใช้งานลูกค้าแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถเปลี่ยนสถานะลูกค้าได้');
    }
  };

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-300">
        <div className="flex items-center">
          <h1 className="text-xl font-light text-black">จัดการลูกค้า</h1>
        </div>
      </div>
      {/* Mobile FAB */}
      <button
        onClick={handleCreate}
        className="lg:hidden fixed bottom-18 right-4 w-10 h-10 bg-black rounded text-white border border-black hover:bg-white hover:text-black transition-all active:scale-95 flex items-center justify-center z-40"
        title="+ ลูกค้า"
      >
        <Plus size={20} />
      </button>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:pt-8">
        {/* Desktop Header with Search */}
        <div className="hidden lg:flex justify-between items-center gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-light text-black whitespace-nowrap">จัดการลูกค้า</h1>
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="w-96">
              <Input
                type="text"
                placeholder="ค้นหาลูกค้า..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Button onClick={handleCreate} size="md">
              + ลูกค้า
            </Button>
          </div>
        </div>

        {/* Mobile Search - Add this section */}
        <div className="lg:hidden mb-4">
          <Input
            type="text"
            placeholder="ค้นหาลูกค้า..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full"
          />
        </div>

        {/* Bulk Actions */}
        {selectedCustomers.length > 0 && (
          <div className="mb-2 p-4 bg-gray-100 border border-gray-200 rounded">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-light">
                เลือกแล้ว {selectedCustomers.length} รายการ
              </span>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-light"
              >
                ลบที่เลือก
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-black shadow-2xl">
              <CustomerForm
                customer={editingCustomer}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
        ) : (
          <CustomerTable
            customers={customers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedCustomers={selectedCustomers}
            onCustomerSelection={handleCustomerSelection}
            onSelectAll={handleSelectAll}
            onToggleActive={handleToggleActive}
          />
        )}
      </div>
    </>
  );
}