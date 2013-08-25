"use strict";

function collectNodes(obj, collection, known) {
    var key,
        i;

    collection = collection || [];
    known = known || [];

    if (obj instanceof Node) {
        collection.push(obj);
    } else {

        // check for circular references
        if (known.indexOf(obj) > -1) {
            return collection;
        }

        known.push(obj);
        if (obj instanceof Array) {
            for (i = 0; i < obj.length; i++) {
                collectNodes(obj[i], collection, known);
            }
        } else if (obj && typeof obj === "object") {
            /*jshint forin:false */ // we want 'em all
            for (key in obj) {
                collectNodes(obj[key], collection, known);
            }
        }
    }

    return collection;
}

module.exports = collectNodes;