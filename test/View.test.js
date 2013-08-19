"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    View = require("../lib/View.js"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("View", function () {

    describe(".configure()", function () {

        function emit() {}
        function on() {}
        function removeListener() {}
        function removeAllListeners() {}

        it("should set the given config", function () {
            View.configure({
                emit: emit,
                on: on,
                removeListener: removeListener,
                removeAllListeners: removeAllListeners
            });

            expect(View.prototype.config.emit).to.equal(emit);
            expect(View.prototype.config.on).to.equal(on);
            expect(View.prototype.config.removeListener).to.equal(removeListener);
            expect(View.prototype.config.removeAllListeners).to.equal(removeAllListeners);
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
        var s,
            emit,
            event,
            obj;

        beforeEach(function () {
            s = new View();
            View.prototype.config.emit = emit = sinon.spy();
        });

        describe(".config", function () {

            it("should be an object containing the current config", function () {
                expect(View.prototype.config).to.be.an("object");
            });

        });

        describe(".constructor()", function () {

            it("should be an override-able function", function () {
                var constructor = View.prototype.constructor;

                expect(constructor).to.be.a("function");

                View.prototype.constructor = sinon.spy();
                s = new View();
                expect(View.prototype.constructor).to.have.been.called;

                View.prototype.constructor = constructor;
            });

            it("should return an instance of View", function () {
                expect(new View()).to.be.an.instanceof(View);
            });

            it("should be callable with an initial object", function () {
                s = new View(obj = {});
                expect(s.toObject()).to.equal(obj);
            });

        });

        describe(".toObject()", function () {

            it("should return the internal object", function () {
                obj = s.toObject();
                expect(obj).to.be.an.instanceof(Object);
                s.set("greeting", "hi");
                expect(obj.greeting).to.equal("hi");
            });

        });

        describe(".set()", function () {

            it("should store the value under the given key", function () {
                s.set("greeting", "hi");
                expect(s.toObject()).to.eql({
                    greeting: "hi"
                });
            });

            it("should cast the key to a string", function () {
                var key = {
                    toString: function () {
                        return "I'm an arbitrary object";
                    }
                };

                s.set(key, "some value");
                expect(s.toObject()["I'm an arbitrary object"]).to.equal("some value");
            });

            it("should be chainable", function () {
                expect(s.set("greeting", "hi")).to.equal(s);
            });

            it("should emit an 'add'-event", function () {
                s.set("greeting", "hi");

                expect(emit).to.have.been.calledOnce;

                expect(emit.firstCall).to.have.been.calledWith("add");
                event = emit.firstCall.args[1];
                expect(event).to.eql({
                    name: "add",
                    target: s,
                    key: "greeting",
                    element: "hi"
                });
                expect(event.target.toObject()[event.key]).to.equal(event.element);
            });
            
            describe("if there is already a value stored under the given key", function () {

                beforeEach(function () {
                    s.toObject().greeting = "ahoi";
                });
                
                it("should emit an 'remove'-event and then an 'add'-event", function () {
                    s.set("greeting", "hi");

                    expect(emit).to.have.been.calledTwice;

                    expect(emit.firstCall).to.have.been.calledWith("remove");
                    event = emit.firstCall.args[1];
                    expect(event).to.eql({
                        name: "remove",
                        target: s,
                        key: "greeting",
                        element: "ahoi"
                    });

                    expect(emit.secondCall).to.have.been.calledWith("add");
                    event = emit.secondCall.args[1];
                    expect(event).to.eql({
                        name: "add",
                        target: s,
                        key: "greeting",
                        element: "hi"
                    });
                    expect(event.target.toObject()[event.key]).to.equal(event.element);
                });
                
            });

            describe("if the same value is stored under the given key", function () {

                it("should not emit any events if '===' returns true", function () {
                    s.toObject().greeting = "hi";
                    s.set("greeting", "hi");
                    expect(emit).to.not.have.been.called;
                });

                it("should emit events if '==' returns true but '===' returns false", function () {
                    s.toObject().num = 0;
                    s.set("num", "0");
                    expect(emit).to.have.been.called;
                });

            });

        });

        describe(".setAll()", function () {

            it("should call .set() for each value in the given object", function () {
                s.set = sinon.spy();
                s.setAll({
                    greeting: "hi",
                    goodbye: "ciao"
                });
                expect(s.set).to.have.been.calledTwice;
                expect(s.set.firstCall).to.have.been.calledWith("greeting", "hi");
                expect(s.set.secondCall).to.have.been.calledWith("goodbye", "ciao");
            });

            it("should be chainable", function () {
                expect(s.setAll({})).to.equal(s);
            });

        });

        describe(".get()", function () {

            it("should return the value", function () {
                s.toObject().greeting = "hi";
                expect(s.get("greeting")).to.equal("hi");
            });

            describe("if there is no value stored under the given key", function () {

                it("should return undefined", function () {
                    expect(s.get("greeting")).to.equal(undefined);
                });

            });

        });

        describe(".getAll()", function () {

            beforeEach(function () {
                obj = s.toObject();
                obj.greeting = "hi";
                obj.goodbye = "ciao";
            });

            it("should call .get() for each value in the set", function () {
                s.get = sinon.spy();
                s.getAll();
                expect(s.get).to.have.been.calledTwice;
                expect(s.get.firstCall).to.have.been.calledWith("greeting");
                expect(s.get.secondCall).to.have.been.calledWith("goodbye");
            });

            it("should NOT return the internal object", function () {
                expect(s.getAll()).to.not.to.equal(s.toObject());
                expect(s.getAll()).to.eql(s.toObject());
            });

        });

        describe(".has()", function () {

            describe("if any value has been stored under the given key", function () {

                it("should return true", function () {
                    obj = s.toObject();
                    obj.greeting = "hi";
                    obj.someUndefined = undefined;
                    obj.someNull = null;
                    obj.someZero = 0;

                    expect(s.has("greeting")).to.equal(true);
                    expect(s.has("someUndefined")).to.equal(true);
                    expect(s.has("someNull")).to.equal(true);
                    expect(s.has("someZero")).to.equal(true);
                });

            });

            describe("if there is no value stored under the given key", function () {

                it("should return false", function () {
                    expect(s.has("value")).to.equal(false);
                });

                it("should return false even if the value is defined in the prototype chain", function () {
                    Object.prototype.bla = "bla";
                    expect(s.has("bla")).to.equal(false);
                    delete Object.prototype.bla;
                });

            });

        });

        describe(".remove()", function () {

            beforeEach(function () {
                s.toObject().greeting = "hi";
            });

            it("should remove the given key", function () {
                s.remove("greeting");
                expect(s.toObject()).to.not.have.ownProperty("greeting");
            });

            it("should emit a 'remove'-event", function () {
                s.remove("greeting");

                expect(emit).to.have.been.calledOnce;

                expect(emit.firstCall).to.have.been.calledWith("remove");
                event = emit.firstCall.args[1];
                expect(event).to.eql({
                    name: "remove",
                    target: s,
                    element: "hi",
                    key: "greeting"
                });
            });

            describe("if there is no value stored under the given key", function () {

                it("should not emit any events", function () {
                    s.remove("someOtherValue");
                    expect(emit).to.not.have.been.called;
                });

            });

        });

        describe(".dispose()", function () {

            it("should call removeAllListeners() on the set", function () {
                var removeAllListeners;

                s.config = Object.create(s.config);
                s.config.removeAllListeners = removeAllListeners = sinon.spy();

                s.dispose();

                expect(removeAllListeners).to.have.been.calledOnce;
            });

            it("should clear the _elements reference", function () {
                s.dispose();
                expect(s._elements).to.not.be.ok;
            });

        });

    });

});