"use strict";

var incubator = document.createElement("div"),
    known = {};

function createNodes(html) {
    var root = known[html],
        node,
        children,
        i;

    if (!root) {
        incubator.innerHTML = html;
        children = incubator.children;
        for (i = 0; i < children.length; i++) {
            node = children[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (root) {
                    throw new Error("(alamid-view) Error: Template " + prettyPrint(html) + " has more than one root node.");
                }
                root = node;
            }
        }
        if (!root) {
            throw new Error("(alamid) Error: Could not find a root node in template " + prettyPrint(html) + ".");
        }
        incubator.removeChild(root);
        known[html] = root;
    }

    return root.cloneNode(true);
}

function prettyPrint(html) {
    return "'" +
        html
        .replace(/\s+/g, " ")
        .substr(0, 20) +
        "...'";
}

module.exports = createNodes;