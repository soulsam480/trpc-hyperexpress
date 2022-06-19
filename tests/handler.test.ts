import { inferAsyncReturnType, router } from '@trpc/server';
import { z } from 'zod';
import { CreateHyperExpressContextOptions, createTRPC } from '../src';
import HyperExpress from 'hyper-express';
import { createTRPCClient, HTTPHeaders } from '@trpc/client';
import AbortController from 'abort-controller';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import fetch from 'node-fetch';

const config = {
  port: 2022,
  logger: false,
  prefix: '/trpc',
};

function createContext({ req, res }: CreateHyperExpressContextOptions) {
  const user = { name: req.headers.username ?? 'anonymous' };
  return { req, res, user };
}

type Context = inferAsyncReturnType<typeof createContext>;

function createAppRouter() {
  const appRouter = router<Context>()
    .query('ping', {
      resolve() {
        return 'pong';
      },
    })
    .query('hello', {
      input: z
        .object({
          username: z.string().nullish(),
        })
        .nullish(),
      resolve({ input, ctx }) {
        return {
          text: `hello ${input?.username ?? ctx.user?.name ?? 'world'}`,
        };
      },
    })
    .mutation('post.edit', {
      input: z.object({
        id: z.string(),
        data: z.object({
          title: z.string(),
          text: z.string(),
        }),
      }),
      async resolve({ input, ctx }) {
        if (ctx.user.name === 'anonymous') {
          return { error: 'Unauthorized user' };
        }
        const { id, data } = input;
        return { id, ...data };
      },
    });

  return { appRouter };
}

type CreateAppRouter = inferAsyncReturnType<typeof createAppRouter>;
type AppRouter = CreateAppRouter['appRouter'];

interface ServerOptions {
  appRouter: AppRouter;
}

function createServer(opts: ServerOptions) {
  const instance = new HyperExpress.Server();

  createTRPC(instance, {
    router: opts.appRouter,
    prefix: config.prefix,
    createContext,
  });

  instance.get('/hello', async (_, res) => {
    res.json({ hello: 'GET' });
  });

  instance.post('/hello', async (req, res) => {
    try {
      const body = await req.json();

      res.json({ hello: 'POST', body });
    } catch (error) {
      res.status(500).json(error);
    }
  });

  function stop() {
    instance.close();
  }

  async function start() {
    try {
      await instance.listen(config.port);
    } catch (err) {
      console.log(err);
    }
  }

  return { instance, start, stop };
}

interface ClientOptions {
  headers?: HTTPHeaders;
}

function createClient(opts: ClientOptions = {}) {
  const host = `localhost:${config.port}${config.prefix}`;

  const client = createTRPCClient<AppRouter>({
    headers: opts.headers,
    AbortController: AbortController as any,
    fetch: fetch as any,
    links: [httpBatchLink({ url: `http://${host}` })],
  });

  return { client };
}

interface AppOptions {
  clientOptions?: ClientOptions;
  serverOptions?: Partial<ServerOptions>;
}

function createApp(opts: AppOptions = {}) {
  const { appRouter } = createAppRouter();

  const { instance, start, stop } = createServer({
    ...(opts.serverOptions ?? {}),
    appRouter,
  });

  const { client } = createClient(opts.clientOptions);

  return { server: instance, start, stop, client };
}

let app: inferAsyncReturnType<typeof createApp>;

describe('anonymous user', () => {
  beforeEach(async () => {
    app = createApp();
    await app.start();
  });

  afterEach(async () => {
    await app.stop();
  });

  test('fetch POST', async () => {
    const data = { text: 'life', life: 42 };
    const req = await fetch(`http://localhost:${config.port}/hello`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    // body should be object
    expect(await req.json()).toMatchObject({
      body: {
        life: 42,
        text: 'life',
      },
      hello: 'POST',
    });
  });

  test('query', async () => {
    expect(await app.client.query('ping')).toMatchSnapshot(`"pong"`);
    expect(await app.client.query('hello')).toMatchObject({
      text: 'hello anonymous',
    });
    expect(
      await app.client.query('hello', {
        username: 'test',
      }),
    ).toMatchObject({
      text: 'hello test',
    });
  });

  test('mutation', async () => {
    expect(
      await app.client.mutation('post.edit', {
        id: '42',
        data: { title: 'new_title', text: 'new_text' },
      }),
    ).toMatchObject({
      error: 'Unauthorized user',
    });
  });
});

describe('authorized user', () => {
  beforeEach(async () => {
    app = createApp({ clientOptions: { headers: { username: 'nyan' } } });
    await app?.start();
  });

  afterEach(async () => {
    app?.stop();
  });

  test('query', async () => {
    expect(await app.client.query('hello')).toMatchObject({
      text: 'hello nyan',
    });
  });

  test('mutation', async () => {
    expect(
      await app.client.mutation('post.edit', {
        id: '42',
        data: { title: 'new_title', text: 'new_text' },
      }),
    ).toMatchObject({
      id: '42',
      text: 'new_text',
      title: 'new_title',
    });
  });
});
