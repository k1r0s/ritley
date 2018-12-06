<p align="center">
  <a><img src="https://i.imgur.com/6BKD8jW.png"></a>
  <h2>Ritley JS</h2>
</p>

#### Table of Contents

- [about](https://github.com/k1r0s/ritley#about)
- [features](https://github.com/k1r0s/ritley#features)
- [packages](https://github.com/k1r0s/ritley#packages)
- [how it works](https://github.com/k1r0s/ritley#how-it-works)
- [alpha version](https://github.com/k1r0s/ritley#get-alpha)
- [philosophy](https://github.com/k1r0s/ritley#philosophy)
- [tutorial](https://github.com/k1r0s/ritley#tutorial)
- [roadmap](https://github.com/k1r0s/ritley#roadmap)

#### About
Ritley is a small package __with ZERO dependencies__ that allows you to create server-side applications in no time. You can define `Resources` as classes which handle requests to the server. Also you can extend (inherit) previous entities to build more complex behaviors.

The project is now separated in several parts that you may use as you see fit.

#### Features

- As fast as [fastify](https://github.com/fastify/fastify)
- Easy to master
- Scalable
- Tiny
- Progressive
- High level extensions

#### Packages

- [@ritley/core](https://www.npmjs.com/package/@ritley/core): provides `BaseAdapter`, `AbstractResource` and `setAdapter`
- [@ritley/standalone-adapter](https://www.npmjs.com/package/@ritley/standalone-adapter): provides the `StandaloneAdapter` which will create a nodejs server to handle forthcoming requests
- [@ritley/decorators](https://www.npmjs.com/package/@ritley/decorators): provides a set of useful abstractions that will reduce your codebase

> Why too many packages? maybe you don't like decorators or perhaps our abstractions doesn't fit for you so you don't want `@ritley/decorators`. Perhaps you're working with _Firebase_ so you don't need to create a nodejs instance yourself so you don't need `@ritley/standalone-adapter` pkg.

#### How it works

Ritley its just a wrapper of Node's default http package. You don't have to worry about learn another API but [this one](https://nodejs.org/api/http.html) that you may already known.

As you may know `http.createServer` returns an `http.Server` instance which you can subscribe for requests. Ritley basically distributes those requests within your _resources_ which are `AbstractResource` subclasses that you must implement. Each resource will either handle the request or not depending on the result of `AbstractResource::shouldHandle` method, which by default checks whether `<http.Request> request.url` starts with the uri associated with the _resource_. In other words. If you have instantiated a resource like this: `new AnyResourceSubClass("/person")`, that instance will handle all requests that start with "/person", ie: "/person/1", "/person?any=param", "/person/filter"...

_Adapters_ on the other hand define how _Resources_ receive upcoming requests. For example `@ritley/core` contains the `BaseAdapter`, which you have to manually call `handle` for every request. This adapter can be used on environments where you only have to subscribe for requests such as _Firebase_:

```javascript

const adapter = setAdapter(BaseAdapter);

exports.api = functions.https.onRequest((...args) => adapter.handle(...args));
```

In most cases, on raw environments you need to spawn a nodejs server. So `@ritley/standalone-adapter` provides it. This adapter will spawn a new nodejs server and will bind forthcoming requests to _Resources_.

So this is pretty straightforward:

```javascript
const { setAdapter, AbstractResource } = require("@ritley/core");

// use an adapter (as we're going to create the
// node instance we use this one)
const Adapter = require("@ritley/standalone-adapter");

// define the adapter (will start nodejs)
setAdapter(Adapter, {
  "port": 8080
});

// create a resource that listens get calls
class DefaultResource extends AbstractResource {
  get(req, res) {
    res.statusCode = 200;
    res.end("Hello World!");
  }
}

// create an instance without route (will listen any route starting with "/")
new DefaultResource;
// new DefaultResource("/cat"); // listen only /cat requests
```

Now by doing `curl localhost:8080` you'll get a nice Hello World!

#### Get alpha

This repo is intended to be a complete override of v1

You can check ritley-alpha [here](https://github.com/k1r0s/ritley-alpha)

#### Philosophy

This library aims to provide a friendly development experience while you build scalable services using an API that you already know how to use within a sort of guidelines.

I strongly believe that OOP programming should be the mainframe when designing enterprise world applications. Ritley empowers this and is compatible with other Paradigms and Techniques, so you can/must use any other technique where its necessary like FP, FRP, AOP, and so on...

Ritley just provides the basics to sort and separate your code into domains as a logic placeholders and let you share only what you need.

Like React does, your resources will extend from `AbstractResource` to be able to listen calls having its first parameter on the constructor. You can ignore the constructor or simply override it by implementing `super(uri)` or by applying any reflection technique.

#### Tutorial

- [series 1/3](https://dev.to/k1r0s/idiomatic-javascript-backend-part-1-4g0b)
- [series 2/3](https://dev.to/k1r0s/idiomatic-javascript-backend-part-2-4lhe)
- [series 3/3](https://dev.to/k1r0s/idiomatic-javascript-backend-part-3-1eii)
- [repo on series](https://github.com/k1r0s/ritley-tutorial)

#### Roadmap
- ~~Setup testing~~
- ~~Create examples for advanced behaviors~~
- SSL support (apache facade?)
- WebSocket support (another abstractclass?)
