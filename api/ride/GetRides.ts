import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { dynamodb, parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import {
    createErrorResponse,
    createResponse,
    isDateAfterToday,
} from "../common/Utils";
import { GetRidesResponse } from "../models/dto/ride/GetRidesResponse";
import { UserClaims } from "../models/dto/user/UserClaims";
import { EntityType } from "../models/EntityType";
import QueryInput = DocumentClient.QueryInput;
import QueryOutput = DocumentClient.QueryOutput;

const _ = require("lodash");
const tableName = process.env.DB_TABLE_RIDES;

let logger: ServiceLogger = new ServiceLogger();
let context: Context;

exports.handler = (event) => {
    return new Promise(async (resolve, reject) => {
        try {
            context = new Context(event.requestContext.requestId);
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

            logger.debug(context, "user claims :" + JSON.stringify(userClaims));

            let params: QueryInput = {
                TableName: tableName!,
                IndexName: "gsi-2-index",
                KeyConditionExpression: "gsi2pk = :user",
                ExpressionAttributeValues: {
                    ":user": "USER#" + userClaims.id,
                },
                ScanIndexForward: true,
            };
    

            let data: QueryOutput = await dynamodb.query(params).promise();
            logger.debug(context, "dynamodb result :" + JSON.stringify(data));

            data.Items = data.Items?.filter(i => {
                if (i.type == EntityType.RIDE_OFFER) {
                    return  isDateAfterToday(i.rideStartTime as string);
                } else {
                    return isDateAfterToday(i.rideRequestTime as string);
                }   
            });
            

            resolve(
                createResponse(context, 200, GetRidesResponse.fromDao(data))
            );
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
