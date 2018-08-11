<p align="center">
  <a><img src="https://i.imgur.com/6BKD8jW.png"></a>
  <h2>Ritley JS</h2>
</p>

#### About
Ritley is a small package __with ZERO dependencies__ that allows you to create server-side applications in no time. You can define `Resources` as entities which handle requests to the server. Create as many instances as you need. Also you can extend (inherit) previous entities to build more complex behaviors.

The project is now separated in several parts that you may use as you see fit.

#### Get v1

This repo is intended to be a complete override of v1

You can check ritley-v1 [here](https://github.com/k1r0s/ritley-v1)

#### Features

- As fast as [fastify](https://github.com/fastify/fastify)
- Tiny
- Scalable
- Progressive
- High level extensions
- Easy to master

#### Packages

- @ritley/core: provides `BaseAdapter` and `AbstractResource`
- @ritley/standalone-adapter: provides the standalone adapter which will create a nodejs server and bind it to ritley
- @ritley/decorators: provides a set of useful abstractions that will reduce your codebase

> Why too many packages? maybe you don't like decorators or perhaps our abstractions doesn't fit for you so you don't want `@ritley/decorators`. Perhaps you're working with _Firebase_ so you don't need to create a nodejs instance yourself so you don't need `@ritley/standalone-adapter` pkg.

#### Philosophy

Ritley its just a wrapper of Node's default http package. You don't have to worry about learn another API but [this one](https://nodejs.org/api/http.html) that you may already known.

This library aims to provide a friendly development experience while you build scalable services using an API that you already know how to use within a sort of guidelines.

I strongly believe that OOP programming should be the mainframe when designing enterprise world applications. Ritley empowers this and is compatible with other Paradigms and Techniques, so you can/must use any other technique where its necessary like FP, FRP, AOP, and so on...

Ritley just provides the basics to sort and separate your code into domains as a logic placeholders and let you share only what you need.

Like React does, your resources will extend from `AbstractResource` to be able to listen calls having its first parameter on the constructor. You can ignore the constructor or simply override it by implementing `super(uri)` or by applying any reflection technique.

So this is pretty straightforward:

```javascript
const Ritley = require("@ritley/core");

// use an adapter (as we're going to create the
// node instance we use this one)
const Adapter = require("@ritley/standalone-adapter");

// initialize the adapter (start nodejs)
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

// create an instance without route (will listen any route starting with "/")
new DefaultResource;
// new DefaultResource("/cat"); // listen only /cat reqiests
```

_Adapters_ define how requests are sent to resources, _Resources_ define how requests are handled. In previous example `new Adapter(...)` instantiates an standalone adapter which will create a __nodejs instance__ and will bind forthcoming resources to listen request from it.

Now by doing `curl localhost:8080` you'll get a nice Hello World!

#### Roadmap
- ~~Setup testing~~
- Create examples for advanced behaviors
- SSL support
