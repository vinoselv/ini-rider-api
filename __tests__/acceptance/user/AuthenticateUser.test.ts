import "reflect-metadata";
import { classToPlain } from "class-transformer";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import {
    createAndGetUserId,
    getEmail,
    getRandomPassword,
} from "../TestUtils";
import { AuthenticateUserRequest } from "../../../api/models/dto/user/AuthenticateUserRequest";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { Context } from "../../../api/common/Context";

const nano = require("nanoid");
const { v4: uuidV4 } = require("uuid");

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const request = require("supertest");

describe("authenticate user integration tests", () => {
    let createUserRequest: CreateUserRequest;
    let userMap = new Map();
    let userId: string;
    let idToken: string;

    let applicationToken = (global as any).APPLICATION_TOKEN;
    let server = request((global as any).API_ENDPOINT);

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
            server,
            applicationToken,
            createUserRequest
        ).then((res) => {
            userId = res;
            expect(userId).toBeDefined();
        });
    });

    afterAll(async () => {
        for (let [key, value] of userMap) {
            logger.debug(context, "Deleting user " + key);
            await server
                .delete("/user/" + key)
                .set("Authorization", value)
                .expect(200);
            logger.debug(context, "Deleted user");
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

        return server
            .post("/user/authenticate")
            .set("Authorization", applicationToken)
            .send(classToPlain(authenticateUserRequest))
            .expect(200)
            .then((res) => {
                const body = res.body;
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

        return server
            .post("/user/authenticate")
            .send(classToPlain(authenticateUserRequest))
            .expect(401)
            .then((res) => {
                expect(res.body.message).toBe("Unauthorized");
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

        return server
            .post("/user/authenticate")
            .set("Authorization", "Invalid-Token")
            .send(classToPlain(authenticateUserRequest))
            .expect(401)
            .then((res) => {
                expect(res.body.message).toBe("Unauthorized");
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

        return server
            .post("/user/authenticate")
            .set("Authorization", applicationToken)
            .send(classToPlain(authenticateUserRequest))
            .expect(401)
            .then((res) => {
                expect(res.body.message).toBe("Unauthorized");
            });
    });
});
