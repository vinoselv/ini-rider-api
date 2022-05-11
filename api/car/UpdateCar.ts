import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { plainToClass } from "class-transformer";
import "reflect-metadata";
import { dynamodb, getCar, parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import {
    createErrorResponse,
    createResponse,
    validateRequest
} from "../common/Utils";
import { Car } from "../models/dao/Car";
import { GetCarResponse } from "../models/dto/car/GetTaskResponse";
import { UpdateCarRequest } from "../models/dto/car/UpdateCarRequest";
import UpdateItemOutput = DocumentClient.UpdateItemOutput;

const _ = require("lodash");
const tableName = process.env.DB_TABLE;

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

            let userClaims = await parseUserClaims(
                event.requestContext?.authorizer?.jwt?.claims
            );
            context.setClaims(userClaims);

            let car: Car = await getCar(userClaims.id);

            if (!_.isEmpty(car)) {
                let ucr: UpdateCarRequest = plainToClass(
                    UpdateCarRequest,
                    JSON.parse(<string>event.body) as Object
                );

                await validateRequest(ucr);
                const params = {
                    TableName: tableName,
                    Key: {
                        pk: car.pk,
                        sk: car.sk,
                    },
                    UpdateExpression:
                        "set make = :make, " +
                        "model = :model, " +
                        "#year = :year, " +
                        "registrationNumber = :registrationNumber, " +
                        "thingy91ImeiNumber = :thingy91ImeiNumber", 
                    ExpressionAttributeNames: {
                        "#year": "year"
                    },    
                    ExpressionAttributeValues: {
                        ":make": ucr.make,
                        ":model": ucr.model,
                        ":year": ucr.year,
                        ":registrationNumber": ucr.registrationNumber,
                        ":thingy91ImeiNumber": ucr.thingy91ImeiNumber,
                    },
                    ReturnValues: "ALL_NEW",
                };

                let data: UpdateItemOutput = await dynamodb
                    .update(params)
                    .promise();
                logger.debug(context, "data : " + JSON.stringify(data));

                resolve(
                    createResponse(
                        context,
                        200,
                        GetCarResponse.fromDao(data.Attributes)
                    )
                );
            } else {
                resolve(createResponse(context, 404));
            }
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
