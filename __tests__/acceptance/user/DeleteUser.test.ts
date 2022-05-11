import { Context } from "../../../api/common/Context";
import { ServiceLogger } from "../../../api/common/ServiceLogger";
import { CreateUserRequest } from "../../../api/models/dto/user/CreateUserRequest";
import {
    authenticateUser,
    createAndGetUserId, getEmail,
    getRandomPassword
} from "../TestUtils";

const nano = require("nanoid");
const { v4: uuidV4 } = require("uuid");

let logger: ServiceLogger = new ServiceLogger();
let context: Context = new Context(uuidV4());

const request = require("supertest");

describe("delete user integration tests", () => {
    let createUserRequest: CreateUserRequest;
    let idToken: string;
    let userId: string;
    let homeId: string;

    let applicationToken = (global as any).APPLICATION_TOKEN;
    let server = request((global as any).API_ENDPOINT);

    beforeEach(() => {
        let name = nano.nanoid();
        createUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name),
            "dog"
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
            });
    });

    it("200 OK on deleting a user without home", () => {
        return server
            .delete("/user/" + userId)
            .set("Authorization", idToken)
            .expect(200);
    });
});
