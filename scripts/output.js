function handler(data, serverless, options) {
    console.log("Received Stack Output ", data);
    process.env.SERVICE_ENDPOINT = data.ServiceHttpApiUrlEndpoint;
    console.log(
        "process.env.SERVICE_ENDPOINT : ",
        process.env.SERVICE_ENDPOINT
    );
}

module.exports = { handler };
