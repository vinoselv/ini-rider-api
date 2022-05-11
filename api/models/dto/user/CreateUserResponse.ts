import { IsDefined } from "class-validator";
import { Expose } from "class-transformer";
import { SignUpResponse } from "aws-sdk/clients/cognitoidentityserviceprovider";

export class CreateUserResponse {
    @IsDefined()
    @Expose()
    confirmed: boolean;

    @IsDefined()
    @Expose()
    id: string;

    static fromCognito(signUpResponse: SignUpResponse) {
        let cur = new CreateUserResponse();
        cur.confirmed = signUpResponse.UserConfirmed;
        cur.id = signUpResponse.UserSub;
        return cur;
    }
}
