import { Expose, Type } from "class-transformer";
import {
    IsDateString,
    IsDefined, IsNotEmpty,
    IsNumber,
    IsOptional,
    ValidateNested
} from "class-validator";
import { Place } from "../../Place";
import { RideUser } from "../../RideUser";

export class CreateRideOfferRequest { 
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
    rideStartTime: string;

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

    @Expose()
    @ValidateNested()
    @IsNotEmpty()
    @Type(() => RideUser)
    creator: RideUser;

    @IsDefined()
    @Expose()
    @IsNumber()
    @IsNotEmpty()
    passengersAllowed: number;

    constructor(from: Place, 
        to: Place, 
        rideStartTime: string, 
        distance: number, 
        duration: number,
        creator: RideUser,
        passengersAllowed: number) {
        this.from = from;
        this.to = to;
        this.rideStartTime = rideStartTime;
        this.creator = creator;
        this.duration = duration;
        this.distance = distance;
        this.passengersAllowed = passengersAllowed;
    }
}
