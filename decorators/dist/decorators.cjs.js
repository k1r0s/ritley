'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var url = _interopDefault(require('url'));
var kaop = require('kaop');
var kaopTs = require('kaop-ts');
var Path = _interopDefault(require('path-parser'));

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Dependency = function Dependency(prop, provider) {
  var _inject$assign;

  return kaopTs.beforeInstance(kaop.inject.assign((_inject$assign = {}, _inject$assign[prop] = provider, _inject$assign)));
};

var Method = {
  _createMethodWrap: function _createMethodWrap(method, path) {
    return function (proto, key, descriptor) {
      var METHOD_DECORATOR_META_KEY = "ritley-listeners-" + method;
      var listeners = Reflect.getMetadata(METHOD_DECORATOR_META_KEY, proto);
      if (!listeners) listeners = [];
      if (!proto[method]) proto[method] = function () {
        var _this = this;

        for (var _len = arguments.length, argList = Array(_len), _key = 0; _key < _len; _key++) {
          argList[_key] = arguments[_key];
        }

        var req = argList[0],
            res = argList[1];

        var predicate = function predicate(listener) {
          return Path.createPath(_this.$uri + listener.path).test(req.url);
        };
        var found = listeners.find(predicate);
        if (found) this[found.key].apply(this, [].concat(argList, [predicate(found)]));else BadRequest(res);
      };
      listeners.push({ path: path, key: key });
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

var Default = function Default(success) {
  return kaopTs.afterMethod(function (meta) {
    var result = meta.result,
        args = meta.args;

    if (result && typeof result.then === "function") {
      result.then(function (result) {
        return success(args[1], result);
      }, function () {});
    } else {
      success(args[1], result);
    }
  });
};

var Catch = function Catch(error, content) {
  return kaopTs.afterMethod(function (meta) {
    var result = meta.result,
        args = meta.args;

    if (result && typeof result.catch === "function") {
      result.catch(function () {
        return error(args[1], content);
      });
    } else {
      error(args[1], content);
    }
  });
};

var resolveMethod = function resolveMethod(res, code, content) {
  res.statusCode = code;
  if ((typeof content === "undefined" ? "undefined" : _typeof(content)) === "object") {
    res.write(JSON.stringify(content));
  } else if (typeof content === "string") {
    res.write(content);
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

exports.Provider = kaop.provider;
exports.Dependency = Dependency;
exports.Method = Method;
exports.ReqTransformQuery = ReqTransformQuery;
exports.ReqTransformBodySync = ReqTransformBodySync;
exports.ReqTransformBodyAsync = ReqTransformBodyAsync;
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
