import { IsDefined, IsNotEmpty, IsString } from "class-validator";
import { Expose, Type } from "class-transformer";
import { EntityType } from "aws-sdk/clients/iam";
import { BaseEntity } from "./dao/BaseEntity";
import { RideUser } from "./RideUser";
import { Place } from "./Place";
import { RideStatus } from "./RideStatus";
import { RideRequest } from "./dao/RideRequest";

export class RideRequestMetaData {
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
    rideRequestTime: string;

    @Expose()
    passengersRequested: number;

    @Expose()
    id: string;

    static fromDao(data: any) {
        let r =  new RideRequestMetaData();
        r.id = data.id;
        r.creator = data.creator;
        r.from = data.from;
        r.to = data.to;
        r.distance = data.distance;
        r.duration = data.duration;
        r.rideStatus = data.rideStatus;
        r.rideRequestTime = data.rideRequestTime;
        r.passengersRequested = data.passengersRequested;
        return r;
    } 
}
