import * as trpc from '@trpc/server';
import { TRPCError } from '@trpc/server';
import EventEmitter from 'events';
import HyperExpress from 'hyper-express';
import { z } from 'zod';
import {
  CreateHyperExpressContextOptions,
  createTRPC,
} from '../src/hyperExpressHandler';

const createContext = ({ req, res }: CreateHyperExpressContextOptions) => {
  const getUser = () => {
    if (req.headers.authorization !== 'secret') {
      return null;
    }
    return {
      name: 'alex',
    };
  };

  return {
    req,
    res,
    user: getUser(),
  };
};
type Context = trpc.inferAsyncReturnType<typeof createContext>;

function createRouter() {
  return trpc.router<Context>();
}

// --------- create procedures etc

let id = 0;

const ee = new EventEmitter();
const db = {
  posts: [
    {
      id: ++id,
      title: 'hello',
    },
  ],
  messages: [createMessage('initial message')],
};
function createMessage(text: string) {
  const msg = {
    id: ++id,
    text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  ee.emit('newMessage', msg);
  return msg;
}

const posts = createRouter()
  .mutation('create', {
    input: z.object({
      title: z.string(),
    }),
    resolve: ({ input }) => {
      const post = {
        id: ++id,
        ...input,
      };
      db.posts.push(post);
      return post;
    },
  })
  .query('list', {
    resolve: () => db.posts,
  });

const messages = createRouter()
  .query('list', {
    resolve: () => db.messages,
  })
  .mutation('add', {
    input: z.string(),
    resolve: async ({ input }) => {
      const msg = createMessage(input);

      db.messages.push(msg);

      return msg;
    },
  });

// root router to call
export const appRouter = createRouter()
  .query('hello', {
    input: z.string().nullish(),
    resolve: ({ input, ctx }) => {
      return `hello ${input ?? ctx.user?.name ?? 'world'}`;
    },
  })
  .merge('post.', posts)
  .merge(
    'admin.',
    createRouter().query('secret', {
      resolve: ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        if (ctx.user?.name !== 'alex') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return {
          secret: 'sauce',
        };
      },
    }),
  )
  .merge('messages.', messages);

export type AppRouter = typeof appRouter;

async function main() {
  const webserver = new HyperExpress.Server();

  webserver.use((req, _res, next) => {
    // request logger
    console.log('⬅️ ', req.method, req.path, req.body ?? req.query);

    next();
  });

  // Create GET route to serve 'Hello World'
  //   webserver.get('/trpc', (_, res) => {
  //     res.send('some');
  //   });

  webserver.get('/', (_, res) => {
    res.send('tRPC HyperExpress home');
  });

  createTRPC(webserver, {
    createContext,
    router: appRouter,
  });

  // Activate webserver by calling .listen(port, callback);
  webserver
    .listen(3005)
    .then(() => console.log('Webserver started on http://localhost:3000'))
    .catch(() =>
      console.log('Failed to start webserver on http://localhost:3000'),
    );
}

main();
