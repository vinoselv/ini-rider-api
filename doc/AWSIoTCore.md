# AWS IoT Core

AWS IoT Core is a managed cloud service that lets connected devices easily and securely interact with cloud applications and other devices. This document describes the steps required to setup the iNi Rider API service after installing the required components described in the [Getting Started](GettingStarted.md#deployment) document. 

## Terms 
**An AWS IoT thing**  
A thing represents a physical device (in this case, Thingy91) and contains static metadata about the device.

**A device certificate**  
All devices must have a device certificate to connect to and authenticate with AWS IoT.

**An AWS IoT policy**  
Each device certificate has one or more AWS IoT policies associated with it. These policies determine which AWS IoT resources the device can access.

**An AWS IoT root CA certificate**  
Devices and other clients use an AWS IoT root CA certificate to authenticate the AWS IoT server with which they are communicating. For more information, see Server authentication.

**An AWS IoT rule**  
A rule contains a query and one or more rule actions. The query extracts data from device messages to determine if the message data should be processed. The rule action specifies what to do if the data matches the query.

## Create IoT Policy
Create a AWSA IoT Policy as instructed [here](https://docs.aws.amazon.com/iot/latest/developerguide/iot-moisture-policy.html) but with the below payload. The * can be replaced by the Thingy 91 Imei number if you plan to connect only one device using the generated ceritifcate.
```
{
   "Version": "2012-10-17",
   "Statement": [{
         "Effect": "Allow",
         "Action": "iot:Connect",
         "Resource": "arn:aws:iot:region:account:client/*"
      },
      {
         "Effect": "Allow",
         "Action": "iot:Publish",
         "Resource": [
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/update",
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/delete",
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/get"
         ]
      },
      {
         "Effect": "Allow",
         "Action": "iot:Receive",
         "Resource": [
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/update/accepted",
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/delete/accepted",
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/get/accepted",
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/update/rejected",
            "arn:aws:iot:region:account:topic/$aws/things/*/shadow/delete/rejected"
         ]
      },
      {
         "Effect": "Allow",
         "Action": "iot:Subscribe",
         "Resource": [
            "arn:aws:iot:region:account:topicfilter/$aws/things/*/shadow/update/accepted",
            "arn:aws:iot:region:account:topicfilter/$aws/things/*/shadow/delete/accepted",
            "arn:aws:iot:region:account:topicfilter/$aws/things/*/shadow/get/accepted",
            "arn:aws:iot:region:account:topicfilter/$aws/things/*/shadow/update/rejected",
            "arn:aws:iot:region:account:topicfilter/$aws/things/*/shadow/delete/rejected"
         ]
      },
      {
         "Effect": "Allow",
         "Action": [
            "iot:GetThingShadow",
            "iot:UpdateThingShadow",
            "iot:DeleteThingShadow"
         ],
         "Resource": "arn:aws:iot:region:account:thing/*"

      }
   ]
}
```

## Create thing & device certificate
Create the IoT thing and device certificates as instructed [here](https://docs.aws.amazon.com/iot/latest/developerguide/iot-moisture-create-thing.html) but remember to attach the IoT policy generated in the previous step.

Download the certificates for flashing them to the Nordic Thingy 91. You need the three certificates as listed below:
  - *thing-name*.cert.pem
  - *thing-name*.private.key
  - root-CA.crt

  Also note down the AWS IoT core endpoint name from the settings. AWS IoT > Settings

## Create IoT Rules
The IoT rules are used to forward the location notifications to the DynamoDB and the Lambda for further processing.

**DynamoDB Rule**

Navigate to AWS IoT > Act > Rules > Create Rule

1. Set the SQL version to 2016-03-23.
2. Set the SQL statement as below:
```
SELECT state.reported.env.v.temp as temp,
       state.reported.env.v.hum as hum,
       state.reported.env.v.atmp as atmp,
       state.reported.gnss.v.lat as lat,
       state.reported.gnss.v.lng as lng,
FROM '$aws/things/+/shadow/update'
```
3. In the Rule Action section:
- Select Action as DynamodB
- Set patition key as pk and the key type as *STRING*.
- Set the partition key value as *${topic(3)}*
- Set sort key as sk and the key type as *STRING*.
- Set the partition key value as *${parse_time('yyyy.MM.dd HH:mm:ss.SSS z', timestamp(), 'UTC')}*
- Set the Write message data to this column to *device_data*
- Set the operation to *INSERT*
- Create a new IAM role with access to the DynamoDB table creates in the deployment. 
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:BatchGetItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:region:account:table/<table-name>",
                "arn:aws:dynamodb:region:account:table/<table-name>/index/*"
            ],
            "Effect": "Allow"
        }
    ]
}
```
Note: The table name be extracted from the *DB_TABLE_LOCATION* variable in the *.env.<stage-name>* when you run the *./scripts/generate-base-env.sh* script. 

**Lambda Rule**
Navigate to AWS IoT > Act > Rules > Create Rule

1. Set the SQL version to 2016-03-23.
2. Set the SQL statement as below:
```
SELECT * as payload, topic(3) as imei_no FROM '$aws/things/+/shadow/update'
```
3. In the Rule Action section:
- Select Action as Lambda.
- Set the lambda function name to <application-name-stage>-mqtt-bridge in the dropdown box.

Note: When you create IoT rules, it is always recommended to create the Error actions to route the logs to the cloud formartion as it helps you debug the data flow issues.