import mongoose from 'mongoose';

const OrderDetailSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  vegetable_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Auto-calculate subtotal before saving
OrderDetailSchema.pre('save', function(next) {
  if (this.quantity && this.price) {
    this.subtotal = this.quantity * this.price;
  }
  next();
});

export default mongoose.models.OrderDetail || mongoose.model('OrderDetail', OrderDetailSchema);