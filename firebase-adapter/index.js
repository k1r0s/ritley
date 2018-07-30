class FirebaseAdapter {

  constructor() {
    this.listeners = [];
  }

  handle(req, res) {
    const timeout = setTimeout(this.timeout, 0, req, res);
    this.listeners.forEach(instance => {
      if(this.requestAllowed(req, instance.$uri)) {
        instance.onRequest(req, res);
        clearTimeout(timeout);
      }
    })
  }

  requestAllowed(req, path) {
    return req.url.startsWith("/" + path);
  }

  register(resourceInstance) {
    this.listeners.push(resourceInstance);
  }

  timeout(req, res) {
    res.statusCode = 404;
    res.end("not found!");
  }
}

module.exports = FirebaseAdapter;
