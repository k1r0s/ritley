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
      if (!proto[method]) proto[method] = function (req, res) {
        var _this = this;

        var predicate = function predicate(listener) {
          return Path.createPath(_this.$uri + listener.path).test(req.url);
        };
        var found = listeners.find(predicate);
        if (found) this[found.key](req, res, predicate(found));else BadRequest({ args: [undefined, res] });
      };
      listeners.push({ path: path, key: key });
      Reflect.defineMetadata(METHOD_DECORATOR_META_KEY, listeners, proto);
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
    if (meta.result && typeof meta.result.then === "function") {
      meta.result.then(function (result) {
        return success(meta, result);
      }, function () {});
    } else {
      success(meta, meta.result);
    }
  });
};

var Catch = function Catch(error, message) {
  return kaopTs.afterMethod(function (meta) {
    if (meta.result && typeof meta.result.catch === "function") {
      meta.result.catch(function (err) {
        return error(meta, err ? err : { message: message });
      });
    } else {
      error(meta, { message: message });
    }
  });
};

var Ok = function Ok(meta, content) {
  return resolveMethod(meta, 200, content);
};
var Created = function Created(meta, content) {
  return resolveMethod(meta, 201, content);
};
var BadRequest = function BadRequest(meta, content) {
  return resolveMethod(meta, 400, content);
};
var Unauthorized = function Unauthorized(meta, content) {
  return resolveMethod(meta, 401, content);
};
var Forbidden = function Forbidden(meta, content) {
  return resolveMethod(meta, 403, content);
};
var MethodNotAllowed = function MethodNotAllowed(meta, content) {
  return resolveMethod(meta, 405, content);
};
var Conflict = function Conflict(meta, content) {
  return resolveMethod(meta, 409, content);
};
var InternalServerError = function InternalServerError(meta, content) {
  return resolveMethod(meta, 500, content);
};

var resolveMethod = function resolveMethod(meta, code, content) {
  var _meta$args4 = meta.args,
      req = _meta$args4[0],
      res = _meta$args4[1];

  res.statusCode = code;
  if ((typeof content === "undefined" ? "undefined" : _typeof(content)) === "object") {
    res.write(JSON.stringify(content));
  } else if (typeof content === "string") {
    res.write(content);
  }
  res.end();
};

exports.Dependency = Dependency;
exports.Method = Method;
exports.ReqTransformQuery = ReqTransformQuery;
exports.ReqTransformBodySync = ReqTransformBodySync;
exports.ReqTransformBodyAsync = ReqTransformBodyAsync;
exports.Default = Default;
exports.Catch = Catch;
exports.Ok = Ok;
exports.Created = Created;
exports.BadRequest = BadRequest;
exports.Unauthorized = Unauthorized;
exports.Forbidden = Forbidden;
exports.MethodNotAllowed = MethodNotAllowed;
exports.Conflict = Conflict;
exports.InternalServerError = InternalServerError;
