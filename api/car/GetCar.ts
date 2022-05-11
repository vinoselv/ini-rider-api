import "reflect-metadata";
import { getCar, getCarLocation, parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";
import { createErrorResponse, createResponse } from "../common/Utils";
import { Car } from "../models/dao/Car";
import { CreateCarResponse } from "../models/dto/car/CreateCarResponse";

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

            let car: Car = await getCar(userClaims.id);



            if (!_.isEmpty(car)) {
                // try to get the last reported location
                var place = await getCarLocation(car.thingy91ImeiNumber.toString());

                if (!_.isEmpty(place)) {
                    car.place = place;
                }
                resolve(
                    createResponse(
                        context,
                        200,
                        CreateCarResponse.fromDao(car)
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
