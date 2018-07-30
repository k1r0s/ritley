'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FirebaseAdapter = function () {
  function FirebaseAdapter() {
    _classCallCheck(this, FirebaseAdapter);

    this.listeners = [];
  }

  FirebaseAdapter.prototype.handle = function handle(req, res) {
    var _this = this;

    var timeout = setTimeout(this.timeout, 0, req, res);
    this.listeners.forEach(function (instance) {
      if (_this.requestAllowed(req, instance.$uri)) {
        instance.onRequest(req, res);
        clearTimeout(timeout);
      }
    });
  };

  FirebaseAdapter.prototype.requestAllowed = function requestAllowed(req, path) {
    return req.url.startsWith("/" + path);
  };

  FirebaseAdapter.prototype.register = function register(resourceInstance) {
    this.listeners.push(resourceInstance);
  };

  FirebaseAdapter.prototype.timeout = function timeout(req, res) {
    res.statusCode = 404;
    res.end("not found!");
  };

  return FirebaseAdapter;
}();

module.exports = FirebaseAdapter;
