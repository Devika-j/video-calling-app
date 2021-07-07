const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  time: {
    type: String,
  },
  room:{
    type: String,
  }
});

const Chat = mongoose.model('Chat', ChatMessageSchema);

module.exports = Chat;
