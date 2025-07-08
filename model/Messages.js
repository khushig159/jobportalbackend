const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, required: true, ref: 'JobSeeker' },
  receiverId: { type: Schema.Types.ObjectId, required: true, ref: 'JobSeeker' },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
