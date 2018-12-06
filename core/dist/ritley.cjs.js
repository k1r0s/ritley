'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var normalizeUrl = function normalizeUrl(path) {
  return path ? path : "";
};

var setAdapter = function setAdapter(adapter) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return AbstractResource.$singleton = new adapter(config);
};

var AbstractResource = function () {
  function AbstractResource(_uri) {
    _classCallCheck(this, AbstractResource);

    this.$uri = _uri;
    if (!AbstractResource.$singleton) return console.warn("first you must define some adapter!");
    AbstractResource.$singleton.register(this);
  }

  AbstractResource.prototype.shouldHandle = function shouldHandle(req, base) {
    var matchingUrl = normalizeUrl(base) + normalizeUrl(this.$uri);
    return req.url.startsWith(matchingUrl);
  };

  AbstractResource.prototype.onRequest = function onRequest(req, res) {
    var methodName = req.method.toLowerCase();
    if (typeof this[methodName] !== "function") return console.warn("unhandled '" + methodName + "' request on " + this.$uri + " resource");
    return this[methodName](req, res);
  };

  return AbstractResource;
}();

var BaseAdapter = function () {
  function BaseAdapter(config) {
    _classCallCheck(this, BaseAdapter);

    this.listeners = [];
    if (config) this.config = config;
  }

  BaseAdapter.prototype.handle = function handle(req, res) {
    var _this = this;

    var willHandle = this.listeners.filter(function (listener) {
      return listener.shouldHandle(req, _this.config.base);
    });
    if (!willHandle.length) return this.timeout(res);
    return Promise.all(willHandle.map(function (listener) {
      return listener.onRequest(req, res);
    }));
  };

  BaseAdapter.prototype.register = function register(resourceInstance) {
    this.listeners.push(resourceInstance);
  };

  BaseAdapter.prototype.timeout = function timeout(res) {
    res.statusCode = 404;
    res.end();
    return Promise.resolve();
  };

  return BaseAdapter;
}();

exports.setAdapter = setAdapter;
exports.AbstractResource = AbstractResource;
exports.BaseAdapter = BaseAdapter;
