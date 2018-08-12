const normalizeUrl = path => path ? path: "";

export const setAdapter = ((adapter, config = {}) => AbstractResource.$singleton = new adapter(config));

export class AbstractResource {

  constructor(_uri) {
    this.$uri = _uri;
    if(!AbstractResource.$singleton) return console.error(`First you must define some adapter!`);
    AbstractResource.$singleton.register(this);
  }

  shouldHandle(req, base) {
    const matchingUrl = normalizeUrl(base) + normalizeUrl(this.$uri);
    return req.url.startsWith(matchingUrl);
  }

  onRequest(req, res) {
    const methodName = req.method.toLowerCase();
    if(typeof this[methodName] !== "function") return console.warn(`unhandled '${methodName}' request on ${this.$uri} resource`);
    this[methodName](req, res);
  }

  mergeTasks(...tasks) {
    return {
      args: (...initialArgs) => {
        return new Promise((resolve) => {
          const caller = args => {
            const task = tasks.shift();
            if(task) task.apply(this, args).then(result => caller(args.concat(result)), () => {});
            else resolve(args.pop());
          };
          caller(initialArgs);
        })
      }
    }
  }
}

export class BaseAdapter {

  constructor(config) {
    this.listeners = [];
    if(config) this.config = config;
  }

  handle(req, res) {
    const timeout = setTimeout(this.timeout, 0, res);
    for (let i = 0; i < this.listeners.length; i++) {
      const instance = this.listeners[i];
      if(instance.shouldHandle(req, this.config.base)) {
        instance.onRequest(req, res);
        clearTimeout(timeout);
      }
    }
  }

  register(resourceInstance) {
    this.listeners.push(resourceInstance);
  }

  timeout(res) {
    res.statusCode = 404;
    res.end();
  }
}
