import "reflect-metadata";
import { classToPlain } from "class-transformer";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import {
    getEmail,
    getRandomPassword,
} from "../../acceptance/TestUtils";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { Context } from "../../../api/common/Context";

const nano = require("nanoid");
const { v4: uuidV4 } =  require("uuid");
import { authenticateUser, createAndGetUserId, createEvent, deleteUser } from "../TestUtils";

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const request = require("supertest");
const getUserHandler = require('../../../api/user/GetUser');

describe("get user integration tests", () => {
    let createUserRequest: CreateUserRequest;
    let idToken: string;
    let userMap = new Map();
    let name = nano.nanoid();
    let userId: string;

    let applicationToken = (global as any).APPLICATION_TOKEN;

    beforeAll(() => {
        let name = nano.nanoid();
        createUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name)
        );
        return createAndGetUserId(
            context,
            applicationToken,
            createUserRequest
        )
            .then((res) => {
                userId = res;
                return authenticateUser(
                    applicationToken,
                    createUserRequest.name,
                    createUserRequest.password
                );
            })
            .then((res) => {
                idToken = res;
                expect(idToken).toBeDefined();
                userMap.set(userId, idToken);
            });
    });

    afterAll(async () => {
        for (let [key, value] of userMap) {
            await deleteUser(key, value);
        }
        userMap.clear();
    });

    it("200 OK with valid id token", () => {
        logger.debug(context, "inside the test...");

        const event = createEvent(undefined, idToken);
        return getUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
                const body = JSON.parse(res.body);
                expect(body.name).toBe(createUserRequest.name);
                expect(body.email).toBe(createUserRequest.email);
                expect(body.enabled).toBe(true);
                expect(body.status).toBe("CONFIRMED");
            });
    });

    it("401 Unauthorised when invalid Token is used.", () => {
        const event = createEvent(undefined, "Invalid-token");
        return getUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(401);
                const body = JSON.parse(res.body);
                expect(body.message).toBe("Unauthorized");
            });
    });

    it("401 Unauthorised when no Token is used.", () => {
        const event = createEvent(undefined, undefined);
        return getUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(401);
                const body = JSON.parse(res.body);
                expect(body.message).toBe("Unauthorized");
            });
    });
});
