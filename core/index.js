const url = require("url");

class AbstractResource {

  constructor(_uri) {
    this.$uri = _uri;
    this.$srv = AbstractResource.instance;
    this.$srv.register(this);
  }

  onRequest(req, res) {
    const body = [];
    req.on("data", d => body.push(d));
    req.on("end", () => this.dispatch(req, res, Buffer.concat(body)));
  }

  dispatch(req, res, buffer) {
    req.query = url.parse(req.url, true).query;
    req.buffer = buffer;
    req.body = buffer.toString();
    req.toJSON = () => JSON.parse(buffer.toString());

    const methodName = req.method.toLowerCase();
    if(typeof this[methodName] !== "function") return console.warn(`unhandled '${methodName}' request on ${this.$uri} resource`);
    this[methodName](req, res);
  }

  mergeTasks(...tasks) {
    return {
      args: (...args) => {
        return new Promise((resolve) => {
          const caller = prevResult => {
            const task = tasks.shift();
            if(task) task.call(this, ...args.concat(prevResult)).then(caller, () => {});
            else resolve(prevResult);
          };
          caller();
        })
      }
    }
  }
}

export class BaseAdapter {

  constructor(config) {
    this.listeners = [];
    if(config) this.config = config;
    else this.config = {};
    AbstractResource.instance = this;
  }

  handle(req, res) {
    const timeout = setTimeout(this.timeout, 0, res);
    for (let i = 0; i < this.listeners.length; i++) {
      const instance = this.listeners[i];
      if(this.requestAllowed(req.url, instance.$uri)) {
        instance.onRequest(req, res);
        clearTimeout(timeout);
      }
    }
  }

  requestAllowed(url, abspath = "") {
    const absolutePath = (this.config.base || "/") + abspath;
    return url.startsWith(absolutePath);
  }

  register(resourceInstance) {
    this.listeners.push(resourceInstance);
  }

  timeout(res) {
    res.statusCode = 404;
    res.end();
  }
}

module.exports = { BaseAdapter, AbstractResource }
