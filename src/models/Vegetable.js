import mongoose from 'mongoose';

const VegetableSchema = new mongoose.Schema({
  name_th: {
    type: String,
    required: true
  },
  name_eng: String,
  status: {
    type: String,
    enum: ['available', 'out_of_stock', 'discontinued'],
    default: 'available'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  photo: String
}, {
  timestamps: true
});

export default mongoose.models.Vegetable || mongoose.model('Vegetable', VegetableSchema);