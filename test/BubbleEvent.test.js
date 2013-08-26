"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    BubbleEvent = require("../lib/BubbleEvent.js"),
    View = require("../lib/View.js"),
    ViewEvent = require("../lib/ViewEvent.js"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("BubbleEvent", function () {

    describe(".prototype", function () {
        var event,
            target;

        function MyView() {
            View.apply(this, arguments);
            this.config = Object.create(this.config);
        }

        function createViewCascade() {
            var view1 = new MyView(),
                view2 = new MyView(),
                view3 = new MyView();

            view1.append(view2).at(view1.root());
            view2.append(view3).at(view2.root());

            return view3;
        }

        before(function () {
            MyView.prototype = Object.create(View.prototype);
        });

        describe(".constructor", function () {

            it("should be an override-able function", function () {
                var constructor = BubbleEvent.prototype.constructor;

                expect(constructor).to.be.a("function");

                BubbleEvent.prototype.constructor = sinon.spy();
                event = new BubbleEvent();
                expect(BubbleEvent.prototype.constructor).to.have.been.called;

                BubbleEvent.prototype.constructor = constructor;
            });

        });

        describe(".constructor(target)", function () {

            it("should return an instance of BubbleEvent", function () {
                expect(new BubbleEvent(new MyView())).to.be.an.instanceof(BubbleEvent);
            });

            it("should return an instance of ViewEvent", function () {
                expect(new BubbleEvent(new MyView())).to.be.an.instanceof(ViewEvent);
            });

            it("should call the ViewEvent's constructor", function () {
                var constructor = ViewEvent.prototype.constructor;

                ViewEvent.prototype.constructor = sinon.spy();

                target = new MyView();
                event = new BubbleEvent(target);
                expect(ViewEvent.prototype.constructor).to.have.been.calledWith(target);

                ViewEvent.prototype.constructor = constructor;
            });

        });

        describe(".emit()", function () {

            it("should call ViewEvent.prototype.emit()", function () {
                var emit = ViewEvent.prototype.emit;

                ViewEvent.prototype.emit = sinon.spy();
                target = new MyView();

                event = new BubbleEvent(target);
                event.emit();

                expect(ViewEvent.prototype.emit).to.have.been.calledWith();

                ViewEvent.prototype.emit = emit;
            });

            it("should climb up all parents one after another and emit the event", function () {
                target = createViewCascade();

                target.config.emit = sinon.spy();
                target.parent().config.emit = sinon.spy();
                target.parent().parent().config.emit = sinon.spy();

                event = new BubbleEvent(target);
                event.name = "someevent";
                event.emit();

                expect(target.parent().config.emit).to.have.been.calledWith(event.name, event);
                expect(target.parent().config.emit).to.have.been.calledOn(target.parent());
                expect(target.parent().parent().config.emit).to.have.been.calledWith(event.name, event);
                expect(target.parent().parent().config.emit).to.have.been.calledOn(target.parent().parent());
            });

            it("should update the currentTarget accordingly", function (done) {
                target = createViewCascade();

                target.config.emit = function (eventName, event) {
                    expect(event.currentTarget).to.equal(target);
                };

                target.parent().config.emit = function (eventName, event) {
                    expect(event.currentTarget).to.equal(target.parent());
                };

                target.parent().parent().config.emit = function (eventName, event) {
                    expect(event.currentTarget).to.equal(target.parent().parent());
                    done();
                };

                event = new BubbleEvent(target);
                event.name = "someevent";
                event.emit();
            });

        });

    });

});