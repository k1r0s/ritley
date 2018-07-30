'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var kaop = require('kaop');
var kaopTs = require('kaop-ts');

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Dependency = function Dependency(prop, provider) {
  var _inject$assign;

  return kaopTs.beforeInstance(kaop.inject.assign((_inject$assign = {}, _inject$assign[prop] = provider, _inject$assign)));
};

var Default = function Default(success) {
  return kaopTs.afterMethod(function (meta) {
    if (meta.result instanceof Promise) {
      meta.result.then(function (result) {
        return success(meta, result);
      });
    } else if (meta.result) {
      success(meta, meta.result);
    }
  });
};

var Catch = function Catch(error, message) {
  return kaopTs.afterMethod(function (meta) {
    if (meta.result instanceof Promise) {
      meta.result.catch(function (err) {
        return error(meta, { message: message, err: err });
      });
    } else if (!meta.result) {
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
  var _meta$args = meta.args,
      req = _meta$args[0],
      res = _meta$args[1];

  res.statusCode = code;
  if ((typeof content === "undefined" ? "undefined" : _typeof(content)) === "object") {
    res.write(JSON.stringify(content));
  } else if (typeof content === "string") {
    res.write(content);
  }
  res.end();
};

exports.Dependency = Dependency;
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
