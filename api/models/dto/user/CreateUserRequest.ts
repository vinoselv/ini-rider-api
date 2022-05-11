import {
    IsDefined,
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    MinLength,
} from "class-validator";
import { Expose } from "class-transformer";

export class CreateUserRequest {
    @IsDefined()
    @Expose()
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDefined()
    @Expose()
    @IsString()
    @IsNotEmpty()
    iconKey: string;

    @IsDefined()
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(
        /^(?=.*([A-Z]){1,})(?=.*[!@#|%$&*]{1,})(?=.*[0-9]{1,})(?=.*[a-z]{1,}).{4,}$/,
        {
            message:
                "password must contain at least 1 uppper case, 1 lower case, 1 special and 1 number.",
        }
    )
    password: string;

    @IsDefined()
    @Expose()
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;

    constructor(name: string, password: string, email: string, iconKey: string) {
        this.name = name;
        this.password = password;
        this.email = email;
        this.iconKey = iconKey;
    }
}
