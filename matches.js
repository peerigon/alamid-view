"use strict";

(function () {
    var methodNames = ["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"];
    var i;

    if (typeof Element.prototype.matches === "function") {
        return;
    }

    for (i = 0; i < methodNames.length; i++) {
        if (typeof Element.prototype[methodNames[i]] === "function") {
            Object.defineProperty(Element.prototype, "matches", {
                enumerable: false,
                writable: true,
                value: Element.prototype[methodNames[i]]
            });
            return;
        }
    }

    throw new Error("No polyfill for Element.prototype.matches available");
})();
