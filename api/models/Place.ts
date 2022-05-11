import { IsDateString, IsDecimal, IsDefined, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Expose } from "class-transformer";
import { last } from "lodash";

export class Place {
    @IsDefined()
    @Expose()
    @IsNotEmpty()
    id: string;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    name: string;

    @IsDefined()
    @Expose()
    @IsNotEmpty()
    address: string;

    @IsDefined()
    @Expose()
    @IsLatitude()
    @IsNotEmpty()
    latitude: number;

    @IsDefined()
    @Expose()
    @IsLongitude()
    @IsNotEmpty()
    longitude: number;

    @IsOptional()
    @Expose()
    @IsDateString()
    lastReportedTime: string;

    constructor(id: string, name: string, address: string, latitude: number, longitude: number, lastReportedTime: string) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.lastReportedTime = lastReportedTime;
    }
}
