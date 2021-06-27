const express = require("express");
const app = express();

// const cors = require('cors')
// app.use(cors())

// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({
//     extended: true
// }));

const server = require("http").Server(app);
const io = require("socket.io")(server);
const {
  v4: uuidv4
} = require("uuid");

const ExpressPeerServer = require('peer').ExpressPeerServer;

var options = {
  debug: true
};

const peerServer = ExpressPeerServer(server, options);
app.use('/peerjs', peerServer);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get("/", (req, res) => {
  let url = uuidv4();
  res.redirect(`/${url}`);
});

// app.get("/", (req,res)=>{
//   res.sendFile(__dirname +'/home.html');
// });

app.get("/:room", (req, res) => {
  res.render('room', {
    roomId: req.params.room
  });
});

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId);

    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message, userName)
    });

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnect', userId);
    })
  });
});

server.listen(3000, () => {
  console.log("Server is running");
});
