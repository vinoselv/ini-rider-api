import { ServiceLogger } from "../../api/common/ServiceLogger";
import { Context } from "../../api/common/Context";
import { CreateUserRequest } from "../../api/models/dto/user/CreateUserRequest";
import { classToPlain, plainToClass } from "class-transformer";
import { getEmail, getRandomPassword } from "../acceptance/TestUtils";
import { AuthenticateUserRequest } from "../../api/models/dto/user/AuthenticateUserRequest";
import { CreateHomeRequest } from "../../api/models/dto/home/CreateHomeRequest";
import { AddUserRequest } from "../../api/models/dto/home/AddUserRequest";
import { Role } from "../../api/models/Role";
import { toNumber } from "lodash";
import { CreateTaskRequest } from "../../api/models/dto/task/CreateTaskRequest";
import { Category } from "../../api/models/Category";
import { UserEntity } from "../../api/models/UserEntity";
import { RepeatInterval } from "../../api/models/RepeatInterval";
import { TaskStatus } from "../../api/models/TaskStatus";

const nano = require("nanoid");
let logger: ServiceLogger = new ServiceLogger();

export {};

const eventGenerator = require("./EventGenerator");
const createUserHandler = require("../../api/user/CreateUser");
const authenticateUserHandler = require("../../api/user/AuthenticateUser");
const deleteUserHandler = require("../../api/user/DeleteUser");
const getUserHandler = require("../../api/user/GetUser");
const createHomeHandler = require("../../api/home/CreateHome");
const addUserHandler = require("../../api/user/AddUser");
const removeUserHandler = require("../../api/user/RemoveUser");
const createTaskHandler = require("../../api/task/CreateTask");

export function createEvent(
    body?: any,
    applicationToken?: string,
    pathParametersObject?: any
) {
    return eventGenerator({
        body: classToPlain(body),
        headers: {
            Authorization: applicationToken,
        },
        pathParametersObject: pathParametersObject,
    });
}

export async function createUser(
    context: Context,
    applicationToken: string
): Promise<CreateUserRequest> {
    expect(applicationToken).toBeDefined();
    return new Promise<CreateUserRequest>((resolve, reject) => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name)
        );

        const event = createEvent(createUserRequest, applicationToken);
        return createUserHandler.handler(event).then((res) => {
            expect(res).toBeDefined();
            expect(res.statusCode).toBe(200);
            resolve(createUserRequest);
        });
    });
}

export async function createAndGetUserId(
    context: Context,
    applicationToken: string,
    createUserRequest: CreateUserRequest
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const event = createEvent(createUserRequest, applicationToken);
        return createUserHandler.handler(event).then((res) => {
            expect(res).toBeDefined();
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.body);
            expect(body.id).toBeDefined();
            resolve(body.id);
        });
    });
}

export async function authenticateUser(
    applicationToken: string,
    userName: string,
    password: string
): Promise<string> {
    expect(applicationToken).toBeDefined();
    return new Promise<string>((resolve, reject) => {
        let authenticateUserRequest: AuthenticateUserRequest = new AuthenticateUserRequest(
            userName,
            password
        );

        const event = createEvent(authenticateUserRequest, applicationToken);
        return authenticateUserHandler
            .handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                const body = JSON.parse(res.body);
                expect(body.idToken).toBeDefined();
                expect(body.refreshToken).toBeDefined();
                expect(body.expiresIn).toBeDefined();
                resolve(body.idToken);
            })
            .catch((err) =>
                reject(new Error("authenticate user failed :" + err))
            );
    });
}

export async function deleteUser(
    userId: string,
    idToken: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const event = createEvent(undefined, idToken, {
            user_id: userId,
        });
        return deleteUserHandler
            .handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                resolve();
            })
            .catch((err) => reject(new Error("delete user failed :" + err)));
    });
}

export async function RemoveUser(
    userId: string,
    idToken: string,
    homeId: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const event = createEvent(undefined, idToken, {
            home_Id: homeId,
            user_id: userId,
        });
        return removeUserHandler
            .handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                resolve();
            })
            .catch((err) => reject(new Error("delete user failed :" + err)));
    });
}
export async function getUser(
    idToken: string,
    statusCode: number
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const event = createEvent(undefined, idToken);
        return getUserHandler
            .handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(statusCode);
                resolve();
            })
            .catch((err) => reject(new Error("get user failed :" + err)));
    });
}

export async function createHome(
    context: Context,
    idToken: string,
    createHomeRequest: CreateHomeRequest
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        logger.debug(
            context,
            "createHomeRequest: " + JSON.stringify(createHomeRequest)
        );

        const event = createEvent(classToPlain(createHomeRequest), idToken);
        return createHomeHandler
            .handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                const body = JSON.parse(res.body);
                expect(body.id).toBeDefined();
                resolve(body.id);
            })
            .catch((err) => reject(new Error("create home failed :" + err)));
    });
}

export async function addUserInHome(
    context: Context,
    idToken: string,
    homeId: string
): Promise<[string, AddUserRequest]> {
    return new Promise<[string, AddUserRequest]>((resolve, reject) => {
        let name = nano.nanoid();
        let role = Role.USER;
        let userId: string;

        let addUserInHomeRequest: AddUserRequest = new AddUserRequest(
            name,
            getRandomPassword(8),
            role
        );

        logger.debug(
            context,
            "AddUserInHome: " + JSON.stringify(addUserInHomeRequest)
        );

        const event = createEvent(classToPlain(addUserInHomeRequest), idToken, {
            home_id: homeId,
        });
        return addUserHandler
            .handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                expect(res.body.id).toBe(userId);
                const body = JSON.parse(res.body);
                resolve([body.id, addUserInHomeRequest]);
            })
            .catch((err) => reject(new Error("create user failed :" + err)));
    });
}

export async function createTask(
    context: Context,
    idToken: string,
    homeId: string,
    users: UserEntity[]
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name)
        );

        let taskName = createUserRequest.name + "Task1";

        function getDueDate(daysToAdd: number) {
            let dueDate = new Date();
            dueDate.setDate(new Date().getDate() + daysToAdd);
            return dueDate;
        }
        
        let createTaskRequest: CreateTaskRequest = new CreateTaskRequest(
            taskName,
            Category.SPORTS,
            getDueDate(10).toISOString(),
            users,
            RepeatInterval.DAILY,
            3
        );

        logger.debug(
            context,
            "CreateTaskRequest: " + JSON.stringify(createTaskRequest)
        );
        const event = createEvent(classToPlain(createTaskRequest), idToken, {
            home_id: homeId,
        });
        return createTaskHandler
            .handler(event)
            .then((res) => {
                const body = JSON.parse(res.body);
                expect(res.statusCode).toBe(200);
                expect(body.id).toBeDefined();
                resolve(body.id);
            })
            .catch((err) => reject(new Error("create task failed :" + err)));
    });
}
