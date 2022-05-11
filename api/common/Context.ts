import { Claims } from "../models/dto/user/Claims";

const log4js = require("log4js");

export class Context {
    requestId: string;
    claims: Claims;

    constructor(requestId: string) {
        this.requestId = requestId;
    }

    setClaims(claims: Claims) {
        this.claims = claims;
    }
}
