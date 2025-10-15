import mongoose from 'mongoose';

// ลบ model เก่าถ้ามี เพื่อป้องกันความขัดแย้ง
if (mongoose.models.Holiday) {
  delete mongoose.models.Holiday;
}

const HolidaySchema = new mongoose.Schema({
  day_of_week: {
    type: Number,
    required: true,
    unique: true,
    min: 0, // Sunday
    max: 6  // Saturday
  },
  day_name: {
    type: String,
    required: true,
    enum: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  },
  is_holiday: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Holiday', HolidaySchema);