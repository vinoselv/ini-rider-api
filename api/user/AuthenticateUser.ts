import "reflect-metadata";
import { AdminInitiateAuthResponse } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { plainToClass } from "class-transformer";
import { cognito } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import {
    createErrorResponse,
    createResponse,
    getApplicationClaims,
    validateRequest,
} from "../common/Utils";
import { ApplicationClaims } from "../models/dto/user/ApplicationClaims";
import { AuthenticateUserRequest } from "../models/dto/user/AuthenticateUserRequest";
import { AuthenticateUserResponse } from "../models/dto/user/AuthenticateUserResponse";

let logger: ServiceLogger = new ServiceLogger();
let context: Context;

exports.handler = async (event) => {
    return new Promise(async (resolve, reject) => {
        try {
            context = new Context(event.requestContext.requestId);
            logger.debug(
                context,
                "event.requestContext?.headers : " +
                    JSON.stringify(event.headers)
            );
            if (event.requestContext?.authorizer?.jwt?.claims == undefined) {
                throw {
                    name: "AuthenticationException",
                    message: "Application claim not found",
                };
            }

            let applicationClaims: ApplicationClaims = await getApplicationClaims(
                context,
                event.requestContext?.authorizer?.jwt?.claims
            );
            context.setClaims(applicationClaims);

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

            let authenticateUserRequest: AuthenticateUserRequest = plainToClass(
                AuthenticateUserRequest,
                JSON.parse(event.body) as Object,
                { excludeExtraneousValues: true }
            );
            await validateRequest(authenticateUserRequest);

            var params = {
                ClientId: process.env.USER_POOL_CLIENT_ID,
                AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                UserPoolId: process.env.USER_POOL_ID,
                AuthParameters: {
                    USERNAME: authenticateUserRequest.name,
                    PASSWORD: authenticateUserRequest.password,
                },
            };

            let authResult: AdminInitiateAuthResponse = await cognito
                .adminInitiateAuth(params)
                .promise();

            resolve(
                createResponse(
                    context,
                    200,
                    AuthenticateUserResponse.fromCognito(authResult)
                )
            );
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
