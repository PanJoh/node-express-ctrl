import { Body, Controller, Delete, FromParams, FromQuery, Get, Post } from "../decorators";
import Express from 'express';
import { addController } from "../controller";
import bodyParser from "body-parser";
import { NextFunction, Request, Response, Router } from "express";
import { container as globalContainer, inject, injectable, Lifecycle } from 'tsyringe';
import { createApp } from "../application";
import { User, UserNotFoundError, UserRepository } from "./user-repository";

const container = globalContainer.createChildContainer();
const app = createApp(container);

const UserCtrlNameSym = Symbol('user-controller-name');

@injectable()
class CalcService {
    add(a: number, b: number): number {
        return a + b;
    }

    sub(a: number, b: number): number {
        return a - b;
    }

    mult(a: number, b: number): number {
        return a * b;
    }

    div(a: number, b: number): number {
        return a / b;
    }
}

container.register<CalcService>(CalcService, CalcService, {lifecycle: Lifecycle.Singleton});
container.register<string>(UserCtrlNameSym, {useValue: 'user-controller'});
container.registerSingleton(UserRepository);

app.use(bodyParser.json());

interface UserDTO {
    name: string;
    age: number;
}

interface UserEntryDTO extends UserDTO {
    id: string;
}

interface StatusResponse {
    status: string;
    msg: string;
}

class HttpError extends Error {
    constructor(public statusCode: number, msg: string) {
        super(msg);
    }
}

class HttpNotFoundError extends HttpError {
    constructor(msg: string) {
        super(404, msg);
    }
}

class HttpInternalServerError extends HttpError {
    constructor(msg: string) {
        super(501, msg);
    }
}

const users: {[id: string]: UserDTO} = {
    '000001': {
        name: 'John',
        age: 43,
    },
    '000002': {
        name: 'Max',
        age: 15,
    },
    '000003': {
        name: 'George',
        age: 35,
    },
};

function delayAsync(millies: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), millies);
    });
}

type ToHttpError = (err: any) => HttpError;

@Controller
class UserController {
    private transformErrorMap: {[className: string]: ToHttpError} = {
        [UserNotFoundError.name]: (err) => {
            const notFoundError = err as UserNotFoundError;
            return new HttpNotFoundError(notFoundError.message);
        },
    };

    constructor(
        @inject(UserCtrlNameSym) private ctrlName: string,
        private userRepo: UserRepository,
    ) {}

    @Get('/')
    async getUsers(): Promise<User[]> {
        try {
            await delayAsync(4000);
            return this.userRepo.getUsers();
        } catch (err) {
            throw this.transformError(err);
        }
    }

    @Get('/hello')
    async getLog(@FromQuery('name') name: string): Promise<string> {
        try {
            await delayAsync(2000);
            return `hello ${name} from ${this.ctrlName}`;
        } catch (err) {
            throw this.transformError(err);
        }
    }

    @Get('/:id')
    getUser(@FromParams('id') userId: string): User {
        try {
            return this.userRepo.getUser(userId);
        } catch (err) {
            throw this.transformError(err);
        }
    }

    @Post('/:id')
    postUser(@FromParams('id') userId: string, @Body user: UserDTO): User {
        try {
            this.userRepo.createOrUpdateUser(userId, user);
            return {id: userId, ...user};
        } catch(err) {
            throw this.transformError(err);
        }
    }

    @Delete('/:id')
    deleteUser(@FromParams('id') userId: string): StatusResponse {
        try {
            this.userRepo.removeUser(userId);
            return {
                status: 'success',
                msg: `deleted user with id ${userId}`,
            };
        } catch(err) {
            throw this.transformError(err);
        }
    }

    transformError(err: any): HttpError {
        const transform = this.transformErrorMap[err.constructor.name];
        if (transform != null) {
            return transform(err);
        }

        if (err instanceof Error) {
            return new HttpInternalServerError(err.message);
        }

        return new HttpInternalServerError('unexpected error');
    }
}

interface CalcResultDTO {
    result: number;
}

@Controller
class CalculatorController {

    constructor(private calcService: CalcService) {}

    @Get('/add')
    async add(@FromQuery('a') a: string, @FromQuery('b') b: string): Promise<CalcResultDTO> {
        await delayAsync(1000);
        return { result: this.calcService.add(+a, +b)};
    }

    @Get('/sub')
    async sub(@FromQuery('a') a: string, @FromQuery('b') b: string): Promise<CalcResultDTO> {
        await delayAsync(1000);
        return { result: this.calcService.sub(+a, +b)};
    }

    @Get('/mult')
    async mult(@FromQuery('a') a: string, @FromQuery('b') b: string): Promise<CalcResultDTO> {
        await delayAsync(1000);
        return { result: this.calcService.mult(+a, +b)};
    }

    @Get('/div')
    async div(@FromQuery('a') a: string, @FromQuery('b') b: string): Promise<CalcResultDTO> {
        await delayAsync(1000);
        return { result: this.calcService.div(+a, +b)};
    }
}



function addApiControllers(router: Router) {
    addController(router, '/user', UserController);
    addController(router, '/calc', CalculatorController);
}

const apiRouter = Router();
addApiControllers(apiRouter);

app.use('/api', apiRouter);


app.use((err: any, _req: Request, resp: Response, next: NextFunction) => {
    if (err instanceof HttpError) {
        resp.status(err.statusCode).send({ status: 'ERROR', msg: err.message})
    } else {
        next(err);
    }
});


app.listen(3000, () => console.log('server listening on port 3000'));