"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    ViewEvent = require("../lib/ViewEvent.js"),
    View = require("../lib/View.js"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("ViewEvent", function () {
    var event;

    describe(".prototype", function () {

        describe(".bubbles", function () {

            it("should be false by default", function () {
                expect(ViewEvent.prototype.bubbles).to.equal(false);
            });

        });

        describe(".cancelable", function () {

            it("should be false by default", function () {
                expect(ViewEvent.prototype.cancelable).to.equal(false);
            });

        });

        describe(".currentTarget", function () {

            it("should be null by default", function () {
                expect(ViewEvent.prototype.currentTarget).to.equal(null);
            });

        });

        describe(".defaultPrevented", function () {

            it("should be false by default", function () {
                expect(ViewEvent.prototype.defaultPrevented).to.equal(false);
            });

        });

        describe(".target", function () {

            it("should be null by default", function () {
                expect(ViewEvent.prototype.target).to.equal(null);
            });

        });

        describe(".target", function () {

            it("should be null by default", function () {
                expect(ViewEvent.prototype.target).to.equal(null);
            });

        });

        describe(".timeStamp", function () {

            it("should be 0 by default", function () {
                expect(ViewEvent.prototype.timeStamp).to.equal(0);
            });

        });

        describe(".type", function () {

            it("should be '' by default", function () {
                expect(ViewEvent.prototype.type).to.equal("");
            });

        });

        describe(".constructor", function () {

            it("should be an override-able function", function () {
                var constructor = ViewEvent.prototype.constructor;

                expect(constructor).to.be.a("function");

                ViewEvent.prototype.constructor = sinon.spy();
                event = new ViewEvent();
                expect(ViewEvent.prototype.constructor).to.have.been.called;

                ViewEvent.prototype.constructor = constructor;
            });

        });

        describe(".constructor()", function () {
            var event;

            function MyViewEvent() {
                ViewEvent.apply(this, arguments);
            }

            before(function () {
                MyViewEvent.prototype = Object.create(ViewEvent.prototype);
                MyViewEvent.prototype.type = "super special event";
                MyViewEvent.prototype.bubbles = true;
                MyViewEvent.prototype.cancelable = true;
            });

            it("should return an instance of ViewEvent", function () {
                expect(new ViewEvent()).to.be.an.instanceof(ViewEvent);
            });

            it("should set the timeStamp to Date.now()", function () {
                var now = Date.now(),
                    timeStamp = new ViewEvent().timeStamp,
                    then = Date.now();

                expect(timeStamp).to.be.at.least(now);
                expect(timeStamp).to.be.at.most(then);
            });

            describe("if no additional parameters are provided", function () {

                it("should not modify .cancelable, .bubbles, .type", function () {
                    event = new MyViewEvent();

                    expect(event.cancelable).to.equal(true);
                    expect(event.bubbles).to.equal(true);
                    expect(event.type).to.equal("super special event");
                });

            });

            describe("if additional parameters are provided", function () {

                it("should override the event's defaults", function () {
                    event = new ViewEvent("super special event", true, true);

                    expect(event.cancelable).to.equal(true);
                    expect(event.bubbles).to.equal(true);
                    expect(event.type).to.equal("super special event");
                });

            });

        });

    });

    describe(".preventDefault()", function () {

        beforeEach(function () {
            event = new ViewEvent();
        });

        describe("if .cancelable is true", function () {

            beforeEach(function () {
                event.cancelable = true;
            });

            it("should set .defaultPrevented to true", function () {
                event.preventDefault();
                expect(event.defaultPrevented).to.equal(true);
                event.preventDefault(); // calling it twice doesn't change a thing
                expect(event.defaultPrevented).to.equal(true);
            });

        });

        describe("if .cancelable is false", function () {

            it("should do nothing", function () {
                event.preventDefault();
                expect(event.defaultPrevented).to.equal(false);
                event.preventDefault(); // calling it twice doesn't change a thing
                expect(event.defaultPrevented).to.equal(false);
            });

        });

    });

    describe(".stopPropagation()", function () {

        beforeEach(function () {
            event = new ViewEvent();
        });

        it("should do nothing", function () {
            event.stopPropagation();
        });

    });
});