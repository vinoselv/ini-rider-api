import "reflect-metadata";
import { Expose } from "class-transformer";
import { EntityType } from "../EntityType";

export class UniqueAttribute {
    @Expose()
    pk: string;

    @Expose()
    sk: string;

    @Expose()
    type: string = EntityType.UNIQUE_CHECK;

    constructor(prefix: string, value: string) {
        this.pk = this.sk = prefix + "#" + value;
    }
}
