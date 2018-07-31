const http = require("http");

class StandaloneAdapter {
  constructor(config) {
    this.config = config;
    this.listeners = [];
    this.server = this.createServer(config.port);
    if(config.static) {
      this.setStaticSrv(this.server, config.static, config.base);
    }
  }

  createServer(port) {
    const nodeInstance = http.createServer();
    nodeInstance.listen(port);
    nodeInstance.on("request", (...args) => this.handle(...args));
    console.log(`running on port ${port}`);
    return nodeInstance;
  }

  setStaticSrv(srv, staticPath, basePath) {
    const ecstatic = require("ecstatic");
    const staticMiddleware = ecstatic({ root: `${staticPath}`, handleError: false });
    srv.on("request", (req, res) =>
      !req.url.startsWith(basePath) && staticMiddleware(req, res));
    console.log(`serving ${staticPath} as a static content`);
  }

  handle(req, res) {
    const timeout = setTimeout(this.timeout, 0, res);
    this.listeners.forEach(instance => {
      if(this.requestAllowed(req.url, instance.$uri)) {
        instance.onRequest(req, res);
        clearTimeout(timeout);
      }
    })
  }

  register(resourceInstance) {
    this.listeners.push(resourceInstance);
  }

  timeout(res) {
    res.statusCode = 404;
    res.end("not found!");
  }

  requestAllowed(url, abspath) {
    const absolutePath = (this.config.base || "/") + abspath;
    return url.startsWith(absolutePath);
  }

}

module.exports = StandaloneAdapter;
