import { Expose } from "class-transformer";
import { EntityType } from "../EntityType";
import { BaseEntity } from "./BaseEntity";

export class User extends BaseEntity {
    @Expose()
    name: string;

    @Expose()
    type: string = EntityType.USER;

    @Expose()
    email: string;

    @Expose()
    iconKey: string;

    constructor(
        id: string,
        name: string,
        email: string,
        iconKey: string,
        date: string,
    ) {
        super();
        this.id = id;
        this.name = name;
        this.email = email;
        this.iconKey = iconKey;
        this.pk = this.sk = "USER#" + id;
        this.createdAt = this.updatedAt = date;
    }
}
