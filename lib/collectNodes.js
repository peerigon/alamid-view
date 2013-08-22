"use strict";

function collectNodes(obj, collection) {
    var key,
        i;

    collection = collection || [];

    if (obj instanceof Node) {
        collection.push(obj);
    } else if (obj instanceof Array) {
        for (i = 0; i < obj.length; i++) {
            collectNodes(obj[i], collection);
        }
    } else if (obj && typeof obj === "object") {
        /*jshint forin:false */ // we want 'em all
        for (key in obj) {
            collectNodes(obj[key], collection);
        }
    }

    return collection;
}

module.exports = collectNodes;