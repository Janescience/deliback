import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  created_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  delivery_date: {
    type: Date,
    required: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  total: {
    type: Number
  },
  paid_status: {
    type: Boolean,
    default: false
  },
  user: {
    type: String,
    required: true
  },
  created_by: {
    type: String,
    default: 'ADMIN',
    required: true
  },
  docnumber: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate orders for same customer on same delivery date
// OrderSchema.index({ customer_id: 1, delivery_date: 1 }, { unique: true });

// // Auto generate docnumber and calculate total based on customer payment method
OrderSchema.pre('save', async function(next) {
  try {
    // Only run complex logic for new documents
    if (this.isNew) {
      // Check for duplicate order (same customer + delivery date)
      // Skip this check if we're updating an existing order (has _id)
      const existingOrder = await this.constructor.findOne({
        customer_id: this.customer_id,
        delivery_date: this.delivery_date,
        _id: { $ne: this._id } // Exclude current order from duplicate check
      });
      
      if (existingOrder) {
        const deliveryDateStr = new Date(this.delivery_date).toLocaleDateString('th-TH');
        return next(new Error(`ลูกค้านี้มีคำสั่งซื้อในวันที่ ${deliveryDateStr} อยู่แล้ว`));
      }
      // Get customer to check payment method
      const Customer = mongoose.model('Customer');
      const customer = await Customer.findById(this.customer_id);
      
      if (!customer) {
        console.error('Customer not found for ID:', this.customer_id);
        return next(new Error('Customer not found'));
      }
      
      const payMethod = customer.pay_method || 'cash';
      console.log('Customer payment method:', payMethod);
      const createDocnumber = customer.is_print; // Only create docnumber if not provided
      console.log('Customer is print:', createDocnumber);

      // Set paid_status based on payment method
      if (payMethod === 'cash') {
        this.paid_status = true; // เงินสดชำระทันที
      } else {
        this.paid_status = false; // เครดิต/โอนเงินต้องรอชำระ
      }

      if(createDocnumber){
        // Generate docnumber for non-cash payments based on delivery_date
        const deliveryDate = new Date(this.delivery_date);
        const day = String(deliveryDate.getDate()).padStart(2, '0');
        const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
        const year = String(deliveryDate.getFullYear()).slice(-2);
        
        let prefix = '';
        if (payMethod === 'credit') {
          prefix = 'DS';
        } else {
          prefix = 'RC'; 
        }
        
        // Count for same delivery date (running number per day)
        const dayStart = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
        const dayEnd = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate() + 1);
        
        const count = await this.constructor.countDocuments({
          delivery_date: { $gte: dayStart, $lt: dayEnd },
          docnumber: { $exists: true, $ne: null }
        });
        
        this.docnumber = `${prefix}${day}${month}${year}${String(count + 1).padStart(3, '0')}`;
        console.log('Generated docnumber:', this.docnumber);
      }
    }
    
    // Calculate total from OrderDetails if this is an update
    if (!this.isNew && this.isModified('total') === false) {
      const OrderDetail = mongoose.model('OrderDetail');
      const orderDetails = await OrderDetail.find({ order_id: this._id });
      this.total = orderDetails.reduce((sum, detail) => sum + detail.subtotal, 0);
      console.log('Calculated total from OrderDetails:', this.total);
    }
    
    next();
  } catch (error) {
    console.error('Order pre-save error:', error);
    next(error);
  }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);