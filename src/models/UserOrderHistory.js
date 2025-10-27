import mongoose from 'mongoose';

const UserOrderHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shops: [{
    shopName: {
      type: String,
      required: true
    },
    payMethod: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

export default mongoose.models.UserOrderHistory || mongoose.model('UserOrderHistory', UserOrderHistorySchema);