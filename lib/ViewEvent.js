"use strict";

//TODO implement https://developer.mozilla.org/en-US/docs/Web/API/Event
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

ViewEvent.prototype.emit = function () {
    var view = this.target;

    view.config.emit.call(view, this.name, this);
};

module.exports = ViewEvent;