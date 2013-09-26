"use strict";

var parseHTML = require("./parseHTML.js"),
    collectNodes = require("./collectNodes.js"),
    ViewEvent = require("./ViewEvent");

function View() {
    View.prototype.constructor.apply(this, arguments);
}

View.prototype.config = {
    emit: noop,
    on: throwMethodMissingError("on"),
    removeListener: throwMethodMissingError("removeListener"),
    removeAllListeners: noop,
    hasListener: noop,
    $: noop,
    $removeEventListener: noop,
    dev: false
};

View.prototype.template = "<div></div>";

View.prototype._children = null;

View.prototype._isInDocument = false;

View.prototype._appender = {
    context: null,
    target: null,
    at: function (node) {
        if (node.length === 1) {
            node = node[0];
        }

        this.context._addChild.call(this.context, this.target, node);
    }
};

View.prototype.constructor = function (root) {
    if (root instanceof Node) {
        this._root = root;
        this._isInDocument = inDocument(root);
    } else {
        this._root = parseHTML(this.template);
    }

    this._children = [];
};

View.prototype._addChild = function (child, node) {
    if (node instanceof Node === false) {
        throw new TypeError("(alamid-view) append().at() needs a dom node where the subView should be appended");
    }

    if (child._parent) {
        child.detach();
    }

    node.appendChild(child._root);
    child._parent = this;
    child._isInDocument = true;
    this._children.push(child);
};

View.prototype._removeChild = function (child) {
    var childRoot = child._root;

    child._parent = null;
    child._isInDocument = false;
    childRoot.parentNode.removeChild(childRoot);

    // If this._children is null this view is about to be disposed. In this case
    // we don't want and don't need to modify the children-array.
    if (this._children) {
        this._children.splice(this._children.indexOf(child), 1);
    }
};

View.prototype.root = function () {
    return this.config.$(this._root);
};

View.prototype.parent = function () {
    return this._parent || null;
};

View.prototype.children = function () {
    return this._children;
};

View.prototype.isInDocument = function () {
    return this._isInDocument;
};

View.prototype.find = function (query) {
    return this.config.$(this._root).find(query);
};

View.prototype.append = function (view) {
    this._appender.context = this;
    this._appender.target = view;

    return this._appender;
};

View.prototype.detach = function () {
    var parent;

    if (this._parent) {
        parent = this._parent;
        this._parent._removeChild(this);

        this.dispatchEvent(new DetachEvent(parent));
    }

    return this;
};
//https://dvcs.w3.org/hg/dom3events/raw-file/tip/html/DOM3-Events.html#interface-EventTarget
View.prototype.addEventListener = function (type, listener) {
    type = type.toLowerCase();
    if (!this.config.hasListener.call(this, type, listener)) {
        this.config.on.call(this, type, listener);
    }
};

View.prototype.removeEventListener = function (type, listener) {
    type = type.toLowerCase();
    this.config.removeListener.call(this, type, listener);
};

View.prototype.dispatchEvent = function (event) {
    var stop = !event.bubbles,
        target;

    if (!event.type || typeof event.type !== "string") {
        throw new Error("(alamid-view) Event type is missing. Expected a non-empty string, instead saw " + event.type);
    }

    event.stopPropagation = function () {
        stop = true;
    };
    event.type = event.type.toLowerCase();
    event.target = target = this;

    do {
        event.currentTarget = target;
        target.config.emit.call(target, event.type.toLowerCase(), event);
    } while ((target = target.parent()) && !stop);

    return event.defaultPrevented;
};

View.prototype.dispose = function () {
    var config = this.config,
        children = this._children,
        i,
        forgottenNodes;

    this.detach();

    this.dispatchEvent(new DisposeEvent());

    config.removeAllListeners.call(this);
    config.$removeEventListener.call(this, this._root);

    this._root = null;
    this._appender.context = null;
    this._appender.target = null;

    for (i = 0; i < children.length; i++) {
        children[i].dispose();
    }

    if (config.dev) {
        forgottenNodes = collectNodes(this);
        if (forgottenNodes.length > 0) {
            console.error("(alamid-view) Warning: You've forgotten to clear these node references on dispose():");
            console.error(forgottenNodes);
        }
    }
};

View.Event = ViewEvent;

View.configure = function (newConfig) {
    this.prototype.config = newConfig;

    return this;
};

/**
 * Calls the given function with the View as first argument and the given config (optionally). Plugins can be used
 * to hook into class methods by overriding them.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {View}
 */
View.use = function (plugin, config) {
    plugin(this, config);

    return this;
};

function DetachEvent(oldParent) {
    ViewEvent.call(this);
    this.oldParent = oldParent;
}
DetachEvent.prototype = Object.create(ViewEvent.prototype);
DetachEvent.prototype.type = "detach";
DetachEvent.prototype.oldParent = null;

function DisposeEvent() {
    ViewEvent.call(this);
}
DisposeEvent.prototype = Object.create(ViewEvent.prototype);
DisposeEvent.prototype.type = "dispose";

function noop(arg) { return arg; }

function throwMethodMissingError(method) {
    return function () {
        throw new Error("(alamid-view) You need to configure a '" + method + "'-method for the View");
    };
}

function inDocument(node) {
    return document.documentElement.contains(node);
}

module.exports = View;