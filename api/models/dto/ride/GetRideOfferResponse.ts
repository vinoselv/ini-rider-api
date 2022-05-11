import { Expose, Type } from "class-transformer";
import { RideRequestMetaData } from "../../RideRequestMetaData";
import { CreateRideOfferResponse } from "./CreateRideOfferResponse";

export class GetRideOfferResponse extends CreateRideOfferResponse {

    @Expose()
    @Type(() => RideRequestMetaData)
    rideRequests: RideRequestMetaData[]

    static fromDao(data: any) {
        let crr = new GetRideOfferResponse();
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
        crr.rideRequests = data.rideRequests;
        return crr;
    }


}
