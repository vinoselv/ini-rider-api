import "reflect-metadata";
import { IsDefined, ValidateNested } from "class-validator";
import { Expose, Transform, Type } from "class-transformer";
import { GetRideOfferResponse } from "./GetRideOfferResponse";
import { EntityType } from "../../EntityType";

export class SearchRidesResponse {
    @IsDefined()
    @Expose()
    @ValidateNested()
    @Type(() => GetRideOfferResponse)
    offers: GetRideOfferResponse[];

    @IsDefined()
    @Expose()
    @Transform(({ value }) => value != undefined)
    hasMore: boolean;

    static fromDao(data: any) {
        let result = new SearchRidesResponse();
        result.offers = data.Items.filter(i => i.type == EntityType.RIDE_OFFER).map((i) => GetRideOfferResponse.fromDao(i));
        result.hasMore = data.LastEvaluatedKey != undefined;
        return result;
    }
}
