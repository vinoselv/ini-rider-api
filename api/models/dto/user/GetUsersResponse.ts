import "reflect-metadata";
import { IsDefined, ValidateNested } from "class-validator";
import { Expose, Type } from "class-transformer";
import { GetUserResponse } from "./GetUserResponse";

export class GetUsersResponse {
    @IsDefined()
    @Expose()
    @ValidateNested()
    @Type(() => GetUserResponse)
    items: GetUserResponse[];

    @IsDefined()
    @Expose()
    hasMore: boolean;

    static fromDao(data: any) {
        let result = new GetUsersResponse();
        result.items = data.Items.map((i) => GetUserResponse.fromDao(i));
        result.hasMore = data.LastEvaluatedKey != undefined;
        return result;
    }
}
