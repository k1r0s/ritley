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

module.exports = { AbstractResource, setAdapter: instance => AbstractResource.instance = instance }
