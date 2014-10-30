"use strict";

var chai = require("chai");
var sinon = require("sinon");
var View = require("../lib/View.js");
var expect = chai.expect;
var customElements = require("../plugins/customElements.js");

chai.use(require("sinon-chai"));

describe("plugins/customElements", function () {
    var ParentView;
    var CustomElement;
    var AnotherElement;
    var customElementSpy;
    var anotherElementSpy;
    var parentView;

    function createParentView(template, casing) {
        var elements;

        ParentView = function () {
            ParentView.prototype.constructor.apply(this, arguments);
        };

        CustomElement = function () {
            customElementSpy.apply(this, arguments);
            View.apply(this, arguments);
        };

        AnotherElement = function () {
            anotherElementSpy.apply(this, arguments);
            View.apply(this, arguments);
        };

        if (casing === "camel") {
            elements = {
                "CustomElement": CustomElement,
                "AnotherElement": AnotherElement
            };
        } else {
            elements = {
                "custom-element": CustomElement,
                "another-element": AnotherElement
            };
        }


        customElementSpy = sinon.spy();
        anotherElementSpy = sinon.spy();

        CustomElement.prototype = Object.create(View.prototype);
        AnotherElement.prototype = Object.create(View.prototype);

        ParentView.prototype = Object.create(View.prototype);
        ParentView.prototype.constructor = function () {
            View.apply(this, arguments);
        };
        sinon.spy(ParentView.prototype, "_initRoot");
        ParentView.prototype.template = template;

        ParentView.use = View.use;
        ParentView.use(customElements, elements);

        parentView = new ParentView();
    }

    it("should instantiate every imported view", function () {
        createParentView(
            '<div>' +
                '<custom-element></custom-element>' +
                '<custom-element></custom-element>' +
                '<another-element></another-element>' +
            '</div>'
        );

        expect(customElementSpy).to.have.been.calledTwice;
        expect(anotherElementSpy).to.have.been.calledOnce;
    });

    it("should add every imported view as child", function () {
        var children;

        createParentView(
            '<div>' +
                '<custom-element></custom-element>' +
                '<custom-element></custom-element>' +
                '<another-element></another-element>' +
            '</div>'
        );
        children = parentView.children();

        expect(children[0]).to.be.an.instanceof(CustomElement);
        expect(children[1]).to.be.an.instanceof(CustomElement);
        expect(children[2]).to.be.an.instanceof(AnotherElement);
    });

    it("should add the child view to the parent view under the given name", function () {
        createParentView(
            '<div>' +
                '<custom-element name="myElement"></custom-element>' +
                '<custom-element></custom-element>' +
                '<another-element></another-element>' +
            '</div>'
        );

        expect(parentView.myElement).to.be.an.instanceof(CustomElement);
    });

    it("should instantiate the child view with the given parameters", function () {
        createParentView(
            '<div>' +
                '<custom-element null-param="null" bool-param="true" number-param="2" string-param="\'hi\'"></custom-element>' +
                '<another-element some-property="obj"></another-element>' +
            '</div>'
        );

        expect(customElementSpy.firstCall.args[0]).to.eql({
            nullParam: null,
            boolParam: true,
            numberParam: 2,
            stringParam: "hi"
        });
        expect(anotherElementSpy.firstCall.args[0]).to.eql({
            someProperty: parentView.obj
        });
    });
    
    it("should turn camelcase into dashcase", function () {
        createParentView(
            '<div>' +
                '<custom-element></custom-element>' +
                '<another-element></another-element>' +
            '</div>',
            "camel"
        );

        expect(customElementSpy).to.have.been.calledOnce;
        expect(anotherElementSpy).to.have.been.calledOnce;
    });

    it("should be ok to no use all imported elements", function () {
        createParentView(
            '<div></div>'
        );

        expect(customElementSpy).to.not.have.been.called;
        expect(anotherElementSpy).to.not.have.been.called;
    });

    it("should instantiate the views on initRoot", function () {
        throw Error("Error")
    });

});