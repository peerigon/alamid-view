"use strict";

function View() {
    View.prototype.constructor.apply(this, arguments);
}

View.prototype.config = {

};

View.configure = function (newConfig) {
    this.prototype.config = newConfig;

    return this;
};

/**
 * Calls the given function with the List as argument. Plugins can be used to hook into class methods by
 * overriding them.
 *
 * @param {Function} plugin
 * @returns {View}
 */
View.use = function (plugin) {
    plugin(this);

    return this;
};