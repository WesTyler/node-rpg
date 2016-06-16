'use strict';

var io = require('socket.io')(8000),
    roomGenerator = require('./roomGenerator');

var numberOfRooms = Math.round(Math.random() * 50);
var rooms = roomGenerator(numberOfRooms);
console.log('Will have', numberOfRooms + 1, 'rooms this game.');

console.log(JSON.stringify(rooms, null, 4))

io.on('connection', function (socket) {
    socket.on('send', function (data) {
        io.emit('message', data);
    });
});