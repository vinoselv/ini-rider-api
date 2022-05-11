import { Expose } from "class-transformer";
import "reflect-metadata";
import { EntityType } from "../EntityType";
import { Place } from "../Place";
import { BaseEntity } from "./BaseEntity";

export class Car extends BaseEntity {
    @Expose()
    make: string;

    @Expose()
    model: string;

    @Expose()
    year: number;

    @Expose()
    registrationNumber: string;

    @Expose()
    thingy91ImeiNumber: number;

    @Expose()
    type: string;

    @Expose()
    ownerId: string;

    @Expose()
    place: Place;
}

export class CarBuilder {
    private id: string;
    private make: string;
    private model: string;
    private year: number;
    private registrationNumber: string;
    private thingy91ImeiNumber: number;
    private ownerId: string;
    private date: string;

    setId(value: string): CarBuilder {
        this.id = value;
        return this;
    }

    setMake(value: string): CarBuilder {
        this.make = value;
        return this;
    }

    setModel(value: string): CarBuilder {
        this.model = value;
        return this;
    }

    setYear(value: number): CarBuilder {
        this.year = value;
        return this;
    }

    setRegistrationNumber(value: string): CarBuilder {
        this.registrationNumber = value;
        return this;
    }

    setThingy91ImeiNumber(value: number): CarBuilder {
        this.thingy91ImeiNumber = value;
        return this;
    }

    setOwnerId(value: string): CarBuilder {
        this.ownerId = value;
        return this;
    }

    setDate(value: string): CarBuilder {
        this.date = value;
        return this;
    }

    build(): Car {
        let car = new Car();

        car.type = EntityType.CAR;
        car.id = this.id;
        car.make = this.make;
        car.model = this.model;
        car.make = this.make;
        car.registrationNumber = this.registrationNumber;
        car.thingy91ImeiNumber = this.thingy91ImeiNumber;
        car.ownerId = this.ownerId;
        car.year = this.year;
        car.pk = "USER#" + this.ownerId;
        car.sk = "CAR";
        car.createdAt = car.updatedAt = this.date;

        return car;
    }
}
