const { inject } = require("kaop");
const { afterMethod, beforeInstance } = require("kaop-ts");

export const Dependency = (prop, provider) => beforeInstance(inject.assign({ [prop]: provider }));

export const Method = {
  _createMethodWrap: (method, path) => (proto, key, descriptor) => {
    const Path = require("path-parser");
    const METHOD_DECORATOR_META_KEY = `ritley-listeners-${method}`;
    let listeners = Reflect.getMetadata(METHOD_DECORATOR_META_KEY, proto);
    if(!listeners) listeners = [];
    if(!proto[method]) proto[method] = function(req, res) {
      const predicate = listener =>
        Path.createPath("/" + this.$uri + listener.path).test(req.url);
      const found = listeners.find(predicate);
      if(found) this[found.key](req, res, predicate(found));
      else BadRequest({ args: [undefined, res] });
    }
    listeners.push({ path, key });
    Reflect.defineMetadata(METHOD_DECORATOR_META_KEY, listeners, proto);
  },
  get: path => Method._createMethodWrap("get", path),
  post: path => Method._createMethodWrap("post", path),
  put: path => Method._createMethodWrap("put", path),
  delete: path => Method._createMethodWrap("delete", path)
}

export const ReqTransformQuery = beforeMethod(meta => {
  const [req, res] = meta.args;
  const url = require("url");
  req.query = url.parse(req.url, true).query;
});

export const ReqTransformBody = beforeMethod(meta => {
  const [req, res] = meta.args;
  const body = [];
  req.on("data", d => body.push(d));
  req.on("end", () => {
    req.buffer = buffer;
    req.body = buffer.toString();
    req.toJSON = () => JSON.parse(buffer.toString());
    meta.commit();
  });
});

export const Default = success => afterMethod(meta => {
  if(meta.result instanceof Promise) {
    meta.result.then(result => success(meta, result));
  } else if(meta.result) {
    success(meta, meta.result);
  }
});

export const Catch = (error, message) => afterMethod(meta => {
  if(meta.result instanceof Promise) {
    meta.result.catch(err => error(meta, { message, err }));
  } else if(!meta.result) {
    error(meta, { message });
  }
});

export const Ok = (meta, content) =>
  resolveMethod(meta, 200, content)
export const Created = (meta, content) =>
  resolveMethod(meta, 201, content)
export const BadRequest = (meta, content) =>
  resolveMethod(meta, 400, content)
export const Unauthorized = (meta, content) =>
  resolveMethod(meta, 401, content)
export const Forbidden = (meta, content) =>
  resolveMethod(meta, 403, content)
export const MethodNotAllowed = (meta, content) =>
  resolveMethod(meta, 405, content)
export const Conflict = (meta, content) =>
  resolveMethod(meta, 409, content)
export const InternalServerError = (meta, content) =>
  resolveMethod(meta, 500, content)

const resolveMethod = (meta, code, content) => {
  const [req, res] = meta.args;
  res.statusCode = code;
  if(typeof content === "object") {
    res.write(JSON.stringify(content));
  } else if(typeof content === "string") {
    res.write(content);
  }
  res.end();
}
