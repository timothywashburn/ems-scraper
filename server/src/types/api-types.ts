import { Request, Response } from 'express';

export interface ApiRequest<T = any> extends Request {
    body: T;
    auth?: {
        tokenId: number;
        tokenName: string;
        isAdmin: boolean;
    };
}

export interface ApiResponse<T = any> extends Response {
    json: (body: ApiSuccessResponse<T> | ApiErrorResponse) => this;
}

export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        details?: any;
    };
}

export enum AuthType {
    NONE = 'none',
    AUTHENTICATED = 'authenticated',
    ADMIN_AUTHENTICATED = 'admin_authenticated',
}

export interface ApiEndpoint<TReq = any, TRes = any> {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    auth: AuthType;
    handler: (req: ApiRequest<TReq>, res: ApiResponse<TRes>) => Promise<void> | void;
}

export enum ErrorCode {
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    MISSING_TOKEN = 'MISSING_TOKEN',
    INVALID_TOKEN = 'INVALID_TOKEN',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
}