const Chat = require('../models/Chat');
const moment = require('moment');

function formatMessage(username, text, room) {
  const time=moment().format('h:mm a');
  console.log(Chat);
  const msg = new Chat({
    username,
    text,
    time,
    room
  });
  msg.save();
  console.log(msg);
  return {
    username,
    text,
    time
  };

}

module.exports = formatMessage;
