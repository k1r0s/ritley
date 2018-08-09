<p align="center">
  <a><img src="https://i.imgur.com/6BKD8jW.png"></a>
  <h2>Ritley JS</h2>
</p>

#### About
Ritley is a small package __with ZERO dependencies__ that allows you to create server-side applications in no time. You can define `Resources` as entities which handle requests to the server. Create as many instances as you need. Also you can extend (inherit) previous entities to build more complex behaviors.

The project is now separated in several parts that you may use as you see fit.

#### Packages

- @ritley/core: provides `BaseAdapter` and `AbstractResource`
- @ritley/default-adapter: provides a boilerplate to run your project anywhere with nodejs
- @ritley/decorators: provides a set of useful abstractions that will reduce your codebase

#### Get v1

This repo is intended to be a complete override of v1

You can check ritley-v1 [here](https://github.com/k1r0s/ritley-v1)

#### Philosophy

Ritley its just a wrapper of Node's default http package. You don't have to worry about learn another API but [this one](https://nodejs.org/api/http.html) that you may already known.

This library aims to provide a friendly development experience while you build scalable services using an API that you already know how to use within a sort of guidelines.

I strongly believe that OOP programming should be the mainframe when designing enterprise world applications. Ritley empowers this and is compatible with other Paradigms and Techniques, so you can/must use any other technique where its necessary like FP, FRP, AOP, and so on...

Ritley just provides the basics to sort and separate your code into domains as a logic placeholders and let you share only what you need.

Like React does, your resources will extend from `AbstractResource` to be able to listen calls having its first parameter on the constructor. You can ignore the constructor or simply override it by implementing `super(uri)` or by applying any reflection technique.

So this is pretty straightforward:

```javascript

import Ritley from "@ritley/core";

// use an adapter (for now, only raw (standalone) or firebase)
import Adapter from "@ritley/default-adapter";

// create an instance of the adapter
new Adapter({
  "port": 8080
});

// create a resource that listens get calls
class DummyResource extends Ritley.AbstractResource {
  get(req, res) {
    res.statusCode = 200;
    res.write("Hello World!")
    res.end();
  }
}

// create an instance with a specific route
new DummyResource();
```

Now by doing `curl localhost:8080` you'll get a nice Hello World!

#### Roadmap
- Create examples for advanced behaviors
- Setup testing
- SSL support
