'use strict';

var io       = require('socket.io-client'),
    util     = require('util'),
    color    = require('ansi-color').set,
    readline = require('readline');

var serverUrl = 'http://localhost:8000/';

var connection  = io.connect(serverUrl),
    userInput = readline.createInterface(process.stdin, process.stdout),
    userName;

function move(direction) {
    connection.emit('action', {
        type: 'move',
        direction: direction
    })
}

var commands = {
    '/shout': function(message) {
        var data = { type: 'chat', message: message, name: userName };

        connection.emit('send', data);
        userInput.prompt(true);
    },
    '/say': function(message) {
        var data = { type: 'localChat', message: message, name: userName };

        connection.emit('send', data);
        userInput.prompt(true);
    }
};

var actions = {
    'N': move,
    'S': move,
    'E': move,
    'W': move
};

function display(msg) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    userInput.prompt(true);
}

userInput.on('line', function(line) {
    var trimmedLine = line.trim();
    var splitInput = trimmedLine.split(' ');

    if (trimmedLine[0] === '/') {
        commands[splitInput[0]](splitInput.slice(1).join(' '));
    } else if (actions[splitInput[0]]){
        actions[splitInput[0]](splitInput[0]);
    }
});

connection.on('connect', function() {
    userInput.question('Please enter your name: ', function(name) {
        var msg = name + ' has joined the game.';

        userName = name;
        connection.emit('send', {
            type   : 'notice',
            message: msg
        });
        connection.emit('playerEnter', {userName});
        userInput.prompt(true);
    });
});

connection.on('enterRoom', function(roomData) {
    display(color(roomData.description, 'bold+blue'));
    if (Object.keys(roomData.players).length === 1) {
        display(color('You\'re the only one here.', 'blue'));
    }
});

connection.on('roomAction', function(roomData) {
    if (roomData.userName === userName) {
        if (roomData.room) {
            var entryMessage;

            display(color(entryMessage, 'yellow'))
        } else {
            display(color(roomData.reason, 'yellow'));
        }
    } else {
        if (roomData.room) {
            var entryMessage;

            display(color(entryMessage, 'yellow'))
        } else {
            display(color(roomData.userName + ' can\'t leave! ' + roomData.reason, 'yellow'));
        }
    }
});

connection.on('message', function (data) {
    var leader;

    if (data.type == 'chat' && data.name) {
        leader = color(data.name+' shouts ', 'green');
        display(leader + data.message);
    } else if (data.type == 'localChat' && data.name) {
        leader = color('<' + data.name+'> ', 'green');
        display(leader + data.message);
    }  else if (data.type == 'notice') {
        display(color(data.message, 'cyan'));
    } else if (data.type == 'tell' && data.to == nick) {
        leader = color('['+data.from+'->'+data.to+']', 'red');
        display(leader + data.message);
    } else if (data.type == 'emote') {
        display(color(data.message, 'cyan'));
    }
});

connection.on('disconnect', function() {
    display(color('UH OH! You\'ve been disconnected...', 'red'));
    userInput.close();
    process.exit(0);
});
