import { Request } from 'express';

export interface ParamProvider {
    getParam(req: Request): any;
}

export class FromBodyParamProvider implements ParamProvider {
    constructor(private prop: string){}

    getParam(req: Request): any {
        return req.body?.[this.prop];
    }
}

export class FromQueryParamProvider implements ParamProvider {
    constructor(private param: string) {}

    getParam(req: Request): any {
        return req.query?.[this.param];
    }
}

export class RouteParamProvider implements ParamProvider {
    constructor(private param: string) {}

    getParam(req: Request): any {
        return req.params?.[this.param]
    }
}

export class BodyProvider implements ParamProvider {
    getParam(req: Request): any {
        return req.body;
    }
}