'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var http = require("http");

var _require = require("@ritley/core"),
    BaseAdapter = _require.BaseAdapter;

var StandaloneAdapter = function (_BaseAdapter) {
  _inherits(StandaloneAdapter, _BaseAdapter);

  function StandaloneAdapter(config) {
    _classCallCheck(this, StandaloneAdapter);

    var _this = _possibleConstructorReturn(this, _BaseAdapter.call(this, config));

    _this.server = _this.createServer();
    if (_this.config.static) {
      _this.setStaticSrv();
    }
    return _this;
  }

  StandaloneAdapter.prototype.createServer = function createServer() {
    var _this2 = this;

    var nodeInstance = http.createServer();
    nodeInstance.listen(this.config.port);
    nodeInstance.on("request", function () {
      return _this2.handle.apply(_this2, arguments);
    });
    return nodeInstance;
  };

  StandaloneAdapter.prototype.setStaticSrv = function setStaticSrv() {
    var _this3 = this;

    var ecstatic = require("ecstatic");
    var staticMiddleware = ecstatic({ root: "" + this.config.static, handleError: false });
    this.server.on("request", function (req, res) {
      return !req.url.startsWith(_this3.config.base) && staticMiddleware(req, res);
    });
  };

  return StandaloneAdapter;
}(BaseAdapter);

module.exports = StandaloneAdapter;
