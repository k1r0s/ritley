'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var url = _interopDefault(require('url'));
var kaopTs = require('kaop-ts');
var Path = _interopDefault(require('path-parser'));

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Dependency = function Dependency(prop, prov) {
  var _inject$assign;

  return kaopTs.beforeInstance(kaopTs.inject.assign((_inject$assign = {}, _inject$assign[prop] = prov, _inject$assign)));
};

var Method = {
  _createMethodWrap: function _createMethodWrap(method, path) {
    return function (proto, key, descriptor) {
      var METHOD_DECORATOR_META_KEY = "ritley-listeners-" + method;
      var listeners = Reflect.getMetadata(METHOD_DECORATOR_META_KEY, proto) || [];
      if (!proto[method]) proto[method] = function () {
        var _this = this;

        for (var _len = arguments.length, argList = Array(_len), _key = 0; _key < _len; _key++) {
          argList[_key] = arguments[_key];
        }

        var req = argList[0],
            res = argList[1];


        var predicate = function predicate(listener) {
          if (!listener.path) return req.url === _this.$uri;else return Path.createPath(listener.path).test(req.url.split(_this.$uri).pop());
        };

        var found = listeners.find(predicate);
        if (found) {
          req.params = predicate(found);
          return this[found.key].apply(this, argList);
        } else return BadRequest(res);
      };
      var list = { path: path, key: key };
      listeners.push(list);
      Reflect.defineMetadata(METHOD_DECORATOR_META_KEY, listeners, proto);
      return descriptor;
    };
  },
  get: function get(path) {
    return Method._createMethodWrap("get", path);
  },
  post: function post(path) {
    return Method._createMethodWrap("post", path);
  },
  put: function put(path) {
    return Method._createMethodWrap("put", path);
  },
  delete: function _delete(path) {
    return Method._createMethodWrap("delete", path);
  }
};

var ReqTransformQuery = kaopTs.beforeMethod(function (meta) {
  var _meta$args = meta.args,
      req = _meta$args[0],
      res = _meta$args[1];

  req.query = url.parse(req.url, true).query;
});

var ReqTransformBodySync = kaopTs.beforeMethod(function (meta) {
  var _meta$args2 = meta.args,
      req = _meta$args2[0],
      res = _meta$args2[1];

  var data = [];
  req.on("data", function (d) {
    return data.push(d);
  });
  req.on("end", function () {
    var buffer = Buffer.concat(data);
    var string = buffer.toString();
    var toJSON = function toJSON() {
      return JSON.parse(buffer.toString());
    };
    req.body = { buffer: buffer, string: string, toJSON: toJSON };
    meta.commit();
  });
});

var ReqTransformBodyAsync = kaopTs.beforeMethod(function (meta) {
  var _meta$args3 = meta.args,
      req = _meta$args3[0],
      res = _meta$args3[1];

  var data = [];
  req.body = new Promise(function (resolve) {
    req.on("data", function (d) {
      return data.push(d);
    });
    req.on("end", function () {
      var buffer = Buffer.concat(data);
      var string = buffer.toString();
      var toJSON = function toJSON() {
        return JSON.parse(buffer.toString());
      };
      resolve({ buffer: buffer, string: string, toJSON: toJSON });
    });
  });
});

var Throws = function Throws(errorType, fn) {
  return kaopTs.afterMethod(function (meta) {
    var _meta$args4 = meta.args,
        req = _meta$args4[0],
        res = _meta$args4[1];

    if (meta.exception && meta.exception instanceof errorType) {
      var exception = meta.handle();
      fn(res, { error: exception.name, message: exception.message });
    } else if (meta.result && typeof meta.result.catch === "function") {
      meta.result = meta.result.catch(function (exception) {
        if (exception instanceof errorType) {
          fn(res, { error: exception.name, message: exception.message });
        } else {
          throw exception;
        }
      });
    }
  });
};

var Default = function Default(fn) {
  return kaopTs.afterMethod(function (meta) {
    var _meta$args5 = meta.args,
        req = _meta$args5[0],
        res = _meta$args5[1];

    if (meta.exception) {
      var exception = meta.handle();
      console.error(exception);
      InternalServerError(res);
    } else if (meta.result && typeof meta.result.then === "function") {
      meta.result.then(function (result) {
        return fn(res, result);
      }, function (exception) {
        console.error(exception);
        InternalServerError(res);
      });
    } else {
      fn(res, meta.result);
    }
  });
};

var Catch = function Catch(error, content) {
  return kaopTs.afterMethod(function (meta) {
    var _meta$args6 = meta.args,
        req = _meta$args6[0],
        res = _meta$args6[1];

    if (meta.exception) {
      meta.handle();
      error(res, content);
    } else if (meta.result && typeof meta.result.catch === "function") {
      meta.result.catch(function () {
        return error(res, content);
      });
    }
  });
};

var resolveMethod = function resolveMethod(res, code, message) {
  if (res.headersSent) return;
  res.writeHead(code);
  if ((typeof message === "undefined" ? "undefined" : _typeof(message)) === "object") {
    res.write(JSON.stringify(message));
  } else if (typeof message === "string") {
    res.write(JSON.stringify({ message: message }));
  }
  res.end();
};

var Ok = function Ok(res, content) {
  return resolveMethod(res, 200, content);
};
var Created = function Created(res, content) {
  return resolveMethod(res, 201, content);
};
var NoContent = function NoContent(res, content) {
  return resolveMethod(res, 204, content);
};
var BadRequest = function BadRequest(res, content) {
  return resolveMethod(res, 400, content);
};
var Unauthorized = function Unauthorized(res, content) {
  return resolveMethod(res, 401, content);
};
var Forbidden = function Forbidden(res, content) {
  return resolveMethod(res, 403, content);
};
var MethodNotAllowed = function MethodNotAllowed(res, content) {
  return resolveMethod(res, 405, content);
};
var Conflict = function Conflict(res, content) {
  return resolveMethod(res, 409, content);
};
var InternalServerError = function InternalServerError(res, content) {
  return resolveMethod(res, 500, content);
};

exports.Provider = kaopTs.provider;
exports.Dependency = Dependency;
exports.Method = Method;
exports.ReqTransformQuery = ReqTransformQuery;
exports.ReqTransformBodySync = ReqTransformBodySync;
exports.ReqTransformBodyAsync = ReqTransformBodyAsync;
exports.Throws = Throws;
exports.Default = Default;
exports.Catch = Catch;
exports.Ok = Ok;
exports.Created = Created;
exports.NoContent = NoContent;
exports.BadRequest = BadRequest;
exports.Unauthorized = Unauthorized;
exports.Forbidden = Forbidden;
exports.MethodNotAllowed = MethodNotAllowed;
exports.Conflict = Conflict;
exports.InternalServerError = InternalServerError;
