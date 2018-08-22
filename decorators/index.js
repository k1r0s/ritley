import url from "url";
import { inject, provider, afterMethod, beforeMethod, beforeInstance } from "kaop-ts";
import Path from "path-parser";

export { provider as Provider }

export const Dependency = (prop, prov) => beforeInstance(inject.assign({ [prop]: prov }));

export const Method = {
  _createMethodWrap: (method, path) => (proto, key, descriptor) => {
    const METHOD_DECORATOR_META_KEY = `ritley-listeners-${method}`;
    let listeners = Reflect.getMetadata(METHOD_DECORATOR_META_KEY, proto);
    if(!listeners) listeners = [];
    if(!proto[method]) proto[method] = function(...argList) {
      const [req, res] = argList;
      const predicate = listener =>
        Path.createPath(this.$uri + listener.path).test(req.url);
      const found = listeners.find(predicate);
      if(found) this[found.key](...[ ...argList, predicate(found) ]);
      else BadRequest(res);
    }
    listeners.push({ path, key });
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

export const Default = success => afterMethod(meta => {
  const { result, args, exception, handle } = meta;
  if (exception) {
    handle();
    InternalServerError(args[1]);
  } else if(result && typeof result.then === "function") {
    result.then(result => success(args[1], result), () => InternalServerError(args[1]));
  } else {
    success(args[1]);
  }
});

export const Catch = (error, content) => afterMethod(meta => {
  const { result, args, exception, handle } = meta;
  if (exception) {
    handle();
    error(args[1], content);
  } else if(result && typeof result.then === "function") {
    result.catch(() => error(args[1], content));
  }
});

const resolveMethod = (res, code, content) => {
  res.statusCode = code;
  if(typeof content === "object") {
    res.write(JSON.stringify(content));
  } else if(typeof content === "string") {
    res.write(content);
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
