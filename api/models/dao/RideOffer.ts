import { Expose, Type } from "class-transformer";
import "reflect-metadata";
import { EntityType } from "../EntityType";
import { Place } from "../Place";
import { RideStatus } from "../RideStatus";
import { RideRequest } from "./RideRequest";
import { RideUser } from "../RideUser";
import { BaseEntity } from "./BaseEntity";
import { RideRequestMetaData } from "../RideRequestMetaData";

export class RideOffer extends BaseEntity {
    @Expose()
    type: EntityType;
    
    @Expose()
    @Type(() => RideUser)
    creator: RideUser;

    @Expose()
    from: Place;

    @Expose()
    to: Place;

    @Expose()
    rideStartTime: string;

    @Expose()
    distance: number;

    @Expose()
    duration: number;

    @Expose()
    passengersAllowed: number;

    @Expose()
    passengersAccepted: number;

    @Expose()
    rideStatus: RideStatus;
}

export class RideOfferBuilder {
    private id: string;
    private creator: RideUser;
    private from: Place;
    private to: Place;
    private distance: number;
    private duration: number;
    private passengersAllowed: number;
    private passengersAccepted: number;
    private createdAt: string;
    private rideStartTime: string;
    private type: EntityType;
    private rideStatus: RideStatus;

    setId(id: string): RideOfferBuilder {
        this.id = id;
        return this;
    }

    setCreator(creator: RideUser): RideOfferBuilder {
        this.creator = creator;
        return this;
    }

    setFrom(from: Place): RideOfferBuilder {
        this. from = from;
        return this;
    }

    setTo(to: Place): RideOfferBuilder {
        this.to = to;
        return this;
    }

    setDistance(distance: number): RideOfferBuilder {
        this.distance = distance;
        return this;
    }

    setDuration(duration: number): RideOfferBuilder {
        this.duration = duration;
        return this;
    }

    setPassengersAllowed(passengersAllowed: number): RideOfferBuilder {
        this.passengersAllowed = passengersAllowed;
        return this;
    }

    setPassengersAccepted(passengersAccepted: number): RideOfferBuilder {
        this.passengersAccepted = passengersAccepted;
        return this;
    }

    setDate(value: string): RideOfferBuilder {
        this.createdAt = value;
        return this;
    }

    setRideStartTime(rideStartTime: string): RideOfferBuilder {
        this.rideStartTime = rideStartTime;
        return this;
    }

    setRideType(type: EntityType) {
        this.type = type;
        return this;
    }

    setRideStatus(rideStatus: RideStatus) {
        this.rideStatus = rideStatus;
        return this;
    }

    build(): RideOffer {
        let ride = new RideOffer(); 

        ride.type = this.type;
        ride.id = this.id;
        ride.creator = this.creator;
        // pk is set by the geohash library
        ride.sk = ride.rideStartTime;
        ride.gsi2pk = "USER#" + this.creator.id;
        ride.gsi2sk = "RIDE#" + this.id;
        ride.gsi3pk = "RIDE_OFFER#" + this.id;
        ride.gsi3sk = "RIDE_OFFER#" + this.id;
        ride.createdAt = ride.updatedAt = this.createdAt;
        ride.from = this.from;
        ride.to = this.to;
        ride.distance = this.distance;
        ride.duration = this.duration;
        ride.passengersAccepted = this.passengersAccepted;
        ride.passengersAllowed = this.passengersAllowed;
        ride.rideStartTime = this.rideStartTime;
        ride.rideStatus = this.rideStatus;
        return ride;
    }
}
