import { Expose } from "class-transformer";
import {
    IsDefined, IsOptional
} from "class-validator";
import { Place } from "../../Place";

export class CreateCarResponse {
    @IsDefined()
    @Expose()
    id: string;

    @IsDefined()
    @Expose()
    make: string;

    @IsDefined()
    @Expose()
    model: string;

    @IsDefined()
    @Expose()
    year: number;

    @IsDefined()
    @Expose()
    registrationNumber: string;

    @IsDefined()
    @Expose()
    ownerId: string;

    @IsDefined()
    @Expose()
    thingy91ImeiNumber: number;

    @IsOptional()
    @Expose()
    place: Place;

    static fromDao(data: any) {
        let ccr = new CreateCarResponse();
        ccr.id = data.id;
        ccr.make = data.make;
        ccr.model = data.model;
        ccr.year = data.year;
        ccr.registrationNumber = data.registrationNumber;
        ccr.thingy91ImeiNumber = data.thingy91ImeiNumber;
        ccr.ownerId = data.ownerId;
        ccr.place = data.place;
        return ccr;
    }
}
