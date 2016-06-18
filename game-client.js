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
};

function look() {
    connection.emit('action', {
        type: 'look'
    });
};

function displayExits(exits) {
    var visibleExits = Object.keys(exits).filter(exitDirection => {
        return !!exits[exitDirection].connectedRoom;
    });

    display(color('You see exits to the: ' + visibleExits.join(','), 'blue'));
};

function displayPlayers(players) {
    var playerIds    = Object.keys(players),
        otherPlayerNames = [];

    playerIds.forEach(playerId => {
        if (players[playerId].userName !== userName) {
            otherPlayerNames.push(players[playerId].userName);
        }
    });

    if (playerIds.length === 1) {
        display(color('You\'re the only one here.', 'blue'));
    } else {
        display(color('You see ' + otherPlayerNames.join(',') + ' already here.'));
    }
};

function displayItems(items) {
    var itemIds          = Object.keys(items),
        itemDescriptions = [];

    itemIds.map(id => {
        itemDescriptions.push(items[id].title);
    });

    if (itemIds.length === 1) {
        display('A ' + itemDescriptions[0] + ' is on the ground.');
    } else if (itemIds.length === 2) {
        display('A ' + itemDescriptions[0] + ' and a ' + itemDescriptions[1] + ' are on the ground.');
    } else if (itemIds.length > 2) {
        display('A ' + itemDescriptions.slice(0, -1).join(', ') + ', and a' + itemDescriptions.slice(-1) + ' are on the ground.');
    }
};

function displayEnemies(enemies) {
    var enemyIds          = Object.keys(enemies),
        enemyDescriptions = [];

    enemyIds.forEach(id => {
        enemyDescriptions.push(enemies[id].title);
    });

    if (enemyIds.length === 1) {
        display('A ' + enemyDescriptions[0] + ' is lurking here.');
    } else if (enemyIds.length === 2) {
        display('A ' + enemyDescriptions[0] + ' and a ' + enemyDescriptions[1] + ' are staring at you.');
    } else if (enemyIds.length > 2) {
        display('A ' + enemyDescriptions.slice(0, -1).join(', ') + ', and a' + enemyDescriptions.slice(-1) + ' are congregated here.');
    }
};

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
    'N'   : move,
    'S'   : move,
    'E'   : move,
    'W'   : move,
    'look': look
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
        connection.emit('playerJoin', {userName});
        userInput.prompt(true);
    });
});

connection.on('enterRoom', function(roomData) {
    display(color(roomData.description, 'bold+blue'));

    displayExits(roomData.exits);
    displayPlayers(roomData.players);
    displayItems(roomData.items);
    displayEnemies(roomData.enemies);
});

connection.on('roomAction', function(roomData) {
    if (roomData.userName === userName) {
        if (roomData.failure) {
            display(color(roomData.reason, 'yellow'));
        }
    } else {
        if (roomData.userName) {
            var entryMessage = roomData.userName + ' has ' + roomData.action + ' the room.';
            display(color(entryMessage, 'yellow'))
        } else {
            display(color(roomData.userName + ' can\'t leave! ' + roomData.reason, 'yellow'));
        }
    }
});

connection.on('lookData', function(exits) {
    var visibleExits = Object.keys(exits).filter(exitDirection => {
        return !!exits[exitDirection].connectedRoom;
    });

    display(color('You see exits to the: ' + visibleExits.join(','), 'blue'));
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
