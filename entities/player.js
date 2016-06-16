'use strict';

var uuid = require('uuid');

var Player = function(name) {
    this.id = uuid.v4();
    this.name = name;
    this.hp = 1;
    this.mp = 1;
};

module.exports = Player;