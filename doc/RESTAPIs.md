# REST APIs

The REST APIs are implmented using AWS Lambda handlers in the api folder. The APIs can be organized into the below categories:

- application
  - the API to retrive the application token from Amazon Cognito service. The application token is used in the API to create the user.
- user
  - the APIs to create, authenticate, get and delete the users of the iNi Rider service.
- car
  - the APIs to create, update, get and delete the cars associated to the users. A user can register a maximum of one car for now. 
- ride
  - the APIs to create, update, get and delete the ride offers and requests. 

## API validations and conditional checks
The REST API request body is always validated in the server side and any additional fields to the request or missing manadatory parameters will result in validartion errors.

The documentation is not extensive due to the time limitations.

**Application Context**
- A user can create any number of ride offers and requests.
- A user cannot accept his own ride offer.
- A user cannot update the status of the other user's ride offer.
- A user cannot update the status of the other user's ride requests except the rider offerer when accepting / rejecting  or marking the ride as ongoing.
- A user can register a maximum of 1 car.
- A ride offerer must register a car before marking the ride offer as ongoing to enable live tracking of the ride owner's car.

**Table of Contents**  
- [Application APIs](#application-apis)  
- [User APIs](#user-apis)  
- [Car APIs](#car-apis)  
- [Ride APIs](#ride-apis)  

## Application APIs

**Get application token**

POST   
*AWS Cognito Endpooint*/oauth2/token

Authorization:  
We must pass the client_id and client_secret in the authorization header through Basic HTTP authorization. The authorization header string is Basic Base64Encode(client_id:client_secret). You must use the *USER_POOL_CLIENT_ID* and *USER_POOL_APPLICATION_CLIENT_SECRET* included in the .env.{stage} file generated during the deployment. 

Content-Type:  
Must always be 'application/x-www-form-urlencoded'.

Request parameters in body:  
grant_type: client_credentials  
scope: users/post  

Example Response:
```
200 OK
{
    "access_token": "eyJraWQiOiIyUmxEOGM3S002ZXYzMmpkaG5RZnMraFZVVUZibGxrN0RJUURoSFJpaWFnPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyMGJuOGU0M3A19joXBo27s-_FLM3JtoBq3VPKLfXmkJWQpK8ONlEipf7LlxYjCNULNLJFud4zhVHdrig2UWb7hOmApug73m0uCgfy08SiL49aijEmnxI8kXkX1WBroK_lCBoOF40EXF9rYWinkzHY5RxSXJ2FBFiH2SorYbfSwmF1MA-ZGNgUYRMm3TSll2kHBuEjVyXOF3qGGfVUAAhCQ",
    "expires_in": 3600,
    "token_type": "Bearer"
}
```

## User APIs

**Create User**

POST  
*SERVICE-URL*/user

Authorization:  
*Application token*

Example Request: 
```
{
    "name": "test-7",
    "password": "Test@123",
    "email": "test@gmail.com",
    "iconKey": "test-icon"
}
```

Example Response:
```
200 OK
{
    "confirmed": true,
    "id": "d118c4b2-f61b60b-207327f40d57"
}
```

**Authenticate User** 

POST  
*SERVICE-URL*/user/authenticate

Authorization:  
*Application token*

Example Request: 
```
{
    "name": "test-7",
    "password": "Test@123"
}
```

Example Response:
```
200 OK
{
    "idToken": "eyJraWQiOiJsS1JGx9GbV9xC7ufuYKrYAo7QrX07IwhuR5LgJUe8-WUEV1a2xMThYQREX1QPVwkJAHa3SFx-gt8jOkkhBGTW2SdVlqNsCyFSHLm9097h3FYkj5HCbnXlkWvrKTOhKhBfdNg4gkrFPQKPjCtINj9_BkyysyKcqaDEyK1YZkqGNCgX_FkRY0ZvQEukqQ5cVfdPmvdxV4olvKFMWkGn9iOnk-3QbNs3qobCURhYglx2QqTaW9MRA8OcpNWcyX0w",
    "refreshToken": "eyJjdHkiOiJKV1QiLLsv2C9IToBS4FT4HHuXqrcdoqNKpLBlqnyrUkIndou09klukVOzP6670U0NCvcPjTrn2gI2Mw-d-oLWsrU1x6nqjov4qWZNQF0odf8SpThe4K7bAiL5spm6CfnSHRn6WET0x52j-lM7_PILvu0tw6Gr4IorVJz20zCqPYFPLxlK.Uy8CTHrhZQUJJzaaqg01kA",
    "expiresIn": 3600
}
```

Note: The idToken in the response is the User token that must be used with all the other requests to identify the user.

**Get User**

GET  
*SERVICE-URL*/user

Authorization:  
*User token*

Example Response:
```
200 OK
{
    "id": "f4ee21c4-191-8c91-45a23ee01372",
    "iconKey": "cat",
    "name": "test",
    "email": "testh@gmail.com",
    "createdAt": "2022-05-10T20:02:38.113Z",
    "updatedAt": "2022-05-10T21:32:10.497Z"
}
```

**Delete User**

DELETE  
*SERVICE-URL*/user

Authorization:  
*User token*

Example Response:
```
200 OK
```

## Car APIs

**Create Car**

POST  
*SERVICE-URL*/car

Authorization:  
*User token*

Example Request: 
```
{
    "make": "toyota",
    "model": "rav4",
    "year": 2020,
    "registrationNumber": "XYZ-123",
    "thingy91ImeiNumber": 123456789012345
}
```

Example Response:
```
200 OK
```

**Update Car**

PATCH  
*SERVICE-URL*/car

Authorization:  
*User token*

Example Request: 
```
{
    "make": "toyota",
    "model": "rav4",
    "year": 2020,
    "registrationNumber": "XYZ-123",
    "thingy91ImeiNumber": 123456789012345
}
```

Example Response:
```
200 OK
```

**Get Car**

GET  
*SERVICE-URL*/car

Authorization:  
*User token*

Example Request: 
```
{
    "id": "28zLkQQLlVB1WikLomSlsn",
    "make": "Toyata",
    "model": "Rav4",
    "year": 2020,
    "registrationNumber": "XYZ-123",
    "thingy91ImeiNumber": 351358543214746,
    "ownerId": "f4ee21c4-c91-45a23ee01372",
    "place": {
        "id": "ChIJ3YG5cFYtgEYRBF8mlIhfChs",
        "name": "Kasarmintie 14, 90100 Oulu, Finland",
        "address": "Kasarmintie 14, 90100 Oulu, Finland",
        "latitude": 65.02018,
        "longitude": 25.49009,
        "lastReportedTime": "2022.05.11 15:33:31.736 UTC"
    }
}
```

Example Response:
```
200 OK
```

**Delete Car**

DELETE  
*SERVICE-URL*/car

Authorization:  
*User token*

Example Response:
```
200 OK
```

## Ride APIs

**Create ride offer**

POST  
*SERVICE-URL*/ride-offer

Authorization:  
*User token*

Example Request: 
```
{
    "creator": {
        "id": "f4ee21c4-19af-4da1-8c91-45a23ee01372",
        "iconKey": "dog",
        "name": "vinoth"
    },
    "from" : {
        "id": "point-4-id",
        "name": "rusko",
        "address": "Rusko, Oulu",
        "latitude": 65.04976225296727, 
        "longitude": 25.538076048737693
    },
    "to" : {
        "id": "point-5-id",
        "name": "ritaharju",
        "address": "Ritharju, Oulu",
        "latitude": 65.08301317865836, 
        "longitude": 25.454719423944795
    },
    "rideStartTime": "2021-04-27T14:56:46.247Z",
    "distance" : 6,
    "duration" : 4,
    "passengersAllowed": 5
}
```

Example Response:
```
200 OK
{
    "type": "ride_offer",
    "id": "1rl0XIUOae21fJnH6nkDmjGGMtk",
    "from": {
        "id": "point-4-id",
        "name": "rusko",
        "address": "Rusko, Oulu",
        "latitude": 65.04976225296727,
        "longitude": 25.538076048737693
    },
    "to": {
        "id": "point-5-id",
        "name": "ritaharju",
        "address": "Ritharju, Oulu",
        "latitude": 65.08301317865836,
        "longitude": 25.454719423944795
    },
    "distance": 6,
    "duration": 4,
    "passengersAllowed": 5,
    "passengersAccepted": 0,
    "creator": {
        "id": "f4ee21c4-19af-4da1-8c91-45a23ee01372",
        "name": "vinoth",
        "iconKey": "dog"
    },
    "rideStartTime": "2021-04-27T14:56:46.247Z",
    "rideStatus": "ride_active"
}
```

**Create Ride Request**

POST  
*SERVICE-URL*/rides/*:ride_offer_id/request

Authorization:  
*User token*

Example Request: 
```
{
    "creator": {
        "id": "4b6fe666-a4a8-4467-9f38-0624364fb90d",
        "iconKey": "cat",
        "name": "test-2"
    },
    "from" : {
        "id": "point-3-id",
        "name": "peltola",
        "address": "Peltola, Oulu",
        "latitude": 65.01325473440531, 
        "longitude": 25.514612266707196
    },
    "to" : {
        "id": "point-2-id",
        "name": "work",
        "address": "Torikatu, Oulu",
        "latitude": 65.01171458500018, 
        "longitude": 25.4645119527727
    },
    "distance" : 6,
    "duration" : 4,
    "rideRequestTime": "2021-04-27T14:26:46.247Z",
    "passengersRequested": 4
}
```

Example Response:
```
200 OK
{
    "type": "ride_request",
    "id": "1rl0XFroo4Dwzud0DffTShxuxpP",
    "from": {
        "id": "point-3-id",
        "name": "peltola",
        "address": "Peltola, Oulu",
        "latitude": 65.01325473440531,
        "longitude": 25.514612266707196
    },
    "to": {
        "id": "point-2-id",
        "name": "work",
        "address": "Torikatu, Oulu",
        "latitude": 65.01171458500018,
        "longitude": 25.4645119527727
    },
    "distance": 6,
    "duration": 4,
    "creator": {
        "id": "4b6fe666-a4a8-4467-9f38-0624364fb90d",
        "name": "test-2",
        "iconKey": "cat"
    },
    "rideStatus": "request_waiting"
}
```

**Search for Ride offers**

POST  
*SERVICE-URL*/search-rides

Authorization:  
*User token*

Example Request: 
```
{
    "from" : {
        "id": "point-3-id",
        "name": "peltola",
        "address": "Peltola, Oulu",
        "latitude": 65.01325473440531, 
        "longitude": 25.514612266707196
    },
    "to" : {
        "id": "point-2-id",
        "name": "work",
        "address": "Torikatu, Oulu",
        "latitude": 65.01171458500018, 
        "longitude": 25.4645119527727
    },
    "rideRequestTime": "2021-04-27T14:26:46.247Z",
    "passengersRequested": 4
}
```

Example Response:
```
200 OK
{
    "requests": [
        {
            "type": "ride_offer",
            "id": "295ISeMXxbir6wuRSkSUkgiysyx",
            "from": {
                "name": "Oulu International School",
                "lastReportedTime": null,
                "id": "ChIJy19QgVRagkYRxrFMI8dxFtM",
                "address": "Kasarmintie 4, 90130 Oulu, Finland",
                "latitude": 65.01672239999999,
                "longitude": 25.4810653
            },
            "to": {
                "name": "Torikatu",
                "lastReportedTime": null,
                "id": "EhdUb3Jpa2F0dSwgT3VsdSwgRmlubGFuZCIuKiwKFAoSCVnoKAGwMoBGERxKsIYkaET6EhQKEglFBOXjE9eBRhEwkbrz3mXvcg",
                "address": "Torikatu, Oulu, Finland",
                "latitude": 65.0114763,
                "longitude": 25.4670217
            },
            "distance": 1,
            "duration": 5,
            "creator": {
                "name": "shobana",
                "id": "4b6fe666-a4a8-4467-9f38-0624364fb90d",
                "iconKey": "spider"
            },
            "rideStartTime": "2022-05-13T04:02:00.000",
            "rideStatus": "ride_active",
            "passengersAllowed": 5,
            "passengersAccepted": 2,
        }
    ],
}
```

**Update Ride status**

POST  
*SERVICE-URL*/ride-status

Authorization:  
*User token*

Example Request: 
```
{
   "type":"ride_offer",
   "id":"292akyCpFhZbtykoE2LkDkdCbwr",
   "rideStatus":"ride_ongoing"
}
```

**Get the rides (both offers and requests)**

GET  
*SERVICE-URL*/rides

Authorization:  
*User token*

Example Response: 
```
{
    "offers": [],
    "requests": [
        {
            "type": "ride_request",
            "id": "295ISeMXxbir6wuRSkSUkgiysyx",
            "from": {
                "name": "Oulu International School",
                "lastReportedTime": null,
                "id": "ChIJy19QgVRagkYRxrFMI8dxFtM",
                "address": "Kasarmintie 4, 90130 Oulu, Finland",
                "latitude": 65.01672239999999,
                "longitude": 25.4810653
            },
            "to": {
                "name": "Torikatu",
                "lastReportedTime": null,
                "id": "EhdUb3Jpa2F0dSwgT3VsdSwgRmlubGFuZCIuKiwKFAoSCVnoKAGwMoBGERxKsIYkaET6EhQKEglFBOXjE9eBRhEwkbrz3mXvcg",
                "address": "Torikatu, Oulu, Finland",
                "latitude": 65.0114763,
                "longitude": 25.4670217
            },
            "distance": 1,
            "duration": 5,
            "creator": {
                "name": "shobana",
                "id": "4b6fe666-a4a8-4467-9f38-0624364fb90d",
                "iconKey": "spider"
            },
            "rideRequestTime": "2022-05-13T04:02:00.000",
            "rideOfferId": "295ISg8XkTjz7uxfjPvWkOGPj1n",
            "rideStatus": "ride_ongoing",
            "passengersRequested": 2
        }
    ],
    "hasMore": false
}
```

**Get a ride by id**

GET  
*SERVICE-URL*/rides/:ride_id

Authorization:  
*User token*

Example Response: 
```
{
    "type": "ride_offer",
    "id": "292akyCpFhZbtykoE2LkDkdCbwr",
    "from": {
        "name": "Oulu International School",
        "lastReportedTime": null,
        "id": "ChIJy19QgVRagkYRxrFMI8dxFtM",
        "address": "Kasarmintie 4, 90130 Oulu, Finland",
        "latitude": 65.01672239999999,
        "longitude": 25.4810653
    },
    "to": {
        "name": "Rusko",
        "lastReportedTime": null,
        "id": "ChIJc_D9Si0tgEYRkOqVo9hGAQo",
        "address": "Rusko, 90630 Oulu, Finland",
        "latitude": 65.0483583,
        "longitude": 25.5380756
    },
    "distance": 6,
    "duration": 9,
    "passengersAllowed": 5,
    "passengersAccepted": 4,
    "creator": {
        "name": "vinoth",
        "id": "f4ee21c4-19af-4da1-8c91-45a23ee01372",
        "iconKey": "cat"
    },
    "rideStartTime": "2022-05-12T03:03:00.000",
    "rideStatus": "ride_ongoing",
    "rideRequests": [
        {
            "id": "292akvgwSjw0fN46PNYIrLNsvYC",
            "creator": {
                "name": "saravanan",
                "id": "8f36f681-0883-4d99-a491-7e1864f8174a",
                "iconKey": "dog"
            },
            "from": {
                "name": "Oulu International School",
                "lastReportedTime": null,
                "id": "ChIJy19QgVRagkYRxrFMI8dxFtM",
                "address": "Kasarmintie 4, 90130 Oulu, Finland",
                "latitude": 65.01672239999999,
                "longitude": 25.4810653
            },
            "to": {
                "name": "Myllyoja",
                "lastReportedTime": null,
                "id": "ChIJ083sd8DSgUYRgOOVo9hGAQo",
                "address": "Myllyoja, 90650 Oulu, Finland",
                "latitude": 65.01948709999999,
                "longitude": 25.5514428
            },
            "distance": 4,
            "duration": 7,
            "rideStatus": "ride_completed",
            "rideRequestTime": "2022-05-12T03:05:00.000",
            "passengersRequested": 2
        },
        {
            "id": "292akyp2ymVbu0fa7LLWbwzJNEh",
            "creator": {
                "name": "balakumar",
                "id": "b54cd9d9-9472-4d06-a955-c16afd89ffd4",
                "iconKey": "hippo"
            },
            "from": {
                "name": "Oulu International School",
                "lastReportedTime": null,
                "id": "ChIJy19QgVRagkYRxrFMI8dxFtM",
                "address": "Kasarmintie 4, 90130 Oulu, Finland",
                "latitude": 65.01672239999999,
                "longitude": 25.4810653
            },
            "to": {
                "name": "Rusko",
                "lastReportedTime": null,
                "id": "ChIJc_D9Si0tgEYRkOqVo9hGAQo",
                "address": "Rusko, 90630 Oulu, Finland",
                "latitude": 65.0483583,
                "longitude": 25.5380756
            },
            "distance": 6,
            "duration": 9,
            "rideStatus": "ride_ongoing",
            "rideRequestTime": "2022-05-12T03:15:00.000",
            "passengersRequested": 2
        }
    ]
}
```

**Delete a ride**

DELETE  
*SERVICE-URL*/rides/:ride_id

Authorization:  
*User token*

Example Response:
```
200 OK
```