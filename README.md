## tRPC-HyperExpress
> tRPC adapter for HyperExpress

### Why ?
- [HyperExpress](https://github.com/kartikk221/hyper-express) is fast, like really fast and has much higher throughoutput than fastify. See the benchmarks
- I freaking love tRPC and the typesafety it brings.

### How ?
I just copied everything from [https://github.com/trpc/trpc/tree/main/packages/server/src/adapters/fastify](https://github.com/trpc/trpc/tree/main/packages/server/src/adapters/fastify). 


### Status 
This is far from being used in prod. This was built as a POC. I'll use this in Mirai and see if I can make is better as a lib. I'll also try to add some tests. Also uWebsockets.js is really good as a websockets server, so I'll try to harness the power with tRPC subscriptions. 

### Credits
- All [tRPC](https://github.com/trpc) contributors and Sir [Alex](https://github.com/KATT) !. Thanks for creating this amazing piece of software. 