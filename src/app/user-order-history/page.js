'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, User, Store, CreditCard } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function UserOrderHistoryPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    shopName: '',
    payMethod: 'เงินสด'
  });

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      // สร้าง API endpoint ใหม่สำหรับดึงข้อมูลทั้งหมด
      const response = await axios.get('/api/user-order-history/all');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        await axios.put('/api/user-order-history/manage', {
          userId: formData.userId,
          shopName: formData.shopName,
          payMethod: formData.payMethod,
          userName: formData.userName
        });
        toast.success('อัพเดทข้อมูลสำเร็จ');
      } else {
        // Add new user/shop
        await axios.post('/api/user-order-history/manage', formData);
        toast.success('เพิ่มข้อมูลสำเร็จ');
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData({ userId: '', userName: '', shopName: '', payMethod: 'เงินสด' });
      fetchAllUsers();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (user, shop) => {
    setFormData({
      userId: user.userId,
      userName: shop.userName,
      shopName: shop.shopName,
      payMethod: shop.payMethod
    });
    setEditingUser({ userId: user.userId, shopName: shop.shopName });
    setShowForm(true);
  };

  const handleDelete = async (userId, shopName) => {
    if (confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
      try {
        await axios.delete(`/api/user-order-history/manage?userId=${userId}&shopName=${encodeURIComponent(shopName)}`);
        toast.success('ลบข้อมูลสำเร็จ');
        fetchAllUsers();
      } catch (error) {
        toast.error('ไม่สามารถลบข้อมูลได้');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.shops.some(shop =>
      shop.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.shopName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getTotalShops = () => {
    return users.reduce((total, user) => total + user.shops.length, 0);
  };

  const payMethodColors = {
    'เงินสด': 'bg-green-100 text-green-800',
    'โอนเงิน': 'bg-blue-100 text-blue-800',
    'เครดิต': 'bg-purple-100 text-purple-800'
  };

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-2 z-40 border-b border-gray-200">
        <div className="flex items-center">
          <User className="w-5 h-5 text-gray-600 mr-2" />
          <h1 className="text-lg font-light text-black">ประวัติการสั่งซื้อ</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:pt-0 pt-16">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-light text-black">ประวัติการสั่งซื้อของลูกค้า</h1>
          <Button onClick={() => setShowForm(true)} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มข้อมูล
          </Button>
        </div>

        {/* Mobile Add Button */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มข้อมูล
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded border border-gray-100 p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา User ID, ชื่อผู้ใช้, หรือชื่อร้าน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500 mb-1">จำนวนผู้ใช้</div>
              <div className="font-light text-black text-sm">{users.length} คน</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500 mb-1">ร้านค้าทั้งหมด</div>
              <div className="font-light text-black text-sm">{getTotalShops()} ร้าน</div>
            </div>
            <div className="bg-gray-50 rounded p-2 col-span-2 sm:col-span-1">
              <div className="text-gray-500 mb-1">ข้อมูลที่แสดง</div>
              <div className="font-light text-black text-sm">{filteredUsers.length} คน</div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center">
              <User className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-light text-gray-900 mb-1">ไม่พบข้อมูล</h3>
              <p className="text-xs text-gray-500">ไม่มีข้อมูลประวัติการสั่งซื้อ</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-light text-gray-600">User ID</th>
                      <th className="px-3 py-2 text-left text-xs font-light text-gray-600">ชื่อผู้ใช้</th>
                      <th className="px-3 py-2 text-left text-xs font-light text-gray-600">ชื่อร้าน</th>
                      <th className="px-3 py-2 text-left text-xs font-light text-gray-600">วิธีชำระ</th>
                      <th className="px-3 py-2 text-left text-xs font-light text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) =>
                      user.shops.map((shop, shopIndex) => (
                        <tr key={`${user.userId}-${shopIndex}`} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-xs text-gray-900">
                            {user.userId}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-900">
                            {shop.userName}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-900">
                            {shop.shopName}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-light ${
                              payMethodColors[shop.payMethod] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {shop.payMethod}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEdit(user, shop)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="แก้ไข"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.userId, shop.shopName)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="ลบ"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 p-3">
                {filteredUsers.map((user) =>
                  user.shops.map((shop, shopIndex) => (
                    <div key={`${user.userId}-${shopIndex}`} className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-light text-gray-900">{user.userId}</div>
                          <div className="text-xs text-gray-600 mt-1">{shop.userName}</div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleEdit(user, shop)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.userId, shop.shopName)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-500">ร้าน: </span>
                          <span className="text-gray-700">{shop.shopName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">วิธีชำระ:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-light ${
                            payMethodColors[shop.payMethod] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {shop.payMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full p-4">
            <h3 className="text-base font-light text-gray-900 mb-3">
              {editingUser ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-light text-gray-600 mb-1">User ID</label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  disabled={editingUser}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-gray-600 mb-1">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-gray-600 mb-1">ชื่อร้าน</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  disabled={editingUser}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-gray-600 mb-1">วิธีชำระเงิน</label>
                <select
                  value={formData.payMethod}
                  onChange={(e) => setFormData({ ...formData, payMethod: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="เงินสด">เงินสด</option>
                  <option value="โอนเงิน">โอนเงิน</option>
                  <option value="เครดิต">เครดิต</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({ userId: '', userName: '', shopName: '', payMethod: 'เงินสด' });
                  }}
                  className="px-3 py-2 text-sm font-light text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 text-sm font-light text-white bg-black rounded hover:bg-gray-800 transition-colors"
                >
                  {editingUser ? 'อัพเดท' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}