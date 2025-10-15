'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import VegetableTable from '@/components/Tables/VegetableTable';
import VegetableForm from '@/components/Forms/VegetableForm';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function VegetablesPage() {
  const [normalVegetables, setNormalVegetables] = useState([]);
  const [revenueVegetables, setRevenueVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVegetable, setEditingVegetable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showRevenue, setShowRevenue] = useState(false);

  // Touch/Slide states
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    fetchVegetables();
  }, [searchTerm]);

  const fetchVegetables = async () => {
    try {
      setLoading(true);

      // Fetch both normal and revenue data in parallel
      const [normalResponse, revenueResponse] = await Promise.all([
        axios.get(`/api/vegetables?search=${searchTerm}`),
        axios.get('/api/vegetables/revenue')
      ]);

      let normal = normalResponse.data;
      let revenue = revenueResponse.data.vegetables;

      // Apply status filter to both
      if (statusFilter) {
        normal = normal.filter(veg => veg.status === statusFilter);
        revenue = revenue.filter(veg => veg.status === statusFilter);
      }

      // Apply search filter to revenue data
      if (searchTerm) {
        revenue = revenue.filter(veg =>
          veg.name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (veg.name_eng && veg.name_eng.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setNormalVegetables(normal);
      setRevenueVegetables(revenue);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลผักได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVegetables();
  }, [statusFilter, searchTerm]);

  const handleCreate = () => {
    setEditingVegetable(null);
    setShowForm(true);
  };

  const handleEdit = (vegetable) => {
    setEditingVegetable(vegetable);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('คุณต้องการลบผักนี้ใช่หรือไม่?')) {
      try {
        await axios.delete(`/api/vegetables?id=${id}`);
        toast.success('ลบผักสำเร็จ');
        fetchVegetables();
      } catch (error) {
        toast.error('ไม่สามารถลบผักได้');
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingVegetable) {
        await axios.put('/api/vegetables', { id: editingVegetable._id, ...formData });
        toast.success('อัปเดตผักสำเร็จ');
      } else {
        await axios.post('/api/vegetables', formData);
        toast.success('เพิ่มผักใหม่สำเร็จ');
      }
      setShowForm(false);
      fetchVegetables();
    } catch (error) {
      toast.error('ไม่สามารถบันทึกข้อมูลผักได้');
    }
  };

  const handleQuickStatusUpdate = async (id, currentStatus) => {
    // Cycle through status: available -> out_of_stock -> discontinued -> available
    const statusCycle = {
      'available': 'out_of_stock',
      'out_of_stock': 'discontinued', 
      'discontinued': 'available'
    };
    
    const newStatus = statusCycle[currentStatus] || 'available';
    
    try {
      await axios.put('/api/vegetables', { id, status: newStatus });
      toast.success('อัปเดตสถานะสำเร็จ');
      fetchVegetables();
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  // Touch handlers for sliding
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !showRevenue) {
      setIsSliding(true);
      setTimeout(() => {
        setShowRevenue(true);
        setTimeout(() => setIsSliding(false), 100);
      }, 150);
    } else if (isRightSwipe && showRevenue) {
      setIsSliding(true);
      setTimeout(() => {
        setShowRevenue(false);
        setTimeout(() => setIsSliding(false), 100);
      }, 150);
    }
  };

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-300">
        <div className="flex items-center">
          <h1 className="text-xl font-light text-black">จัดการผัก</h1>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={handleCreate}
        className="lg:hidden fixed bottom-18 right-4 w-10 h-10 bg-black rounded text-white border border-black hover:bg-white hover:text-black transition-all active:scale-95 flex items-center justify-center z-40"
        title="+ ผัก"
      >
        <Plus size={20} />
      </button>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-light text-black">จัดการผัก</h1>
          <Button onClick={handleCreate} size="md">
            + ผัก
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-row gap-2 sm:gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              placeholder="ค้นหาผัก (ชื่อไทย, ชื่ออังกฤษ)..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="w-24 sm:w-auto flex-shrink-0">
            <Select
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <option value="">ทั้งหมด</option>
              <option value="available">พร้อมขาย</option>
              <option value="out_of_stock">หมด</option>
              <option value="discontinued">ยกเลิก</option>
            </Select>
          </div>
          <div className="hidden sm:block w-auto flex-shrink-0">
            <Button
              onClick={() => setShowRevenue(!showRevenue)}
              variant={showRevenue ? 'primary' : 'secondary'}
              size="sm"
            >
              {showRevenue ? 'แสดงยอดขาย' : 'เรียงยอดขาย'}
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-black shadow-2xl">
              <VegetableForm
                vegetable={editingVegetable}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
                onDelete={handleDelete}
                isMobile={window.innerWidth < 1024}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-600">กำลังโหลด...</div>
        ) : (
          <>
            {/* Mobile Navigation */}
            {(normalVegetables.length > 0 || revenueVegetables.length > 0) && (
              <div className="lg:hidden border border-minimal rounded mb-2 p-2 bg-minimal-gray">
                <div className="flex justify-between items-center text-xs text-minimal-gray">
                  <div className={`flex items-center gap-1 transition-all duration-300 ${showRevenue ? 'opacity-100' : 'opacity-0'}`}>
                    <ChevronLeft size={14} />
                    รายการสินค้า
                  </div>

                  {/* Dots Indicator */}
                  <div className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${!showRevenue ? 'bg-black scale-125' : 'bg-minimal'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${showRevenue ? 'bg-black scale-125' : 'bg-minimal'}`}></div>
                  </div>

                  <div className={`flex items-center gap-1 transition-all duration-300 ${!showRevenue ? 'opacity-100' : 'opacity-0'}`}>
                    ดูยอดขาย
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Views */}
            <div className="lg:hidden">
              <div
                className={`transition-all duration-300 ease-out ${isSliding ? 'scale-95 opacity-90' : ''}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {!showRevenue ? (
                  <VegetableTable
                    vegetables={normalVegetables}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onQuickStatusUpdate={handleQuickStatusUpdate}
                  />
                ) : (
                  <VegetableTable
                    vegetables={revenueVegetables}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onQuickStatusUpdate={handleQuickStatusUpdate}
                  />
                )}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block">
              <VegetableTable
                vegetables={showRevenue ? revenueVegetables : normalVegetables}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onQuickStatusUpdate={handleQuickStatusUpdate}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}