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
        function once() {}
        function removeAllListeners() {}
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
                once: once,
                removeAllListeners: removeAllListeners,
                $: $,
                $removeEventListener: $removeEventListener,
                dev: true
            });

            expect(View.prototype.config.emit).to.equal(emit);
            expect(View.prototype.config.once).to.equal(once);
            expect(View.prototype.config.removeAllListeners).to.equal(removeAllListeners);
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

        describe(".disposables", function () {

            it("should be an empty array", function () {
                expect(new View().disposables).to.eql([]);
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

            it("should take the dom node as root", function () {
                var node = document.createElement("ul");

                view = new View(node);
                expect(view._root).to.be.an.instanceof(HTMLUListElement);
            });

        });

        describe(".getRoot()", function () {

            beforeEach(function () {
                view = new View();
                view.config = Object.create(view.config);
            });

            it("should return the $-enhanced root node", function () {
                var root = {},
                    returned,
                    $;

                view.config.$ = $ = sinon.stub().returns(root);

                returned = view.getRoot();

                expect($).to.have.been.calledWith(view._root);
                expect(returned).to.equal(root);
            });

        });

        describe(".getParent()", function () {

            beforeEach(function () {
                view = new View();
            });

            describe("when the view has never been appended to a parent view", function () {

                it("should return null", function () {
                    expect(view.getParent()).to.equal(null);
                });

            });

            describe("when the view has been appended to a parent view", function () {
                var parent;

                beforeEach(function () {
                    parent = new View();
                    parent.append(view).at(parent._root);
                });

                it("should return the parent view", function () {
                    expect(view.getParent()).to.equal(parent);
                });

            });

            describe("when the view has been appended and detached again", function () {

                beforeEach(function () {
                    var parent = new View();

                    parent.append(view).at(parent._root);
                    view.detach();
                });

                it("should return null again", function () {
                    expect(view.getParent()).to.equal(null);
                });

            });

        });

        describe(".isInDocument()", function () {

            beforeEach(function () {
                view = new View();
            });

            describe("when the view has never been appended to a parent view", function () {

                it("should return false", function () {
                    expect(view.isInDocument()).to.equal(false);
                });

            });

            describe("when the view has been appended to a parent view", function () {
                var parent;

                beforeEach(function () {
                    parent = new View();
                    parent.append(view).at(parent._root);
                });

                it("should return true", function () {
                    expect(view.isInDocument()).to.equal(true);
                });

            });

            describe("when the view has been appended and detached again", function () {

                beforeEach(function () {
                    var parent = new View();

                    parent.append(view).at(parent._root);
                    view.detach();
                });

                it("should return false again", function () {
                    expect(view.isInDocument()).to.equal(false);
                });

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
            var subView;

            beforeEach(function () {
                view = new View();
                subView = new View();
            });

            it("should return view._appender with the right context and target", function () {
                var appender;

                appender = view.append(subView);
                expect(appender).to.equal(view._appender);
                expect(appender.context).to.equal(view);
                expect(appender.target).to.equal(subView);
            });

            describe(".at(node)", function () {
                var node;

                beforeEach(function () {
                    node = view._root;
                });

                it("should append the subView below the node", function () {
                    view.append(subView).at(node);
                    expect(node.firstChild).to.equal(subView._root);
                });

                it("should add the subView to .disposables", function () {
                    view.append(subView).at(node);
                    expect(view.disposables).to.contain(subView);
                });

                describe("when the subView is currently part of another view", function () {

                    it("should call .detach() first", function () {
                        var oldView = new View();

                        oldView.append(subView).at(oldView._root);
                        subView.detach = sinon.spy();
                        view.append(subView).at(view._root);

                        expect(subView.detach).to.have.been.called;
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
                    view.append(subView).at($node);
                    expect(node.firstChild).to.equal(subView._root);
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

            describe("when the view is part of another view", function () {
                var parent;

                beforeEach(function () {
                    parent = new View();
                    parent.append(view).at(parent._root);
                });

                it("should call .detach(this) on the parent", function () {
                    parent.detach = sinon.spy();
                    view.detach();
                    expect(parent.detach).to.have.been.calledWith(view);
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

            it("should call .dispose() on all objects of .disposables", function () {
                var disp1 = {},
                    disp2 = {};

                disp1.dispose = sinon.spy();
                disp2.dispose = sinon.spy();

                view.disposables.push(disp1, disp2);
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