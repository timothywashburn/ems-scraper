import express, { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { ApiEndpoint, ApiRequest, ApiResponse, AuthType, ErrorCode } from '@/types/api-types';
import { statusEndpoint } from '@/api/misc/status';
import { getViolationsEndpoint } from '@/api/monitor/get-violations';
import { getEventsEndpoint } from '@/api/events/get-events';
import { getEventByIdEndpoint } from '@/api/events/get-event-by-id';
import { getEventHistoryEndpoint } from '@/api/events/get-event-history';
import { getRecentArchivesEndpoint } from '@/api/events/get-recent-archives';
import { getNoLongerFoundEventsEndpoint } from '@/api/events/get-no-longer-found-events';
import { getNewEventsEndpoint } from '@/api/events/get-new-events';
import { getGroupsEndpoint } from '@/api/groups/get-groups';
import { getDailyAvailabilityEndpoint } from '@/api/availability/daily-availability';
import { getWeeklyAvailabilityEndpoint } from '@/api/availability/weekly-availability';
import { getMonthlyAvailabilityEndpoint } from '@/api/availability/monthly-availability';
import { TokenService } from '@/services/token-service';
import { validateTokenEndpoint } from "@/api/misc/validate-token";
import { scraperOverviewEndpoint } from '@/api/scraper/scraper-overview';
import { scraperControlEndpoint } from '@/api/scraper/scraper-control';
import { scraperLogsEndpoint } from '@/api/scraper/scraper-logs';
import { getApiKeysEndpoint } from '@/api/admin/get-api-keys';
import { createApiKeyEndpoint } from '@/api/admin/create-api-key';
import { updateApiKeyEndpoint } from '@/api/admin/update-api-key';
import { deleteApiKeyEndpoint } from '@/api/admin/delete-api-key';
import { getScriptsStatus, runScript, runAllScripts } from '@/api/admin/scripts-control';

export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;

    private constructor() {
        this.router = express.Router();
        this.setupMiddleware();
        this.registerEndpoints();
    }

    private registerEndpoints() {
        // Misc endpoints
        this.addEndpoint(statusEndpoint);
        this.addEndpoint(validateTokenEndpoint);

        // Monitoring endpoints
        this.addEndpoint(getViolationsEndpoint);

        // Event endpoints
        this.addEndpoint(getEventsEndpoint);
        this.addEndpoint(getEventByIdEndpoint);
        this.addEndpoint(getEventHistoryEndpoint);
        this.addEndpoint(getRecentArchivesEndpoint);
        this.addEndpoint(getNoLongerFoundEventsEndpoint);
        this.addEndpoint(getNewEventsEndpoint);

        // Group endpoints
        this.addEndpoint(getGroupsEndpoint);

        // Availability endpoints
        this.addEndpoint(getDailyAvailabilityEndpoint);
        this.addEndpoint(getWeeklyAvailabilityEndpoint);
        this.addEndpoint(getMonthlyAvailabilityEndpoint);

        // Scraper endpoints
        this.addEndpoint(scraperOverviewEndpoint);
        this.addEndpoint(scraperControlEndpoint);
        this.addEndpoint(scraperLogsEndpoint);

        // Admin endpoints
        this.addEndpoint(getApiKeysEndpoint);
        this.addEndpoint(createApiKeyEndpoint);
        this.addEndpoint(updateApiKeyEndpoint);
        this.addEndpoint(deleteApiKeyEndpoint);
        this.addEndpoint(getScriptsStatus);
        this.addEndpoint(runScript);
        this.addEndpoint(runAllScripts);

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