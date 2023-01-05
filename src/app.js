const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages.js');
const { getUser, addUser, getUsersInRoom, removeUser } = require('./utils/users.js');

const app = express();
const server = http.createServer(app); //express already does this
const io = socketio(server)

const port = process.env.PORT || 3000;

const directoryPath = path.join(__dirname, '../public');

app.use(express.static(directoryPath));

//let count  = 0;
//socket.emit - msg for himself
//io.emit - send msg to all people
//socket.broadcast.emit - send msg to all people except himself
//io.to.emit - send msg to all people in a room
//socket.broadcast.to.emit - send msg to all people in a room except himself

io.on('connection', (socket) => {
    console.log('New Websocket connection');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if(error)
        {
            return callback(error);
        }

        socket.join(room);

        socket.emit('message', generateMessage("Admin", "Welcome !")); //sending to client side
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => { //receiving from client side
        const filter = new Filter();
        const user = getUser(socket.id);

        if(filter.isProfane(msg))
        {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, msg));

        callback();
    });

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));

        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        
        if(user)
        {
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left the chat`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }

    })
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
})