import "reflect-metadata";
import { IsDefined, ValidateNested } from "class-validator";
import { Expose, Transform, Type } from "class-transformer";
import { GetRideOfferResponse } from "./GetRideOfferResponse";
import { EntityType } from "../../EntityType";
import { GetRideRequestResponse } from "./GetRideRequestResponse";
import { CreateRideOfferResponse } from "./CreateRideOfferResponse";
import { CreateRideRequestResponse } from "./CreateRideRequestResponse";

export class GetRidesResponse {
    @IsDefined()
    @Expose()
    @ValidateNested()
    @Type(() => GetRideOfferResponse)
    offers: GetRidesResponse[];

    @IsDefined()
    @Expose()
    @ValidateNested()
    @Type(() => GetRideOfferResponse)
    requests: GetRidesResponse[];

    @IsDefined()
    @Expose()
    @Transform(({ value }) => value != undefined)
    hasMore: boolean;

    static fromDao(data: any) {
        let result = new GetRidesResponse();
        result.offers = data.Items.filter(i => i.type == EntityType.RIDE_OFFER).map((i) => CreateRideOfferResponse.fromDao(i));
        result.requests = data.Items.filter(i => i.type == EntityType.RIDE_REQUEST).map((i) => CreateRideRequestResponse.fromDao(i));
        result.hasMore = data.LastEvaluatedKey != undefined;
        return result;
    }
}
