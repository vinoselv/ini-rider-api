import { type } from "os";

var atob = require('atob');

const APIGatewayRequest = ({
    body,
    method,
    path = "",
    queryStringObject,
    pathParametersObject,
    stageVariables = null,
    headers = {}
}) => {
    const request = {
        body: body ? JSON.stringify(body) : null,
        headers: headers,
        multiValueHeaders: {},
        httpMethod: method,
        isBase64Encoded: false,
        path,
        pathParameters: pathParametersObject || null,
        queryStringParameters: queryStringObject || null,
        multiValueQueryStringParameters: null,
        stageVariables,
        requestContext: {
            accountId: "",
            apiId: "",
            httpMethod: method,
            authorizer: {
                jwt: {
                    claims: parseAuthorizationHeader(headers),
                }
            },
            identity: {
                accessKey: "",
                accountId: "",
                apiKey: "",
                apiKeyId: "",
                caller: "",
                cognitoAuthenticationProvider: "",
                cognitoAuthenticationType: "",
                cognitoIdentityId: "",
                cognitoIdentityPoolId: "",
                principalOrgId: "",
                sourceIp: "",
                user: "",
                userAgent: "",
                userArn: "",
            },
            path,
            stage: "",
            requestId: "",
            requestTimeEpoch: 3,
            resourceId: "",
            resourcePath: "",
        },
        resource: "",
    };
    return request;
};

function parseAuthorizationHeader(headers: any) {
    let ca = headers.Authorization;
    let base64Url = ca?.split('.')[1];

    if (typeof(base64Url) === 'undefined')
        return {};

    return JSON.parse(atob(base64Url));
}

module.exports = APIGatewayRequest;
