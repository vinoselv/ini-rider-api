import { createErrorResponse, createResponse } from "../common/Utils";
import { Role } from "../models/Role";
import {
    cognito,
    deleteUser,
    getHome,
    parseUserClaims,
} from "../common/AWSUtils";
import { AdminGetUserResponse } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { Home } from "../models/dao/Home";
import { ServiceLogger } from "../common/ServiceLogger";
import { Context } from "../common/Context";

const _ = require("lodash");

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

            let homeId = decodeURIComponent(event.pathParameters?.home_id!);
            let userId = decodeURIComponent(event.pathParameters?.user_id!);
            let userClaims = await parseUserClaims(
                event.requestContext?.authorizer?.jwt?.claims
            );
            context.setClaims(userClaims);

            logger.debug(context, "homeId: " + homeId);

            if (
                !(
                    userClaims.role == Role.ROOT ||
                    (userClaims.role == Role.OWNER && userClaims.home == homeId)
                )
            ) {
                throw {
                    name: "ForbiddenException",
                    message: "Access denied. Insufficient privileges.",
                };
            }

            if (userClaims.role == Role.OWNER && userClaims.id == userId) {
                throw {
                    name: "ForbiddenException",
                    message:
                        "Access denied. A owner cannot be removed from home.",
                };
            }

            let adminUserGetResponse: AdminGetUserResponse = await cognito
                .adminGetUser({
                    UserPoolId: process.env.USER_POOL_ID,
                    Username: userClaims.userName,
                })
                .promise();

            if (_.isEmpty(adminUserGetResponse)) {
                resolve(createResponse(context, 404));
                return;
            }

            let home: Home = await getHome(homeId);

            if (!_.isEmpty(home)) {
                const homeUser = home.users.find((u) => u.id === userId);

                if (!_.isEmpty(homeUser)) {
                    await deleteUser(home, userId, homeUser?.name!);
                } else {
                    resolve(createResponse(context, 404));
                    return;
                }
            } else {
                resolve(createResponse(context, 404));
                return;
            }

            resolve(createResponse(context, 200));
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
