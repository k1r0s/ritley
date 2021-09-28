import url from "url";
import { inject, provider, afterMethod, beforeMethod, beforeInstance } from "kaop-ts";
import Path from "path-parser";

// TODO: remove on the next version
let reportException = exception => console.error(exception);

export const Provider = {
  singleton: (target) => {
    let pr = provider.singleton(target);
    pr._original = target;
    return pr;
  },
  factory: (target) => {
    let pr = provider.factory(target);
    pr._original = target;
    return pr;
  }
}

export const Dependency = {
  assign: (...entries) => beforeInstance(...entries.map(entry => inject.assign({ [entry[0]]: entry[1] }))),
  args: (...providers) => beforeInstance(...providers.map(prov => inject.args(prov)))
}

export const DefaultExceptionHandler = (handler) => reportException = handler;

export const Method = {
  _createMethodWrap: (method, path) => (proto, key, descriptor) => {
    const METHOD_DECORATOR_META_KEY = `ritley-listeners-${method}`;
    const listeners = Reflect.getMetadata(METHOD_DECORATOR_META_KEY, proto) || [];
    if(!proto[method]) proto[method] = function(...argList) {
      const [req, res] = argList;

      const predicate = listener => {
        if(!listener.path) return req.url === this.$uri;
        else return Path.createPath(listener.path).test(req.url.split(this.$uri).pop());
      }

      const found = listeners.find(predicate);
      if(found) {
        req.params = predicate(found);
        return this[found.key](...argList);
      } else return BadRequest(res);
    }
    const list = { path, key };
    listeners.push(list);
    Reflect.defineMetadata(METHOD_DECORATOR_META_KEY, listeners, proto);
    return descriptor;
  },
  get: path => Method._createMethodWrap("get", path),
  post: path => Method._createMethodWrap("post", path),
  put: path => Method._createMethodWrap("put", path),
  delete: path => Method._createMethodWrap("delete", path)
}

export const ReqTransformQuery = beforeMethod(meta => {
  const [req, res] = meta.args;
  req.query = url.parse(req.url, true).query;
});

export const ReqTransformBodySync = beforeMethod(meta => {
  const [req, res] = meta.args;
  const data = [];
  req.on("data", d => data.push(d));
  req.on("end", () => {
    const buffer = Buffer.concat(data);
    const string = buffer.toString();
    const toJSON = () => JSON.parse(buffer.toString());
    req.body = { buffer, string, toJSON };
    meta.commit();
  });
});

export const ReqTransformBodyAsync = beforeMethod(meta => {
  const [req, res] = meta.args;
  const data = [];
  req.body = new Promise(resolve => {
    req.on("data", d => data.push(d));
    req.on("end", () => {
      const buffer = Buffer.concat(data);
      const string = buffer.toString();
      const toJSON = () => JSON.parse(buffer.toString());
      resolve({ buffer, string, toJSON });
    });
  });
})

export const Throws = (errorType, fn) => afterMethod(meta => {
  const [req, res] = meta.args;
  if (meta.exception && meta.exception instanceof errorType) {
    const exception = meta.handle();
    fn(res, exception);
  } else if(meta.result && typeof meta.result.catch === "function") {
    meta.result = meta.result.catch(exception => {
      if (exception instanceof errorType) {
        fn(res, exception);
      } else {
        throw exception;
      }
    });
  }
});

export const Default = fn => afterMethod(meta => {
  const [req, res] = meta.args;
  if (meta.exception) {
    const exception = meta.handle();
    reportException(exception);
    InternalServerError(res);
  } else if(meta.result && typeof meta.result.then === "function") {
    meta.result.then(result => fn(res, result), exception => {
      reportException(exception);
      InternalServerError(res);
    });
  } else {
    fn(res, meta.result);
  }
});

export const Catch = (error, content) => afterMethod(meta => {
  const [req, res] = meta.args;
  if (meta.exception) {
    meta.handle();
    error(res, content);
  } else if(meta.result && typeof meta.result.catch === "function") {
    meta.result.catch(() => error(res, content));
  }
});

const resolveMethod = (res, code, data) => {
  if(res.headersSent) return;
  if(typeof data === "object") {
    let responseBody;
    if(data instanceof Error) {
      const { message, name } = data;
      responseBody = JSON.stringify({ error: name, message });
    } else {
      responseBody = JSON.stringify(data);
    }
    res.writeHead(code, {
      "Content-Length": Buffer.byteLength(responseBody),
      "Content-Type": "application/json; charset=utf-8"
    })
    res.write(responseBody);
  } else if(typeof data === "string") {
    res.writeHead(code);
    res.write(`{"message":"${data}"}`);
  } else {
    res.writeHead(code);
  }
  res.end();
}

export const Ok = (res, content) =>
  resolveMethod(res, 200, content)
export const Created = (res, content) =>
  resolveMethod(res, 201, content)
export const NoContent = (res, content) =>
  resolveMethod(res, 204, content)
export const BadRequest = (res, content) =>
  resolveMethod(res, 400, content)
export const Unauthorized = (res, content) =>
  resolveMethod(res, 401, content)
export const Forbidden = (res, content) =>
  resolveMethod(res, 403, content)
export const MethodNotAllowed = (res, content) =>
  resolveMethod(res, 405, content)
export const Conflict = (res, content) =>
  resolveMethod(res, 409, content)
export const InternalServerError = (res, content) =>
  resolveMethod(res, 500, content)
