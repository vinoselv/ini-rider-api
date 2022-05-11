import { IsDefined, IsNotEmpty, IsString } from "class-validator";
import { Expose, Type } from "class-transformer";
import { Place } from "../Place";
import { RideUser } from "../RideUser";
import { RideStatus } from "../RideStatus";
import { BaseEntity } from "./BaseEntity";
import { EntityType } from "aws-sdk/clients/iam";
import { RideOfferMetaData } from "../RideOfferMetaData";

export class RideRequest extends BaseEntity {
    @Expose()
    type: string;

    @Expose()
    @Type(() => RideUser)
    creator: RideUser;

    @Expose()
    from: Place;

    @Expose()
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
    rideOfferId: string;

    @Expose()
    passengersRequested: number;
}

export class RideRequestBuilder {
    private id: string;
    private creator: RideUser;
    private from: Place;
    private to: Place;
    private distance: number;
    private duration: number;
    private createdAt: string;
    private rideRequestTime: string;
    private type: EntityType;
    private rideStatus: RideStatus;
    private rideOfferId: string;
    private passengersRequested: number;

    setId(id: string): RideRequestBuilder {
        this.id = id;
        return this;
    }

    setCreator(creator: RideUser): RideRequestBuilder {
        this.creator = creator;
        return this;
    }

    setFrom(from: Place): RideRequestBuilder {
        this.from = from;
        return this;
    }

    setTo(to: Place): RideRequestBuilder {
        this.to = to;
        return this;
    }

    setDistance(distance: number): RideRequestBuilder {
        this.distance = distance;
        return this;
    }

    setDuration(duration: number): RideRequestBuilder {
        this.duration = duration;
        return this;
    }

    setDate(value: string): RideRequestBuilder {
        this.createdAt = value;
        return this;
    }

    setRideRequestTime(rideRequestTime: string): RideRequestBuilder {
        this.rideRequestTime = rideRequestTime;
        return this;
    }

    setRideOfferId(rideOfferId: string): RideRequestBuilder {
        this.rideOfferId = rideOfferId;
        return this;
    }

    setRideType(type: EntityType) {
        this.type = type;
        return this;
    }

    setStatus(rideStatus: RideStatus) {
        this.rideStatus = rideStatus;
        return this;
    }

    setPassengersRequested(passengersRequested: number): RideRequestBuilder {
        this.passengersRequested = passengersRequested;
        return this;
    }

    build(): RideRequest {
        let ride = new RideRequest(); 

        ride.type = this.type;
        ride.id = this.id;
        ride.creator = this.creator;
        // pk is set by the geohash library
        ride.sk = this.id;
        ride.gsi2pk = "USER#" + this.creator.id;
        ride.gsi2sk = "RIDE#" + this.id;
        ride.gsi3pk = "RIDE_OFFER#" + this.rideOfferId;
        ride.gsi3sk = "RIDE_REQUEST#" + this.id;
        ride.createdAt = ride.updatedAt = this.createdAt;
        ride.from = this.from;
        ride.to = this.to;
        ride.rideOfferId = this.rideOfferId;
        ride.distance = this.distance;
        ride.duration = this.duration;
        ride.rideRequestTime = this.rideRequestTime
        ride.rideStatus = this.rideStatus;
        ride.passengersRequested = this.passengersRequested;
        return ride;
    }
}
