'use strict';

module.exports = function(min, max) {
    // Range is inclusive of both min, max
    if (!max) {
        var max = min;
        min = 0;
    }

    var int = Math.round(Math.random() * max);

    return int < min ? max : int;
};