## Getting Started

**Project Prerequisites**

- [nodejs](https://nodejs.org/en/download/) 

**Install dependencies**

Install the project prerequisites as mentioned in the Server section. Run the npm install command from the root directory.

```
$ npm install
```
Install the serverless framework. The npm install alone is not enough to get the serverless framework working due to some missing dependencies.

```
$ npm install -g serverless
```

**Setup AWS access**

Create [Amazon web services account](https://aws.amazon.com/free) and install the [AWS command line interface](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html) tool.

Create a file named credentials in the path  <your home folder>/.aws/credentials and add the below content.

[default]
aws_access_key_id = <your account id>
aws_secret_access_key = <your access key>
region = eu-west-1

Verify you can access the AWS with the configured credentials using the below command.
```
$ aws iam get-user
{
    "User": {
        "Path": "/",
        "UserName": "<your user name>",
        "UserId": "<your user name>",
        "Arn": "arn:aws:iam::<account-id>:user/<your user name>",
        "CreateDate": "<date>",
        "PasswordLastUsed": "<date>"
    }
}
```

## Deployment

The [serverless framework](https://www.serverless.com/) is used to deploy and manage the AWS resources. The serverless base stack which manages Dynamodb and Cognito is defined in the serverless-base.yml. The serverless stack which manages the Lambda functions is defined in the serverless.yml.

The serverless base stack is deployed using the command

```
$ sls deploy -c serverless-base.yml
```

After creating the base stack, create the environment variables for the serverless stack by running the below command.
```
$ ./scripts/generate-base-env.sh
``` 
The script will export the environment variables to .env.{stage} file and also retirves the cognito application secret to be used to authenticate the application with AWS.

The serverless stack is deployed using the command

```
$ sls deploy -c serverless.yml
```

Note: The AWS IoT Core setup is not part of the serverless framework due to the time limitations. Follow the instructions in the [AWS IoT Core setup](AWSIoTCore.md) document to configure the AWS IoT Core manually.  

The serverless stack can be removed using the command
```
$ sls remove -c serverless.yml
```

The serverless base stack can be removed using the command
```
$ sls remove -c serverless-base.yml
```

## Build
The project uses the serverless framework to deploy the AWS resources. The serverless stack is defined in two different files.

- serverless.yml - stack to deploy the Lambda functions to the AWS.
- serverless-base.yml - stack to deploy the Dynamodb and Cognito to the AWS.

The Lambda function deployment using the serverless.yml depends on the environment variables from the serverless-base.yml deployment. The serverless framework reads the environment variables from the .env or .env.<stage> files in the root directory using the dot-env package automatically. 

**Serverless export-env plugin**   
The serverless export-env plugin exports the stack output and the environment variables to the .env files and so, the scripts folder contains the scripts to use export-env plugin to generate the required the environment variables for the development environment.

## Run
**Using serverless offline**

Start the serverless offline locally to run the Lambda functions. The serverless offline still uses the Dynamodb and Cognito in the AWS. The serverless offline supports hot deployment, so the changes to the implementation are automatically deployed without any need to restart the server.

```
$ ./scripts/start.sh
Exporting environment variables from the serverless.
Running "serverless" from node_modules
Sourcing the environment variables.
Retrieving the application client secret.
...
   │   PATCH  | http://localhost:3000/car                                                    │
   │   POST   | http://localhost:3000/2015-03-31/functions/update-car-request/invocations    │
   │   GET    | http://localhost:3000/car                                                    │
   │   POST   | http://localhost:3000/2015-03-31/functions/get-car/invocations               │
   │   DELETE | http://localhost:3000/car                                                    │
   │   POST   | http://localhost:3000/2015-03-31/functions/delete-car/invocations            │
   │                                                                                         │
   └─────────────────────────────────────────────────────────────────────────────────────────┘

Server ready: http://localhost:3000 🚀

Enter "rp" to replay the last request
```

## Tests
**Using integration tests**

The integration tests are calling the Lambda handlers directly to access the Dynamodb and Cognito. So there is no need for any local deployment here. You could modify the implementation and test directly without any external dependency. 

You could run the tests from IDE or the below command.
```
$ npm run integration
```

**Using acceptance tests**

The acceptance tests can be run against the local serverless offline deployment or the AWS deployment based on the gloabl variable HTTP_API_URL
You could run the tests from IDE or the below command.
```
$ npm run acceptance
```
The tests are limited only to the user endpoints now. TODO: tests for the other endpoints.
