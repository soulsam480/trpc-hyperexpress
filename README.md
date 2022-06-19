## tRPC-HyperExpress
> tRPC adapter for HyperExpress

[![codecov](https://codecov.io/gh/soulsam480/trpc-hyperexpress/branch/master/graph/badge.svg?token=oPOjxDkGWr)](https://codecov.io/gh/soulsam480/trpc-hyperexpress) [![Test](https://github.com/soulsam480/trpc-hyperexpress/actions/workflows/test.yml/badge.svg)](https://github.com/soulsam480/trpc-hyperexpress/actions/workflows/test.yml)


### Why ?
- [HyperExpress](https://github.com/kartikk221/hyper-express) is fast, like really fast and has much higher throughoutput than fastify. See the benchmarks
- I freaking love tRPC and the typesafety it brings.

### How ?
I just copied everything from [https://github.com/trpc/trpc/tree/main/packages/server/src/adapters/fastify](https://github.com/trpc/trpc/tree/main/packages/server/src/adapters/fastify). 


### Status 
This is far from being used in prod. This was built as a POC. I'll use this in Mirai and see if I can make is better as a lib. I'll also try to add some tests. Also uWebsockets.js is really good as a websockets server, so I'll try to harness the power with tRPC subscriptions. 

**TODO**
- [ ] Setup WS (tRPC subscriptions)
- [ ] more tests

### Credits
- All [tRPC](https://github.com/trpc) contributors and Sir [Alex](https://github.com/KATT) !. Thanks for creating this amazing piece of software. 
