'use strict';

var uuid = require('uuid');

var Enemy = function() {
    this.id = uuid.v4();
    this.title = 'kobold';
    this.description = 'A rust-brown scaly, reptilian humanoid stands before you, baring its crocodile-like teeth and swishing its tail back and forth aggressively.\n You gag on the stench of wet dogs and rancid water.'
    this.items = {};

    setInterval(() => {
        //console.log(this.title + ' tries to wander');
    }, 2500);
};

module.exports = Enemy;