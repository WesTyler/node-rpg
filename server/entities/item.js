'use strict';

var uuid = require('uuid');

var Item = function() {
    this.id = uuid.v4();
    this.title = 'thing';
    this.description = 'You can\'t really tell what it is. But it looks like a seamless white cube.'
};

module.exports = Item;