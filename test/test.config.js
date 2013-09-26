"use strict";

module.exports = {
    entry: "mocha!" + __dirname + "/main.js",
    devtool: "eval",
    define: {
        /**
         * These variables need to be defined in order to resolve conditional requires because of
         * internal code coverage tests of chai modules
         */
        "process.env.eql_COV": false,
        "process.env.type_COV": false
    }
};