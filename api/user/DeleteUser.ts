import {
    deleteUser,
    deleteUserInCognito,
    dynamodb,
    parseUserClaims,
} from "../common/AWSUtils";
import { createErrorResponse, createResponse } from "../common/Utils";
import { UserClaims } from "../models/dto/user/UserClaims";
import { ServiceLogger } from "../common/ServiceLogger";
import { Context } from "../common/Context";

const _ = require("lodash");

let tableName: string = process.env.DB_TABLE!;
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
            context.setClaims(userClaims);

            logger.debug(
                context,
                "user request :" + JSON.stringify(userClaims)
            );

            let userId = decodeURIComponent(event.pathParameters.user_id);

            if (userClaims.id != userId) {
                throw {
                    name: "ForbiddenException",
                    message: "Access denied. Insufficient privileges.",
                };
            }

            logger.debug(context, "deleting user in cognito");
            await deleteUserInCognito(userClaims.userName);

            let group: any[] = [];
            const deleteReq = {
                DeleteRequest: {
                    Key: {
                        pk: "USER#" + userClaims.id,
                        sk: "USER#" + userClaims.id,
                    },
                },
            };

            group.push(deleteReq);

            const params = {
                RequestItems: {
                    [tableName]: group,
                },
            };

            await dynamodb.batchWrite(params).promise();

            resolve(createResponse(context, 200));
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
