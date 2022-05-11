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
import { QueryOutput } from "aws-sdk/clients/dynamodb";
import { RideStatus } from "../models/RideStatus";

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


            let crr: CreateRideOfferRequest = plainToClass(
                CreateRideOfferRequest,
                JSON.parse(<string>event.body) as Object
            );

            logger.debug(
                context,
                "CreateRideOfferRequest :" + JSON.stringify(crr)
            );
            await validateRequest(crr);

            // check the user token matches with the user requesting the ride
            if (userClaims.id != crr.creator.id) {
                throw {
                    name: "ForbiddenException",
                    message: "Access denied. A user cannot offer the ride for another user.",
                };
            }

            let rideId: string = KSUID.randomSync(new Date(crr.rideStartTime)).string;
            let date: string = new Date().toISOString();

            let dbRide: RideOffer = new RideOfferBuilder()
                .setId(rideId)
                .setRideType(EntityType.RIDE_OFFER)
                .setCreator(crr.creator)
                .setFrom(crr.from)
                .setTo(crr.to)
                .setRideStartTime(crr.rideStartTime)
                .setDistance(crr.distance)
                .setDuration(crr.duration)
                .setPassengersAccepted(0)
                .setPassengersAllowed(crr.passengersAllowed)
                .setDate(date)
                .setRideStatus(RideStatus.RIDE_ACTIVE)
                .build();

            logger.debug(context, "input ride : " + JSON.stringify(dbRide));

            await awsUtils.myGeoTableManager.putPoint({
                RangeKeyValue: { S: rideId }, // unique ID
                GeoPoint: {
                    latitude: crr.to!.latitude,
                    longitude: crr.to!.longitude
                },
                PutItemInput: {
                    Item: AWS.DynamoDB.Converter.marshall(dbRide)
                }
            }).promise();

            logger.debug(context, "dynamodb write done");
            resolve(
                createResponse(context, 200, CreateRideOfferResponse.fromDao(dbRide))
            );
        } catch (error) {
            logger.debug(context, error.stack);
            resolve(createErrorResponse(context, error));
        }
    });
};
