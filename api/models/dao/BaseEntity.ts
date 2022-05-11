import { Expose } from "class-transformer";
import { IsDateString } from "class-validator";

export class BaseEntity {
    @Expose()
    id: string;

    @Expose()
    pk: string;

    @Expose()
    sk: string;

    @Expose()
    gsi1pk: string;

    @Expose()
    gsi1sk: string;

    @Expose()
    gsi2pk: string;

    @Expose()
    gsi2sk: string;

    @Expose()
    gsi3pk: string;

    @Expose()
    gsi3sk: string;

    @Expose()
    @IsDateString()
    createdAt: string;

    @Expose()
    @IsDateString()
    updatedAt: string;
}
