const { AbstractResource, setAdapter } = require("@ritley/core");
const Adapter = require("@ritley/standalone-adapter");

setAdapter(Adapter, {
  "port": 3003
});

class DefaultResource extends AbstractResource {
  get(req, res) {
    res.statusCode = 200;
    res.end("Hello World!");
  }
}

new DefaultResource();
