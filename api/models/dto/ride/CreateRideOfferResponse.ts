import { IsDateString, IsDefined } from "class-validator";
import { Expose, Type } from "class-transformer";
import { Place } from "../../Place";
import { RideUser } from "../../RideUser";
import { RideRequestMetaData } from "../../RideRequestMetaData";
import { RideStatus } from "../../RideStatus";

export class CreateRideOfferResponse {
    @Expose()
    id: string;

    @Expose()
    type: string;
    
    @Expose()
    @Type(() => Place)
    from: Place;

    @Expose()
    @Type(() => Place)
    to: Place;

    @Expose()
    rideStartTime: string;

    @Expose()
    distance: number;

    @Expose()
    duration: number;

    @Expose()
    @Type(() => RideUser)
    creator: RideUser;

    @Expose()
    passengersAllowed: number;

    @Expose()
    passengersAccepted: number;

    @Expose()
    rideStatus: RideStatus;

    static fromDao(data: any) {
        let crr = new CreateRideOfferResponse();
        crr.type = data.type;
        crr.id = data.id;
        crr.from = data.from;
        crr.to = data.to;
        crr.distance = data.distance;
        crr.duration = data.duration;
        crr.passengersAllowed = data.passengersAllowed;
        crr.passengersAccepted = data.passengersAccepted;
        crr.creator = data.creator;
        crr.rideStartTime = data.rideStartTime;
        crr.rideStatus = data.rideStatus;
        return crr;
    }
}
