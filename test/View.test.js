"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    View = require("../lib/View.js"),
    collectNodes = require("../lib/collectNodes.js"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("View", function () {

    it("should return an instance of View", function () {
        expect(new View()).to.be.an.instanceof(View);
    });

    describe(".configure()", function () {
        var config;

        function emit() {}
        function on() {}
        function removeListener() {}
        function removeAllListeners() {}
        function hasListener() {}
        function $() {}
        function $removeEventListener() {}

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
                on: on,
                removeListener: removeListener,
                removeAllListeners: removeAllListeners,
                hasListener: hasListener,
                $: $,
                $removeEventListener: $removeEventListener,
                dev: true
            });

            expect(View.prototype.config.emit).to.equal(emit);
            expect(View.prototype.config.on).to.equal(on);
            expect(View.prototype.config.removeListener).to.equal(removeListener);
            expect(View.prototype.config.removeAllListeners).to.equal(removeAllListeners);
            expect(View.prototype.config.hasListener).to.equal(hasListener);
            expect(View.prototype.config.$).to.equal($);
            expect(View.prototype.config.$removeEventListener).to.equal($removeEventListener);
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

            it("should return the $-enhanced root node", function () {
                var root = {},
                    returned,
                    $;

                view.config.$ = $ = sinon.stub().returns(root);

                returned = view.root();

                expect($).to.have.been.calledWith(view._root);
                expect(returned).to.equal(root);
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

        describe(".find(query)", function () {

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
            });

            it("should return the result of $(root).find(query)", function () {
                var nodes = [],
                    query = "li",
                    find,
                    returned,
                    $;

                find = sinon.stub().returns(nodes);
                view.config.$ = $ = sinon.stub().returns({
                    find: find
                });

                returned = view.find(query);

                expect($).to.have.been.calledWith(view._root);
                expect(find).to.have.been.calledWith(query);
                expect(returned).to.equal(nodes);
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
                var node,
                    emit;

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
                    view._isInDocument = true; // fake isInDocument
                    view.append(child).at(node);
                    expect(child.isInDocument()).to.equal(true);
                });

                it("should add the child to the children array", function () {
                    view.append(child).at(node);
                    expect(view.children()).to.contain(child);
                });

                it("should emit a 'child'-event", function () {
                    view.config.emit = emit = sinon.spy();
                    view.append(child).at(node);

                    expect(emit).to.have.been.calledWith("child");
                    event = emit.firstCall.args[1];
                    expect(event).to.eql({
                        name: "child",
                        target: view,
                        child: child
                    });
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

            });

            describe(".at($node) with $node being an array of one element", function () {
                var $node,
                    node;

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
                var parent,
                    emit;

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
                    expect(event).to.eql({
                        name: "detach",
                        target: view,
                        oldParent: parent
                    });
                });

                it("should emit the 'detach'-event after the view has been detached", function () {
                    view.config.emit = function () {
                        expect(view.parent()).to.equal(null);
                    };
                });

            });

        });

        describe(".addEventListener()", function () {

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

        describe(".removeEventListener()", function () {

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

        describe(".dispatchEvent()", function () {
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
    
                it("should update the currentTarget accordingly", function (done) {
                    view.config.emit = function (eventType, event) {
                        expect(event.currentTarget).to.equal(view);
                    };
    
                    view.parent().config.emit = function (eventType, event) {
                        expect(event.currentTarget).to.equal(view.parent());
                    };
    
                    view.parent().parent().config.emit = function (eventType, event) {
                        expect(event.currentTarget).to.equal(view.parent().parent());
                        done();
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

        describe(".dispose()", function () {
            var removeAllListeners,
                emit;

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

            it("should call view.config.$removeEventListener(view._root)", function () {
                var root = view._root,
                    $removeEventListener;

                view.config.$removeEventListener = $removeEventListener = sinon.spy();
                view.dispose();

                expect($removeEventListener).to.have.been.calledWith(root);
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

        });

    });

});