'use strict';

var io       = require('socket.io-client'),
    util     = require('util'),
    color    = require('ansi-color').set,
    readline = require('readline');

var serverUrl = 'http://localhost:8000/';

var connection  = io.connect(serverUrl),
    rlInterface = readline.createInterface(process.stdin, process.stdout),
    userName;

function display(msg) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    rlInterface.prompt(true);
}

connection.on('connect', function() {
    rlInterface.question('Please enter your name: ', function(name) {
        var msg = name + ' has joined the game.';

        userName = name;
        connection.emit('send', {
            type   : 'notice',
            message: msg
        });
        connection.emit('playerEnter', {userName});
        rlInterface.prompt(true);
    });
});

rlInterface.on('line', function(line) {
    var data = { type: 'chat', message: line, name: userName };

    connection.emit('send', data);
    rlInterface.prompt(true);
});

connection.on('enterRoom', function(roomData) {
    display(color(roomData.description, 'bold+blue'));
    if (Object.keys(roomData.players).length === 1) {
        display(color('You\'re the only one here.', 'blue'));
    }
});

connection.on('message', function (data) {
    var leader;
    if (data.type == 'chat' && data.name) {
        leader = color('<'+data.name+'> ', 'green');
        display(leader + data.message);
    }
    else if (data.type == 'notice') {
        display(color(data.message, 'cyan'));
    }
    else if (data.type == 'tell' && data.to == nick) {
        leader = color('['+data.from+'->'+data.to+']', 'red');
        display(leader + data.message);
    }
    else if (data.type == 'emote') {
        display(color(data.message, 'cyan'));
    }
});

connection.on('disconnect', function() {
    display(color('UH OH! You\'ve been disconnected...', 'red'));
    rlInterface.close();
    process.exit(0);
});