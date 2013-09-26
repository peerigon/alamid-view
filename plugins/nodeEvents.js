"use strict";

var EventEmitter = require("events").EventEmitter,
    proto = EventEmitter.prototype;

function nodeEvents(View) {
    var config = View.prototype.config,
        constructor = View.prototype.constructor,
        key;

    function hasListener(eventType) {
        return this.listeners(eventType).length > 0;
    }

    config.emit = proto.emit;
    config.on = proto.on;
    config.removeListener = proto.removeListener;
    config.removeAllListeners = proto.removeAllListeners;
    config.hasListener = hasListener;

    for (key in proto) { /* jshint forin: false */
        if (View.prototype.hasOwnProperty(key)) {
            throw new Error("Cannot apply nodeEvents-plugin: There is already a '" + key + "'-property defined.");
        }
        View.prototype[key] = proto[key];
    }

    View.prototype.constructor = function () {
        EventEmitter.call(this);
        constructor.apply(this, arguments);
    };
}

module.exports = nodeEvents;