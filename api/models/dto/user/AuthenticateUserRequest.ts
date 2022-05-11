import { IsDefined } from "class-validator";
import { Expose } from "class-transformer";

export class AuthenticateUserRequest {
    @IsDefined()
    @Expose()
    name: string;

    @IsDefined()
    @Expose()
    password: string;

    constructor(name?: string, password?: string) {
        this.name = name!;
        this.password = password!;
    }
}
