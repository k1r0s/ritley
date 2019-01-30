const normalizeUrl = path => path ? path: "";

export const setAdapter = ((adapter, config = {}) => AbstractResource.$singleton = new adapter(config));

export class AbstractResource {

  constructor(_uri) {
    this.$uri = _uri;
    if(!AbstractResource.$singleton) return console.warn(`first you must define some adapter!`);
    AbstractResource.$singleton.register(this);
  }

  shouldHandle(req, prefix) {
    const matchingUrl = normalizeUrl(prefix) + normalizeUrl(this.$uri);
    return req.url.startsWith(matchingUrl);
  }

  onRequest(req, res) {
    const methodName = req.method.toLowerCase();
    if(typeof this[methodName] !== "function") return console.warn(`unhandled '${methodName}' request on ${this.$uri} resource`);
    return this[methodName](req, res);
  }
}

export class BaseAdapter {

  constructor(config) {
    this.listeners = [];
    if(config) this.config = config;
  }

  handle(req, res) {
    const willHandle = this.listeners.filter(listener =>
      listener.shouldHandle(req, this.config.reqPrefix));
    if(!willHandle.length) return this.timeout(res);
    return Promise.all(willHandle.map(listener =>
      listener.onRequest(req, res)));
  }

  register(resourceInstance) {
    this.listeners.push(resourceInstance);
  }

  timeout(res) {
    res.statusCode = 404;
    res.end();
    return Promise.resolve();
  }
}
