import { Expose, Type } from "class-transformer";
import { RideUser } from "./RideUser";
import { Place } from "./Place";
import { RideStatus } from "./RideStatus";
import { RideOffer } from "./dao/RideOffer";

export class RideOfferMetaData {
    @Expose()
    @Type(() => RideUser)
    creator: RideUser;

    @Expose()
    @Type(() => Place)
    from: Place;

    @Expose()
    @Type(() => Place)
    to: Place;

    @Expose()
    distance: number;

    @Expose()
    duration: number;

    @Expose()
    rideStatus: RideStatus;
    
    @Expose()
    id: string;

    @Expose()
    rideStartTime: string;

    static fromRideOffer(ro: RideOffer) {
        let r = new RideOfferMetaData();
        r.id = ro.id;
        r.creator = ro.creator;
        r.from = ro.from;
        r.to = ro.to;
        r.distance = ro.distance;
        r.duration = ro.duration;
        r.rideStatus = ro.rideStatus;
        r.rideStartTime = ro.rideStartTime;
        return r;
    }
}
