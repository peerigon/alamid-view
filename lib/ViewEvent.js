"use strict";

function ViewEvent() {
    ViewEvent.prototype.constructor.apply(this, arguments);
}

ViewEvent.prototype._defaultPrevented = false;

ViewEvent.prototype.target = null;

ViewEvent.prototype.name = null;

ViewEvent.prototype.constructor = function (target) {
    this.target = target;
};

ViewEvent.prototype.preventDefault = function () {
    this._defaultPrevented = true;
};

ViewEvent.prototype.isDefaultPrevented = function () {
    return this._defaultPrevented;
};

module.exports = ViewEvent;