import { IsDefined } from "class-validator";
import { Expose } from "class-transformer";

export class Claims {
    @IsDefined()
    @Expose()
    id: string;
}
