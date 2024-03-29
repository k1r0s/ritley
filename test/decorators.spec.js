const sinon = require("sinon");
const assert = require("assert");
const kaopTs = require("../decorators/node_modules/kaop-ts");

const {
  Provider,
  Dependency,
  Method,
  ReqTransformQuery,
  ReqTransformBodySync,
  ReqTransformBodyAsync,
  Default,
  Catch,
  Throws,
  ...HTTPVERBS
} = require("../decorators");

const wrapInvoke = (klass, method) => (context, ...args) => klass.prototype[method].call(context, ...args);

const decorateMethod = (target, method, decorator) => {
  const descriptor = Object.getOwnPropertyDescriptor(target.prototype, method);
  Object.defineProperty(target.prototype, method, decorator(target.prototype, method, descriptor));
}

describe("ritley's decorators suite", () => {
  describe("named export `Provider`", () => {
    it("Provider should be available as an alias of kaop.provider", () => {
      assert(typeof Provider.singleton === "function");
      assert(typeof Provider.factory === "function");
    })

    it("Provider should preserve original declaration under _original", () => {
      class Dummy {
        aMethod() {
          return 29;
        }
      }

      const decorated = Provider.factory(Dummy);

      assert(typeof decorated._original.prototype.aMethod === "function");
      assert(decorated._original.name === Dummy.name);
    })
  });

  describe("named export `Dependency`", () => {
    let providerStub;

    before(() => {
      sinon.stub(kaopTs.inject, "assign").returns(function() {});
      providerStub = sinon.stub().returns("some instance");
    });

    it("Dependency should be able to call kaop.inject.assign", () => {
      Dependency.assign(["foo", providerStub])(function() {});
      sinon.assert.calledWith(kaopTs.inject.assign, { foo: providerStub });
    });

    it("Dependency should be able to assign named properties on decorated class instantation", () => {
      kaopTs.inject.assign.restore();

      class Bar {}
      const decoratedBar = Dependency.assign(["foo", providerStub])(Bar);

      let barInstance = new decoratedBar;
      sinon.assert.called(providerStub);
      assert.deepEqual(barInstance.foo, "some instance");
    });
  });

  describe("named export `Method`", () => {

    it("Method.get should dispatch to the proper method having its path", () => {

      class DummyResource {
        constructor(uri) {
          this.$uri = uri;
        }

        method1() {}
      }

      decorateMethod(DummyResource, "method1", Method.get("/filter/:prop/:value"));

      const dummyResource = new DummyResource("/some");

      sinon.stub(dummyResource, "method1");

      const req = { url: "/some/filter/try/1"};
      const res = {};
      res.end = sinon.stub();
      res.writeHead = sinon.stub();

      dummyResource.get(req, res);

      sinon.assert.notCalled(res.end);
      sinon.assert.calledWith(dummyResource.method1, { params: { prop: "try", value: "1" }, ...req });
    });

    it("Method.get should handle same http verb within different methods", () => {
      class DummyResource {
        constructor(uri) {
          this.$uri = uri;
        }

        method2() {}
        method3() {}
      }

      decorateMethod(DummyResource, "method2", Method.get());
      decorateMethod(DummyResource, "method3", Method.get("/aaa"));

      const dummyResource = new DummyResource("/some");

      sinon.stub(dummyResource, "method2");
      sinon.stub(dummyResource, "method3");

      const req = {};
      req.url = "/some/aaa";
      const res = {};
      res.end = sinon.stub();
      res.writeHead = sinon.stub();

      dummyResource.get(req, res);
      sinon.assert.called(dummyResource.method3);

      // req.url = "/some/aaa";
      // dummyResource.get(req, res);
      // sinon.assert.calledWith(dummyResource.method3, req, res);
    });

    it("if url doesn\'t match specified pattern request should not be handled", () => {
      class DummyResource {
        constructor(uri) {
          this.$uri = uri;
        }

        method4() {}
      }

      decorateMethod(DummyResource, "method4", Method.get("/filter"));

      const dummyResource = new DummyResource("/some");

      sinon.stub(dummyResource, "method4");

      const req = {};
      req.url = "/another-url"
      const res = {};
      res.end = sinon.stub();
      res.writeHead = sinon.stub();

      dummyResource.get(req, res);

      sinon.assert.notCalled(dummyResource.method4);
    });
  });

  describe("named export `ReqTransformQuery`", () => {

    class DummyResource {
      get() {}
    }

    it("should be able to transform req and append query property with parsed url params", () => {
      decorateMethod(DummyResource, "get", ReqTransformQuery);

      const dummyResource = new DummyResource();

      const req = { url: "/stuff?prop1=1&prop2=2" };

      dummyResource.get(req);

      assert.deepEqual(req.query, { prop1: "1", prop2: "2" });
    });
  });

  describe("named export `ReqTransformBodySync`", () => {
    class DummyResource {
      post() {}
    }

    it("should be able to transform the method into an async task which will delay method execution till body is resolved", done => {
      decorateMethod(DummyResource, "post", ReqTransformBodySync);

      const dummyResource = new DummyResource();

      const phrase = "roses are red";

      const req = { on(ev, cbk) {
        if(ev === "data") phrase.split(" ").forEach(str => cbk(Buffer.from(str)));
        if(ev === "end") setTimeout(cbk, 5);
      } };

      dummyResource.post(req);

      setTimeout(() => {
        assert.deepEqual(req.body.buffer, Buffer.from(phrase.replace(/\s/g, "")));
        done();
      }, 10);
    });

  });

  describe("named export `ReqTransformBodyAsync`", () => {
    class DummyResource {
      post() {}
    }

    it("should be able to create req.body prop which will be a promise to resolve request\'s payload", done => {
      decorateMethod(DummyResource, "post", ReqTransformBodyAsync);

      const dummyResource = new DummyResource();

      const phrase = "roses are red";

      const req = { on(ev, cbk) {
        if(ev === "data") phrase.split(" ").forEach(str => cbk(Buffer.from(str)));
        if(ev === "end") setTimeout(cbk, 5);
      } };

      dummyResource.post(req);

      req.body.then((body) => {
        assert.deepEqual(body.buffer, Buffer.from(phrase.replace(/\s/g, "")));
        done();
      });
    });

  });

  describe("named export `Default`", () => {
    class DummyResource {
      post() {
        return Promise.resolve(result)
      }

      put() {
        return Promise.reject()
      }

      delete() {
        lajsjsldjldsalk();
      }
    }

    const result = { message: "test is right "};

    it("should be able to resolve http request when returned promise resolves properly", () => {
      decorateMethod(DummyResource, "post", Default(HTTPVERBS.Ok));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      return dummyResource.post(undefined, res).then(() => {
        sinon.assert.calledWith(res.writeHead, 200);
        sinon.assert.calledWith(res.write, JSON.stringify(result));
        sinon.assert.called(res.end);
      });
    });

    it("should be able to resolve `InternalServerError` when returned promise rejects", () => {
      decorateMethod(DummyResource, "put", Default(HTTPVERBS.Ok));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      return dummyResource.put(undefined, res).catch(() => {
        sinon.assert.calledWith(res.writeHead, 500);
        sinon.assert.called(res.end);
      });
    });

    it("should be able to catch syncronous exceptions if any", done => {
      decorateMethod(DummyResource, "delete", Default(HTTPVERBS.Ok));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      dummyResource.delete(undefined, res);

      setTimeout(() => {
        sinon.assert.calledWith(res.writeHead, 500);
        sinon.assert.called(res.end);
        done();
      }, 1)
    });

  });

  describe("named export `Catch`", () => {

    class DummyResource {
      post() {
        return Promise.reject()
      }

      put() {
        aaaaaaaaasdasdasda()
      }
    }

    const result = { message: "result is wrong, but test right"};

    it("should be able to resolve http request when returned promise rejects", () => {
      decorateMethod(DummyResource, "post", Catch(HTTPVERBS.BadRequest, result));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      return dummyResource.post(undefined, res).catch(() => {
        sinon.assert.calledWith(res.writeHead, 400);
        sinon.assert.calledWith(res.write, JSON.stringify(result));
        sinon.assert.called(res.end);
      });
    });

    it("should be able to catch syncronous exceptions if any", done => {
      decorateMethod(DummyResource, "put", Catch(HTTPVERBS.BadRequest, result));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      dummyResource.put(undefined, res);

      setTimeout(() => {
        sinon.assert.calledWith(res.writeHead, 400);
        sinon.assert.calledWith(res.write, JSON.stringify(result));
        sinon.assert.called(res.end);
        done();
      }, 1);
    });

  });

  describe("named export `Throws`", () => {

    class DummyResource {
      post() {
        return new Promise(() => {
          zz()
        })
      }

      put() {
        zz()
      }

      pat() {
        zz()
      }
    }

    it("should be able to capture specific errors in rejections", () => {
      decorateMethod(DummyResource, "post", Throws(ReferenceError, HTTPVERBS.BadRequest));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      return dummyResource.post(undefined, res).then(() => {
        sinon.assert.calledWith(res.writeHead, 400);
        sinon.assert.calledWith(res.write, JSON.stringify({ error: "ReferenceError", message: "zz is not defined"}));
        sinon.assert.called(res.end);
      });
    });

    it("should be able to capture specific errors (synchronous)", () => {
      decorateMethod(DummyResource, "put", Throws(ReferenceError, HTTPVERBS.BadRequest));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      dummyResource.put(undefined, res);

      sinon.assert.calledWith(res.writeHead, 400);
      sinon.assert.calledWith(res.write, JSON.stringify({ error: "ReferenceError", message: "zz is not defined"}));
      sinon.assert.called(res.end);
    });

    it("should throw the exception if no matching type is defined", () => {
      decorateMethod(DummyResource, "pat", Throws(TypeError, HTTPVERBS.BadRequest));

      const dummyResource = new DummyResource();

      const res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();

      assert.throws(() => dummyResource.pat(undefined, res), ReferenceError);
      sinon.assert.notCalled(res.writeHead);
      sinon.assert.notCalled(res.write);
      sinon.assert.notCalled(res.end);
    });
  });

  describe("named export `HTTP verbs`", () => {

    let res;


    beforeEach(() => {
      res = {};
      res.end = sinon.stub();
      res.write = sinon.stub();
      res.writeHead = sinon.stub();
    });

    it("verb Ok", () => {
      HTTPVERBS.Ok(res, "something");
      sinon.assert.calledWith(res.writeHead, 200);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb Created", () => {
      HTTPVERBS.Created(res, "something");
      sinon.assert.calledWith(res.writeHead, 201);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb NoContent", () => {
      HTTPVERBS.NoContent(res, "something");
      sinon.assert.calledWith(res.writeHead, 204);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb BadRequest", () => {
      HTTPVERBS.BadRequest(res, "something");
      sinon.assert.calledWith(res.writeHead, 400);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb Unauthorized", () => {
      HTTPVERBS.Unauthorized(res, "something");
      sinon.assert.calledWith(res.writeHead, 401);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb Forbidden", () => {
      HTTPVERBS.Forbidden(res, "something");
      sinon.assert.calledWith(res.writeHead, 403);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb MethodNotAllowed", () => {
      HTTPVERBS.MethodNotAllowed(res, "something");
      sinon.assert.calledWith(res.writeHead, 405);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb Conflict", () => {
      HTTPVERBS.Conflict(res, "something");
      sinon.assert.calledWith(res.writeHead, 409);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
    it("verb InternalServerError", () => {
      HTTPVERBS.InternalServerError(res, "something");
      sinon.assert.calledWith(res.writeHead, 500);
      sinon.assert.calledWith(res.write, '{"message":"something"}');
      sinon.assert.called(res.end);
    });
  });
});
