import http from "http";
import { BaseAdapter } from "@ritley/core";

export default class StandaloneAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.initialize();
  }

  initialize() {
    this.createServer();
    this.createStaticMw();
    this.start();
  }

  start() {
    this.server.listen(this.config.port);
    this.server.on("request", (req, res) => this.handle(req, res));
  }

  handle(req, res) {
    if(!this.middlw) {
      return super.handle(req, res);
    } else if (req.url.startsWith(this.config.reqPrefix)) {
      return super.handle(req, res);
    } else {
      return Promise.resolve().then(() => this.handleStatic(req, res));
    }
  }

  createServer() {
    this.server = http.createServer();
  }

  createStaticMw() {
    if(this.config.contentBase && this.config.reqPrefix) {
      const ecstatic = require("ecstatic");
      this.middlw = ecstatic({ root: `${this.config.contentBase}`, handleError: false });
    }
  }

  handleStatic(req, res) {
    this.middlw(req, res, () => {
      if (this.config.historyApiFallback && req.method === "GET" && !/\./.test(req.url)) {
        this.middlw(Object.assign(req, { url: this.config.historyApiFallback }), res);
      } else {
        res.statusCode = 404;
        res.end();
      }
    })
  }
}
