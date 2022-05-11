#!/bin/bash

#Start by removing all the environment files
rm .env*

if [[ ! -f env-base.toml ]] ; then
    echo 'File env-base.toml does not exists, generating....'
    sls deploy --config serverless-base.yml
fi

echo "Exporting environment variables from the serverless."
sls export-env --config serverless-base.yml

#add new line if doesn't exist
x=$(tail -c 1 .env-base)
if [ "$x" != "" ]
  then echo >> .env-base
fi

awk -F= '{ gsub(/ /, "", $0); gsub(/\B[A-Z]+/,"_&",$1); $1 = toupper($1); gsub(OFS,"="); print}' env-base.toml >> .env-base

echo "Sourcing the environment variables."
source .env-base

echo "Retrieving the application client secret."
ApplicationClientSecret=`aws cognito-idp describe-user-pool-client --user-pool-id $USER_POOL_ID --region $REGION --client-id $USER_POOL_APPLICATION_CLIENT_ID --query 'UserPoolClient.ClientSecret' --output text`

retVal=$?
if [ $retVal -ne 0 ]; then
    echo "Error on retrieving the application client secret."
else
  echo "Application client secret retrieved successfully. Appending .env..."
  echo -e "\nUSER_POOL_APPLICATION_CLIENT_SECRET=$ApplicationClientSecret\n" >> .env-base
fi
mv .env-base .env."$STAGE"
       
exit $retVal 
