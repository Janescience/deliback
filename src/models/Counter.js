import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Counter || mongoose.model('Counter', CounterSchema);