import "reflect-metadata";
import { plainToClass } from "class-transformer";
import {
    createCognitoUser,
    dynamodb,
    getHome,
    parseUserClaims,
} from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import {
    createErrorResponse,
    createResponse,
    validateRequest,
} from "../common/Utils";
import { Home } from "../models/dao/Home";
import { User } from "../models/dao/User";
import { AddUserRequest } from "../models/dto/home/AddUserRequest";
import { CreateUserResponse } from "../models/dto/user/CreateUserResponse";
import { HomeUser } from "../models/HomeUser";
import { Role } from "../models/Role";

const tableName = process.env.DB_TABLE;
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

            let home: Home = await getHome(homeId);

            if (_.isEmpty(home)) {
                resolve(createResponse(context, 404));
                return;
            }

            let addUserRequest: AddUserRequest = plainToClass(
                AddUserRequest,
                JSON.parse(<string>event.body) as Object
            );

            logger.debug(context, "body :" + JSON.stringify(addUserRequest));
            if (addUserRequest.role == Role.ROOT) {
                throw {
                    name: "ForbiddenException",
                    message: "Access denied. ",
                };
            }
            await validateRequest(addUserRequest);

            let signUpResponse = await createCognitoUser(
                addUserRequest,
                homeId
            );
            logger.debug(
                context,
                "cognito result : " + JSON.stringify(signUpResponse)
            );

            home.users.push(
                HomeUser.from(
                    signUpResponse.UserSub,
                    addUserRequest.name,
                    addUserRequest.role
                )
            );

            // add the user to the home
            const params = {
                TableName: tableName,
                Key: {
                    pk: "HOME#" + homeId,
                    sk: "HOME#" + homeId,
                },
                UpdateExpression:
                    "set #users = :users, #updated_at = :updated_at",
                ExpressionAttributeNames: {
                    "#users": "users",
                    "#updated_at": "updated_at",
                },
                ExpressionAttributeValues: {
                    ":users": home.users,
                    ":updated_at": Date.now(),
                },
                ReturnValues: "ALL_NEW",
            };

            await dynamodb.update(params).promise();

            let dbUser = new User(
                signUpResponse.UserSub,
                addUserRequest.name,
                addUserRequest.email,
                '',
                new Date().toISOString()
            );

            // create the user and home to our internal database now
            logger.debug(context, "user: " + JSON.stringify(dbUser));
            const dynamoParams: any = {
                TransactItems: [
                    {
                        Put: {
                            TableName: tableName,
                            Item: dbUser,
                        },
                    },
                ],
                ConditionExpression:
                    "attribute_not_exists(pk) AND attribute_not_exists(sk)",
            };

            await dynamodb.transactWrite(dynamoParams).promise();

            resolve(
                createResponse(
                    context,
                    200,
                    CreateUserResponse.fromCognito(signUpResponse)
                )
            );
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
