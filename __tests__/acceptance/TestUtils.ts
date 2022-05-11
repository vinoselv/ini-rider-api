import "reflect-metadata";
import { CreateUserRequest } from "../../api/models/dto/user/CreateUserRequest";
import { classToPlain, plainToClass } from "class-transformer";
import { AuthenticateUserRequest } from "../../api/models/dto/user/AuthenticateUserRequest";
import { AuthenticateUserResponse } from "../../api/models/dto/user/AuthenticateUserResponse";
import { GetUserResponse } from "../../api/models/dto/user/GetUserResponse";
import { Context } from "../../api/common/Context";
import { ServiceLogger } from "../../api/common/ServiceLogger";

const nano = require("nanoid");
let logger: ServiceLogger = new ServiceLogger();

export {};

export async function createUser(
    context: Context,
    request: any,
    applicationToken: string
): Promise<CreateUserRequest> {
    expect(applicationToken).toBeDefined();
    return new Promise<CreateUserRequest>((resolve, reject) => {
        let name = nano.nanoid();
        let createUserRequest: CreateUserRequest = new CreateUserRequest(
            name,
            getRandomPassword(8),
            getEmail(name),
            "dog"
        );

        return request
            .post("/user")
            .set("Authorization", applicationToken)
            .set("X-Request-Id", context.requestId)
            .send(JSON.stringify(createUserRequest))
            .expect(200)
            .end(function (err, res) {
                if (err)
                    reject(
                        new Error(
                            "create user failed :" +
                                err +
                                ", " +
                                context.requestId
                        )
                    );
                resolve(createUserRequest);
            });
    });
}

export async function createAndGetUserId(
    context: Context,
    request: any,
    applicationToken: string,
    createUserRequest: CreateUserRequest
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        return request
            .post("/user")
            .set("Authorization", applicationToken)
            .send(classToPlain(createUserRequest))
            .expect(200)
            .end(function (err, res) {
                if (err)
                    reject(
                        new Error(
                            "create user failed :" +
                                err +
                                ", " +
                                context.requestId
                        )
                    );
                resolve(res.body.id);
            });
    });
}

export async function authenticateUser(
    request: any,
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

        request
            .post("/user/authenticate")
            .set("Authorization", applicationToken)
            .send(classToPlain(authenticateUserRequest))
            .expect(200)
            .then((res) => {
                let authenticationResult: AuthenticateUserResponse = plainToClass(
                    AuthenticateUserResponse,
                    res.body as Object
                );

                expect(authenticationResult.idToken).toBeDefined();
                expect(authenticationResult.refreshToken).toBeDefined();
                expect(authenticationResult.expiresIn).toBeDefined();
                resolve(authenticationResult.idToken!);
            })
            .catch((err) =>
                reject(new Error("authenticate user failed :" + err))
            );
    });
}

export async function getUserProfile(
    request: any,
    idToken: string
): Promise<GetUserResponse> {
    let res = await request.get("/user").set("Authorization", idToken).send();

    expect(res).toBeDefined();
    expect(res.statusCode).toBe(200);

    return plainToClass(GetUserResponse, res.body as Object);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRandomPassword(len: number): string {
    return "Test@123";
}

export function getEmail(name: string): string {
    return name + "@test.com";
}

export function getHome(name: string): string {
    return name + "-home";
}


export async function deleteUser(
    request: any,
    userId: string,
    idToken: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        request
            .delete("/user/" + userId)
            .set("Authorization", idToken)
            .send()
            .expect(200)
            .then(resolve())
            .catch((err) => reject(new Error("delete user failed :" + err)));
    });
}

export async function verifyGetUser(
    request: any,
    idToken: string,
    statusCode: number
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        request
            .get("/user")
            .set("Authorization", idToken)
            .expect(statusCode)
            .then(resolve())
            .catch((err) => reject(new Error("get user failed :" + err)));
    });
}

export async function getUser(request: any, idToken: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        request
            .get("/user")
            .set("Authorization", idToken)
            .expect(200)
            .then(resolve())
            .catch((err) => reject(new Error("get user failed :" + err)));
    });
}