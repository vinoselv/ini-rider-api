import { IsDefined } from "class-validator";
import { Expose } from "class-transformer";
import { Claims } from "./Claims";

export class ApplicationClaims extends Claims {
    @IsDefined()
    @Expose()
    tokenUse: string;

    @IsDefined()
    @Expose()
    scope: string;

    @IsDefined()
    @Expose()
    clientId: string;

    static fromRequest(claims: any) {
        let ac = new ApplicationClaims();
        ac.id = claims.sub;
        ac.tokenUse = claims.token_use;
        ac.scope = claims.scope;
        ac.clientId = claims.client_id;
        return ac;
    }
}
