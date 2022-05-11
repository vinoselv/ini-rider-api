import "reflect-metadata";
import { AdminGetUserResponse } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { cognito, getUser, parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import { createErrorResponse, createResponse } from "../common/Utils";
import { User } from "../models/dao/User";
import { GetUserResponse } from "../models/dto/user/GetUserResponse";
import { UserClaims } from "../models/dto/user/UserClaims";

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
                    message: "user claim not found",
                };
            }
            let userClaims: UserClaims = await parseUserClaims(
                event.requestContext?.authorizer?.jwt?.claims
            );
            console.log("uc: " + JSON.stringify(userClaims));
            context.setClaims(userClaims);
            logger.debug(
                context,
                "user request :" + JSON.stringify(userClaims)
            );

            let response: GetUserResponse;

            let user: User = await getUser(userClaims.id);
            response = GetUserResponse.fromDao(user);

            resolve(createResponse(context, 200, response));
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
