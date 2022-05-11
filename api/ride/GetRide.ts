import "reflect-metadata";
import { getRideOffer, parseUserClaims } from "../common/AWSUtils";
import { createErrorResponse, createResponse } from "../common/Utils";
import { ServiceLogger } from "../common/ServiceLogger";
import { Context } from "../common/Context";
import { EntityType } from "../models/EntityType";
import { CreateRideOfferResponse } from "../models/dto/ride/CreateRideOfferResponse";
import { CreateRideRequestResponse } from "../models/dto/ride/CreateRideRequestResponse";
import { GetRideOfferResponse } from "../models/dto/ride/GetRideOfferResponse";

const _ = require("lodash");

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
            
            let rideId = decodeURIComponent(event.pathParameters.ride_id);

            let result: any = await getRideOffer(rideId);

            if (!_.isEmpty(result)) {
                let response: any;

                if (result.type == EntityType.RIDE_OFFER) {
                    response = GetRideOfferResponse.fromDao(result);
                } else {
                    response = CreateRideRequestResponse.fromDao(result);
                }

                resolve(
                    createResponse(
                        context,
                        200,
                        response
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
