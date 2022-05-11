import { plainToClass } from "class-transformer";
import "reflect-metadata";
import {
    dynamodb, parseUserClaims
} from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import {
    createErrorResponse,
    createResponse,
    validateRequest
} from "../common/Utils";
import { Car, CarBuilder } from "../models/dao/Car";
import { CreateCarResponse } from "../models/dto/car/CreateCarResponse";
import { CreateCarRequest } from "../models/dto/car/CreateCarRequest";
import KSUID = require("ksuid");
const { v4: uuidV4 } =  require("uuid");

const tableName = process.env.DB_TABLE;
const _ = require("lodash");
import awsUtils = require("../common/AWSUtils");

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

            if (!userClaims.emailVerified) {
                throw {
                    name: "ForbiddenException",
                    message: "Access denied. User email not confirmed.",
                };
            }

            let ccr: CreateCarRequest = plainToClass(
                CreateCarRequest,
                JSON.parse(<string>event.body) as Object
            );

            logger.debug(
                context,
                "createCarRequest :" + JSON.stringify(ccr)
            );
            await validateRequest(ccr);


            let date: string = new Date().toISOString();
            let carId: string = KSUID.randomSync(new Date()).string;

            let car: Car = new CarBuilder()
                .setId(carId)
                .setDate(date)
                .setMake(ccr.make)
                .setModel(ccr.model)
                .setOwnerId(userClaims.id)
                .setRegistrationNumber(ccr.registrationNumber)
                .setThingy91ImeiNumber(ccr.thingy91ImeiNumber)
                .setYear(ccr.year)
                .build();
                
           logger.debug(context, "input user: " + JSON.stringify(car));
            const dynamoParams: any = {
                TransactItems: [
                    {
                        Put: {
                            TableName: tableName,
                            Item: car,
                            ConditionExpression:
                                "attribute_not_exists(pk) AND attribute_not_exists(sk)",
                        },
                    },
                ],
            };

            await dynamodb
                .transactWrite(dynamoParams)
                .promise()
                .catch((error) => {
                    if (error.message.includes("ConditionalCheckFailed")) {
                        throw {
                            name: "ForbiddenException",
                            message:
                                "The user has already registered a car.",
                        };
                    } else {
                        throw error;
                    }
                });

            logger.debug(context, "dynamodb write done");
            resolve(
                createResponse(context, 200, CreateCarResponse.fromDao(car))
            );
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
