"use strict";

var plugin = require("alamid-plugin");

var detectString = /^'.*'$/;
var detectDashCase = /-([A-Z])/gi;
var detectCamelCase = /(.)([A-Z])/g;
var emptyArr = [];

var customElements = plugin(function (View, elements) {
    var self = this;
    var elementsKeys = Object.keys(elements);
    var normalizedElementKeys = normalizeKeys(elementsKeys);

    this(View.prototype).after("_initRoot", function () {
        var view = this;
        var store = self(this).store();
        var View;

        store.childrenToAdd = [];

        elementsKeys
            .map(function (element, i) {
                View = elements[element];

                (view.find(normalizedElementKeys[i]) || emptyArr)
                    .forEach(function (node) {
                        var options = {};
                        var i;
                        var attribute;
                        var viewName;
                        var child;

                        for (i = 0; i < node.attributes.length; i++) {
                            attribute = node.attributes[i];
                            if (attribute.name === "name") {
                                viewName = attribute.value;
                            } else if (attribute.value) {
                                options[dashCaseToCamelCase(attribute.name)] = getValue(attribute.value, view);
                            }
                        }

                        child = new View(options);
                        if (viewName) {
                            view[viewName] = child;
                        }
                        store.childrenToAdd.push({
                            child: child,
                            view: view,
                            node: node
                        });
                        node = null; // prevent possible memory leaks
                    });
            });
    });

    this(View.prototype).after("constructor", function () {
        var store = self(this).store();

        store.childrenToAdd.forEach(function (config) {
            config.view._addChild(config.child, config.node);
            config.node = null; // deleting node because some browsers
                                // are unable to clear objects which hold a reference on a DOM object
        });
        store.childrenToAdd = null; // we don't need that array anymore
    });
});

function getValue(attrValue, instance) {
    if (detectString.test(attrValue)) {
        // it's a string
        return attrValue.slice(1, -1);
    } else if (attrValue === "true") {
        return true;
    } else if (attrValue === "false") {
        return false;
    } else if (attrValue === "null") {
        return null;
    } else if (isNaN(Number(attrValue)) === false) {
        // it's a number
        return Number(attrValue);
    } else {
        // it's a keypath, look up on scope
        // no complex keypaths supported yet
        return instance[attrValue];
    }
}

function dashCaseToCamelCase(str) {
    return str.replace(detectDashCase, $1ToUppercase);
}

function $1ToUppercase(match, $1) {
    return $1.toUpperCase();
}

function normalizeKeys(keys) {
    return keys.map(function (key) {
        if (detectDashCase.test(key) === false) {
            key = key.replace(detectCamelCase, putDashBetween$1And$2);
        }

        return key.toLowerCase();
    });
}

function putDashBetween$1And$2(match, $1, $2) {
    return $1 + "-" + $2;
}

module.exports = customElements;