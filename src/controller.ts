import { NextFunction, Router } from 'express';
import Express from 'express';
import { HttpAction, HttpActionEntry, HttpMethod } from './action';
import { Constructor } from './decorators';
import { httpActionsKey } from './meta-keys';
import { container as globalContainer, DependencyContainer } from 'tsyringe';
import { RequestEx } from './application';

type AddHandler = (router: Router, route: string, handler: HttpRequestHandler) => void;
type HttpRequestHandler = (req: Express.Request, resp: Express.Response, next: NextFunction) => void;

const addActionMap: {[method in HttpMethod]: AddHandler} = {
    'GET':    (router: Router, route: string, handler: HttpRequestHandler) => router.get(route, handler),
    'PUT':    (router: Router, route: string, handler: HttpRequestHandler) => router.put(route, handler),
    'POST':   (router: Router, route: string, handler: HttpRequestHandler) => router.post(route, handler),
    'PATCH':  (router: Router, route: string, handler: HttpRequestHandler) => router.patch(route, handler),
    'DELETE': (router: Router, route: string, handler: HttpRequestHandler) => router.delete(route, handler),
}

function getContainer(req: RequestEx): DependencyContainer {
    return req.container ?? globalContainer;
}

function wrapAction<T>(ctor: Constructor<T>, httpAction: HttpAction): HttpRequestHandler {
    return (req: Express.Request, resp: Express.Response, next: Express.NextFunction) => {
        const container = getContainer(req);
        const ctrl = container.resolve(ctor);
        try {
            const res = httpAction.execute(ctrl, req);
            if (res instanceof Promise) {
                res.then(v => resp.send(v));
                res.catch(err => next(err));
            } else {
                resp.send(res);
            }
        } catch (err) {
            next(err);
        }
    }
}

export function toRouter<T>(ctor: Constructor<T>): Router {
    const httpActionEntries: HttpActionEntry[] = Reflect.getOwnMetadata(httpActionsKey, ctor.prototype) ?? [];
    const router = Router();

    for(const httpActionEntry of httpActionEntries) {
        addActionMap[httpActionEntry.action.method](router, httpActionEntry.route, wrapAction(ctor, httpActionEntry.action));
    }

    return router;
}

export function addController<T>(router: Router, baseRoute: string, ctor: Constructor<T>, ...args: any[]) {
    const ctrlRouter = toRouter(ctor);
    router.use(baseRoute, ctrlRouter);
}