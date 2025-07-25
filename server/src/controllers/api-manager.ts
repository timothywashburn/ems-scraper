import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiEndpoint, ApiRequest, ApiResponse, AuthType, ErrorCode } from '@/types/api-types';
import { statusEndpoint } from '@/api/misc/status';
import { scraperTestEndpoint } from '@/api/misc/scraper-test';
import { schedulerStatusEndpoint } from '@/api/scheduler/scheduler-status';
import { startSchedulerEndpoint } from '@/api/scheduler/start-scheduler';
import { stopSchedulerEndpoint } from '@/api/scheduler/stop-scheduler';
import { getViolationsEndpoint } from '@/api/monitor/get-violations';
import { TokenService } from '@/services/token-service';

export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;

    private constructor() {
        this.router = express.Router();
        this.setupMiddleware();
        // this.registerEndpoints(); // TODO: Secure endpoints
    }

    private registerEndpoints() {
        // Status endpoints
        this.addEndpoint(statusEndpoint);
        this.addEndpoint(scraperTestEndpoint);
        
        // Scheduler endpoints
        this.addEndpoint(schedulerStatusEndpoint);
        this.addEndpoint(startSchedulerEndpoint);
        this.addEndpoint(stopSchedulerEndpoint);
        
        // Monitoring endpoints
        this.addEndpoint(getViolationsEndpoint);
        
        console.log(`registered api endpoints`);
    }

    private setupMiddleware() {
        this.router.use(express.json());

        this.router.use((req: Request, res: Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });

        this.router.use((req: Request, res: Response, next: NextFunction) => {
            if (!req.path.startsWith('/api')) {
                next();
                return;
            }

            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.path}`);
            next();
        });

        this.router.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
            console.error(error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Internal server error',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                },
            });
        });
    }

    private handleAuth: RequestHandler = async (req: ApiRequest, res: ApiResponse, next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'No token provided',
                    code: ErrorCode.MISSING_TOKEN,
                },
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid token',
                    code: ErrorCode.INVALID_TOKEN,
                },
            });
            return;
        }

        const tokenService = TokenService.getInstance();
        const apiToken = await tokenService.validateToken(token);

        if (!apiToken) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid token',
                    code: ErrorCode.INVALID_TOKEN,
                },
            });
            return;
        }

        req.auth = {
            tokenId: apiToken.id,
            tokenName: apiToken.comment,
            isAdmin: apiToken.is_admin,
        };

        next();
    };

    private handleAdminAuth: RequestHandler = async (req: ApiRequest, res: ApiResponse, next: NextFunction): Promise<void> => {
        await this.handleAuth(req, res, (error?: any) => {
            if (error) {
                next(error);
                return;
            }

            if (!req.auth?.isAdmin) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: 'Admin access required',
                        code: ErrorCode.FORBIDDEN,
                    },
                });
                return;
            }

            next();
        });
    };

    addEndpoint<TReq, TRes>(endpoint: ApiEndpoint<TReq, TRes>) {
        const handlers: RequestHandler[] = [];

        if (endpoint.auth === AuthType.AUTHENTICATED) handlers.push(this.handleAuth);
        if (endpoint.auth === AuthType.ADMIN_AUTHENTICATED) handlers.push(this.handleAdminAuth);
        handlers.push(endpoint.handler);

        this.router[endpoint.method](endpoint.path, ...handlers);
    }

    getRouter(): Router {
        return this.router;
    }

    static getInstance(): ApiManager {
        if (!ApiManager.instance) ApiManager.instance = new ApiManager();
        return ApiManager.instance;
    }
}