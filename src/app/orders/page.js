'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import OrderTable from '@/components/Tables/OrderTable';
import OrderForm from '@/components/Forms/OrderForm';
import { Plus, ChevronUp, ChevronDown,PlusIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { getThailandTodayString } from '@/lib/thailand-time-client';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSearchCriteria, setShowSearchCriteria] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    customer_id: '',
    delivery_date_from: getThailandTodayString(), // Today in Thailand timezone
    delivery_date_to: getThailandTodayString(), // Today in Thailand timezone
    pay_method: ''
  });
  const [customers, setCustomers] = useState([]);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchHolidays();
    
    // Setup real-time updates with auto-reconnect SSE
    let eventSource;
    let reconnectTimeout;
    
    const connectSSE = () => {
      console.log('🔄 Setting up SSE connection...');
      eventSource = new EventSource('/api/orders/stream');
      
      eventSource.addEventListener('open', (event) => {
        console.log('🟢 SSE connection opened');
        // Clear any existing reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      });
      
      eventSource.addEventListener('error', (event) => {
        console.error('🔴 SSE error event:', event);
        console.error('ReadyState:', eventSource.readyState);
        
        // Only reconnect if connection is closed
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 SSE connection lost, reconnecting in 5 seconds...');
          reconnectTimeout = setTimeout(connectSSE, 5000);
        }
      });
      
      return eventSource;
    };
    
    eventSource = connectSSE();
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'heartbeat') {
          console.log('💓 SSE heartbeat received');
        } else if (data.type === 'connected') {
          console.log('🟢 SSE connected successfully');
        } else if (data.type === 'order_update') {
          console.log('🔔 New real-time order update received:', data.data);
          
          // Check if new order matches current search criteria
          const orderDate = new Date(data.data.delivery_date);
          const fromDate = new Date(searchCriteria.delivery_date_from);
          const toDate = new Date(searchCriteria.delivery_date_to);
          toDate.setHours(23, 59, 59, 999);
          
          console.log('📅 Date comparison:', {
            orderDate: orderDate.toISOString().split('T')[0],
            fromDate: fromDate.toISOString().split('T')[0], 
            toDate: toDate.toISOString().split('T')[0],
            payMethod: data.data.customer_id?.pay_method,
            searchPayMethod: searchCriteria.pay_method
          });
          
          // More detailed date comparison debug
          const dateMatch1 = !searchCriteria.delivery_date_from || orderDate >= fromDate;
          const dateMatch2 = !searchCriteria.delivery_date_to || orderDate <= toDate;
          const customerMatch = !searchCriteria.customer_id || data.data.customer_id?._id === searchCriteria.customer_id;
          const payMethodMatch = !searchCriteria.pay_method || data.data.customer_id?.pay_method === searchCriteria.pay_method;
          
          console.log('🔍 Detailed criteria check:', {
            dateMatch1: dateMatch1,
            dateMatch2: dateMatch2,
            customerMatch: customerMatch,
            payMethodMatch: payMethodMatch,
            orderDateMs: orderDate.getTime(),
            fromDateMs: fromDate.getTime(),
            toDateMs: toDate.getTime()
          });
          
          const matchesCriteria = dateMatch1 && dateMatch2 && customerMatch && payMethodMatch;
          
          console.log('✅ Order matches criteria:', matchesCriteria);
          
          // For testing - always show new orders regardless of criteria
          if (true || matchesCriteria) {
            console.log('➕ Adding order to list');
            const orderWithHighlight = { ...data.data, isNewOrder: true };
            
            setOrders(prevOrders => {
              const existingIndex = prevOrders.findIndex(order => order._id === data.data._id);
              
              if (existingIndex >= 0) {
                const updatedOrders = [...prevOrders];
                updatedOrders[existingIndex] = orderWithHighlight;
                return updatedOrders;
              } else {
                return [orderWithHighlight, ...prevOrders];
              }
            });
            
            toast.success(`คำสั่งซื้อใหม่จาก ${data.data.customer_id?.name || 'ลูกค้า'}`, {
              duration: 4000,
              position: 'top-right',
            });
            
            setTimeout(() => {
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order._id === data.data._id ? { ...order, isNewOrder: false } : order
                )
              );
            }, 3000);
          } else {
            console.log('❌ Order does not match criteria, showing notification only');
            toast(`คำสั่งซื้อใหม่จาก ${data.data.customer_id?.name || 'ลูกค้า'} (นอกเหนือจากตัวกรอง)`, {
              duration: 3000,
              position: 'top-right',
              style: { background: '#f3f4f6', color: '#374151' }
            });
          }
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection opened successfully');
    };
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
        console.log('SSE connection closed');
      }
    };
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [searchCriteria]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(searchCriteria).filter(([_, value]) => value !== '')
        )
      });
      const response = await axios.get(`/api/orders?${queryParams}`);
      
      // Sort orders by delivery date (newest first) and quantity (highest first) within each date
      const sortedOrders = response.data.orders.sort((a, b) => {
        // First sort by delivery date (newest first)
        const dateA = new Date(a.delivery_date);
        const dateB = new Date(b.delivery_date);
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        
        // If same date, sort by total quantity (highest first)
        const quantityA = a.details?.reduce((total, detail) => total + (detail.quantity || 0), 0) || 0;
        const quantityB = b.details?.reduce((total, detail) => total + (detail.quantity || 0), 0) || 0;
        return quantityB - quantityA;
      });
      
      setOrders(sortedOrders);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers for search');
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await axios.get('/api/holidays');
      setHolidays(response.data.holidays || []); // Extract holidays array
    } catch (error) {
      console.error('Failed to fetch holidays');
    }
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('คุณต้องการลบคำสั่งซื้อนี้ใช่หรือไม่?')) {
      try {
        await axios.delete(`/api/orders?id=${id}`);
        toast.success('ลบคำสั่งซื้อสำเร็จ');
        fetchOrders();
        
        // Trigger custom event to update QuickAction
        window.dispatchEvent(new CustomEvent('orderUpdated'));
      } catch (error) {
        toast.error('ไม่สามารถลบคำสั่งซื้อได้');
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingOrder) {
        await axios.put('/api/orders', { id: editingOrder._id, ...formData });
        toast.success('อัปเดตคำสั่งซื้อสำเร็จ');
      } else {
        await axios.post('/api/orders', formData);
        toast.success('สร้างคำสั่งซื้อสำเร็จ');
      }
      setShowForm(false);
      fetchOrders();
      
      // Trigger custom event to update QuickAction
      window.dispatchEvent(new CustomEvent('orderUpdated'));
    } catch (error) {
      // Check if it's a duplicate order error
      const errorMessage = error.response?.data?.error || error.message || '';
      if (errorMessage.includes('มีคำสั่งซื้อในวันที่') || errorMessage.includes('อยู่แล้ว')) {
        toast.error(errorMessage);
      } else {
        toast.error('ไม่สามารถบันทึกคำสั่งซื้อได้');
      }
    }
  };


  const handleSearchChange = (field, value) => {
    setSearchCriteria(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-adjust end date when start date changes
      if (field === 'delivery_date_from' && value && prev.delivery_date_to && value > prev.delivery_date_to) {
        updated.delivery_date_to = value;
      }
      
      return updated;
    });
    setPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchCriteria({
      customer_id: '',
      delivery_date_from: new Date().toISOString().split('T')[0],
      delivery_date_to: new Date().toISOString().split('T')[0],
      pay_method: ''
    });
    setPage(1);
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  // Check if there are holidays in the selected date range
  const getHolidaysInRange = () => {
    if (!searchCriteria.delivery_date_from || !searchCriteria.delivery_date_to || !Array.isArray(holidays)) {
      return [];
    }
    
    const fromDate = new Date(searchCriteria.delivery_date_from);
    const toDate = new Date(searchCriteria.delivery_date_to);
    
    // Get all dates in the selected range
    const datesInRange = [];
    let currentDate = new Date(fromDate);
    
    while (currentDate <= toDate) {
      datesInRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Find holidays that match any day in the range
    return holidays.filter(holiday => {
      if (!holiday.is_holiday) return false;
      
      return datesInRange.some(date => {
        const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
        return dayOfWeek === holiday.day_of_week;
      });
    });
  };

  const holidaysInRange = getHolidaysInRange();

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-300">
        <div className="flex items-center">
          <h1 className="text-xl font-light text-black">จัดการคำสั่งซื้อ</h1>
        </div>
      </div>

      {/* Mobile FAB (Floating Action Button) */}
      <button
        onClick={handleCreate}
        className="lg:hidden fixed bottom-18 right-4 w-10 h-10 bg-black rounded text-white border border-black hover:bg-white hover:text-black transition-all active:scale-95 flex items-center justify-center z-40"
        title="+ คำสั่งซื้อ"
      >
        <Plus size={20} />
      </button>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-light text-black">จัดการคำสั่งซื้อ</h1>
          <Button onClick={handleCreate} size="md">
             + คำสั่งซื้อ
          </Button>
        </div>

      {/* Search Criteria - Collapsible */}
      <div className="bg-white border border-gray-200 rounded mb-2 ">
        {/* Header - Clickable */}
        <div 
          className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-100"
          onClick={() => setShowSearchCriteria(!showSearchCriteria)}
        >
          <div className="flex items-center">
            <span className="mr-2 text-black">
              {showSearchCriteria ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h3 className="text-base font-light text-black">ค้นหา</h3>
            {(searchCriteria.customer_id || searchCriteria.pay_method) && (
              <span className="ml-2 px-2 py-1 bg-black text-white rounded-full text-xs">
                มีตัวกรอง
              </span>
            )}
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              clearSearch();
            }}
            variant="ghost"
            size="sm"
          >
            ล้างการค้นหา
          </Button>
        </div>
        
        {/* Search Form */}
        {showSearchCriteria && (
          <div className="p-2 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {/* Customer */}
              <div>
                <Select
                  label="ลูกค้า"
                  value={searchCriteria.customer_id}
                  onChange={(e) => handleSearchChange('customer_id', e.target.value)}
                >
                  <option value="">ทุกลูกค้า</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Payment Method */}
              <div>
                <Select
                  label="การชำระเงิน"
                  value={searchCriteria.pay_method}
                  onChange={(e) => handleSearchChange('pay_method', e.target.value)}
                >
                  <option value="">ทุกประเภท</option>
                  <option value="cash">เงินสด</option>
                  <option value="credit">เครดิต</option>
                  <option value="transfer">โอนเงิน</option>
                </Select>
              </div>

              {/* Delivery Date Range */}
              <div>
                <Input
                  type="date"
                  label="วันจัดส่ง (เริ่ม)"
                  value={searchCriteria.delivery_date_from}
                  onChange={(e) => handleSearchChange('delivery_date_from', e.target.value)}
                />
              </div>

              <div>
                <Input
                  type="date"
                  label="วันจัดส่ง (สิ้นสุด)"
                  value={searchCriteria.delivery_date_to}
                  min={searchCriteria.delivery_date_from}
                  onChange={(e) => handleSearchChange('delivery_date_to', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-black shadow-2xl">
            <OrderForm
              order={editingOrder}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}


      {loading ? (
        <div className="text-center py-8 text-gray-600">กำลังโหลด...</div>
      ) : (
        <>
          {orders.length > 0 && (
            <>
              {/* Summary Section - Clean 2 Section Layout */}
              <div className=" border border-gray-200 rounded mb-3 p-3 bg-gray-100">
                {/* Desktop Layout */}
                <div className="hidden font-light lg:flex justify-between items-center ">
                  {/* Section 1: Basic Stats */}
                  <div className="flex items-center space-x-6">
                    <span className="text-black">
                      <strong className="">{orders.length}</strong> คำสั่ง
                    </span>
                    <span className="text-black">
                      <strong className="">{new Set(orders.map(order => order.customer_id?._id).filter(Boolean)).size}</strong> ลูกค้า
                    </span>
                    <span className="text-black">
                      <strong className="">
                        {orders.reduce((total, order) => 
                          total + (order.details?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0), 0
                        ).toFixed(2)}
                      </strong> กก.
                    </span>
                    <span className="text-black">
                      <strong className="">{formatMoney(orders.reduce((total, order) => total + (order.total || 0), 0))}</strong> บ.
                    </span>
                  </div>
                  
                  {/* Section 2: Payment Methods */}
                  <div className="flex items-center space-x-6 text-gray-600">
                    <span>
                      เงินสด <strong className="text-black ">
                        {formatMoney(orders.filter(order => order.customer_id?.pay_method === 'cash')
                          .reduce((sum, order) => sum + (order.total || 0), 0))}
                      </strong>
                    </span>
                    <span>
                      เครดิต <strong className="text-black ">
                        {formatMoney(orders.filter(order => order.customer_id?.pay_method === 'credit')
                          .reduce((sum, order) => sum + (order.total || 0), 0))}
                      </strong>
                    </span>
                    <span>
                      โอนเงิน <strong className="text-black ">
                        {formatMoney(orders.filter(order => order.customer_id?.pay_method === 'transfer')
                          .reduce((sum, order) => sum + (order.total || 0), 0))}
                      </strong>
                    </span>
                  </div>
                </div>
                
                {/* Mobile Layout - Full Info Compact */}
                <div className="lg:hidden ">
                  <div className="font-light text-center ">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-1">
                        <span>{orders.length} คำสั่ง</span>
                        <span>{new Set(orders.map(order => order.customer_id?._id).filter(Boolean)).size} ลูกค้า</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span >{orders.reduce((total, order) => 
                          total + (order.details?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0), 0
                        ).toFixed(2)} กก.</span>
                        <span className="text-black">
                          {formatMoney(orders.reduce((total, order) => total + (order.total || 0), 0))} บ.
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center mt-2 space-x-2 text-gray-600">
                      <span>
                        เงินสด <strong className="text-black">
                          {formatMoney(orders.filter(order => order.customer_id?.pay_method === 'cash')
                            .reduce((sum, order) => sum + (order.total || 0), 0))}
                        </strong>
                      </span>
                      <span>
                        เครดิต <strong className="text-black">
                          {formatMoney(orders.filter(order => order.customer_id?.pay_method === 'credit')
                            .reduce((sum, order) => sum + (order.total || 0), 0))}
                        </strong>
                      </span>
                      <span>
                        โอนเงิน <strong className="text-black">
                          {formatMoney(orders.filter(order => order.customer_id?.pay_method === 'transfer')
                            .reduce((sum, order) => sum + (order.total || 0), 0))}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
            </>
          )}
          <OrderTable
            orders={orders}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-1 sm:gap-2 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  variant={page === i + 1 ? 'primary' : 'secondary'}
                  size="sm"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}