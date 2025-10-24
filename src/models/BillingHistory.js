import mongoose from 'mongoose';

const BillingHistorySchema = new mongoose.Schema({
  billing_period: {
    type: String,
    required: true,
    index: true
  },
  created_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  created_by: {
    type: String,
    required: true,
    default: 'admin'
  },
  // สรุปยอด
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  total_customers: {
    type: Number,
    required: true,
    min: 0
  },
  total_invoices: {
    type: Number,
    required: true,
    min: 0
  },
  // รายละเอียดลูกค้า
  customers: [{
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    customer_name: {
      type: String,
      required: true
    },
    company_name: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    order_count: {
      type: Number,
      required: true,
      min: 0
    },
    date_range: {
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date,
        required: true
      }
    },
    invoice_number: {
      type: String,
      required: true
    }
  }],
  delivery_method: {
    type: String,
    enum: ['print', 'email', 'manual'],
    default: 'print'
  }
}, {
  timestamps: true
});

// Index for better query performance
BillingHistorySchema.index({ billing_period: 1, created_date: -1 });
BillingHistorySchema.index({ created_date: -1 });

export default mongoose.models.BillingHistory || mongoose.model('BillingHistory', BillingHistorySchema);