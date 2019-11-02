const normalizeUrl = path => path ? path: "";

export const setAdapter = ((adapter, config = {}) => AbstractResource.$singleton = new adapter(config));

export class AbstractResource {

  constructor(_uri) {
    this.$uri = _uri;
    if(!AbstractResource.$singleton) return console.warn(`You must define some adapter first!`);
    AbstractResource.$singleton.register(this);
  }

  shouldHandle(req) {
    if(this.$uri instanceof RegExp) {
      return this.$uri.test(req.url);
    } else {
      const normalized = normalizeUrl(this.$uri);
      return req.url.includes(normalized);
    }
  }

  onRequest(req, res) {
    const methodName = req.method.toLowerCase();
    if(typeof this[methodName] !== "function") return console.warn(`Unhandled '${methodName}' request on ${this.$uri} resource`);
    return this[methodName](req, res);
  }
}

export class BaseAdapter {

  constructor(config) {
    this.listeners = [];
    if(config) this.config = config;
  }

  handle(req, res) {
    const matchings = this.listeners.filter(listener =>
      listener.shouldHandle(req));
    if(matchings.length === 0) return this.notFound(res);
    if(matchings.length > 1) console.warn(`Caution! ${req.url} is being handled by more than 1 resource!`);
    const selectedListener = matchings.shift();
    return Promise.resolve(selectedListener.onRequest(req, res));
  }

  register(resourceInstance) {
    this.listeners.push(resourceInstance);
  }

  notFound(res) {
    res.statusCode = 404;
    res.end();
    return Promise.resolve();
  }
}
