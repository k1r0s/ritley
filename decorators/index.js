import { inject } from "kaop";
import { afterMethod, beforeInstance } from "kaop-ts";

export const Dependency = (prop, provider) => beforeInstance(inject.assign({ [prop]: provider }));

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
