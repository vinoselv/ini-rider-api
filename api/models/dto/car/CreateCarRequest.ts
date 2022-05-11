import { Expose } from "class-transformer";
import {
    IsDefined, IsNotEmpty,
    IsNumber,
    IsString,
    Matches
} from "class-validator";

export class CreateCarRequest {
    @IsDefined()
    @Expose()
    @IsString()
    @IsNotEmpty()
    make: string;

    @IsDefined()
    @Expose()
    @IsString()
    @IsNotEmpty()
    model: string;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 4 })
    year: number;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    @IsString()
    @Matches(
        /^[A-Za-z]{3}-[0-9]{3}$/,
        {
            message:
                "Registration number must be in the formant ABC-123.",
        }
    )
    registrationNumber: string;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 15 })
    thingy91ImeiNumber: number;

    constructor(
        make: string,
        model: string,
        year: number,
        registrationNumber: string,
        thingy91ImeiNumber: number
    ) {
        this.make = make;
        this.model = model;
        this.year = year;
        this.registrationNumber = registrationNumber;
        this.thingy91ImeiNumber = thingy91ImeiNumber;
    }
}
