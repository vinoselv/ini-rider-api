import { QueryOutput } from "aws-sdk/clients/dynamodb";
import "reflect-metadata";
import { dynamodb, getCar, getCarLocation, parseUserClaims } from "../common/AWSUtils";
import { Context } from "../common/Context";
import { ServiceLogger } from "../common/ServiceLogger";

const _ = require("lodash");

const log4js = require("log4js");
const logger = log4js.getLogger();

let locationTableName: string = process.env.DB_TABLE_LOCATION!;

var AWS = require('aws-sdk');
var iotdata = new AWS.IotData({ endpoint: process.env.IOT_CORE_ENDPOINT });

exports.handler = async (event) => {

    logger.debug("event received from the MQTT :" + JSON.stringify(event['payload']));

    logger.debug(
        "Querying the active ride topic ids for imei number : " + event['imei_no']
    );

    let params = {
        TableName: locationTableName,
        KeyConditionExpression: "pk = :imei_no AND begins_with(sk, :ride_prefix)",
        ExpressionAttributeValues: {
            ":imei_no": "CAR_IMEI#" + event.imei_no,
            ":ride_prefix": "RIDE_OFFER#"
        },
        Limit: 1,
    };

    let result: any;

    let data: QueryOutput = await dynamodb.query(params).promise();
    if (!_.isEmpty(data.Items)) {
        result = data.Items?.[0];

        logger.debug("resolved topic id : " + JSON.stringify(result.sk));

        // remove the imei number for security reasons
        event.imei_no = null;

        var mqttParams = {
            topic: "rides/" + result.sk.split('#')[1] + "/shadow/update",
            payload: JSON.stringify(event['payload']),
            qos: 1
        };

        const request = iotdata.publish(mqttParams);
        request
            .on('success', () => console.log("Success"))
            .on('error', (err) => console.log(err));
        return new Promise(() => request.send());
    } else {
        logger.debug("no active ride topic mappings exist, ignore the event");
    }

};
