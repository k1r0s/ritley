const Ritley = require("@ritley/core");

// use an adapter (for now, only raw (standalone) or firebase)
const Adapter = require("@ritley/default-adapter");

// create an instance of the adapter
new Adapter({
  "port": 8080
});

// create a resource that listens get calls
class DefaultResource extends Ritley.AbstractResource {
  get(req, res) {
    res.statusCode = 200;
    res.end("Hello World!");
  }
}

// create an instance with a specific route
new DefaultResource();
