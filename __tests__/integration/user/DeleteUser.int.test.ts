import { CreateHomeRequest } from "../../../api/models/dto/home/CreateHomeRequest";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import { SubscriptionLevel } from "../../../api/models/SubscriptionLevel";
import {
    getEmail,
    getRandomPassword,
} from "../../acceptance/TestUtils";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { Context } from "../../../api/common/Context";

const nano = require("nanoid");
const { v4: uuidV4 } =  require("uuid");
import { authenticateUser, createAndGetUserId, createEvent, createHome, deleteUser, getUser } from "../TestUtils";

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const request = require("supertest");

const deleteUserHandler = require('../../../api/user/DeleteUser');

describe("delete user integration tests", () => {
    let createUserRequest: CreateUserRequest;
    let idToken: string;
    let userId: string;
    let homeId: string;
    let createHomeRequest: CreateHomeRequest;

    let applicationToken = (global as any).APPLICATION_TOKEN;
    let server = request((global as any).API_ENDPOINT);

    beforeEach(() => {
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
            });
    });

    it("200 OK on deleting a user without home", () => {
        const event = createEvent(undefined, idToken, {
            user_id: userId
        });
        return deleteUserHandler.handler(event)
            .then((res) => {
                expect(res).toBeDefined();
                expect(res.statusCode).toBe(200);
            });
    });

    it("200 OK on deleting a user with home", () => {
        let subscriptionLevel = SubscriptionLevel.BASIC;
        let name = "ini";

        createHomeRequest = new CreateHomeRequest(subscriptionLevel, name);

        return createHome(context, idToken, createHomeRequest)
            .then((res) => {
                homeId = res;
                return authenticateUser(
                    applicationToken,
                    createUserRequest.name,
                    createUserRequest.password
                );
            })
            .then((res) => {
                idToken = res;
                return deleteUser(userId, idToken);
            })
            .then(() => {
                return getUser(idToken, 404);
            });
    });
});
