import { Expose, Type } from "class-transformer";
import {
    IsDateString,
    IsDefined, IsNotEmpty,
    IsNumber,
    ValidateNested
} from "class-validator";
import { Place } from "../../Place";
import { RideUser } from "../../RideUser";
import { SearchRidesRequest } from "./SearchRidesRequest";

export class CreateRideRequest extends SearchRidesRequest { 

    @Expose()
    @ValidateNested()
    @IsNotEmpty()
    @Type(() => RideUser)
    creator: RideUser;

    constructor(from: Place, 
        to: Place, 
        distance: number, 
        duration: number,
        creator: RideUser,
        rideRequestTime: string,
        passengersRequested: number) {
            super(from, to,distance, duration, rideRequestTime, passengersRequested);
        this.creator = creator;
    }
}
