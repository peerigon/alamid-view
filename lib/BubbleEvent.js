"use strict";

var ViewEvent = require("./ViewEvent.js");

function BubbleEvent() {
    BubbleEvent.prototype.constructor.apply(this, arguments);
}

BubbleEvent.prototype = Object.create(ViewEvent.prototype);

BubbleEvent.prototype.currentTarget = null;

BubbleEvent.prototype.constructor = function (target) {
    ViewEvent.call(this, target);
    this.currentTarget = target;
};

BubbleEvent.prototype.emit = function () {
    var currentTarget = this.target;

    ViewEvent.prototype.emit.call(this);

    while (currentTarget = currentTarget.parent()) {
        this.currentTarget = currentTarget;
        currentTarget.config.emit.call(currentTarget, this.name, this);
    }
};

module.exports = BubbleEvent;