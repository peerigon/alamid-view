"use strict";

var plugin = require("alamid-plugin");

var detectString = /^'.*'$/;
var detectDashCase = /-(\w)/gi;

var customElements = plugin(function (View, elements) {
    var elementsKeys = Object.keys(elements);

    this(View.prototype).after("constructor", function () {
        var view = this;
        var View;

        elementsKeys
            .map(function (element) {
                View = elements[element];

                view.find(element)
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
                        view._addChild(child, node);
                        if (viewName) {
                            view[viewName] = child;
                        }
                    });
            });
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
module.exports = customElements;