'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var url = require("url");

var $adapter = null;

var normalizeUrl = function normalizeUrl(path) {
  return path ? "/" + path : "";
};

var AbstractResource = function () {
  function AbstractResource(_uri) {
    _classCallCheck(this, AbstractResource);

    this.$uri = _uri;
    this.adapter = $adapter;
    this.adapter.register(this);
  }

  AbstractResource.prototype.onRequest = function onRequest(req, res) {
    var _this = this;

    var body = [];
    req.on("data", function (d) {
      return body.push(d);
    });
    req.on("end", function () {
      return _this.dispatch(req, res, Buffer.concat(body));
    });
  };

  AbstractResource.prototype.dispatch = function dispatch(req, res, buffer) {
    req.query = url.parse(req.url, true).query;
    req.buffer = buffer;
    req.body = buffer.toString();
    req.toJSON = function () {
      return JSON.parse(buffer.toString());
    };

    var methodName = req.method.toLowerCase();
    if (typeof this[methodName] !== "function") return console.warn("unhandled '" + methodName + "' request on " + this.$uri + " resource");
    this[methodName](req, res);
  };

  AbstractResource.prototype.mergeTasks = function mergeTasks() {
    var _this2 = this;

    for (var _len = arguments.length, tasks = Array(_len), _key = 0; _key < _len; _key++) {
      tasks[_key] = arguments[_key];
    }

    return {
      args: function args() {
        for (var _len2 = arguments.length, _args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          _args[_key2] = arguments[_key2];
        }

        return new Promise(function (resolve) {
          var caller = function caller(prevResult) {
            var task = tasks.shift();
            if (task) task.call.apply(task, [_this2].concat(_args.concat(prevResult))).then(caller, function () {});else resolve(prevResult);
          };
          caller();
        });
      }
    };
  };

  return AbstractResource;
}();

var BaseAdapter = function () {
  function BaseAdapter(config) {
    _classCallCheck(this, BaseAdapter);

    this.listeners = [];
    if (config) this.config = config;else this.config = {};
    $adapter = this;
  }

  BaseAdapter.prototype.handle = function handle(req, res) {
    var timeout = setTimeout(this.timeout, 0, res);
    for (var i = 0; i < this.listeners.length; i++) {
      var instance = this.listeners[i];
      if (this.requestAllowed(req.url, instance.$uri)) {
        instance.onRequest(req, res);
        clearTimeout(timeout);
      }
    }
  };

  BaseAdapter.prototype.requestAllowed = function requestAllowed(url, instanceUri) {
    var matchingUrl = normalizeUrl(this.config.base) + normalizeUrl(instanceUri);
    return url.startsWith(matchingUrl);
  };

  BaseAdapter.prototype.register = function register(resourceInstance) {
    this.listeners.push(resourceInstance);
  };

  BaseAdapter.prototype.timeout = function timeout(res) {
    res.statusCode = 404;
    res.end();
  };

  return BaseAdapter;
}();

module.exports = { BaseAdapter: BaseAdapter, AbstractResource: AbstractResource };

exports.BaseAdapter = BaseAdapter;
