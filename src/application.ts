import { DependencyContainer } from 'tsyringe';
import { Express as ExpressApp } from 'express-serve-static-core';
import { Request, Response, NextFunction } from 'express';

export interface RequestEx extends Request {
    container?: DependencyContainer;
} 

export function addContainer(app: ExpressApp, container: DependencyContainer): void {
    app.use((req: Request, _resp: Response, next: NextFunction) => {
        let reqEx = req as RequestEx;
        reqEx.container = container;
        next();
    });
}