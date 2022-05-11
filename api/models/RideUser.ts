import { IsDefined, IsNotEmpty, IsString } from "class-validator";
import { Expose } from "class-transformer";

export class RideUser {
    @IsDefined()
    @Expose()
    @IsString()
    @IsNotEmpty()
    id: string;

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

    constructor(id: string, name: string, iconKey: string) {
        this.id = id;
        this.name = name;
        this.iconKey = iconKey;
    }
}
