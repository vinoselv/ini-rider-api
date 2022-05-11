import "reflect-metadata";
import { classToPlain, plainToClass } from "class-transformer";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import {
    getEmail,
    getRandomPassword,
} from "../../acceptance/TestUtils";
import { AuthenticateUserRequest } from "../../../api/models/dto/user/AuthenticateUserRequest";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { Context } from "../../../api/common/Context";

const nano = require("nanoid");
const { v4: uuidV4 } =  require("uuid");
import { createAndGetUserId, createEvent, deleteUser } from "../TestUtils";
import { ErrorResponse } from "../../../api/models/dto/ErrorResponse";

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const request = require("supertest");

const authenticateUserHandler = require('../../../api/user/AuthenticateUser');

describe("authenticate user integration tests", () => {
    let createUserRequest: CreateUserRequest;
    let userMap = new Map();
    let userId: string;
    let idToken: string;

    let applicationToken = (global as any).APPLICATION_TOKEN;

    beforeAll(() => {
        let name = nano.nanoid();
        createUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name),
            "cat"
        );
        return createAndGetUserId(
            context,
            applicationToken,
            createUserRequest
        ).then((res) => {
            userId = res;
            expect(userId).toBeDefined();
        });
    });

    afterAll(async () => {
        for (let [key, value] of userMap) {
            await deleteUser(key, value);
        }
        userMap.clear();
    });

    it("200 OK with valid user credentials.", () => {
        // authenticate user
        let authenticateUserRequest: AuthenticateUserRequest = new AuthenticateUserRequest(
            createUserRequest.name,
            createUserRequest.password
        );

        logger.debug(
            context,
            "authenticateUserRequest: " +
                JSON.stringify(authenticateUserRequest)
        );

        const event = createEvent(authenticateUserRequest, applicationToken);
        return authenticateUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                const body = JSON.parse(res.body);
                expect(body.idToken).toBeDefined();
                idToken = body.idToken;
                expect(body.refreshToken).toBeDefined();
                expect(body.expiresIn).toBeDefined();
                userMap.set(userId, idToken);
            });
    });

    it("401 Unauthorised when authorisation header is missing", () => {
        // authenticate user
        let authenticateUserRequest: AuthenticateUserRequest = new AuthenticateUserRequest(
            createUserRequest.name,
            createUserRequest.password
        );

        logger.debug(
            context,
            "authenticateUserRequest: " +
                JSON.stringify(authenticateUserRequest)
        );

        const event = createEvent(authenticateUserRequest);
        return authenticateUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(401);
                const body = JSON.parse(res.body);
                expect(body.message).toBe("Unauthorized");
            });
    });

    it("401 Unauthorised when authorisation header has invalid token", () => {
        // authenticate user
        let authenticateUserRequest: AuthenticateUserRequest = new AuthenticateUserRequest(
            createUserRequest.name,
            createUserRequest.password
        );

        logger.debug(
            context,
            "authenticateUserRequest: " +
                JSON.stringify(authenticateUserRequest)
        );

        const event = createEvent(authenticateUserRequest, "Invalid-token");
        return authenticateUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(401);
                const body = JSON.parse(res.body);
                expect(body.message).toBe("Unauthorized");
            });
    });

    it("401 invalid password", () => {
        // authenticate user
        let authenticateUserRequest: AuthenticateUserRequest = new AuthenticateUserRequest(
            createUserRequest.name,
            "Test1234"
        );

        logger.debug(
            context,
            "authenticateUserRequest: " +
                JSON.stringify(authenticateUserRequest)
        );

        const event = createEvent(authenticateUserRequest, applicationToken);
        return authenticateUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(401);
                const body = JSON.parse(res.body);
                expect(body.message).toBe("Unauthorized");
            });       
    });
    it("404 invalid username", () => {
        // authenticate user
        let authenticateUserRequest: AuthenticateUserRequest = new AuthenticateUserRequest(
            "InvalidUser",
            "Test@1234"
        );

        logger.debug(
            context,
            "authenticateUserRequest: " +
                JSON.stringify(authenticateUserRequest)
        );

        const event = createEvent(authenticateUserRequest, applicationToken);
        return authenticateUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(404);
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    JSON.parse(res.body)
                );
                expect(errorResponse.type).toBe("UserNotFoundException");
                let error: string[] = errorResponse.message;
                expect(error).toBeDefined();
                expect(error.length).toBe(1);
                expect(error[0]).toBe("User does not exist.");
            });       
    });
});
