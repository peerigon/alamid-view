"use strict";

var chai = require("chai");
var sinon = require("sinon");
var pluginInterface = require("alamid-plugin/use");
var View = require("../lib/View.js");
var ViewEvent = require("../lib/ViewEvent.js");
var collectNodes = require("../lib/collectNodes.js");
var expect = chai.expect;

chai.use(require("sinon-chai"));

describe("View", function () {

    it("should return an instance of View", function () {
        expect(new View()).to.be.an.instanceof(View);
    });

    describe(".Event", function () {

        it("should expose ViewEvent", function () {
            expect(View.Event).to.equal(ViewEvent);
        });

    });

    describe(".use()", function () {
        var plugin;
        var config;

        beforeEach(function () {
            plugin = sinon.spy();
            config = {};
        });

        it("should provide the plugin-interface", function () {
            expect(View.use).to.equal(pluginInterface);
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

        describe(".isDisposed", function () {

            it("should be false by default", function () {
                expect(View.prototype.isDisposed).to.equal(false);
            });

        });

        describe(".constructor", function () {

            it("should be an override-able function", function () {
                var constructor = View.prototype.constructor;

                expect(constructor).to.be.a("function");

                View.prototype.constructor = sinon.spy();
                view = new View();
                expect(View.prototype.constructor).to.have.been.called;

                View.prototype.constructor = constructor;
            });

        });

        describe(".constructor()", function () {

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

            it("should create independent instances", function () {
                var view2 = new MyView();
                expect(view._root).to.not.equal(view2._root);
            });

        });

        describe(".constructor(root)", function () {
            var node;

            beforeEach(function () {
                node = document.createElement("ul");
            });

            it("should take the dom node as root", function () {
                view = new View(node);
                expect(view._root).to.be.an.instanceof(HTMLUListElement);
            });

            it("should set the isInDocument-flag accordingly", function () {
                view = new View(node);
                expect(view.isInDocument()).to.equal(false);

                document.body.appendChild(node);

                view = new View(node);
                expect(view.isInDocument()).to.equal(true);

                document.body.removeChild(node);
            });

        });

        describe(".root()", function () {

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
            });

            it("should return the root node", function () {
                expect(view.root()).to.be.an.instanceof(HTMLDivElement);
            });

        });

        describe(".parent()", function () {

            beforeEach(function () {
                view = new View();
            });

            it("should return null in the initial state", function () {
                expect(view.parent()).to.equal(null);
            });

        });

        describe(".isInDocument()", function () {

            beforeEach(function () {
                view = new View();
            });

            it("should return false in the initial state", function () {
                expect(view.isInDocument()).to.equal(false);
            });

        });

        describe(".find(selector)", function () {
            var div;
            var ul;
            var li;

            before(function () {
                div = document.createElement("div");
                div.className = "node";
                div.innerHTML = '<ul class="node"><li class="node"></li></ul>';
                ul = div.firstChild;
                li = ul.firstChild;
            });

            beforeEach(function () {
                view = new View(div);
            });

            it("should query a selector on the root-node and return an array", function () {
                expect(view.find("li")).to.eql([li]);
            });

            it("should return null if no node matches the given selector", function () {
                expect(view.find("button")).to.equal(null);
            });

            it("should not include the root node", function () {
                expect(view.find(".node")).to.eql([ul, li]);
            });

        });

        describe(".append(subView)", function () {
            var child;

            beforeEach(function () {
                view = new View();
                child = new View();
            });

            it("should return view._appender with the right context and target", function () {
                var appender;

                appender = view.append(child);
                expect(appender).to.equal(view._appender);
                expect(appender.context).to.equal(view);
                expect(appender.target).to.equal(child);
            });

            describe(".at(node)", function () {
                var node;

                beforeEach(function () {
                    node = view._root;
                });

                it("should append the child below the node", function () {
                    view.append(child).at(node);
                    expect(node.firstChild).to.equal(child._root);
                });

                it("should set the parent view", function () {
                    view.append(child).at(node);
                    expect(child.parent()).to.equal(view);
                });

                it("should set the child's isInDocument-flag according to the parent view's", function () {
                    view.isInDocument = function () { return true; };

                    view.append(child).at(node);
                    expect(child.isInDocument()).to.equal(true);

                    child.detach();

                    view.isInDocument = function () { return false; };
                    view.append(child).at(node);
                    expect(child.isInDocument()).to.equal(false);
                });

                it("should add the child to the children array", function () {
                    view.append(child).at(node);
                    expect(view.children()).to.contain(child);
                });

                describe("when the child is currently part of another view", function () {

                    it("should call .detach() first", function () {
                        var oldView = new View();

                        oldView.append(child).at(oldView._root);
                        child.detach = sinon.spy();
                        view.append(child).at(view._root);

                        expect(child.detach).to.have.been.called;
                    });

                });

                describe("when the view is in the document", function () {

                    it("should broadcast the 'document'-event on the new child", function () {
                        child.broadcast = sinon.spy();
                        view.isInDocument = function () { return true; };

                        view.append(child).at(node);

                        event = child.broadcast.firstCall.args[0];
                        expect(event).to.be.an.instanceof(ViewEvent);
                        expect(event).to.have.property("type", "document");
                    });

                });

            });

            describe(".at($node) with $node being an array of one element", function () {
                var $node;
                var node;

                beforeEach(function () {
                    node = view._root;
                    $node = [node];
                });

                it("should 'unwrap' the enhanced $node via $node[0]", function () {
                    view.append(child).at($node);
                    expect(node.firstChild).to.equal(child._root);
                });

            });

        });

        describe(".detach()", function () {

            it("should be chainable", function () {
                expect(view.detach()).to.equal(view);
            });

            describe("when the view has no parent view", function () {

                it("should do nothing", function () {
                    view.detach();
                    view.detach();
                });

            });

            describe("when the view has a parent view", function () {
                var parent;
                var emit;

                beforeEach(function () {
                    parent = new View();
                    parent.append(view).at(parent._root);
                });
                
                it("should remove the root node from dom", function () {
                    expect(parent._root.children).to.have.length(1);
                    view.detach();
                    expect(parent._root.children).to.have.length(0);
                });

                it("should set the view's parent to null", function () {
                    view.detach();
                    expect(view.parent()).to.equal(null);
                });

                it("should set the child's isInDocument-flag to false", function () {
                    view.detach();
                    expect(view.isInDocument()).to.equal(false);
                });

                it("should remove the child from the children-array", function () {
                    view.detach();
                    expect(parent.children()).to.not.contain(view);
                });

                it("should emit a 'detach'-event", function () {
                    view.config.emit = emit = sinon.spy();
                    view.detach();

                    expect(emit).to.have.been.calledWith("detach");
                    event = emit.firstCall.args[1];
                    expect(event).to.be.an.instanceof(ViewEvent);
                    expect(event).to.have.property("type", "detach");
                    expect(event).to.have.property("target", view);
                    expect(event).to.have.property("currentTarget", view);
                    expect(event).to.have.property("oldParent", parent);
                });

                it("should emit the 'detach'-event after the view has been detached", function () {
                    view.config.emit = function () {
                        expect(view.parent()).to.equal(null);
                    };
                });

            });

        });

        describe(".addEventListener(type, listener)", function () {

            function listener() {}

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
                view.config.hasListener = sinon.stub().returns(false);
            });

            it("should call .config.on()", function () {
                view.config.on = sinon.spy();
                view.addEventListener("CLICK", listener);

                expect(view.config.on).to.have.been.calledWith("click", listener);
            });

            it("should not add the same listener multiple times", function () {
                view.config.on = sinon.spy();
                view.config.hasListener = sinon.stub().returns(true);
                view.addEventListener("CLICK", listener);

                expect(view.config.on).to.not.have.been.called;
                expect(view.config.hasListener).to.have.been.calledWith("click", listener);
            });

            describe("in contrast to the specification", function () {

                it("should ignore third argument useCapture", function () {
                    view.config.on = sinon.spy();
                    view.addEventListener("click", listener, false);
                    expect(view.config.on).to.have.been.calledWith("click", listener);
                });

            });

        });

        describe(".removeEventListener(type, listener)", function () {

            function listener() {}

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
            });

            it("should call .config.removeListener()", function () {
                view.config.removeListener = sinon.spy();
                view.removeEventListener("CLICK", listener);
                expect(view.config.removeListener).to.have.been.calledWith("click", listener);
            });

            describe("in contrast to the specification", function () {

                it("should ignore third argument useCapture", function () {
                    view.config.removeListener = sinon.spy();
                    view.removeEventListener("CLICK", listener, false);
                    expect(view.config.removeListener).to.have.been.calledWith("click", listener);
                });

            });

        });

        describe(".dispatchEvent(event)", function () {
            var event;

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
                event = { type: "CLICK", defaultPrevented: false };
            });

            it("should throw an error if the event type is missing", function () {
                expect(function () {
                    view.dispatchEvent({});
                }).to.throw(Error, "Event type is missing");
            });

            it("should lowercase the event's type", function () {
                view.dispatchEvent(event);

                expect(event.type).to.equal("click");
            });

            it("should return whether the default has been prevented or not", function () {
                expect(view.dispatchEvent(event)).to.equal(false);

                view.config.emit = function (eventType, event) {
                    event.defaultPrevented = true;
                };

                expect(view.dispatchEvent(event)).to.equal(true);
            });

            describe("when the event does not bubble", function () {

                beforeEach(function () {
                    event.bubbles = false;
                });

                it("just should call view.config.emit once", function () {
                    view.config.emit = sinon.spy();

                    view.dispatchEvent(event);

                    expect(view.config.emit).to.have.been.calledOnce;
                    expect(view.config.emit).to.have.been.calledWith("click", event);
                });

            });
            
            describe("when the event does bubble", function () {

                function createViewCascade() {
                    var view1 = new View(),
                        view2 = new View(),
                        view3 = new View();

                    view1.config = Object.create(view1.config);
                    view2.config = Object.create(view2.config);
                    view3.config = Object.create(view3.config);

                    view1.append(view2).at(view1.root());
                    view2.append(view3).at(view2.root());

                    return view3;
                }

                beforeEach(function () {
                    event.bubbles = true;
                    view = createViewCascade();
                });
               
                it("should climb up all parents one after another and emit the event", function () {
                    view.config.emit = sinon.spy();
                    view.parent().config.emit = sinon.spy();
                    view.parent().parent().config.emit = sinon.spy();
    
                    view.dispatchEvent(event);
    
                    expect(view.parent().config.emit).to.have.been.calledWith("click", event);
                    expect(view.parent().config.emit).to.have.been.calledOn(view.parent());
                    expect(view.parent().parent().config.emit).to.have.been.calledWith("click", event);
                    expect(view.parent().parent().config.emit).to.have.been.calledOn(view.parent().parent());
                });
    
                it("should update the currentTarget accordingly", function () {
                    view.config.emit = function (eventType, event) {
                        expect(event.currentTarget).to.equal(view);
                    };
    
                    view.parent().config.emit = function (eventType, event) {
                        expect(event.currentTarget).to.equal(view.parent());
                    };
    
                    view.parent().parent().config.emit = function (eventType, event) {
                        expect(event.currentTarget).to.equal(view.parent().parent());
                    };
    
                    view.dispatchEvent(event);
                });

                it("should stop the propagation if .stopPropagation() has been called", function () {
                    view.config.emit = sinon.spy();
                    view.parent().config.emit = function (eventType, event) {
                        event.stopPropagation();
                    };
                    view.parent().parent().config.emit = sinon.spy();

                    view.dispatchEvent(event);

                    expect(view.config.emit).to.have.been.called;
                    expect(view.parent().parent().config.emit).to.not.have.been.called;
                });
                
            });

        });

        describe(".broadcast(broadcast)", function () {
            var view;
            var children;
            var broadcast;

            function createViewCascade() {
                var view1 = new View();
                var view2 = new View();
                var view3 = new View();
                var view4 = new View();
                var view5 = new View();

                view1.config = Object.create(view1.config);
                view2.config = Object.create(view2.config);
                view3.config = Object.create(view3.config);
                view4.config = Object.create(view4.config);
                view5.config = Object.create(view5.config);

                view1.config.emit = sinon.spy();
                view2.config.emit = sinon.spy();
                view3.config.emit = sinon.spy();
                view4.config.emit = sinon.spy();
                view5.config.emit = sinon.spy();

                view1.append(view2).at(view1.root());
                view1.append(view3).at(view1.root());
                view2.append(view4).at(view2.root());
                view3.append(view5).at(view3.root());

                return view1;
            }

            beforeEach(function () {
                view = createViewCascade();
                children = view.children();
                broadcast = { type: "MESSAGE" };
            });

            it("should throw an error if the broadcast type is missing", function () {
                expect(function () {
                    view.broadcast({});
                }).to.throw(Error, "Broadcast type is missing");
            });

            it("should emit the given event on the view and every child and so on", function () {
                view.broadcast(broadcast);

                expect(view.config.emit).to.have.been.calledWith("message", broadcast);
                expect(children[0].config.emit).to.have.been.calledWith("message", broadcast);
                expect(children[0].children()[0].config.emit).to.have.been.calledWith("message", broadcast);
                expect(children[1].config.emit).to.have.been.calledWith("message", broadcast);
                expect(children[1].children()[0].config.emit).to.have.been.calledWith("message", broadcast);
            });

            it("should update the currentTarget accordingly", function () {
                children[0].config.emit = function (eventType, event) {
                    expect(event.currentTarget).to.equal(children[0]);
                };

                children[1].config.emit = function (eventType, event) {
                    expect(event.currentTarget).to.equal(children[1]);
                };

                children[0].children()[0].config.emit = function (eventType, event) {
                    expect(event.currentTarget).to.equal(children[0].children()[0]);
                };

                view.broadcast(broadcast);
            });

            it("should throw an error when event.bubbles is true", function () {
                expect(function () {
                    broadcast.bubbles = true;
                    view.broadcast(broadcast);
                }).to.throw(Error, "broadcast can't bubble");
            });

            describe("when .stopPropagation() is called on the brooadcast", function () {

                it("should throw an error", function (done) {
                    children[0].config.emit = function (eventType, event) {
                        expect(function () {
                            event.stopPropagation();
                        }).to.throw(Error, "You can't call .stopPropagation() on a broadcast");

                        done();
                    };

                    view.broadcast(broadcast);
                });

            });

        });

        describe(".async()", function () {
            var callback;
            var fn;

            beforeEach(function () {
                callback = sinon.spy();
                view = new View();
            });

            it("should accept a function and return a function", function () {
                expect(view.async(callback)).to.be.a("function");
            });

            it("should call the callback when the view is not disposed", function () {
                fn = view.async(callback);
                fn();
                expect(callback).to.have.been.calledOnce;
            });

            it("should neither alter the arguments nor the context", function () {
                var ctx = {};

                fn = view.async(callback);
                fn.call(ctx, 1, 2, 3);
                expect(callback).to.have.been.calledWith(1, 2, 3);
                expect(callback).to.have.been.calledOn(ctx);
            });

            it("should pass-through the callback's return value", function () {
                var result;

                fn = view.async(function () {
                    return "hi";
                });
                result = fn();
                expect(result).to.equal("hi");
            });

            it("should NOT call the callback when the view IS disposed", function () {
                fn = view.async(callback);
                view.isDisposed = true;
                fn();
                expect(callback).to.not.have.been.called;
            });

        });

        describe(".dispose()", function () {
            var removeAllListeners;
            var emit;

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
            });

            it("should set the isDisposed-flag on true", function () {
                view.dispose();
                expect(view.isDisposed).to.equal(true);
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

            it("should call view.detach()", function () {
                view.detach = sinon.spy();
                view.dispose();
                expect(view.detach).to.have.been.called;
            });

            it("should remove references on the appender that could point back to the view", function () {
                view._appender.context = view._appender.target = view;
                view.dispose();

                expect(view._appender.context).to.equal(null);
                expect(view._appender.target).to.equal(null);
            });

            it("should call .dispose() on all objects of .children()", function () {
                var disp1 = {},
                    disp2 = {};

                disp1.dispose = sinon.spy();
                disp2.dispose = sinon.spy();

                view.children().push(disp1, disp2);
                view.dispose();

                expect(disp1.dispose).to.have.been.called;
                expect(disp2.dispose).to.have.been.called;
            });

            it("should emit a 'dispose'-event", function () {
                view.config.emit = emit = sinon.spy();
                view.dispose();

                expect(emit).to.have.been.calledWith("dispose");

                event = emit.firstCall.args[1];
                expect(event).to.be.an.instanceof(ViewEvent);
                expect(event).to.have.property("type", "dispose");
                expect(event).to.have.property("target", view);
                expect(event).to.have.property("currentTarget", view);
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

        });

    });

});