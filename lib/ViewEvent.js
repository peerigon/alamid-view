"use strict";

//https://dvcs.w3.org/hg/dom3events/raw-file/tip/html/DOM3-Events.html
function ViewEvent() {
    ViewEvent.prototype.constructor.apply(this, arguments);
}

ViewEvent.prototype.bubbles = false;

ViewEvent.prototype.cancelable = false;

ViewEvent.prototype.currentTarget = null;

ViewEvent.prototype.defaultPrevented = false;

ViewEvent.prototype.target = null;

ViewEvent.prototype.timeStamp = 0;

ViewEvent.prototype.type = "";

ViewEvent.prototype.constructor = function (type, bubbles, cancelable) {
    if (typeof type === "string") {
        this.type = type;
    }
    if (typeof bubbles === "boolean") {
        this.bubbles = bubbles;
    }
    if (typeof cancelable === "boolean") {
        this.cancelable = cancelable;
    }
    this.timeStamp = Date.now();
};

ViewEvent.prototype.preventDefault = function () {
    if (this.cancelable) {
        this.defaultPrevented = true;
    }
};

ViewEvent.prototype.stopPropagation = function () {};

module.exports = ViewEvent;