import { IsDefined } from "class-validator";
import { Expose } from "class-transformer";

export enum ExceptionType {
    ValidationException = "ValidationException",
    AuthenticationException = "AuthenticationException",
    ForbiddenException = "ForbiddenException",
    UsernameExistsException = "UsernameExistsException",
    TaskNameExistsException = "TaskNameExistsException",
    UserTaskEntryExistsException = "UserTaskEntryExistsException",
    UserNotFoundException = "UserNotFoundException",
    NotAuthorizedException = "NotAuthorizedException",
} 

export class ErrorResponse {
    @IsDefined()
    @Expose()
    type: ExceptionType;

    @IsDefined()
    @Expose()
    message: string[];

    constructor(type: ExceptionType, message: string[]) {
        this.type = type;
        this.message = message;
    }
}
