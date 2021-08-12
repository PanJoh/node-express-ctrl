import 'reflect-metadata';
import { BodyProvider, FromBodyParamProvider, FromQueryParamProvider, RouteParamProvider } from './param-providers';
import { Action as ActionExecuter, DeleteAction, GetAction, HttpAction, HttpActionEntry, PatchAction, PostAction, PutAction } from './action';
import { httpActionsKey, paramsKey} from './meta-keys';
import { ParamProvider } from './param-providers';
import { injectable } from 'tsyringe';


type ParamDecorator = (target: Object, propertyKey: string | symbol, paramIndex: number) => void;

type MethodDecorator = (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => any>) => void;

type ParamMap = {[idx: number]: ParamProvider};

export function FromBody(param: string): ParamDecorator {
    return (target, propertyKey, paramIndex) => {
        let paramsMeta: ParamMap = Reflect.getOwnMetadata(paramsKey, target, propertyKey) ?? {};
        paramsMeta[paramIndex] = new FromBodyParamProvider(param);
        Reflect.defineMetadata(paramsKey, paramsMeta, target, propertyKey);
    }
}

export function FromQuery(param: string): ParamDecorator {
    return (target, propertyKey, paramIndex) => {
        let paramsMeta: ParamMap = Reflect.getOwnMetadata(paramsKey, target, propertyKey) ?? {};
        paramsMeta[paramIndex] = new FromQueryParamProvider(param);
        Reflect.defineMetadata(paramsKey, paramsMeta, target, propertyKey);
    }
}

export function FromParams(param: string): ParamDecorator {
    return (target, propertyKey, paramIndex) => {
        let paramsMeta: ParamMap = Reflect.getOwnMetadata(paramsKey, target, propertyKey) ?? {};
        paramsMeta[paramIndex] = new RouteParamProvider(param);
        Reflect.defineMetadata(paramsKey, paramsMeta, target, propertyKey);
    }
}

export function Body(target: Object, propertyKey: string, paramIndex: number): void {
    let paramsMeta: ParamMap = Reflect.getOwnMetadata(paramsKey, target, propertyKey) ?? {};
    paramsMeta[paramIndex] = new BodyProvider();
    Reflect.defineMetadata(paramsKey, paramsMeta, target, propertyKey);
}

function getParamProviders(target: Object, propertyName: string): ParamProvider[] {
    const nrParams = Reflect.getOwnMetadata("design:paramtypes", target, propertyName)?.length ?? 0;
    const paramsMeta: ParamMap = Reflect.getOwnMetadata(paramsKey, target, propertyName) ?? {};
    const providers: ParamProvider[] = [];
    for (let idx = 0; idx < nrParams; idx++) {
        let param = paramsMeta[idx];
        if (param == null) {
            throw new Error('no param');
        }

        providers.push(param);
    }

    return providers;
}
 

type CreateAction = (paramProviders: ParamProvider[], func: (...args: any[]) => any) => HttpAction;


function addHttpAction(
    route: string,
    target: Object,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: any) => any>,
    createAction: CreateAction,
): void {
    const paramProviders = getParamProviders(target, propertyName);
    const func = descriptor.value!;
    const action = createAction(paramProviders, func);
    const httpActions: HttpActionEntry[] = Reflect.getOwnMetadata(httpActionsKey, target) ?? [];
    httpActions.push({
        route,
        action,
    });

    Reflect.defineMetadata(httpActionsKey, httpActions, target);
}

export function Get(route: string): MethodDecorator {
    return (target, propertyKey, descriptor) => addHttpAction(
        route,
        target,
        propertyKey,
        descriptor,
        (paramProviders, func) => new GetAction(paramProviders, func),
    );
}

export function Put(route: string): MethodDecorator {
    return (target, propertyKey, descriptor) => addHttpAction(
        route,
        target,
        propertyKey,
        descriptor,
        (paramProviders, func) => new PutAction(paramProviders, func),
    );
}

export function Post(route: string): MethodDecorator {
    return (target, propertyKey, descriptor) => addHttpAction(
        route,
        target,
        propertyKey,
        descriptor,
        (paramProviders, func) => new PostAction(paramProviders, func),
    );
}

export function Delete(route: string): MethodDecorator {
    return (target, propertyKey, descriptor) => addHttpAction(
        route,
        target,
        propertyKey,
        descriptor,
        (paramProviders, func) => new DeleteAction(paramProviders, func),
    );
}

export function Patch(route: string): MethodDecorator {
    return (target, propertyKey, descriptor) => addHttpAction(
        route,
        target,
        propertyKey,
        descriptor,
        (paramProviders, func) => new PatchAction(paramProviders, func),
    );
}

export type Constructor<T> = new (...args: any[]) => T;

export function Controller<T extends Constructor<any>>(controller: T): void {
    injectable()(controller);
}