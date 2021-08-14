import { DependencyContainer, container as globalContainer } from 'tsyringe';
import { Express as ExpressApp } from 'express-serve-static-core';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { RequestSym, ResponseSym } from './injection-syms';

export interface RequestEx extends Request {
    container?: DependencyContainer;
} 

export function addContainer(app: ExpressApp, container: DependencyContainer): void {
    app.use((req: Request, resp: Response, next: NextFunction) => {
        const reqContainer = container.createChildContainer();
        let reqEx = req as RequestEx;
        reqContainer.register<RequestEx>(RequestSym, {useValue: reqEx});
        reqContainer.register<Response>(ResponseSym, {useValue: resp});
        reqEx.container = reqContainer;
        next();
    });
}

export function createApp(container?: DependencyContainer): ExpressApp {
    const app = express();
    addContainer(app, container ?? globalContainer);
    return app;
}