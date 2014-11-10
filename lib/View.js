"use strict";

var parseHTML = require("./parseHTML.js");
var collectNodes = require("./collectNodes.js");
var ViewEvent = require("./ViewEvent");

var nextViewId = 0;

function View() {
    View.prototype.constructor.apply(this, arguments);
}

View.prototype.config = {
    emit: noop,
    on: throwMethodMissingError("on"),
    removeListener: noop,
    removeAllListeners: noop,
    hasListener: noop,
    dev: false
};

View.prototype.template = "<div></div>";

View.prototype._id = nextViewId++;

View.prototype._isDisposed = false;

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
    this._id = nextViewId++;

    if (root instanceof Node) {
        this._root = root;
        this._isInDocument = inDocument(root);
    } else {
        root = parseHTML(this.template);
    }
    this._initRoot(root);

    this._children = [];
};

View.prototype._initRoot = function (root) {
    // This method can be used as hook to work on the dom nodes as soon as they have been created
    this._root = root;
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
    child._isInDocument = this.isInDocument();
    this._children.push(child);

    if (child._isInDocument) {
        child.broadcast(new DocumentEvent());
    }
};

View.prototype._removeChild = function (child) {
    var childRoot = child._root;

    child._parent = null;
    child._isInDocument = false;
    childRoot.parentNode.removeChild(childRoot);

    this._children.splice(this._children.indexOf(child), 1);
};

View.prototype.id = function () {
    return this._id;
};

View.prototype.root = function () {
    return this._root;
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

View.prototype.isDisposed = function () {
    return this._isDisposed;
};

View.prototype.find = function (selector) {
    var nodeList = this._root.querySelectorAll(selector);
    var result = [];
    var i;

    for (i = 0; i < nodeList.length; i++) {
        result[i] = nodeList.item(i);
    }

    return result;
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
    var stop = !event.bubbles;
    var target;

    if (!event.type || typeof event.type !== "string") {
        throw new Error("(alamid-view) Event type is missing. Expected a non-empty string, instead saw " + event.type);
    }

    event.stopPropagation = function () {
        stop = true;
    };
    event.type = event.type.toLowerCase();
    event.target = target = this;

    do {
        emitEvent(target, event);
    } while ((target = target.parent()) && !stop);

    return event.defaultPrevented;
};

View.prototype.broadcast = function (broadcast) {
    if (!broadcast.type || typeof broadcast.type !== "string") {
        throw new Error("(alamid-view) Broadcast type is missing. Expected a non-empty string, instead saw " + broadcast.type);
    }

    if (broadcast.bubbles) {
        throw new Error("(alamid-view) broadcast.bubbles is true, but a broadcast can't bubble");
    }

    // throws an error if a listener tries to stop the broadcast
    // a broadcast is not stoppable
    broadcast.stopPropagation = throwEventUnstoppableError;
    broadcast.type = broadcast.type.toLowerCase();
    broadcast.target = this;

    emitEvent(this, broadcast);
    recursiveBroadcast(this, broadcast);
};

View.prototype.async = function (fn) {
    var self = this;

    return function checkIsDisposed() {
        if (self.isDisposed()) {
            return;
        }
        return fn.apply(this, arguments);
    };
};

View.prototype.dispose = function () {
    var config = this.config;
    var children = this._children.slice();  // copy children array because child.dispose() will modify it
    var i;
    var forgottenNodes;

    this.detach();

    this.dispatchEvent(new DisposeEvent());
    config.removeAllListeners.call(this);

    for (i = 0; i < children.length; i++) {
        children[i].dispose();
    }

    this._appender.target = null;
    this._root = null;
    this._appender.context = null;
    this._children = null;

    if (config.dev) {
        forgottenNodes = collectNodes(this);
        if (forgottenNodes.length > 0) {
            console.error("(alamid-view) Warning: You've forgotten to clear these node references on dispose():");
            console.error(forgottenNodes);
        }
    }

    this._isDisposed = true;
};

View.Event = ViewEvent;

View.EVENTS = {
    DOCUMENT: "document",
    DETACH: "detach",
    DISPOSE: "dispose"
};

function DocumentEvent() {
    ViewEvent.call(this);
}
DocumentEvent.prototype = Object.create(ViewEvent.prototype);
DocumentEvent.prototype.type = View.EVENTS.DOCUMENT;
View.DocumentEvent = DocumentEvent;

function DetachEvent(oldParent) {
    ViewEvent.call(this);
    this.oldParent = oldParent;
}
DetachEvent.prototype = Object.create(ViewEvent.prototype);
DetachEvent.prototype.type = View.EVENTS.DETACH;
DetachEvent.prototype.oldParent = null;
View.DetachEvent = DetachEvent;

function DisposeEvent() {
    ViewEvent.call(this);
}
DisposeEvent.prototype = Object.create(ViewEvent.prototype);
DisposeEvent.prototype.type = View.EVENTS.DISPOSE;
View.DisposeEvent = DisposeEvent;

View.use = require("alamid-plugin/use");

function noop(arg) { return arg; }

function throwMethodMissingError(method) {
    return function () {
        throw new Error("(alamid-view) You need to configure a '" + method + "'-method for the View");
    };
}

function throwEventUnstoppableError() {
    throw new Error("(alamid-view) You can't call .stopPropagation() on a broadcast.");
}

function recursiveBroadcast(self, broadcast) {
    var children = self.children(),
        i;

    for (i = 0; i < children.length; i++) {
        emitEvent(children[i], broadcast);
    }

    for (i = 0; i < children.length; i++) {
        recursiveBroadcast(children[i], broadcast);
    }
}

function emitEvent(target, event) {
    event.currentTarget = target;
    target.config.emit.call(target, event.type.toLowerCase(), event);
}

function inDocument(node) {
    return document.documentElement.contains(node);
}

module.exports = View;