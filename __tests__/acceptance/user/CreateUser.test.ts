import "reflect-metadata";
import { classToPlain, plainToClass } from "class-transformer";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import { ErrorResponse } from "../../../api/models/dto/ErrorResponse";
import {
    authenticateUser,
    getEmail,
    getRandomPassword,
} from "../TestUtils";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { Context } from "../../../api/common/Context";

const nano = require("nanoid");
const { v4: uuidV4 } = require("uuid");

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const request = require("supertest");

describe("create user integration tests", () => {
    let userMap = new Map();
    let name = nano.nanoid();
    let userId: string;
    let idToken: string;
    let applicationToken = (global as any).APPLICATION_TOKEN;
    let server = request((global as any).API_ENDPOINT);

    afterAll(async () => {
        for (let [key, value] of userMap) {
            logger.debug(context, "Deleting user " + key);
            await server
                .delete("/user/" + key)
                .set("Authorization", value)
                .expect(200);
        }
        userMap.clear();
    });

    it("200 OK with valid user inputs.", () => {
        logger.debug(context, "name: " + name);

        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name),
            "cat"
        );

        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        return server
            .post("/user")
            .set("Authorization", applicationToken)
            .send(classToPlain(createUserRequest))
            .expect(200)
            .then((res) => {
                const body = res.body;
                expect(body.id).toBeDefined();
                userId = body.id;
                expect(body.confirmed).toBe(true);
                return authenticateUser(
                    server,
                    applicationToken,
                    createUserRequest.name,
                    createUserRequest.password
                );
            })
            .then((res) => {
                idToken = res;
                userMap.set(userId, idToken);
            });
    });

    it("401 Unauthorised when authorisation header is missing.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name),
            "cat"
        );

        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        return server
            .post("/user")
            .send(classToPlain(createUserRequest))
            .expect(401)
            .then((res) => {
                logger.debug(context, "res : " + JSON.stringify(res.body));
                expect(res.body.message).toBe("Unauthorized");
            });
    });

    it("401 Unauthorised when authorisation header has invalid token.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name),
            "cat"
        );

        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        return server
            .post("/user")
            .set("Authorization", "invalid-token")
            .send(classToPlain(createUserRequest))
            .expect(401)
            .then((res) => {
                expect(res.body.message).toBe("Unauthorized");
            });
    });

    it("400 with invalid password.", () => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            "Test1234",
            getEmail(name),
            "cat"
        );
        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        return server
            .post("/user")
            .set("Authorization", applicationToken)
            .send(classToPlain(createUserRequest))
            .expect(400)
            .then((res) => {
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    res.body as Object
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
            "",
            getEmail(name),
            "cat"
        );
        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        return server
            .post("/user")
            .set("Authorization", applicationToken)
            .set("X-Request-Id", context.requestId)
            .send(classToPlain(createUserRequest))
            .expect(400)
            .then((res) => {
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    res.body as Object
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
            "Testgmail.com",
            "cat"
        );
        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        return server
            .post("/user")
            .set("Authorization", applicationToken)
            .send(classToPlain(createUserRequest))
            .expect(400)
            .then((res) => {
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    res.body as Object
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
            "",
            "cat"
        );
        logger.debug(
            context,
            "createUserRequest: " + JSON.stringify(createUserRequest)
        );

        return server
            .post("/user")
            .set("Authorization", applicationToken)
            .send(classToPlain(createUserRequest))
            .expect(400)
            .then((res) => {
                let errorResponse: ErrorResponse = plainToClass(
                    ErrorResponse,
                    res.body as Object
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
