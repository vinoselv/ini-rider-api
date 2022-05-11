#!/bin/bash

sls export-env

source .env

Username=`aws cognito-idp admin-get-user --user-pool-id $USER_POOL_ID --username $USER_POOL_ROOT_USER | jq -r .Username`

if [ "$Username" != "$USER_POOL_ROOT_USER" ]; then
  id=`aws cognito-idp sign-up --client-id $USER_POOL_CLIENT_ID --username $USER_POOL_ROOT_USER --password $USER_POOL_ROOT_USER_PASSWORD --user-attributes Name="custom:role",Value="root" Name="custom:home",Value="global" Name="email",Value="selvaraj.vinoth@gmail.com"`
  echo "User created successfully"
else
  echo "User with a same username exists already"
fi
