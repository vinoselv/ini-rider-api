import { plainToClass } from "class-transformer";
import "reflect-metadata";
import { parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import {
    createErrorResponse,
    createResponse,
    isDateAfterToday,
    validateRequest
} from "../common/Utils";
import { SearchRidesRequest } from "../models/dto/ride/SearchRidesRequest";
import awsUtils = require("../common/AWSUtils");
import AWS = require("aws-sdk");
import { QueryOutput } from "aws-sdk/clients/dynamodb";
import { SearchRidesResponse } from "../models/dto/ride/SearchRidesResponse";
import { EntityType } from "../models/EntityType";
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

            let searchRidesRequest: SearchRidesRequest = plainToClass(
                SearchRidesRequest,
                JSON.parse(<string>event.body) as Object
            );

            logger.debug(
                context,
                "searchRidesRequest :" + JSON.stringify(searchRidesRequest)
            );
            await validateRequest(searchRidesRequest);

            const result = await awsUtils.myGeoTableManager.queryRadius({
                RadiusInMeter: 5000, // unique ID
                CenterPoint: {
                    latitude: searchRidesRequest.to.latitude,
                    longitude: searchRidesRequest.to.longitude
                }
            }).then((locations) => {
                logger.debug(context, "locations : " + JSON.stringify(locations));

                const data: QueryOutput =  {
                    Items: [],    
                };

                locations.forEach((item) => {
                   data.Items?.push(AWS.DynamoDB.Converter.unmarshall(item));
                   //logger.debug(context, "k : " + JSON.stringify(k))
                });

                // filter the results based on the time and type
                // need to optimise this later
                //data.Items = data.Items?.filter(i => i.type == EntityType.RIDE_OFFER && i.status == RideStatus.RIDE_IN_OFFER);
                logger.debug(context, "dynamodb result :" + JSON.stringify(data));
                data.Count = data.Items?.length;

                // filter the items to exclude expired rides & rides created by the requested user
                if (data.Count! > 0) {
                    data.Items = data.Items?.filter(i => {
                        return (i.type == EntityType.RIDE_OFFER && 
                            i.rideStatus == RideStatus.RIDE_ACTIVE &&
                            i.creator['id'] != userClaims.id &&
                            isDateAfterToday(i.rideStartTime as string));
                    });
                }          

                resolve(
                    createResponse(context, 200, SearchRidesResponse.fromDao(data))
                );
                //const result = AWS.DynamoDB.Converter.unmarshall(locations.Items);
                //const result = unmarshall(locations as  { [key: string]: AttributeValue });
                //(logger.debug(context, "result : " + JSON.stringify(result));
            });
            
            
        } catch (error) {
            resolve(createErrorResponse(context, error));
        }
    });
};


