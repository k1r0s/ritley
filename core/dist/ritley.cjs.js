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
    if (!AbstractResource.$singleton) return console.warn("You must define some adapter first!");
    AbstractResource.$singleton.register(this);
  }

  AbstractResource.prototype.shouldHandle = function shouldHandle(req) {
    if (this.$uri instanceof RegExp) {
      return this.$uri.test(req.url);
    } else {
      var normalized = normalizeUrl(this.$uri);
      console.log(req.url, "includes", normalized);
      return req.url.includes(normalized);
    }
  };

  AbstractResource.prototype.onRequest = function onRequest(req, res) {
    var methodName = req.method.toLowerCase();
    if (typeof this[methodName] !== "function") return console.warn("Unhandled '" + methodName + "' request on " + this.$uri + " resource");
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
    var matchings = this.listeners.filter(function (listener) {
      return listener.shouldHandle(req);
    });
    if (matchings.length === 0) return this.notFound(res);
    if (matchings.length > 1) console.warn("Caution! " + req.url + " is being handled by more than 1 resource!");
    var selectedListener = matchings.shift();
    return Promise.resolve(selectedListener.onRequest(req, res));
  };

  BaseAdapter.prototype.register = function register(resourceInstance) {
    this.listeners.push(resourceInstance);
  };

  BaseAdapter.prototype.notFound = function notFound(res) {
    res.statusCode = 404;
    res.end();
    return Promise.resolve();
  };

  return BaseAdapter;
}();

exports.setAdapter = setAdapter;
exports.AbstractResource = AbstractResource;
exports.BaseAdapter = BaseAdapter;
