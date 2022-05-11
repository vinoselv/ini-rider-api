import { createErrorResponse, createResponse } from "../common/Utils";
import { deleteRide, getRideByUser, getRideOffer, parseUserClaims } from "../common/AWSUtils";
import { ServiceLogger } from "../common/ServiceLogger";
import { Context } from "../common/Context";
import { EntityType } from "../models/EntityType";
import { RideStatus } from "../models/RideStatus";
import awsUtils = require("../common/AWSUtils");

const _ = require("lodash");

let logger: ServiceLogger = new ServiceLogger();
let context: Context;
let rideTableName: string = process.env.DB_TABLE_RIDES!;

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

            let rideId = decodeURIComponent(event.pathParameters.ride_id);
            let userClaims = await parseUserClaims(
                event.requestContext?.authorizer?.jwt?.claims
            );
            context.setClaims(userClaims);

            let ride: any = await getRideByUser(userClaims.id, rideId);
            
            if (!_.isEmpty(ride)) {       
                
                if (ride.rideStatus == RideStatus.RIDE_COMPLETED) {
                    throw {
                        name: "ValidationException",
                        message: "The ride is marked as completed already.",
                    };
                }


                if (ride.creator.id != userClaims.id) {
                    throw {
                        name: "ForbiddenException",
                        message: "Access denied. Insufficient privileges.",
                    };
                }

                // if a accepted ride request is cancelled, adjust the passengers allowed in the ride offer 
                if(ride.type == EntityType.RIDE_REQUEST && ride.rideStatus == RideStatus.REQUEST_ACCEPTED) {
                    let ro: any = await getRideOffer(ride.rideOfferId);
                    
                    const updateParams = {
                        TableName: rideTableName,
                        Key: {
                            hashKey: ro.hashKey,
                            rangeKey: ro.rangeKey,
                        },
                        UpdateExpression: "set passengersAccepted = if_not_exists(passengersAccepted, :start) - :passengersRequested, updatedAt = :updatedAt",
                        ExpressionAttributeValues: {
                            ":passengersRequested": ride.passengersRequested,
                            ":start": 0,
                            ":updatedAt": new Date().toISOString()
                        },
                        ReturnValues: "ALL_NEW",
                    };

                    await awsUtils.dynamodb.update(updateParams).promise();
                }

                await deleteRide(ride);

                resolve(createResponse(context, 200));
            } else {
                resolve(createResponse(context, 404));
            }
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};
