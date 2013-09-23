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

    emit(this, new ChildEvent(this, child));
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

//TODO Check for ownerDocument if possible
//https://developer.mozilla.org/en-US/docs/Web/API/Node.ownerDocument
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

View.prototype.detach = function () {
    var parent;

    if (this._parent) {
        parent = this._parent;
        this._parent._removeChild(this);

        emit(this, new DetachEvent(this, parent));
    }

    return this;
};

View.prototype.dispose = function () {
    var config = this.config,
        children = this._children,
        i,
        forgottenNodes;

    this.detach();

    emit(this, new DisposeEvent(this));

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

function ChildEvent(target, child) {
    this.target = target;
    this.child = child;
}
ChildEvent.prototype.name = "child";
ChildEvent.prototype.target = null;
ChildEvent.prototype.child = null;

function DetachEvent(target, oldParent) {
    this.target = target;
    this.oldParent = oldParent;
}
DetachEvent.prototype.name = "detach";
DetachEvent.prototype.target = null;
DetachEvent.prototype.oldParent = null;

function DisposeEvent(target) {
    this.target = target;
}
DisposeEvent.prototype.name = "dispose";
DisposeEvent.prototype.target = null;

function noop(arg) { return arg; }

function emit(view, event, name) {
    name = name || event.name;
    view.config.emit.call(view, name, event);
}

module.exports = View;