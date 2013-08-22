"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    View = require("../lib/View.js"),
    collectNodes = require("../lib/collectNodes.js"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("View", function () {

    describe(".configure()", function () {
        var config;

        function emit() {}
        function once() {}
        function removeAllListeners() {}
        function $() {}
        function DisposeEvent() {}

        // preserve default config
        before(function () {
             config = View.prototype.config;
        });
        after(function () {
             View.prototype.config = config;
        });

        it("should set the given config", function () {
            View.configure({
                emit: emit,
                once: once,
                removeAllListeners: removeAllListeners,
                $: $,
                DisposeEvent: DisposeEvent,
                dev: true
            });

            expect(View.prototype.config.emit).to.equal(emit);
            expect(View.prototype.config.once).to.equal(once);
            expect(View.prototype.config.removeAllListeners).to.equal(removeAllListeners);
            expect(View.prototype.config.$).to.equal($);
            expect(View.prototype.config.DisposeEvent).to.equal(DisposeEvent);
            expect(View.prototype.config.dev).to.equal(true);
        });

    });

    describe(".use()", function () {

        it("should provide an plugin-interface", function () {
            var plugin = sinon.spy();

            View.use(plugin);
            expect(plugin).to.have.been.calledWith(View);
            expect(View.use(plugin)).to.equal(View);
        });

        it("should be chainable", function () {
            expect(View.use(function () {})).to.equal(View);
        });

    });

    describe(".prototype", function () {
        var view,
            event;

        describe(".config", function () {

            it("should be an object containing the current config", function () {
                expect(View.prototype.config).to.be.an("object");
            });

        });

        describe(".template", function () {

            it("should provide an empty div as default template", function () {
                expect(View.prototype.template).to.equal("<div></div>");
            });

        });

        describe(".constructor()", function () {

            it("should be an override-able function", function () {
                var constructor = View.prototype.constructor;

                expect(constructor).to.be.a("function");

                View.prototype.constructor = sinon.spy();
                view = new View();
                expect(View.prototype.constructor).to.have.been.called;

                View.prototype.constructor = constructor;
            });

            it("should return an instance of View", function () {
                expect(new View()).to.be.an.instanceof(View);
            });

            describe("when passing no arguments", function () {

                function MyView() {
                    View.call(this);
                }

                before(function () {
                    MyView.prototype = Object.create(View.prototype);
                    MyView.prototype.template = "<ul></ul>";
                });

                it("should turn the .template into a root node", function () {
                    view = new MyView();
                    expect(view._root).to.be.an.instanceof(HTMLUListElement);
                });

            });

            describe("when passing a dom node", function () {

                it("should take the dom node as root", function () {
                    var node = document.createElement("ul");

                    view = new View(node);
                    expect(view._root).to.be.an.instanceof(HTMLUListElement);
                });

            });

        });

        describe(".dispose()", function () {
            var removeAllListeners,
                emit,
                DisposeEvent;

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
            });

            it("should call removeAllListeners() on the view", function () {
                view.config.removeAllListeners = removeAllListeners = sinon.spy();
                view.dispose();
                expect(removeAllListeners).to.have.been.calledOnce;
            });

            it("should remove all node references", function () {
                view.dispose();
                expect(collectNodes(view)).to.be.empty;
            });

            it("should emit a 'dispose'-event", function () {
                view.config.emit = emit = sinon.spy();
                view.dispose();

                expect(emit).to.have.been.calledWith("dispose");
                event = emit.firstCall.args[1];
                expect(event).to.eql({
                    name: "dispose",
                    target: view
                });
            });

            describe("in dev-mode", function () {
                var error;

                beforeEach(function () {
                    view.config.dev = true;
                });

                it("should warn about forgotten node references", function () {
                    var nodes;

                    error = console.error;
                    console.error = sinon.spy();

                    view.obj = {
                        obj: {
                            evilDiv: document.createElement("div")
                        },
                        arr: [ document.createElement("div") ]
                    };
                    view.dispose();

                    expect(console.error).to.have.been.calledTwice;
                    nodes = console.error.secondCall.args[0];
                    expect(nodes).to.eql([view.obj.obj.evilDiv, view.obj.arr[0]]);
                    view.obj = null;
                });

            });

            describe("with a custom DisposeEvent", function () {

                it("should emit the custom DisposeEvent", function () {
                    var event = {
                        name: "DISPOSE"
                    };

                    function MyDisposeEvent(target) {
                        expect(target).to.equal(view);

                        return event;
                    }

                    view.config.emit = emit = sinon.spy();
                    view.config.DisposeEvent = MyDisposeEvent;
                    view.dispose();

                    expect(emit).to.have.been.calledWith("DISPOSE");
                    expect(emit.firstCall.args[1]).to.equal(event);
                });

            });

        });

    });

});