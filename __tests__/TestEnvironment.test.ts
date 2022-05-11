const Environment = require('jest-environment-node'); // or jest-environment-jsdom
let request = require("supertest");
const fs = require("fs");
const appTokenUrl = "https://ini-ride-base-dev.auth.eu-west-1.amazoncognito.com";
const appTokenRequest = require("supertest")(appTokenUrl);
const btoa = require("btoa");

const dotenv = require('dotenv');

module.exports = class MyEnvironment extends Environment {
    constructor(config, context) {
        super(config, context);
        this.testPath = context.testPath;
    }

    async setup() {
        console.log(
            "************************************************************************"
        );
        await super.setup();

        this.global.IS_INTEGRATION = this.testPath.includes("integration");

         // read the .env file here
        dotenv.config();
        if(this.global.IS_INTEGRATION) {
            console.log(
                "initialising the integration tests..."
            );
            if (typeof process.env.DB_TABLE === 'undefined') {
                throw new Error(
                    "DB_TABLE not found in the .env to continue"
                );
            }
            // hack needed for migrating the existing testcases TODO:: remove this when the integration tests are done
            this.global.API_ENDPOINT= process.env.HTTP_API_URL;
        } else {
            console.log(
                "initialising the acceptance tests..."
            );
            await this.initAccpetanceTests();
            console.log(
                "this.global.API_ENDPOINT : " + this.global.API_ENDPOINT
            );
        }

        // get the application Token
        console.log(
            "retrieving the application token..."
        );
        return this.getApplicationToken().then((res) => {
            this.global.APPLICATION_TOKEN = res;
        });
    }

    async initAccpetanceTests() {
        await request("http://localhost:3000")
            .get("/")
            .expect(404)
            .then((res) => {
                // use local deployment
                console.log(
                    "Running the tests against the local server..."
                );
                // if yes copy the .env from the build folder
                return fs.promises.copyFile(".build/.env", ".env").then(() => {
                    console.log(
                        ".env file copied from the build folder to the root"
                    );
                    dotenv.config();

                    if (typeof process.env.API_ENDPOINT === 'undefined') {
                        throw new Error(
                            "API_ENDPOINT not found in the .env to continue"
                        );
                    }
                    this.global.API_ENDPOINT = process.env.API_ENDPOINT.slice(0, -1);
                });
            })
            .catch(() => {
                // use AWS deployment
                console.log(
                    "Running the tests against the AWS deployment..."
                );
                if (typeof process.env.HTTP_API_URL === 'undefined') {
                    throw new Error(
                        "HTTP_API_URL not found in the .env to continue"
                    );
                }
                this.global.API_ENDPOINT= process.env.HTTP_API_URL;
            });
    }

    async getApplicationToken() {
        return new Promise((resolve, reject) => {
            appTokenRequest
                .post("/oauth2/token")
                .set(
                    "Authorization",
                    "Basic " +
                    btoa(
                        process.env.USER_POOL_APPLICATION_CLIENT_ID +
                        ":" +
                        process.env.USER_POOL_APPLICATION_CLIENT_SECRET
                    )
                )
                .set("Content-Type", "application/x-www-form-urlencoded")
                .send({
                    grant_type: "client_credentials",
                    scope: "users/post"
                })
                .expect(200)
                .then((res) => {
                    console.log("response received...");
                    const body = res.body;
                    resolve(body.access_token);
                })
                .catch((err) => {
                        reject(new Error("get application token failed :" + err));
                    }
                );
        });
    }

}
