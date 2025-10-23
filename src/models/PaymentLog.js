import mongoose from 'mongoose';

const PaymentLogSchema = new mongoose.Schema({
  // Action details
  action: {
    type: String,
    enum: ['mark_paid', 'mark_unpaid'],
    required: true
  },
  action_type: {
    type: String,
    enum: ['all', 'cycle', 'selected'],
    required: true
  },

  // Order details
  order_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  }],
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },

  // Previous state (for undo)
  previous_state: [{
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    paid_status: Boolean,
    paid_date: Date
  }],

  // New state
  new_state: [{
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    paid_status: Boolean,
    paid_date: Date
  }],

  // Metadata
  total_amount: {
    type: Number,
    required: true
  },
  billing_cycle: String, // For credit customers
  user: {
    type: String,
    default: 'admin'
  },
  user_agent: String,
  ip_address: String,

  // Undo tracking
  is_undone: {
    type: Boolean,
    default: false
  },
  undone_at: Date,
  undone_by: String,
  undo_reason: String,

  // Related logs
  original_log_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentLog'
  }
}, {
  timestamps: true
});

// Indexes for performance
PaymentLogSchema.index({ customer_id: 1, createdAt: -1 });
PaymentLogSchema.index({ order_ids: 1 });
PaymentLogSchema.index({ action: 1, createdAt: -1 });
PaymentLogSchema.index({ is_undone: 1 });

export default mongoose.models.PaymentLog || mongoose.model('PaymentLog', PaymentLogSchema);