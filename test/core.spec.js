const sinon = require("sinon");
const assert = require("assert");
const { BaseAdapter, AbstractResource, setAdapter } = require("../core");

const wrapInvoke = (klass, method) => (context, ...args) => klass.prototype[method].call(context, ...args);

describe("ritley's core suite", () => {

  const reqStub = { url: "/", on(ev, cbk) { ev === "end" && cbk() } };

  const adapter = setAdapter(BaseAdapter);

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
      { $uri: "/dummy0", onRequest: sinon.stub(), shouldHandle: sinon.stub() },
      { $uri: "/dummy1", onRequest: sinon.stub(), shouldHandle: sinon.stub() },
      { $uri: "/dummy2", onRequest: sinon.stub(), shouldHandle: sinon.stub() }
    ];

    const timeout = sinon.stub();
    const config = {};
    const context = { listeners, timeout, config };

    it("[METHOD] ::handle should be able to invoke interceptors on matching request", done => {
      const handleStub = wrapInvoke(BaseAdapter, "handle");

      const reqStubDummy = { ...reqStub, url: "/dummy0" };

      listeners[0].shouldHandle.withArgs(reqStubDummy).returns(true);
      listeners[1].shouldHandle.returns(false);
      listeners[2].shouldHandle.returns(false);

      handleStub(context, reqStubDummy);

      sinon.assert.calledWith(listeners[0].onRequest, reqStubDummy);
      sinon.assert.notCalled(listeners[1].onRequest);
      sinon.assert.notCalled(listeners[2].onRequest);
      sinon.assert.notCalled(context.timeout);

      const reqStubDummy2 = { ...reqStub, url: "/dummy3" };

      handleStub(context, reqStubDummy2);

      setTimeout(() =>
        sinon.assert.called(context.timeout), 1);

      setTimeout(done, 2);
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

  describe("AbstractResource method suite", () => {

    const context = { $uri: "/car", adapter: null, get() {}, post() {}, put() {}, delete() {} };

    beforeEach(() => {
      sinon.stub(context, "get");
      sinon.stub(context, "post");
      sinon.stub(context, "put");
      sinon.stub(context, "delete");
    })

    afterEach(() => {
      context.get.restore();
      context.post.restore();
      context.put.restore();
      context.delete.restore();
    });

    it.skip("[deprecated] ::onRequest should be able to concat all data from request", done => {

      const onRequestStub = wrapInvoke(AbstractResource, "onRequest");

      const phrase = "roses are red";

      const reqWithPayloadStub = { ...reqStub, on(ev, cbk) {
        if(ev === "data") phrase.split(" ").forEach(str => cbk(Buffer.from(str)));
        if(ev === "end") setTimeout(cbk, 5);
      } };

      const context2 = { ...context, dispatch: sinon.stub() };

      onRequestStub(context2, reqWithPayloadStub, 123);

      setTimeout(() => {
        sinon.assert.calledWith(context2.dispatch, reqWithPayloadStub, 123, Buffer.from(phrase.replace(/\s/g, "")));
        done();
      }, 10);
    });

    it.skip("[deprecated] ::dispatch should be able to transform request and invoke corresponding method if defined", () => {
      const dispathStub = wrapInvoke(AbstractResource, "dispatch");

      const reqWithParams = { ...reqStub, url: "/cat?name=barsik", method: "PUT" };

      dispathStub(context, reqWithParams, 123, Buffer.from('{"name":"barsik"}'));

      sinon.assert.calledWith(context.put, reqWithParams);
      sinon.assert.notCalled(context.post);
      sinon.assert.notCalled(context.get);
      sinon.assert.notCalled(context.delete);

      assert.deepEqual(reqWithParams.query, {"name":"barsik"});
      assert.deepEqual(reqWithParams.body, '{"name":"barsik"}');
      assert.deepEqual(reqWithParams.toJSON(), {"name":"barsik"});
      assert.deepEqual(reqWithParams.buffer, Buffer.from('{"name":"barsik"}'));
    });

    it("[METHOD] ::shouldHandle should be able to validate matching paths", () => {

      const shouldHandleStub = wrapInvoke(AbstractResource, "shouldHandle");

      const emptyUriContext = { ...context, $uri: undefined }
      assert.deepEqual(shouldHandleStub(emptyUriContext, reqStub), true);

      const carReqStub = { ...reqStub, url: "/car" };
      assert.deepEqual(shouldHandleStub(context, carReqStub), true);

      const reqWithParamsStub = { ...reqStub, url: "/car?some=param" };
      assert.deepEqual(shouldHandleStub(context, reqWithParamsStub), true);

      const reqNotToBeHandled = { ...reqStub, url: "/cor" };
      assert.deepEqual(shouldHandleStub(context, reqNotToBeHandled, "/car"), false);

      const reqWithPrefix = { ...reqStub, url: "/something/car" };
      assert.deepEqual(shouldHandleStub(context, reqWithPrefix, "/something"), true);
      assert.deepEqual(shouldHandleStub(context, reqWithPrefix, "/somethinj"), false);
    });

    it("[METHOD] ::onRequest should only dispatch to corresponding implemented method", () => {
      const onRequestStub = wrapInvoke(AbstractResource, "onRequest");

      const reqStubPut = { ...reqStub, method: "PUT" };

      onRequestStub(context, reqStubPut, 123);

      sinon.assert.calledWith(context.put, reqStubPut);
      sinon.assert.notCalled(context.post);
      sinon.assert.notCalled(context.get);
      sinon.assert.notCalled(context.delete);
    });

    it("[METHOD] ::mergeTasks should be able to invoke functions that returns promises appending arguments", done => {
      const mergeTasksStub = wrapInvoke(AbstractResource, "mergeTasks");

      const task0 = sinon.stub().returns(Promise.resolve("Look"));
      const task1 = sinon.stub().returns(Promise.resolve("Like"));
      const task2 = sinon.stub().returns(Promise.resolve("A Bicth?"));

      mergeTasksStub(null, task0, task1, task2, (...args) => {
        assert.deepEqual(args.join(" "), "Do I Look Like A Bicth?");
        return Promise.resolve("The End!");
      }).args("Do", "I").then(result => {
        assert.deepEqual(result, "The End!");
        done();
      });
    });
  });
});
