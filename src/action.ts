import { ParamProvider } from "./param-providers";
import { Request } from 'express';


export class Action {
    constructor(protected params: ParamProvider[], protected func: Function) {}

    execute(target: any, req: Request): any {
        const args = this.params.map(param => param.getParam(req));
        return this.func.apply(target, args);
    }
}

export type HttpMethod = 'GET' | 'PUT' | 'PATCH' | 'DELETE' | 'POST';

export abstract class HttpAction extends Action{
    abstract readonly method: HttpMethod
}

export class GetAction extends HttpAction {
    readonly method = 'GET';
}

export class PutAction extends HttpAction {
    readonly method = 'PUT';
}

export class PostAction extends HttpAction {
    readonly method = 'POST';
}

export class DeleteAction extends HttpAction {
    readonly method = 'DELETE';
}

export class PatchAction extends HttpAction {
    readonly method = 'PATCH';
}

export interface HttpActionEntry {
    route: string;
    action: HttpAction;
}
