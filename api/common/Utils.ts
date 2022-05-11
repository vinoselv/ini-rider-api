import "reflect-metadata";
import { ErrorResponse, ExceptionType } from "../models/dto/ErrorResponse";
import { validate, ValidationError } from "class-validator";
import { ApplicationClaims } from "../models/dto/user/ApplicationClaims";
import { Order } from "../models/Order";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { Context } from "./Context";
import { ServiceLogger } from "./ServiceLogger";
import QueryInput = DocumentClient.QueryInput;

export const snakeCase = require("snake-case");
const _ = require("lodash");

let logger: ServiceLogger = new ServiceLogger();
let context: Context;

export const getUserId = (headers) => {
    return headers.app_user_id;
};

export const getUserName = (headers) => {
    return headers.app_user_name;
};

export const getIdToken = (headers) => {
    return headers.Authorization;
};

export const getResponseHeaders = () => {
    return {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };
};

export function isDateAfterToday(date: string) {
    return new Date(date) > new Date();
}

export function mapToResponse(key, value) {
    if (key === "pk") return undefined;
    else if (key === "sk") return undefined;
    else if (key === "gsi1pk") return undefined;
    else if (key === "gsi1sk") return undefined;
    else if (key === "gsi2pk") return undefined;
    else if (key === "gsi2sk") return undefined;
    else if (key === "createdAt") return new Date(value).toISOString();
    else if (key === "updatedAt") return new Date(value).toISOString();
    else return value;
}

export function createResponse(
    context: Context,
    statusCode: number,
    response?: any
) {
    let body: string = JSON.stringify(response);
    if (logger.getDelegate().isDebugEnabled()) {
        logger.debug(context, body, statusCode);
    } else {
        logger.info(context, "", statusCode);
    }
    return {
        statusCode: statusCode,
        headers: getResponseHeaders(),
        body: response ? body : "",
    };
}

export function createErrorResponse(context: Context, error: any) {
    let statusCode: number = 500;
    if (error.name == undefined) {
        error.name = "Exception";
    } else if (error.name == ExceptionType.ValidationException) {
        statusCode = 400;
    } else if (
        error.name == ExceptionType.UsernameExistsException ||
        error.name == ExceptionType.TaskNameExistsException ||
        error.name == ExceptionType.UserTaskEntryExistsException
    ) {
        statusCode = 409;
    } else if (error.name == ExceptionType.UserNotFoundException) {
        statusCode = 404;
    } else if (
        error.name == ExceptionType.AuthenticationException ||
        error.name == ExceptionType.NotAuthorizedException
    ) {
        statusCode = 401;
    } else if (error.name == ExceptionType.ForbiddenException) {
        statusCode = 403;
    }

    if (typeof error.message === "string") {
        error.message = new Array(error.message);
    }

    let response: string;
    if (statusCode == 401) {
        response = JSON.stringify({ message: "Unauthorized" });
    } else {
        response = JSON.stringify(new ErrorResponse(error.name, error.message));
    }

    logger.debug(context, error.stack);
    if (logger.getDelegate().isDebugEnabled()) {
        logger.debug(context, response, statusCode);
    } else {
        logger.info(context, error.name, statusCode);
    }

    return {
        statusCode: statusCode,
        headers: getResponseHeaders(),
        body: response,
    };
}

export function throwException(statusCode, message) {
    let error = { name: "Exception", message: message, statusCode: statusCode };
    throw error;
}

export function parseAndAddOrderQueryParamter(
    context: Context,
    query: any,
    params: QueryInput
) {
    if (query.order != undefined) {
        if (!Object.values(Order).includes(query.order)) {
            if (query.order == Order.ASC) {
                params.ScanIndexForward = true;
            } else if (query.order == Order.DESC) {
                params.ScanIndexForward = false;
            }
        } else {
            return createErrorResponse(context, {
                name: "ValidationException",
                message: "Invalid order parameter.",
            });
        }
    }
}

export function parseAndAddLimitQueryParamter(
    context: Context,
    query: any,
    params: QueryInput
) {
    if (query.limit != undefined) {
        if (isNaN(Number(query.limit))) {
            return createErrorResponse(context, {
                name: "ValidationException",
                message: "Invalid limit parameter.",
            });
        }
        params.Limit = parseInt(query.limit);
    }
}

export async function getApplicationClaims(
    context,
    claims
): Promise<ApplicationClaims> {
    let ac = ApplicationClaims.fromRequest(claims);
    logger.debug(context, "applicationClaims : " + JSON.stringify(ac));
    await validate(ac).then((errors) => {
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
    return ac;
}

export async function validateRequest(objectToValidate: any) {
    await validate(objectToValidate, {
        whitelist: true,
        forbidNonWhitelisted: true,
    }).then((errors) => {
        // errors is an array of validation errors
        if (errors.length > 0) {
            let errorTexts: string[] = [];
            for (const errorItem of errors) {
                //console.log(errorItem);     
                errorTexts = appendErrorText(errorTexts, errorItem, undefined);
                for(const childrenErrorItem of errorItem.children!) {
                    errorTexts = appendErrorText(errorTexts, childrenErrorItem, errorItem.property);
                }
            }
            throw { name: "ValidationException", message: errorTexts };
        }
    });
}

function appendErrorText(errorTexts: string[], errorItem: ValidationError, property: string | undefined) : string[] {
    if(errorItem.constraints) {
        //console.log(errorItem);
        for(let errorMessage of Object.values(errorItem.constraints)) {
            console.log(errorMessage);
            if(property) {
                errorMessage = property + ':' + errorMessage;
            } 
            errorTexts = errorTexts.concat(errorMessage);
        }
        //return errorTexts.concat(Object.values(errorItem.constraints));
    } 
    return errorTexts;
}

export function getBeginsWithExpression(count: number): string {
    let expression: string = "";

    for (var i = 1; i <= count; i++) {
        if (expression.length == 0) {
            expression += "begins_with(sk,:sk" + i + ")";
        } else {
            expression += "or begins_with(sk,:sk" + i + ")";
        }
    }
    expression = "(" + expression + ")";
    return expression;
}

