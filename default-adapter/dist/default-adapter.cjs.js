'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var http = require("http");

var StandaloneAdapter = function () {
  function StandaloneAdapter(config) {
    _classCallCheck(this, StandaloneAdapter);

    this.config = config;
    this.listeners = [];
    this.server = this.createServer(config.port);
    if (config.static) {
      this.setStaticSrv(this.server, config.static, config.base);
    }
  }

  StandaloneAdapter.prototype.createServer = function createServer(port) {
    var _this = this;

    var nodeInstance = http.createServer();
    nodeInstance.listen(port);
    nodeInstance.on("request", function () {
      return _this.handle.apply(_this, arguments);
    });
    console.log("running on port " + port);
    return nodeInstance;
  };

  StandaloneAdapter.prototype.setStaticSrv = function setStaticSrv(srv, staticPath, basePath) {
    var ecstatic = require("ecstatic");
    var staticMiddleware = ecstatic({ root: "" + staticPath, handleError: false });
    srv.on("request", function (req, res) {
      return !req.url.startsWith(basePath) && staticMiddleware(req, res);
    });
    console.log("serving " + staticPath + " as a static content");
  };

  StandaloneAdapter.prototype.handle = function handle(req, res) {
    var _this2 = this;

    var timeout = setTimeout(this.timeout, 0, res);
    this.listeners.forEach(function (instance) {
      if (_this2.requestAllowed(req.url, instance.$uri)) {
        instance.onRequest(req, res);
        clearTimeout(timeout);
      }
    });
  };

  StandaloneAdapter.prototype.register = function register(resourceInstance) {
    this.listeners.push(resourceInstance);
  };

  StandaloneAdapter.prototype.timeout = function timeout(res) {
    res.statusCode = 404;
    res.end("not found!");
  };

  StandaloneAdapter.prototype.requestAllowed = function requestAllowed(url, abspath) {
    var absolutePath = (this.config.base || "/") + abspath;
    return url.startsWith(absolutePath);
  };

  return StandaloneAdapter;
}();

module.exports = StandaloneAdapter;
