const sinon = require("sinon");
const assert = require("assert");
const { BaseAdapter, AbstractResource } = require("../core");

const wrapInvoke = (klass, method) => (context, ...args) => klass.prototype[method].call(context, ...args);

describe("ritley's core suite", () => {

  const reqStub = { url: "/", on(ev, cbk) { ev === "end" && cbk() } };

  const adapter = new BaseAdapter();

  class DummyResource extends AbstractResource {
    get() {}
    post() {}
    put() {}
    delete() {}
  }

  const instance = new DummyResource();

  describe("Method HTTP verb interception", () => {

    beforeEach(() => {
      sinon.stub(instance, "get")
      sinon.stub(instance, "post")
      sinon.stub(instance, "put")
      sinon.stub(instance, "delete")
    });

    afterEach(() => {
      instance.get.restore();
      instance.post.restore();
      instance.put.restore();
      instance.delete.restore();
    });

    it("[GET] AbstractResource subclasses should be able to intercept calls", () => {

      const reqStubGet = { ...reqStub, method: "GET" };

      adapter.handle(reqStubGet);
      sinon.assert.calledWith(instance.get, reqStubGet);
      sinon.assert.notCalled(instance.put);
      sinon.assert.notCalled(instance.delete);
      sinon.assert.notCalled(instance.post);

    });

    it("[POST] AbstractResource subclasses should be able to intercept calls", () => {

      const reqStubPost = { ...reqStub, method: "POST" };

      adapter.handle(reqStubPost);
      sinon.assert.calledWith(instance.post, reqStubPost);
      sinon.assert.notCalled(instance.put);
      sinon.assert.notCalled(instance.delete);
      sinon.assert.notCalled(instance.get);

    });

    it("[PUT] AbstractResource subclasses should be able to intercept calls", () => {

      const reqStubPut = { ...reqStub, method: "PUT" };

      adapter.handle(reqStubPut);
      sinon.assert.calledWith(instance.put, reqStubPut);
      sinon.assert.notCalled(instance.post);
      sinon.assert.notCalled(instance.delete);
      sinon.assert.notCalled(instance.get);

    });

    it("[DELETE] AbstractResource subclasses should be able to intercept calls", () => {

      const reqStubDelete = { ...reqStub, method: "DELETE" };

      adapter.handle(reqStubDelete);
      sinon.assert.calledWith(instance.delete, reqStubDelete);
      sinon.assert.notCalled(instance.post);
      sinon.assert.notCalled(instance.put);
      sinon.assert.notCalled(instance.get);

    });
  });

  describe("BaseAdapter method suite", () => {

    const listeners = [
      { $uri: "dummy0", onRequest: sinon.stub() },
      { $uri: "dummy1", onRequest: sinon.stub() },
      { $uri: "dummy2", onRequest: sinon.stub() }
    ];

    const timeout = sinon.stub();
    const config = {};
    const context = { listeners, timeout, config };

    it("[METHOD] ::handle should be able to invoke interceptors on matching request", done => {
      const handleStub = wrapInvoke(BaseAdapter, "handle");

      const reqStubDummy = { ...reqStub, url: "/dummy0" };

      const requestAllowed = sinon.stub().returns(false);
      requestAllowed.withArgs("/dummy0", "dummy0").returns(true);

      const contextForDummy0 = { ...context, requestAllowed };

      handleStub(contextForDummy0, reqStubDummy);

      sinon.assert.calledWith(listeners[0].onRequest, reqStubDummy);
      sinon.assert.notCalled(listeners[1].onRequest);
      sinon.assert.notCalled(listeners[2].onRequest);
      sinon.assert.notCalled(context.timeout);

      const reqStubDummy2 = { ...reqStubDummy, url: "/dummy3" };

      handleStub(contextForDummy0, reqStubDummy2);

      setTimeout(() =>
        sinon.assert.called(context.timeout), 1);

      setTimeout(done, 2);
    });

    it("[METHOD] ::requestAllowed should be able to validate matching paths", () => {

      const requestAllowedStub = wrapInvoke(BaseAdapter, "requestAllowed");

      assert.deepEqual(requestAllowedStub(context, "/"), true);
      assert.deepEqual(requestAllowedStub(context, "/car", "car"), true);
      assert.deepEqual(requestAllowedStub(context, "/cor", "car"), false);

      const context2 = { ...context, config: { base: "something" } };

      assert.deepEqual(requestAllowedStub(context2, "/something/car", "car"), true);
      assert.deepEqual(requestAllowedStub(context2, "/something/cor", "car"), false);
      assert.deepEqual(requestAllowedStub(context2, "/car", "car"), false);
    });

    it("[METHOD] ::register should be able to push items into the adapter:listeners prop", () => {

      const registerStub = wrapInvoke(BaseAdapter, "register");

      const context2 = { ...context, listeners: [] };

      registerStub(context2, 1);
      registerStub(context2, 2);
      registerStub(context2, 3);

      assert.deepEqual(context2.listeners.length, 3);
      assert.deepEqual(context2.listeners.reduce((a, b) => a + b), 6);
    });
  })
});
