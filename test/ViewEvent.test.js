"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    ViewEvent = require("../lib/ViewEvent.js"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("ViewEvent", function () {
    var event;

    describe(".prototype", function () {

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

        describe(".constructor(target)", function () {

            it("should return an instance of ViewEvent", function () {
                expect(new ViewEvent()).to.be.an.instanceof(ViewEvent);
            });

            it("should set the given target as .target", function () {
                var target = {};

                expect(new ViewEvent(target).target).to.equal(target);
            });

        });

    });

    describe(".isDefaultPrevented()", function () {

        beforeEach(function () {
            event = new ViewEvent();
        });

        it("should return false by default", function () {
            expect(event.isDefaultPrevented()).to.equal(false);
        });

    });

    describe(".preventDefault()", function () {

        beforeEach(function () {
            event = new ViewEvent();
        });

        it("should set isDefaultPrevented() to true", function () {
            event.preventDefault();
            expect(event.isDefaultPrevented()).to.equal(true);
            event.preventDefault(); // calling it twice doesn't change a thing
            expect(event.isDefaultPrevented()).to.equal(true);
        });

    });
});