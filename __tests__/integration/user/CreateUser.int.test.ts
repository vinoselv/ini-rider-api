import "reflect-metadata";
import { classToPlain, plainToClass } from "class-transformer";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import { ErrorResponse } from "../../../api/models/dto/ErrorResponse";
import {
    getEmail,
    getRandomPassword,
} from "../../acceptance/TestUtils";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { Context } from "../../../api/common/Context";

const nano = require("nanoid");
const { v4: uuidV4 } =  require("uuid");
import { authenticateUser, createEvent, deleteUser } from "../TestUtils";

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const createUserHandler = require('../../../api/user/CreateUser');

describe("create user integration tests", () => {
    let userMap = new Map();
    let name = nano.nanoid();
    let userId: string;
    let idToken: string;

    let applicationToken = (global as any).APPLICATION_TOKEN;

    afterAll(async () => {
        for (let [key, value] of userMap) {
            await deleteUser(key, value);
        }
        userMap.clear();
    });

    it("200 OK with valid user inputs.", () => {
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name)
        );

        const event = createEvent(createUserRequest, applicationToken);
        return createUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                const body = JSON.parse(res.body);
                expect(body.id).toBeDefined();
                userId = body.id;
                expect(body.confirmed).toBe(true);
                return authenticateUser(
                    applicationToken,
                    createUserRequest.name,
                    createUserRequest.password
                );
            }).then((res) => {
                idToken = res;
                //userMap.set(userId, idToken);
            });
    });

    it("401 Unauthorised when authorisation header is missing.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name)
        );

        const event = createEvent(createUserRequest);
        return createUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(401);
                const body = JSON.parse(res.body);
                expect(body.message).toBe("Unauthorized");
            });
    });

    it("401 Unauthorised when authorisation header has invalid token.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name)
        );

        const event = createEvent(createUserRequest, "invalid-token");
        return createUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(401);
                const body = JSON.parse(res.body);
                expect(body.message).toBe("Unauthorized");
            });
    });

    it("400 with invalid password.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            "Test1234",
            getEmail(name)
        );

        const event = createEvent(createUserRequest, applicationToken);
        return createUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(400);
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    JSON.parse(res.body)
                );
                expect(errorResponse.type).toBe("ValidationException");
                let error: string[] = errorResponse.message;
                expect(error).toBeDefined();
                expect(error.length).toBe(1);
                expect(error[0]).toBe(
                    "password must contain at least 1 uppper case, 1 lower case, 1 special and 1 number."
                );
            });
    });

    it("400 with no password.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            undefined,
            getEmail(name)
        );
        const event = createEvent(createUserRequest, applicationToken);
        return createUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(400);
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    JSON.parse(res.body)
                );

                expect(errorResponse.type).toBe("ValidationException");
                let error: string[] = errorResponse.message;
                expect(error).toBeDefined();
                expect(error.length).toBe(5);
                error.includes("password should not be null or undefined");
                error.includes(
                    "password must contain at least 1 uppper case, 1 lower case, 1 special and 1 number."
                );
                error.includes(
                    "password must be longer than or equal to 8 characters"
                );
                error.includes("password should not be empty");
                error.includes("password must be a string");
            });
    });

    it("400 with invalid email.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            "Testgmail.com"
        );
        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        const event = createEvent(createUserRequest, applicationToken);
        return createUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(400);
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    JSON.parse(res.body)
                );
                expect(errorResponse.type).toBe("ValidationException");
                let error: string[] = errorResponse.message;
                expect(error).toBeDefined();
                expect(error.length).toBe(1);
                expect(error[0]).toBe("email must be an email");
            });
    });

    it("400 with no email.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            undefined
        );
        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        const event = createEvent(createUserRequest, applicationToken);
        return createUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(400);
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    JSON.parse(res.body)
                );
                expect(errorResponse.type).toBe("ValidationException");
                let error: string[] = errorResponse.message;
                expect(error).toBeDefined();
                expect(error.length).toBe(4);
                error.includes("email should not be null or undefined");
                error.includes("email should not be empty");
                error.includes("email must be a string");
                error.includes("email must be an email");
            });
    });
});
