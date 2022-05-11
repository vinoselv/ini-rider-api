import { Logger } from "log4js";
import { ApplicationClaims } from "../models/dto/user/ApplicationClaims";
import { UserClaims } from "../models/dto/user/UserClaims";
import { Context } from "./Context";

const log4js = require("log4js");
const CLASSES_TO_OMIT = [
    "Utils.ts",
    "ServiceLogger.ts",
    "AWSUtils.ts",
    "TestUtils.ts",
];

export class ServiceLogger {
    private delegate: Logger;

    constructor() {
        this.delegate = log4js.getLogger();
        this.delegate.level = process.env.LOG_LEVEL ?? "info";
    }

    getDelegate(): Logger {
        return this.delegate;
    }

    debug(context: Context, message: string, statusCode?: number) {
        if (this.delegate.isDebugEnabled()) {
            this.delegate.debug(
                this.logContext(context),
                message + (statusCode ? " - " + statusCode : "")
            );
        }
    }

    info(context: Context, message: string, statusCode?: number) {
        if (this.delegate.isInfoEnabled()) {
            this.delegate.info(
                this.logContext(context),
                message + (statusCode ? " - " + statusCode : "")
            );
        }
    }

    warn(context: Context, message: string) {
        if (this.delegate.isWarnEnabled()) {
            this.delegate.warn(this.logContext(context), message);
        }
    }

    error(context: Context, message: string) {
        if (this.delegate.isErrorEnabled()) {
            this.delegate.error(this.logContext(context), message);
        }
    }

    logContext(context: Context): string {
        let e = new Error();
        let functionName;
        let elements: string[] = e?.stack?.split("\n")!;
        elements.shift();
        for (var element of elements) {
            if (!CLASSES_TO_OMIT.some((v) => element.includes(v))) {
                functionName = element
                    ?.split(" ")[5]
                    .split("\\")
                    .pop()
                    ?.split("/")
                    .pop();
                break;
            }
        }

        if (context.claims instanceof UserClaims) {
            let uClaim: UserClaims = context.claims as UserClaims;
            return `[Request:${context.requestId},User:${uClaim.id}][${functionName}]`;
        } else if (context.claims instanceof ApplicationClaims) {
            let aClaim: ApplicationClaims = context.claims as ApplicationClaims;
            return `[Request:${context.requestId},Client:${aClaim.clientId}][${functionName}]`;
        } else {
            return `[Request:${context.requestId}][${functionName}]`;
        }
    }
}
