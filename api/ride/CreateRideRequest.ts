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
import { RideOffer, RideOfferBuilder } from "../models/dao/RideOffer";
import { CreateRideOfferRequest } from "../models/dto/ride/CreateRideOfferRequest";
import { CreateRideOfferResponse } from "../models/dto/ride/CreateRideOfferResponse";

const KSUID = require('ksuid')
import awsUtils = require("../common/AWSUtils");
import { EntityType } from "../models/EntityType";
import AWS = require("aws-sdk");
import { CreateRideRequest } from "../models/dto/ride/CreateRideRequest";
import { RideRequest, RideRequestBuilder } from "../models/dao/RideRequest";
import { RideStatus } from "../models/RideStatus";
import { RideRequestMetaData } from "../models/RideRequestMetaData";
import { RideOfferMetaData } from "../models/RideOfferMetaData";

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

            let rideOfferId = decodeURIComponent(event.pathParameters?.ride_id!);
            let rideOffer: any = await awsUtils.getRideOffer(rideOfferId);

            if (_.isEmpty(rideOffer)) {
                resolve(createResponse(context, 404));
                return;
            }

            let crr: CreateRideRequest = plainToClass(
                CreateRideRequest,
                JSON.parse(<string>event.body) as Object
            );

            logger.debug(
                context,
                "createRideRequest :" + JSON.stringify(crr)
            );
            await validateRequest(crr);

            // check the user token matches with the user requesting the ride
            if (rideOffer.creator.id == crr.creator.id) {
                throw {
                    name: "ValidationException",
                    message: "A user offering the ride cannot request for the same.",
                };
            }


            // check the user token matches with the user requesting the ride
            if (userClaims.id != crr.creator.id) {
                throw {
                    name: "ForbiddenException",
                    message: "Access denied. A user cannot request the ride for another user.",
                };
            }

            // check the ride request from the same user does not exists   
            let rideRequests: RideRequestMetaData[] = await awsUtils.getRideRequests(rideOffer.id); 
            if (rideRequests?.filter(urr => urr.creator.id === crr.creator.id).length > 0) {
                throw {
                    name: "ValidationException",
                    message: "A ride reuest from the user exists already",
                };
            }

            let rideId: string = KSUID.randomSync(new Date(rideOffer.rideStartTime)).string;
            let date: string = new Date().toISOString();

            let dbRideRequest: RideRequest = new RideRequestBuilder()
                .setId(rideId)
                .setRideType(EntityType.RIDE_REQUEST)
                .setRideRequestTime(crr.rideRequestTime)
                .setCreator(crr.creator)
                .setFrom(crr.from)
                .setTo(crr.to)
                .setDistance(crr.distance)
                .setDuration(crr.duration)
                .setStatus(RideStatus.REQUEST_WAITING)
                .setDate(date)
                .setPassengersRequested(crr.passengersRequested)
                .setRideOfferId(
                    rideOffer.id
                )
                .build();

            logger.debug(context, "input ride : " + JSON.stringify(dbRideRequest));

            await awsUtils.myGeoTableManager.putPoint({
                RangeKeyValue: { S: rideId }, // unique ID
                GeoPoint: {
                    latitude: crr.to!.latitude,
                    longitude: crr.to!.longitude
                },
                PutItemInput: {
                    Item: AWS.DynamoDB.Converter.marshall(dbRideRequest)
                }
            }).promise();

            /*
            var rideRequests: any[] = rideOffer.rideRequests?.length > 0 ? rideOffer.rideRequests : [];
            rideRequests.push(RideRequestMetaData.fromRideRequest(dbRideRequest));

            const marshallMap = rideRequests.map(urr => {
                return {
                    "M": AWS.DynamoDB.Converter.marshall(urr)
                }
            });

            let rideOfferUpdate: any = {
                RangeKeyValue: { S: rideOffer.id }, // unique ID
                GeoPoint: {
                    latitude: rideOffer.to.latitude,
                    longitude: rideOffer.to.longitude
                },
                UpdateItemInput: { // TableName and Key are filled in for you
                    UpdateExpression: 'SET rideRequests =  :rideRequests',
                    ExpressionAttributeValues: {
                        ':rideRequests': {
                            "L": marshallMap
                        }
                    }
                }
            };


            await awsUtils.myGeoTableManager.updatePoint(rideOfferUpdate).promise();
            */

            logger.debug(context, "dynamodb write done");
            resolve(
                createResponse(context, 200, CreateRideOfferResponse.fromDao(dbRideRequest))
            );
        } catch (error) {
            logger.debug(context, error.stack);
            resolve(createErrorResponse(context, error));
        }
    });
};
