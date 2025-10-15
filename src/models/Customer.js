import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  line_id: {
    type: String,
    sparse: true
  },
  line_name: String,
  name: {
    type: String,
    required: true
  },
  pay_method: {
    type: String,
    enum: ['cash', 'transfer', 'credit'],
    default: 'cash'
  },
  tax_id: String,
  company_name: String,
  address: String,
  is_print: Boolean,
  telephone: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);