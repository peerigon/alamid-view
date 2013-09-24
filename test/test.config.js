"use strict";

module.exports = {
    entry: "mocha!" + __dirname + "/main.js",
    define: {
        /**
         * These variables need to be define in order to resolve conditional requires because of
         * internal code coverage tests of chai modules
         */
        "process.env.eql_COV": false,
        "process.env.type_COV": false
    }
};