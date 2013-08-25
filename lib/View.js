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
    $removeEventListener: noop,
    dev: false
};

View.prototype.template = "<div></div>";

View.prototype.disposables = null;

View.prototype._isInDocument = false;

View.prototype._appender = {
    context: null,
    target: null,
    at: function (node) {
        var self = this.context,
            view = this.target;

        if (node.length === 1) {
            node = node[0];
        }

        if (node instanceof Node === false) {
            throw new TypeError("(alamid-view) append().at() needs a dom node where the subView should be appended");
        }

        if (view._parent) {
            view.detach();
        }

        node.appendChild(view._root);
        view._parent = self;
        view._isInDocument = true;
        self.disposables.push(view);
    }
};

View.prototype.constructor = function (root) {
    if (root instanceof Node) {
        this._root = root;
    } else {
        this._root = parseHTML(this.template);
    }

    this.disposables = [];
};

View.prototype.getRoot = function () {
    return this.config.$(this._root);
};

View.prototype.getParent = function () {
    return this._parent || null;
};

View.prototype.isInDocument = function () {
    return this._isInDocument;
};

View.prototype.find = function (query) {
    return this.config.$(this._root).find(query);
};

View.prototype.append = function (displayable) {
    this._appender.context = this;
    this._appender.target = displayable;

    return this._appender;
};

View.prototype.detach = function (subView) {
    var subViewRoot;

    if (subView && subView._parent === this) {
        subView._parent = null;
        subView._isInDocument = false;
        subViewRoot = subView._root;
        subViewRoot.parentNode.removeChild(subViewRoot);
    } else {
        this._parent && this._parent.detach(this);
    }

    return this;
};

View.prototype.dispose = function () {
    var config = this.config,
        event = new DisposeEvent(this),
        disposables = this.disposables,
        i,
        forgottenNodes;

    config.emit.call(this, event.name, event);
    config.removeAllListeners.call(this);
    config.$removeEventListener.call(this, this._root);

    for (i = 0; i < disposables.length; i++) {
        disposables[i].dispose();
    }

    this._root = null;
    this._appender.context = null;
    this._appender.target = null;
    this.disposables = null;

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