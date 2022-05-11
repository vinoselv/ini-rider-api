import { IsDefined, IsOptional } from "class-validator";
import { Expose } from "class-transformer";
import { Claims } from "./Claims";

export class UserClaims extends Claims {
    @IsDefined()
    @Expose()
    emailVerified: boolean;

    @IsDefined()
    @Expose()
    userName: string;

    @IsOptional()
    @Expose()
    home: string;

    @IsOptional()
    @Expose()
    role: string;

    @IsDefined()
    @Expose()
    email: string;

    static fromRequest(claims: any) {
        let uc = new UserClaims();
        uc.email = claims.email;
        uc.emailVerified = claims.email_verified;
        uc.home = claims["custom:home"];
        uc.role = claims["custom:role"];
        uc.id = claims.sub;
        uc.userName = claims["cognito:username"];
        return uc;
    }
}
