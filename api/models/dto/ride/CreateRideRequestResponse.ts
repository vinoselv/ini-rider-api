
import { Expose, Type } from "class-transformer";
import { Place } from "../../Place";
import { RideStatus } from "../../RideStatus";
import { RideOfferMetaData } from "../../RideOfferMetaData";
import { RideUser } from "../../RideUser";

export class CreateRideRequestResponse {
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
    rideRequestTime: string;

    @Expose()
    distance: number;

    @Expose()
    duration: number;

    @Expose()
    rideStatus: RideStatus;

    @Expose()
    @Type(() => RideUser)
    creator: RideUser;

    @Expose()
    rideOfferId: string;

    @Expose()
    passengersRequested: number;

    static fromDao(data: any) {
        let crr = new CreateRideRequestResponse();
        crr.type = data.type;
        crr.id = data.id;
        crr.from = data.from;
        crr.to = data.to;
        crr.distance = data.distance;
        crr.duration = data.duration;
        crr.creator = data.creator;
        crr.rideRequestTime = data.rideRequestTime;
        crr.rideOfferId = data.rideOfferId;
        crr.rideStatus = data.rideStatus;
        crr.passengersRequested = data.passengersRequested;
        return crr;
    }
}
