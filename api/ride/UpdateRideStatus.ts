import { plainToClass } from "class-transformer";
import "reflect-metadata";
import { parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import {
    createErrorResponse,
    createResponse,
    validateRequest
} from "../common/Utils";
import { UpdateRideStatusRequest } from "../models/dto/ride/UpdateRideStatusRequest";
import { EntityType } from "../models/EntityType";
import { RideStatus } from "../models/RideStatus";

const KSUID = require('ksuid')
import awsUtils = require("../common/AWSUtils");
import AWS = require("aws-sdk");
import { RideRequestMetaData } from "../models/RideRequestMetaData";
import { Car } from "../models/dao/Car";

let rideTableName: string = process.env.DB_TABLE_RIDES!;
let tableName: string = process.env.DB_TABLE!;
let locationTableName: string = process.env.DB_TABLE_LOCATION!;
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

            let urs: UpdateRideStatusRequest = plainToClass(
                UpdateRideStatusRequest,
                JSON.parse(<string>event.body) as Object
            );

            logger.debug(
                context,
                "updateRideStatusRequest :" + JSON.stringify(urs)
            );
            await validateRequest(urs);
            let transactionItems: any[] = [];

            if (urs.type == EntityType.RIDE_OFFER) {
                let ro: any = await awsUtils.getRideOffer(urs.id);

                if (_.isEmpty(ro)) {
                    throw {
                        name: "ValidationException",
                        message: "Invalid ride offer id.",
                    };
                } else if (ro.creator.id != userClaims.id) {
                    // ride offer status can only be updated the creator
                    throw {
                        name: "ForbiddenException",
                        message: "Access denied. A ride offer can only be updated by the creator.",
                    };
                } else if (ro.rideStatus == RideStatus.RIDE_COMPLETED) {
                    throw {
                        name: "ValidationException",
                        message: "The ride is marked as completed already.",
                    };
                } else if (ro.rideStatus == urs.rideStatus) {
                    throw {
                        name: "ValidationException",
                        message: "The ride is already in the same status.",
                    };
                }

                logger.debug(
                    context,
                    "trying to update the ride offer"
                );
                transactionItems.push({
                    Update: {
                        TableName: rideTableName,
                        Key: {
                            hashKey: ro.hashKey,
                            rangeKey: ro.rangeKey,
                        },
                        UpdateExpression: "set rideStatus = :rideStatus, updatedAt = :updatedAt",
                        ExpressionAttributeValues: {
                            ":rideStatus": urs.rideStatus,
                            ":updatedAt": Date.now(),
                        },
                    },
                });


                //await awsUtils.dynamodb.update(updateParams).promise();
                if (urs.rideStatus == RideStatus.RIDE_COMPLETED) {
                    // update the ride creator user stats
                    transactionItems.push({
                        Update: {
                            TableName: tableName,
                            Key: {
                                pk: "USER#" + ro.creator.id,
                                sk: "USER#" + ro.creator.id,
                            },
                            UpdateExpression: "set ridesOffered = if_not_exists(ridesOffered, :start) + :ridesOffered, updatedAt = :updatedAt",
                            ExpressionAttributeValues: {
                                ":ridesOffered": 1,
                                ":start": 0,
                                ":updatedAt": new Date().toISOString()
                            },
                        },
                    });

                    // filter to select only the accpeted requests
                    let accpetedRideRequests: RideRequestMetaData[] = ro.rideRequests.filter(r => r.rideStatus == RideStatus.RIDE_ONGOING);

                    logger.debug(
                        context,
                        "The ride has " + accpetedRideRequests?.length + " ongoing ride requests"
                    );

                    if (accpetedRideRequests?.length > 0) {
                        // get the user's thingy 91 IMEI number to add the topic mappings for the ride
                        let car: Car = await awsUtils.getCar(userClaims.id);

                        if (_.isEmpty(car)) {
                            throw {
                                name: "ForbiddenException",
                                message: "A ride cannot be marked as ongoing without registering a car.",
                            };

                        }

                        transactionItems.push({
                            Delete: {
                                TableName: locationTableName,
                                Key: {
                                    "pk": "CAR_IMEI#" + car.thingy91ImeiNumber.toString(),
                                    "sk": "RIDE_OFFER#" + ro.id
                                },
                            },

                        });
                    } else {
                        logger.debug(
                            context,
                            "The ride has no accepted ride requests"
                        );
                    }


                } else if (urs.rideStatus == RideStatus.RIDE_ONGOING) {
                    // find the approved ride requests and update the status
                    //let rideRequests: RideRequestMetaData[] = await awsUtils.getRideRequests(ro.id);

                    // filter to select only the accpeted requests
                    let accpetedRideRequests: RideRequestMetaData[] = ro.rideRequests.filter(r => r.rideStatus == RideStatus.REQUEST_ACCEPTED);

                    logger.debug(
                        context,
                        "The ride has " + accpetedRideRequests?.length + " accepted ride requests"
                    );

                    if (accpetedRideRequests?.length > 0) {
                        // update the status of the ride requests to ongoing
                        for (let arr of accpetedRideRequests) {
                            let data: any = await awsUtils.getRideRequest(arr.id, urs.id);

                            transactionItems.push({
                                Update: {
                                    TableName: rideTableName,
                                    Key: {
                                        hashKey: data.hashKey,
                                        rangeKey: data.rangeKey,
                                    },
                                    UpdateExpression: "set rideStatus = :rideStatus, updatedAt = :updatedAt",
                                    ExpressionAttributeValues: {
                                        ":rideStatus": urs.rideStatus,
                                        ":updatedAt": new Date().toISOString()
                                    },
                                },
                            });

                        }

                        // get the user's thingy 91 IMEI number to add the topic mappings for the ride
                        let car: Car = await awsUtils.getCar(userClaims.id);

                        if (_.isEmpty(car)) {
                            throw {
                                name: "ForbiddenException",
                                message: "A ride cannot be marked as ongoing without registering a car.",
                            };
                        }

                        transactionItems.push({
                            Put: {
                                TableName: locationTableName,
                                Item: {
                                    "pk": "CAR_IMEI#" + car.thingy91ImeiNumber.toString(),
                                    "sk": "RIDE_OFFER#" + ro.id
                                },
                            },

                        });
                    } else {
                        logger.debug(
                            context,
                            "The ride has no accepted ride requests"
                        );
                    }
                }

            } else if (urs.type == EntityType.RIDE_REQUEST) {
                let ro: any = await awsUtils.getRideOffer(urs.rideOfferId);
                if (_.isEmpty(ro)) {
                    throw {
                        name: "ValidationException",
                        message: "Invalid ride offer id.",
                    };
                }

                let rr: any = await awsUtils.getRideRequest(urs.id, urs.rideOfferId);

                if (_.isEmpty(rr)) {
                    throw {
                        name: "ValidationException",
                        message: "Invalid ride request id.",
                    };
                }

                if (rr.rideStatus == RideStatus.RIDE_COMPLETED) {
                    throw {
                        name: "ValidationException",
                        message: "The ride is marked as completed already.",
                    };
                } else if (rr.rideStatus == urs.rideStatus) {
                    throw {
                        name: "ValidationException",
                        message: "The ride is already in the same status.",
                    };
                }


                transactionItems.push({
                    Update: {
                        TableName: rideTableName,
                        Key: {
                            hashKey: rr.hashKey,
                            rangeKey: rr.rangeKey,
                        },
                        UpdateExpression: "set rideStatus = :rideStatus, updatedAt = :updatedAt",
                        ExpressionAttributeValues: {
                            ":rideStatus": urs.rideStatus,
                            ":updatedAt": new Date().toISOString()
                        },
                    },
                });

                if (rr.rideStatus == RideStatus.REQUEST_ACCEPTED && urs.rideStatus == RideStatus.REQUEST_REJECTED) {
                    transactionItems.push({
                        Update: {
                            TableName: rideTableName,
                            Key: {
                                hashKey: ro.hashKey,
                                rangeKey: ro.rangeKey,
                            },
                            UpdateExpression: "set passengersAccepted = if_not_exists(passengersAccepted, :start) - :passengersRequested, updatedAt = :updatedAt",
                            ExpressionAttributeValues: {
                                ":passengersRequested": rr.passengersRequested,
                                ":start": 0,
                                ":updatedAt": new Date().toISOString()
                            },
                        },
                    });
                } else if (urs.rideStatus == RideStatus.REQUEST_ACCEPTED) {
                    if (ro.creator.id != userClaims.id) {
                        throw {
                            name: "ForbiddenException",
                            message: "The ride request can be accepted only by the creator of the ride offer.",
                        };
                    } 

                    if ((ro.passengersAllowed - ro.passengersAccepted) < rr.passengersRequested) {
                        // there is not enough space for the requested passengers
                        throw {
                            name: "ValidationException",
                            message: "The ride offer has not enough capacity.",
                        };
                    }
                    transactionItems.push({
                        Update: {
                            TableName: rideTableName,
                            Key: {
                                hashKey: ro.hashKey,
                                rangeKey: ro.rangeKey,
                            },
                            UpdateExpression: "set passengersAccepted = if_not_exists(passengersAccepted, :start) + :passengersRequested, updatedAt = :updatedAt",
                            ExpressionAttributeValues: {
                                ":passengersRequested": rr.passengersRequested,
                                ":start": 0,
                                ":updatedAt": new Date().toISOString()
                            },
                        },
                    });
                }


                if (urs.rideStatus == RideStatus.RIDE_COMPLETED) {

                    if (rr.creator.id != userClaims.id) {
                        throw {
                            name: "ForbiddenException",
                            message: "The ride request can be marked as completed only by the creator.",
                        };
                    } 


                    transactionItems.push({
                        Update: {
                            TableName: tableName,
                            Key: {
                                pk: "USER#" + ro.creator.id,
                                sk: "USER#" + ro.creator.id,
                            },
                            UpdateExpression: "set distanceSaved = if_not_exists(distanceSaved, :start) + :distanceSaved, rating = if_not_exists(rating, :start) + :rating, ratedUserCount = if_not_exists(ratedUserCount, :start) + :ratedUserCount, updatedAt = :updatedAt",
                            ExpressionAttributeValues: {
                                ":distanceSaved": rr.distance,
                                ":rating": urs.rating > 0 ? urs.rating : 0,
                                ":ratedUserCount": urs.rating > 0 ? 1 : 0,
                                ":start": 0,
                                ":updatedAt": new Date().toISOString()
                            },
                        },
                    });

                    transactionItems.push({
                        Update: {
                            TableName: tableName,
                            Key: {
                                pk: "USER#" + rr.creator.id,
                                sk: "USER#" + rr.creator.id,
                            },
                            UpdateExpression: "set ridesRequested = if_not_exists(ridesRequested, :start) + :inc, updatedAt = :updatedAt",
                            ExpressionAttributeValues: {
                                ":inc": 1,
                                ":start": 0,
                                ":updatedAt": new Date().toISOString()
                            },
                        },
                    });

                }

            } else {
                throw {
                    name: "ValidationException",
                    message: "Invalid entity type.",
                };
            }

            const dynamoParams: any = {
                TransactItems: transactionItems,
            };

            await awsUtils.dynamodb
                .transactWrite(dynamoParams)
                .promise();

            logger.debug(context, "dynamodb write done");
            resolve(
                createResponse(context, 200)
            );
        } catch (error) {
            logger.debug(context, error.stack);
            resolve(createErrorResponse(context, error));
        }
    });
};
