import { Expose } from "class-transformer";
import {
    IsDefined, IsEnum, IsNotEmpty, IsOptional,
    ValidateIf
} from "class-validator";
import { EntityType } from "../../EntityType";
import { RideStatus } from "../../RideStatus";

export class UpdateRideStatusRequest { 
    @IsDefined()
    @Expose()
    @IsNotEmpty()
    id: string;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    @IsEnum(RideStatus, { each: true })
    rideStatus: RideStatus;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    @IsEnum(EntityType, { each: true })
    type: EntityType;

    @IsDefined()
    @IsNotEmpty()
    @Expose()
    @ValidateIf(obj => obj.type == EntityType.RIDE_REQUEST)
    rideOfferId: string;

    @IsOptional()
    rating: number;
    
    constructor(id: string, 
        rideStatus: RideStatus, 
        type: EntityType,
        rideOfferId: string,
        rating: number) {
        this.id = id;
        this.rideStatus = rideStatus;
        this.type = type;
        this.rideOfferId = rideOfferId;
        this.rating = rating;
    }
}
