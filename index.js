const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const {addUser, removeUser, getUser, getUsersInRoom} = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');
const { timeStamp } = require('console');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  // Dealing with cors block error...
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ['my-custom-header'],
    credentials: true
  }
});

// Runs when we have a client connection on our io instance, 'connection' and 'disconnect' are built in events
// parameter 2 is a callback function that sends a socket that's connected as the clientside socket
io.on('connection', (socket) => {
  // Managing the specific socket that just connected
  // on join we have a callback function
  // With socket.on and socket.emit you can pass in a callback
  socket.on('join', ({name, room}, callback) => {
    // Add user either returns an error or a user that we can use
    const {error, user} = addUser({id: socket.id, name, room});
    // Get all the users in current room (Only one room so far... MainRoom)
    //const usersInRoom = getUsersInRoom(room.trim().toLowerCase());
    //console.log('Users in room: ' + usersInRoom)

    // If there's an error such as username is taken it will return from the function with the error callback
    if(error) {
      return callback({error: error});
    }
    console.log(user.name + ' joined the room ' + user.room);

    // Emitting an event from the backend to the front end, Welcoming the user to the chat
    // Front end listens to the 'message' event with socket.on()
    socket.emit('message', { timeStamp: `${new Date().getHours()}:${new Date().getMinutes()}`, user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
    // Sends a message to everyone besides that specific user that he has joined
    socket.broadcast.to(user.room).emit('message', { timeStamp: `${new Date().getHours()}:${new Date().getMinutes()}`, user: 'admin', text: `${user.name} has joined`});

    socket.join(user.room);
    // Emit the userlist to the frontend for displayal to all users including sender
    // io.to(user.room).emit('userList', usersInRoom);

    // Callback at the frontend gets called with no errors
    callback();
  });

  // Expect an event on the backend, waiting on sendMessage (emits from the front end)
  // Listen for a sendMessage event and then sends it to the room with io.to
  socket.on('sendMessage', (message, callback) => {
    // We have the user's socket id which represents the user
    const user = getUser(socket.id);
    // io.to we need to specify the room name, send the message to all connections including sender
    io.to(user.room).emit('message', {user: user.name, text: message.text, timeStamp: message.timeStamp});

    // Call callback so we can do something with the message on the frontend
    callback();
  });

  socket.on('disconnect', () => {
    const user = getUser(socket.id);
    // Get all the users in current room (Only one room so far... MainRoom)
    socket.broadcast.to(user.room).emit('message', { timeStamp: `${new Date().getHours()}:${new Date().getMinutes()}`, user: 'admin', text: `${user.name} has left the chat.`});
    removeUser(socket.id);
    // const usersInRoom = getUsersInRoom(user.room.trim().toLowerCase());
    // Emit the userlist to the frontend for displayal to all users besides sender when sender disconnects
    // socket.to(user.room).emit('userList', usersInRoom);
    console.log(user.name + ' has left');
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port: ${PORT}`));