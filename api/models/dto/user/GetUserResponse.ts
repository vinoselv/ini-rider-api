import "reflect-metadata";
import { IsDateString, IsDefined, IsEmail } from "class-validator";
import { Expose } from "class-transformer";
import { AdminGetUserResponse } from "aws-sdk/clients/cognitoidentityserviceprovider";

export class GetUserResponse {
    @IsDefined()
    @Expose()
    name: string;

    @IsDefined()
    @Expose()
    iconKey: string;

    @IsDefined()
    @Expose()
    @IsEmail()
    email?: string;

    @IsDefined()
    @Expose()
    id: string;

    @IsDefined()
    @Expose()
    enabled?: boolean;

    @IsDefined()
    @Expose()
    emailVerified: boolean;

    @IsDefined()
    @Expose()
    status?: string;

    @IsDefined()
    @Expose()
    @IsDateString()
    createdAt: string;

    @IsDefined()
    @Expose()
    @IsDateString()
    updatedAt: string;

    static fromDao(data: any) {
        let gur = new GetUserResponse();
        gur.id = data.id;
        gur.iconKey = data.iconKey;
        gur.name = data.name;
        gur.email = data.email;
        gur.enabled = data.enabled;
        gur.emailVerified = data.emailVerified;
        gur.status = data.status;
        gur.createdAt = data.createdAt;
        gur.updatedAt = data.updatedAt;
        return gur;
    }
}
