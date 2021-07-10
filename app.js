const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();

const server = require("http").Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    credentials: true
  },
  allowEIO3: true
});


// Passport Config
require('./config/passport')(passport);

//DB config
const db = require('./config/keys').MongoURI;

//Connect to MongoDB
mongoose
  .connect(
    db, {
      useNewUrlParser: true
    }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

//ejs
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static('public'));

//bodyparser
app.use(express.urlencoded({
  extended: false
}));

//express session
var sessionMiddleware = session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
})

app.use(sessionMiddleware);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

//routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

//socket connection
const ExpressPeerServer = require('peer').ExpressPeerServer;

const Chat = require('./models/Chat');

var options = {
  debug: true
};

const peerServer = ExpressPeerServer(server, options);
app.use('/peerjs', peerServer);

const botName = 'Chat Bot';

io.on('connection', socket => {

  socket.on('joinRoom', ({
    username,
    room
  }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    Chat.find({
      room: room
    }).then(messages => {
      for (var i = 0; i < messages.length; i++) {
        socket.emit('message', messages[i]);
      }
    })


    // socket.emit('message',formatMessage(botName, 'welcome to your chat room!',user.room));
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined!`, user.room));

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg, user.room));
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat!`, user.room)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId);

    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message, userName)
    });

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnect', userId);
    })

    socket.on('liveCaptions', (text) => {
      console.log(text);
      socket.broadcast.to(roomId).emit('add-captions', userName, text);
    })
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, console.log(`Server running on ${PORT}`));
