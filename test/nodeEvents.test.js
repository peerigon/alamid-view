"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    View = require("../lib/View.js"),
    nodeEvents = require("../plugins/nodeEvents.js"),
    emitter = require("events").EventEmitter.prototype,
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("plugins/nodeEvents", function () {
    var view;

    function MyView() {
        View.apply(this, arguments);
    }

    before(function () {
        MyView.prototype = Object.create(View.prototype);
        MyView.use = View.use;
        MyView.use(nodeEvents);
    });

    beforeEach(function () {
        view = new MyView();
    });

    it("should adjust the config", function () {
        expect(view.config.emit).to.equal(emitter.emit);
        expect(view.config.on).to.equal(emitter.on);
        expect(view.config.removeListener).to.equal(emitter.removeListener);
        expect(view.config.removeAllListeners).to.equal(emitter.removeAllListeners);
    });

    it("should provide node's EventEmitter api", function () {
        expect(view.on).to.be.a("function");
        expect(view.removeListener).to.be.a("function");
    });

    it("should not throw an exception working with the W3C's event api", function () {
        var listener = sinon.spy(),
            parent = new MyView();

        parent.append(view).at(parent.root());

        view.addEventListener("detach", listener);
        // calling the function several times will still register the listener only once according to the spec
        view.addEventListener("detach", listener);
        view.addEventListener("detach", listener);
        view.detach();

        expect(listener).to.have.been.calledOnce;

        parent.append(view).at(parent.root());

        view.removeEventListener("detach", listener);
        view.detach();

        expect(listener).to.have.been.calledOnce;
    });

    it("should throw an error if the target api clashes with the EventEmitter api", function () {
        function WontWork() {}

        WontWork.prototype = Object.create(View.prototype);
        WontWork.prototype.on = function () {};
        WontWork.use = View.use;

        expect(function () {
            WontWork.use(nodeEvents);
        }).to.throw(Error, "There is already a 'on'-property defined");
    });

});