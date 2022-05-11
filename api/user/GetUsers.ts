import "reflect-metadata";
import { dynamodb, getHome, parseUserClaims } from "../common/AWSUtils";
import {
    createErrorResponse,
    createResponse,
    parseAndAddLimitQueryParamter,
    parseAndAddOrderQueryParamter,
} from "../common/Utils";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { UserClaims } from "../models/dto/user/UserClaims";
import { Role } from "../models/Role";
import { Home } from "../models/dao/Home";
import { GetUsersResponse } from "../models/dto/user/GetUsersResponse";
import { ServiceLogger } from "../common/ServiceLogger";
import { Context } from "../common/Context";
import QueryInput = DocumentClient.QueryInput;
import QueryOutput = DocumentClient.QueryOutput;

const _ = require("lodash");
const tableName = process.env.DB_TABLE;

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
            let userClaims: UserClaims = await parseUserClaims(
                event.requestContext?.authorizer?.jwt?.claims
            );
            context.setClaims(userClaims);

            logger.debug(
                context,
                "user request :" + JSON.stringify(userClaims)
            );

            if (!(userClaims.role == Role.ROOT || userClaims.home == homeId)) {
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

            let query = event.queryStringParameters;

            let params: QueryInput = {
                TableName: tableName!,
                IndexName: "home-gsi-2-index",
                KeyConditionExpression: "gsi2pk = :home",
                ExpressionAttributeValues: {
                    ":home": "HOME#" + homeId + "#USERS",
                },
                ScanIndexForward: true,
            };

            if (query) {
                parseAndAddOrderQueryParamter(context, query, params);
                parseAndAddLimitQueryParamter(context, query, params);

                if (query.after != undefined) {
                    // get the home entry from the database

                    let paramsAfter = {
                        TableName: tableName,
                        KeyConditionExpression:
                            "pk = :home_id AND sk = :user_id",
                        ExpressionAttributeValues: {
                            ":home_id": "HOME#" + homeId,
                            ":user_id": "USER#" + query.after,
                        },
                    };

                    let data: QueryOutput = await dynamodb
                        .query(paramsAfter)
                        .promise();
                    if (!_.isEmpty(data.Items)) {
                        let item = data.Items?.[0];
                        params.ExclusiveStartKey = {
                            gsi2pk: item?.gsi2pk,
                            gsi2sk: item?.gsi2sk,
                            pk: item?.pk,
                            sk: item?.sk,
                        };
                    } else {
                        resolve(createResponse(context, 404));
                        return;
                    }
                }
            }

            let data: QueryOutput = await dynamodb.query(params).promise();
            logger.debug(context, "dynamodb result :" + JSON.stringify(data));
            resolve(
                createResponse(context, 200, GetUsersResponse.fromDao(data))
            );
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
