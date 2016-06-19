'use strict';

var uuid = require('uuid');

var Enemy = function() {
    this.id = uuid.v4();
    this.title = 'kobold';
    this.items = {};

    setInterval(() => {
        //console.log(this.title + ' tries to wander');
    }, 2500);
};

module.exports = Enemy;