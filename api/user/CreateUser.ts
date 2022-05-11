import "reflect-metadata";
import { CreateUserRequest } from "../models/dto/user/CreateUserRequest";
import { plainToClass } from "class-transformer";
import {
    createErrorResponse,
    createResponse,
    getApplicationClaims,
    validateRequest,
} from "../common/Utils";
import { CreateUserResponse } from "../models/dto/user/CreateUserResponse";
import { createUserInCognito } from "../common/AWSUtils";
import { ApplicationClaims } from "../models/dto/user/ApplicationClaims";
import { ServiceLogger } from "../common/ServiceLogger";
import { Context } from "../common/Context";
import { User } from "../models/dao/User";

let logger: ServiceLogger = new ServiceLogger();
const tableName = process.env.DB_TABLE;
let logContext: Context;

import awsUtils = require("../common/AWSUtils");

exports.handler = async (event) => {
    return new Promise(async (resolve, reject) => {
        try {
            logContext = new Context(event.requestContext.requestId);
            logger.debug(
                logContext,
                "event.requestContext?.headers : " +
                    JSON.stringify(event.headers)
            );
            logger.debug(
                logContext,
                "event.requestContext?.authorizer : " +
                    JSON.stringify(event.requestContext?.authorizer)
            );
            if (event.requestContext?.authorizer?.jwt?.claims == undefined) {
                throw {
                    name: "AuthenticationException",
                    message: "Application claim not found",
                };
            }

            let applicationClaims: ApplicationClaims = await getApplicationClaims(
                logContext,
                event.requestContext?.authorizer?.jwt?.claims
            );
            logContext.setClaims(applicationClaims);

            if (
                applicationClaims.scope != "users/post" ||
                applicationClaims.clientId !=
                    process.env.USER_POOL_APPLICATION_CLIENT_ID
            ) {
                throw {
                    name: "AuthenticationException",
                    message: "Invalid applicationClaim",
                };
            }
            logger.debug(logContext, "body :" + event.body);

            let createUserRequest: CreateUserRequest = plainToClass(
                CreateUserRequest,
                JSON.parse(<string>event.body) as Object
            );

            await validateRequest(createUserRequest);

            let signUpResponse = await createUserInCognito(createUserRequest);
            logger.debug(
                logContext,
                "cognito result : " + JSON.stringify(signUpResponse)
            );

            let dbUser = new User(
                signUpResponse.UserSub,
                createUserRequest.name,
                createUserRequest.email,
                createUserRequest.iconKey,
                new Date().toISOString()
            );

            // create the user and home to our internal database now

            logger.debug(logContext, "input user: " + JSON.stringify(dbUser));
            const dynamoParams: any = {
                TransactItems: [
                    {
                        Put: {
                            TableName: tableName,
                            Item: dbUser,
                        },
                    },
                ],
            };

            const request = await awsUtils.dynamodb.transactWrite(dynamoParams);

            request.on('extractError', (resp) => {
                logger.debug(logContext, "error: " + resp.httpResponse.body.toString());
              });

            const res = await request.promise();

            logger.debug(logContext, "dynamodb write done" + res);

            resolve(
                createResponse(
                    logContext,
                    200,
                    CreateUserResponse.fromCognito(signUpResponse)
                )
            );
        }  
        catch (error) {
            logger.debug(logContext, "error: " + JSON.stringify(error.response));
            resolve(createErrorResponse(logContext, error));
        }
    });
};
