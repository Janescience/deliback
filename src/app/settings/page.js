'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Settings, Save, RotateCcw, Building2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/company-settings');
      if (response.data.success) {
        setSettings(response.data.settings);
        setFormData(response.data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put('/api/company-settings', formData);
      if (response.data.success) {
        setSettings(response.data.settings);
        toast.success('บันทึกการตั้งค่าสำเร็จ');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    toast.success('รีเซ็ตการตั้งค่าเรียบร้อย');
  };

  if (loading) {
    return (
      <>
        {/* Mobile Fixed Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-gray-600 mr-2" />
            <h1 className="text-xl font-light text-black">การตั้งค่า</h1>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-light text-black">การตั้งค่า</h1>
          </div>

          <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-200">
        <div className="flex items-center">
          <Settings className="w-5 h-5 text-gray-600 mr-2" />
          <h1 className="text-xl font-light text-black">การตั้งค่า</h1>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-light text-black">การตั้งค่า</h1>
          <div className="flex space-x-3">
            <Button onClick={handleReset} variant="secondary" size="md">
              <RotateCcw size={16} className="mr-2" />
              รีเซ็ต
            </Button>
            <Button onClick={handleSave} size="md" disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden fixed bottom-4 right-4 flex space-x-2 z-40">
          <button
            onClick={handleReset}
            className="w-12 h-12 bg-gray-100 rounded-full border border-gray-300 hover:bg-gray-200 transition-colors flex items-center justify-center"
            title="รีเซ็ต"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-12 h-12 bg-black rounded-full text-white border border-black hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
            title="บันทึก"
          >
            <Save size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Building2 size={20} className="text-gray-600 mr-2" />
              <h2 className="text-lg font-medium text-black">ข้อมูลบริษัท</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อบริษัท
                </label>
                <Input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="ชื่อบริษัท"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขประจำตัวผู้เสียภาษี
                </label>
                <Input
                  type="text"
                  value={formData.taxId || ''}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="เลขประจำตัวผู้เสียภาษี"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่ บรรทัดที่ 1
                </label>
                <Input
                  type="text"
                  value={formData.address?.line1 || ''}
                  onChange={(e) => handleInputChange('address.line1', e.target.value)}
                  placeholder="ที่อยู่ บรรทัดที่ 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่ บรรทัดที่ 2
                </label>
                <Input
                  type="text"
                  value={formData.address?.line2 || ''}
                  onChange={(e) => handleInputChange('address.line2', e.target.value)}
                  placeholder="ที่อยู่ บรรทัดที่ 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <Input
                  type="text"
                  value={formData.telephone || ''}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="อีเมล"
                />
              </div>
            </div>
          </div>

          {/* Document Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-black mb-4">การตั้งค่าเอกสาร</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนวันเครดิต
                </label>
                <Input
                  type="number"
                  value={formData.documentSettings?.creditDays || 15}
                  onChange={(e) => handleInputChange('documentSettings.creditDays', parseInt(e.target.value))}
                  placeholder="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ตัดรอบบิล
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.documentSettings?.billingCycleDay || 15}
                  onChange={(e) => handleInputChange('documentSettings.billingCycleDay', parseInt(e.target.value))}
                  placeholder="15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ข้อความเงื่อนไขการชำระเงิน
                </label>
                <Input
                  type="text"
                  value={formData.documentSettings?.paymentTermsText || ''}
                  onChange={(e) => handleInputChange('documentSettings.paymentTermsText', e.target.value)}
                  placeholder="ตัดรอบวางบิลทุกวันที่ 15 ของเดือน"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ข้อความเงื่อนไขการชำระเงิน
                </label>
                <Input
                  type="text"
                  value={formData.documentSettings?.paymentConditionText || ''}
                  onChange={(e) => handleInputChange('documentSettings.paymentConditionText', e.target.value)}
                  placeholder="รบกวนชําระเงินภายใน 7 วันหลังจากวางบิล"
                />
              </div>
            </div>
          </div>

          {/* Document Titles */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-black mb-4">ชื่อเอกสาร</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ใบส่งสินค้า (ไทย)
                  </label>
                  <Input
                    type="text"
                    value={formData.templateSettings?.deliveryNoteTitle?.thai || ''}
                    onChange={(e) => handleInputChange('templateSettings.deliveryNoteTitle.thai', e.target.value)}
                    placeholder="ใบส่งสินค้า"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ใบส่งสินค้า (อังกฤษ)
                  </label>
                  <Input
                    type="text"
                    value={formData.templateSettings?.deliveryNoteTitle?.english || ''}
                    onChange={(e) => handleInputChange('templateSettings.deliveryNoteTitle.english', e.target.value)}
                    placeholder="Delivery Sheet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ใบเสร็จ (ไทย)
                  </label>
                  <Input
                    type="text"
                    value={formData.templateSettings?.receiptTitle?.thai || ''}
                    onChange={(e) => handleInputChange('templateSettings.receiptTitle.thai', e.target.value)}
                    placeholder="ใบเสร็จ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ใบเสร็จ (อังกฤษ)
                  </label>
                  <Input
                    type="text"
                    value={formData.templateSettings?.receiptTitle?.english || ''}
                    onChange={(e) => handleInputChange('templateSettings.receiptTitle.english', e.target.value)}
                    placeholder="Receipt"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ใบวางบิล (ไทย)
                  </label>
                  <Input
                    type="text"
                    value={formData.templateSettings?.billingTitle?.thai || ''}
                    onChange={(e) => handleInputChange('templateSettings.billingTitle.thai', e.target.value)}
                    placeholder="ใบวางบิล"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ใบวางบิล (อังกฤษ)
                  </label>
                  <Input
                    type="text"
                    value={formData.templateSettings?.billingTitle?.english || ''}
                    onChange={(e) => handleInputChange('templateSettings.billingTitle.english', e.target.value)}
                    placeholder="Invoice"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-black mb-4">การตั้งค่าโลโก้</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL โลโก้
                </label>
                <Input
                  type="url"
                  value={formData.logo?.url || ''}
                  onChange={(e) => handleInputChange('logo.url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ปล่อยว่างเพื่อใช้ placeholder
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ความกว้าง (px)
                  </label>
                  <Input
                    type="number"
                    value={formData.logo?.width || 64}
                    onChange={(e) => handleInputChange('logo.width', parseInt(e.target.value))}
                    placeholder="64"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ความสูง (px)
                  </label>
                  <Input
                    type="number"
                    value={formData.logo?.height || 64}
                    onChange={(e) => handleInputChange('logo.height', parseInt(e.target.value))}
                    placeholder="64"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing for mobile FAB */}
        <div className="lg:hidden h-20"></div>
      </div>
    </>
  );
}