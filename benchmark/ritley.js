const Ritley = require("@ritley/core");
const Adapter = require("@ritley/standalone-adapter");

new Adapter({
  "port": 3003
});

class DefaultResource extends Ritley.AbstractResource {
  get(req, res) {
    res.statusCode = 200;
    res.end("Hello World!");
  }
}

new DefaultResource();
