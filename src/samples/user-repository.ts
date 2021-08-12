import { injectable } from "tsyringe";

export interface UserEntry {
    name: string;
    age: number;
}

export interface User extends UserEntry {
    id: string;
}

export class UserNotFoundError extends Error {
    constructor(id: string) {
        super(`no user with id '${id}'`);
    }
}

@injectable()
export class UserRepository {
    private users: {[id: string]: UserEntry} = {
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

    getUsers(): User[] {
        return Object.keys(this.users).map(id => ({id, ...this.users[id]}));
    }

    getUser(id: string): User {
        if (!Object.keys(this.users).includes(id)) {
            throw new UserNotFoundError(id);
        }

        return {id, ...this.users[id]};
    }

    createOrUpdateUser(id: string, user: UserEntry): void {
        this.users[id] = user;
    }


    removeUser(id: string) {
        delete this.users[id];
    }
}