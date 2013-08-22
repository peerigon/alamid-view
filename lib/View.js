"use strict";

var parseHTML = require("./parseHTML.js"),
    collectNodes = require("./collectNodes.js");

function View() {
    View.prototype.constructor.apply(this, arguments);
}

View.prototype.config = {
    emit: noop,
    once: noop,
    removeAllListeners: noop,
    $: noop,
    DisposeEvent: DisposeEvent,
    dev: false
};

View.prototype.template = "<div></div>";

View.prototype.constructor = function (root) {
    if (root instanceof Node) {
        this._root = root;
    } else {
        this._root = parseHTML(this.template);
    }
};

View.prototype.getRoot = function () {
    return this.config.$(this._root);
};

View.prototype.dispose = function () {
    var config = this.config,
        event = new config.DisposeEvent(this),
        i,
        forgottenNodes;

    config.emit.call(this, event.name, event);

    this._root = null;

    config.removeAllListeners.call(this);

    if (config.dev) {
        forgottenNodes = collectNodes(this);
        if (forgottenNodes.length > 0) {
            console.error("(alamid-view) Warning: You've forgotten to clear these node references on dispose():");
            console.error(forgottenNodes);
        }
    }
};

View.configure = function (newConfig) {
    this.prototype.config = newConfig;

    return this;
};

/**
 * Calls the given function with the View as argument. Plugins can be used to hook into class methods by
 * overriding them.
 *
 * @param {Function} plugin
 * @returns {View}
 */
View.use = function (plugin) {
    plugin(this);

    return this;
};

function DisposeEvent(target) {
    this.target = target;
}
DisposeEvent.prototype.name = "dispose";
DisposeEvent.prototype.target = null;

function noop(arg) { return arg; }

module.exports = View;