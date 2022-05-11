import { IsDefined } from "class-validator";
import { Expose } from "class-transformer";
import { AdminInitiateAuthResponse } from "aws-sdk/clients/cognitoidentityserviceprovider";

export class AuthenticateUserResponse {
    @IsDefined()
    @Expose()
    idToken?: string;

    @IsDefined()
    @Expose()
    refreshToken?: string;

    @IsDefined()
    @Expose()
    expiresIn?: number;

    static fromCognito(authResponse: AdminInitiateAuthResponse) {
        let aur = new AuthenticateUserResponse();
        aur.idToken = authResponse.AuthenticationResult?.IdToken;
        aur.refreshToken = authResponse.AuthenticationResult?.RefreshToken;
        aur.expiresIn = authResponse.AuthenticationResult?.ExpiresIn;
        return aur;
    }
}
