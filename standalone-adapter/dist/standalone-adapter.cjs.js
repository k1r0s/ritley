'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var http = _interopDefault(require('http'));
var core = require('@ritley/core');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var StandaloneAdapter = function (_BaseAdapter) {
  _inherits(StandaloneAdapter, _BaseAdapter);

  function StandaloneAdapter(config) {
    _classCallCheck(this, StandaloneAdapter);

    var _this = _possibleConstructorReturn(this, _BaseAdapter.call(this, config));

    _this.initialize();
    return _this;
  }

  StandaloneAdapter.prototype.initialize = function initialize() {
    this.createServer();
    this.createStaticMw();
    this.start();
  };

  StandaloneAdapter.prototype.start = function start() {
    var _this2 = this;

    this.server.listen(this.config.port);
    this.server.on("request", function (req, res) {
      return _this2.handle(req, res);
    });
  };

  StandaloneAdapter.prototype.handle = function handle(req, res) {
    var _this3 = this;

    if (!this.middlw) {
      return _BaseAdapter.prototype.handle.call(this, req, res);
    } else if (req.url.startsWith(this.config.reqPrefix)) {
      return _BaseAdapter.prototype.handle.call(this, req, res);
    } else {
      return Promise.resolve().then(function () {
        return _this3.handleStatic(req, res);
      });
    }
  };

  StandaloneAdapter.prototype.createServer = function createServer() {
    this.server = http.createServer();
  };

  StandaloneAdapter.prototype.createStaticMw = function createStaticMw() {
    if (this.config.contentBase && this.config.reqPrefix) {
      var ecstatic = require("ecstatic");
      this.middlw = ecstatic({ root: "" + this.config.contentBase, handleError: false });
    }
  };

  StandaloneAdapter.prototype.handleStatic = function handleStatic(req, res) {
    var _this4 = this;

    this.middlw(req, res, function () {
      if (_this4.config.historyApiFallback && req.method === "GET" && !/\./.test(req.url)) {
        _this4.middlw(Object.assign(req, { url: _this4.config.historyApiFallback }), res);
      } else {
        res.statusCode = 404;
        res.end();
      }
    });
  };

  return StandaloneAdapter;
}(core.BaseAdapter);

module.exports = StandaloneAdapter;
