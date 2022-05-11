import { Expose, Type } from "class-transformer";
import {
    IsDateString,
    IsDefined, IsNotEmpty,
    IsNumber,
    ValidateNested
} from "class-validator";
import { Place } from "../../Place";
import { RideUser } from "../../RideUser";

export class SearchRidesRequest {
    @IsDefined()
    @Expose()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Place)
    from: Place;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Place)
    to: Place;

    @IsDefined()
    @Expose()
    @IsDateString()
    rideRequestTime: string;

    @IsDefined()
    @Expose()
    @IsNumber()
    @IsNotEmpty()
    distance: number;

    @IsDefined()
    @Expose()
    @IsNumber()
    @IsNotEmpty()
    duration: number;

    @IsDefined()
    @Expose()
    @IsNumber()
    @IsNotEmpty()
    passengersRequested: number;

    constructor(from: Place, 
        to: Place, 
        distance: number, 
        duration: number,
        rideRequestTime: string,
        passengersRequested: number) {
        this.from = from;
        this.to = to;
        this.duration = duration;
        this.distance = distance;
        this.rideRequestTime = rideRequestTime;
        this.passengersRequested = passengersRequested;
    }
}
