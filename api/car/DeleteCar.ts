import { deleteCar, getCar, parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import { createErrorResponse, createResponse } from "../common/Utils";
import { Car } from "../models/dao/Car";

const _ = require("lodash");

let logger: ServiceLogger = new ServiceLogger();
let tableName: string = process.env.DB_TABLE!;
import awsUtils = require("../common/AWSUtils");
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

                let group: any[] = [];
                const deleteReq = {
                    DeleteRequest: {
                        Key: {
                            pk: car.pk,
                            sk: car.sk,
                        },
                    },
                };

                group.push(deleteReq);

                const params = {
                    RequestItems: {
                        [tableName]: group,
                    },
                };
            
                await awsUtils.dynamodb.batchWrite(params).promise();

                resolve(createResponse(context, 200));
            } else {
                resolve(createResponse(context, 404));
            }
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};