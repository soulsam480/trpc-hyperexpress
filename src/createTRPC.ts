import { AnyRouter } from '@trpc/server';
import HyperExpress from 'hyper-express';
import {
  createHyperExpressHandler,
  HyperExpressOptions,
} from './hyperExpressHandler';

export function createTRPC<TRouter extends AnyRouter>(
  app: HyperExpress.Server,
  {
    prefix,
    ...rest
  }: HyperExpressOptions<TRouter, HyperExpress.Request, HyperExpress.Response>,
) {
  app.all(`${prefix ?? '/trpc'}/:path`, createHyperExpressHandler(rest));
}
