import { resolveHTTPResponse } from '@trpc/server';
import type { AnyRouter, inferRouterContext } from '@trpc/server';
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPCreateContextOption,
} from '@trpc/server/dist/declarations/src/adapters/node-http';
import type {
  HTTPBaseHandlerOptions,
  HTTPRequest,
} from '@trpc/server/dist/declarations/src/http/internals/types';
import type HyperExpress from 'hyper-express';

export type HyperExpressOptions<
  TRouter extends AnyRouter,
  TRequest extends HyperExpress.Request,
  TResponse extends HyperExpress.Response,
> = HTTPBaseHandlerOptions<TRouter, TRequest> &
  NodeHTTPCreateContextOption<TRouter, TRequest, TResponse> & {
    prefix?: string;
  };

type HyperExpressHandlerOptions<
  TRouter extends AnyRouter,
  TRequest extends HyperExpress.Request,
  TResponse extends HyperExpress.Response,
> = HyperExpressOptions<TRouter, TRequest, TResponse>;

export type CreateHyperExpressContextOptions = NodeHTTPCreateContextFnOptions<
  HyperExpress.Request,
  HyperExpress.Response
>;

export function createHyperExpressHandler<TRouter extends AnyRouter>(
  opts: HyperExpressHandlerOptions<
    TRouter,
    HyperExpress.Request,
    HyperExpress.Response
  >,
) {
  return async (
    request: HyperExpress.Request,
    response: HyperExpress.Response,
  ) => {
    const createContext = async function _createContext(): Promise<
      inferRouterContext<TRouter>
    > {
      return opts.createContext?.({
        req: request,
        res: response,
      });
    };

    const path = request.params.path;

    const query = request.query
      ? new URLSearchParams(request.query as any)
      : new URLSearchParams(request.url!.split('?')[1]);

    const req: HTTPRequest = {
      query: query,
      method: request.method,
      headers: request.headers,
      body: (await request.json()) ?? 'null',
    };

    const result = await resolveHTTPResponse({
      req,
      createContext,
      path,
      router: opts.router,
      batching: opts.batching,
      responseMeta: opts.responseMeta,
      onError(o) {
        opts?.onError?.({ ...o, req: request });
      },
    });

    if (
      'status' in result &&
      (!response.statusCode || response.statusCode === 200)
    ) {
      response.status(result.status);
    }

    for (const [key, value] of Object.entries(result.headers ?? {})) {
      if (typeof value === 'undefined') {
        continue;
      }

      void response.header(key, value);
    }

    response.send(result.body);
  };
}

export function createTRPC<TRouter extends AnyRouter>(
  app: HyperExpress.Server,
  {
    prefix,
    ...rest
  }: HyperExpressHandlerOptions<
    TRouter,
    HyperExpress.Request,
    HyperExpress.Response
  >,
) {
  app.all(`${prefix ?? '/trpc'}/:path`, createHyperExpressHandler(rest));
}
