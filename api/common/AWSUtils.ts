import {
    AdminGetUserResponse,
    SignUpResponse
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import "reflect-metadata";
import { Car } from "../models/dao/Car";
import { User } from "../models/dao/User";
import { CreateUserRequest } from "../models/dto/user/CreateUserRequest";
import { UserClaims } from "../models/dto/user/UserClaims";
import { EntityType } from "../models/EntityType";
import { Place } from "../models/Place";
import { RideRequestMetaData } from "../models/RideRequestMetaData";
import QueryInput = DocumentClient.QueryInput;
import QueryOutput = DocumentClient.QueryOutput;

const AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-1" });
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "debug";

export const dynamodb = new AWS.DynamoDB.DocumentClient();
export const ddbGeo = require('dynamodb-geo');
export const cognito = new AWS.CognitoIdentityServiceProvider();

let tableName: string = process.env.DB_TABLE!;
let rideTableName: string = process.env.DB_TABLE_RIDES!;
let locationTableName: string = process.env.DB_TABLE_LOCATION!;
const _ = require("lodash");
const axios = require('axios');

const ddb = new AWS.DynamoDB()
const config = new ddbGeo.GeoDataManagerConfiguration(ddb, process.env.DB_TABLE_RIDES)
config.hashKeyLength = 5
export const myGeoTableManager = new ddbGeo.GeoDataManager(config);

export async function getCarLocation(thingy91ImeiNumber: string): Promise<Place> {
    let place: Place = {} as Place;

    let params = {
        TableName: locationTableName,
        KeyConditionExpression: "pk = :imei_no",
        ExpressionAttributeValues: {
            ":imei_no": thingy91ImeiNumber,
        },
        ScanIndexForward: false,
        Limit: 1,
    };

    let data: QueryOutput = await dynamodb.query(params).promise();
    logger.debug("getCar dynamoDB : " + JSON.stringify(data.Items?.[0]));
    if (!_.isEmpty(data.Items) && data.Items?.[0].device_data.lat) {

        var lat = data.Items?.[0].device_data.lat;
        var lng = data.Items?.[0].device_data.lng;

        return new Promise((resolve, reject) => {
            axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=<Google Map API Key>')
                .then((res) => {
                    console.log(
                        "Google Places API response" + res.data
                    );
                    const body = res.data;

                    var placeAddress = body['results'][0]['formatted_address'];

                    place = new Place(
                        body['results'][0]['place_id'],
                        body['results'][0]['name'] == null ? placeAddress : body['results'][0]['name'],
                        placeAddress,
                        lat,
                        lng,
                        data.Items?.[0].sk
                    );
                    logger.debug("returning from getCarLocation : " + JSON.stringify(place));
                    resolve(place);
                }).catch((err) => {
                    console.log(
                        "Error in resolving the coordinates from goolge places API" + err
                    );
                    reject(err);
                });
        });
    } else {
        return place;
    }
}


export async function getCar(userId: string): Promise<Car> {
    let car: Car = {} as Car;

    let params = {
        TableName: tableName,
        KeyConditionExpression: "pk = :user_id AND sk = :car",
        ExpressionAttributeValues: {
            ":user_id": "USER#" + userId,
            ":car": "CAR"
        },
        Limit: 1,
    };

    let data: QueryOutput = await dynamodb.query(params).promise();
    logger.debug("getCar dynamoDB : " + JSON.stringify(data.Items?.[0]));
    if (!_.isEmpty(data.Items)) {
        car = plainToClass(Car, data.Items?.[0]);
    }
    logger.debug("returning from getCar : " + JSON.stringify(car));
    return car;
}

/*
export async function getRideOffer(rideId: string): Promise<RideOffer> {
    logger.debug("rideId : " + rideId);
    let rideOffer: RideOffer = {} as RideOffer;

    let params = {
        TableName: rideTableName,
        IndexName: "gsi-3-index",
        KeyConditionExpression: "gsi3pk = :ride AND gsi3sk = :ride",
        ExpressionAttributeValues: {
            ":ride": "RIDE_OFFER#" + rideId,
        },
        ScanIndexForward: true,
        Limit: 1,
    };

    let data: QueryOutput = await dynamodb.query(params).promise();
    logger.debug("getRideOffer dynamoDB : " + JSON.stringify(data.Items?.[0]));
    if (!_.isEmpty(data.Items)) {
        rideOffer = plainToClass(RideOffer, data.Items?.[0]);
    }
    logger.debug("returning from getRideOffer : " + JSON.stringify(rideOffer));
    return rideOffer;
}
*/
export async function getRideRequests(rideOfferId: string): Promise<RideRequestMetaData[]> {
    let requestParams = {
        TableName: rideTableName,
        IndexName: "gsi-3-index",
        KeyConditionExpression: "gsi3pk = :ride_id AND begins_with(gsi3sk, :ride_prefix)",
        ExpressionAttributeValues: {
            ":ride_id": "RIDE_OFFER#" + rideOfferId,
            ":ride_prefix": "RIDE_REQUEST#"
        },
    };

    var rideRequests: RideRequestMetaData[] = [];
    let reqData: QueryOutput = await dynamodb.query(requestParams).promise();
    if (!_.isEmpty(reqData.Items)) {
        reqData.Items?.forEach(i => rideRequests.push(RideRequestMetaData.fromDao(i)));
    };

    logger.debug("rideRequests : " + JSON.stringify(rideRequests));
    return rideRequests;
}

export async function getRideRequest(rideId: string, rideOfferId: string): Promise<any> {
    let result: any = {};
    logger.debug(
        "Querying the ride using ride id ",
        rideId
    );

    let params = {
        TableName: rideTableName,
        IndexName: "gsi-3-index",
        KeyConditionExpression: "gsi3pk = :ride_offer_id AND gsi3sk = :ride_id",
        ExpressionAttributeValues: {
            ":ride_offer_id": "RIDE_OFFER#" + rideOfferId,
            ":ride_id": "RIDE_REQUEST#" + rideId,
        },
        Limit: 1,
    };

    let data: QueryOutput = await dynamodb.query(params).promise();
    if (!_.isEmpty(data.Items)) {
        result = data.Items?.[0];
    }

    logger.debug("ride : " + JSON.stringify(result));
    return result;
}

export async function getRideOffer(rideId: string): Promise<any> {
    let result: any = {};
    logger.debug(
        "Querying the ride offer using ride id ",
        rideId
    );

    let params = {
        TableName: rideTableName,
        IndexName: "gsi-3-index",
        KeyConditionExpression: "gsi3pk = :ride_id AND gsi3sk = :ride_id",
        ExpressionAttributeValues: {
            ":ride_id": "RIDE_OFFER#" + rideId
        },
        Limit: 1,
    };

    let data: QueryOutput = await dynamodb.query(params).promise();
    if (!_.isEmpty(data.Items)) {
        result = data.Items?.[0];
        result.rideRequests = await getRideRequests(rideId);
    }

    logger.debug("ride : " + JSON.stringify(result));
    return result;
}

export async function getRideByUser(userId: string, rideId: string): Promise<any> {
    let result: any = {};
    logger.debug(
        "Querying the ride using ride id ",
        rideId
    );

    let params = {
        TableName: rideTableName,
        IndexName: "gsi-2-index",
        KeyConditionExpression: "gsi2pk = :user_id AND gsi2sk = :ride_id",
        ExpressionAttributeValues: {
            ":user_id": "USER#" + userId,
            ":ride_id": "RIDE#" + rideId
        },
        Limit: 1,
    };

    let data: QueryOutput = await dynamodb.query(params).promise();
    if (!_.isEmpty(data.Items)) {
        result = data.Items?.[0];
        result.rideRequests = getRideRequests(rideId);
    }

    logger.debug("ride : " + JSON.stringify(result));
    return result;
}

export async function getUser(userId: string): Promise<User> {
    let user: User = {} as User;
    logger.debug("userId : " + userId);
    let params = {
        TableName: tableName,
        KeyConditionExpression: "pk = :user_id AND sk = :user_id",
        ExpressionAttributeValues: {
            ":user_id": "USER#" + userId,
        },
        Limit: 1,
    };

    let data: QueryOutput = await dynamodb.query(params).promise();
    if (!_.isEmpty(data.Items)) {
        user = plainToClass(User, data.Items?.[0], {
            excludeExtraneousValues: true,
        });
    }
    logger.debug("user : " + JSON.stringify(user));
    return user;
}


export async function createUserInCognito(
    createUserRequest: CreateUserRequest
): Promise<SignUpResponse> {
    var cognitoParams = {
        ClientId: process.env.USER_POOL_CLIENT_ID,
        Username: createUserRequest.name,
        Password: createUserRequest.password,
        UserAttributes: [
            {
                Name: "email",
                Value: createUserRequest.email,
            },
        ],
    };

    // create the user in the cognito database
    return await cognito.signUp(cognitoParams).promise();
}


export async function deleteUsersFromCognito(userNamesToDelete: string[]) {
    for (const userName of userNamesToDelete) {
        await cognito
            .adminDeleteUser({
                UserPoolId: process.env.USER_POOL_ID,
                Username: userName,
            })
            .promise()
            .then(() => {
                logger.debug("Deleted the user " + userName);
            });
    }
}

export async function deleteRide(ride: any) {
    let items: AttributeMap[] = [];
    // push the item to be deleted first
    items.push(ride);
    if (ride.type == EntityType.RIDE_OFFER) {
        // delete all the relevant ride requests if exists
        let requestParams = {
            TableName: rideTableName,
            IndexName: "gsi-3-index",
            KeyConditionExpression: "gsi3pk = :ride_id AND begins_with(gsi3sk, :ride_prefix)",
            ExpressionAttributeValues: {
                ":ride_id": "RIDE_OFFER#" + ride.id,
                ":ride_prefix": "RIDE_REQUEST#"
            },
        };

        var rideRequests: any[] = [];
        let reqData: QueryOutput = await dynamodb.query(requestParams).promise();
        if (!_.isEmpty(reqData.Items)) {
            reqData.Items?.forEach(i => rideRequests.push(items.push(i)));
        };
    }
    await deleteItemsInDb(items, rideTableName);
}

export async function deleteItemsFromDynamoDb(
    params: DocumentClient.QueryInput
) {
    let items: AttributeMap[] = [];
    let data: QueryOutput = await dynamodb.query(params).promise();
    items = [...items, ...data.Items!];
    logger.debug("items : " + JSON.stringify(items));

    while (typeof data.LastEvaluatedKey != "undefined") {
        params.ExclusiveStartKey = data.LastEvaluatedKey;

        data = await dynamodb.query(params).promise();
        items = [...items, ...data.Items!];
    }

    await deleteItemsInDb(items, tableName);
}

async function deleteItemsInDb(items: AttributeMap[], table: string) {
    logger.debug("items : " + JSON.stringify(items));

    let leftItems = items.length;
    let group: any[] = [];
    let groupNumber = 0;

    console.log("Total items to be deleted", leftItems);

    for (const i of items) {
        const deleteReq = {
            DeleteRequest: {
                Key: {
                    hashKey: i.hashKey,
                    rangeKey: i.rangeKey,
                },
            },
        };

        group.push(deleteReq);
        leftItems--;

        if (group.length === 25 || leftItems < 1) {
            groupNumber++;

            logger.debug(`Batch ${groupNumber} to be deleted.`);

            const params = {
                RequestItems: {
                    [table]: group,
                },
            };

            await dynamodb.batchWrite(params).promise();
            logger.debug(
                `Batch ${groupNumber} processed. Left items: ${leftItems}`
            );

            // reset
            group = [];
        }
    }
}

export async function deleteUser(userId: string) {
    // remove the task entries from the database
    let params: QueryInput = {
        TableName: tableName,
        KeyConditionExpression: "pk = :user_id AND sk = :user_id",
        ExpressionAttributeValues: {
            ":user_id": "USER#" + userId,
        },
    };

    await deleteItemsFromDynamoDb(params);
}

export async function deleteCar(userId: string) {
    // remove the task entries from the database
    let params: QueryInput = {
        TableName: tableName,
        KeyConditionExpression: "pk = :user_id AND sk = :sk",
        ExpressionAttributeValues: {
            ":user_id": "USER#" + userId,
            ":sk": "CAR",
        },
    };

    await deleteItemsFromDynamoDb(params);
}

export async function deleteUserInCognito(userName: string) {
    await cognito
        .adminDeleteUser({
            UserPoolId: process.env.USER_POOL_ID,
            Username: userName,
        })
        .promise()
        .then(() => {
            logger.debug("Deleted the user " + userName);
        });
}

export async function parseUserClaims(claims): Promise<UserClaims> {
    let userClaims: UserClaims = UserClaims.fromRequest(claims);
    logger.debug("userClaims: " + JSON.stringify(userClaims));
    await validate(userClaims).then((errors) => {
        // errors is an array of validation errors
        if (errors.length > 0) {
            let errorTexts: string[] = [];
            for (const errorItem of errors) {
                errorTexts = errorTexts.concat(
                    errorItem.constraints!["isDefined"]
                );
            }
            throw { name: "AuthenticationException", message: errorTexts };
        }
    });
    logger.debug("validation done" + userClaims.userName);
    let adminUserGetResponse: AdminGetUserResponse = await cognito
        .adminGetUser({
            UserPoolId: process.env.USER_POOL_ID,
            Username: userClaims.userName,
        })
        .promise();

    logger.debug("adminUserGetResponse: " + adminUserGetResponse);

    let isInvalidToken: boolean = false;
    adminUserGetResponse.UserAttributes!.forEach((attribute) => {
        if (attribute.Name == "sub") {
            if (attribute.Value != userClaims.id) {
                logger.debug("User id mismatch for " + userClaims.userName);
                isInvalidToken = true;
            }
        } else if (attribute.Name == "email_verified") {
            logger.debug(
                "attribute.Value, userClaims.emailVerified : " +
                attribute.Value +
                ", " +
                userClaims.emailVerified
            );
            if (attribute.Value != String(userClaims.emailVerified)) {
                logger.debug(
                    "emailVerified mismatch for " + userClaims.userName
                );
                isInvalidToken = true;
            }
        }
        if (attribute.Name == "custom:home") {
            if (attribute.Value != userClaims.home) {
                logger.debug("home mismatch for " + userClaims.userName);
                isInvalidToken = true;
            }
        }
        if (attribute.Name == "custom:role") {
            if (attribute.Value != userClaims.role) {
                logger.debug("role mismatch for " + userClaims.userName);
                isInvalidToken = true;
            }
        }
        if (attribute.Name == "email") {
            if (attribute.Value != userClaims.email) {
                logger.debug("email mismatch for " + userClaims.userName);
                isInvalidToken = true;
            }
        }
    });

    if (isInvalidToken) {
        throw {
            name: "AuthenticationException",
            message: "Invalid user authentication token",
        };
    }
    return userClaims;
}
