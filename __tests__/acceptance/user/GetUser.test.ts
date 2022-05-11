import "reflect-metadata";
import { classToPlain } from "class-transformer";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import {
    authenticateUser,
    createAndGetUserId,
    getEmail,
    getRandomPassword,
} from "../TestUtils";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { Context } from "../../../api/common/Context";

const nano = require("nanoid");
const { v4: uuidV4 } =  require("uuid");

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const request = require("supertest");

describe("get user integration tests", () => {
    let createUserRequest: CreateUserRequest;
    let idToken: string;
    let userMap = new Map();
    let name = nano.nanoid();
    let userId: string;

    let applicationToken = (global as any).APPLICATION_TOKEN;
    let server = request((global as any).API_ENDPOINT);

    beforeAll(() => {
        let name = nano.nanoid();
        createUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name)
        );
        return createAndGetUserId(
            context,
            server,
            applicationToken,
            createUserRequest
        )
            .then((res) => {
                userId = res;
                return authenticateUser(
                    server,
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
            logger.debug(context, "Deleting user " + key);
            await server
                .delete("/user/" + key)
                .set("Authorization", value)
                .expect(200);
            logger.debug(context, "Deleted user");
        }
        userMap.clear();
    });

    it("200 OK with valid id token", () => {
        logger.debug(context, "inside the test...");

        return server
            .get("/user")
            .set("Authorization", idToken)
            .expect(200)
            .then((res) => {
                const body = res.body;
                expect(body.name).toBe(createUserRequest.name);
                expect(body.email).toBe(createUserRequest.email);
                expect(body.enabled).toBe(true);
                expect(body.status).toBe("CONFIRMED");
            });
    });
    it("401 Unauthorised when invalid Token is used.", () => {
        return server
            .get("/user")
            .set("Authorization", "Invalid-Token")
            .send(classToPlain(createUserRequest))
            .expect(401)
            .then((res) => {
                expect(res.body.message).toBe("Unauthorized");
            });
    });
});
