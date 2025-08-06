import { ApiEndpoint, AuthType, ErrorCode } from '@/types/api-types';
import { GetScriptsStatusResponse, RunScriptRequest, RunScriptResponse, RunAllScriptsResponse } from '@timothyw/ems-scraper-types';
import { scriptManager } from '@/controllers/script-manager';

export const getScriptsStatus: ApiEndpoint<void, GetScriptsStatusResponse> = {
    method: 'get',
    path: '/api/admin/scripts/status',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const scripts = await scriptManager.getScriptsStatus();

            res.json({
                success: true,
                data: { scripts }
            });
        } catch (error) {
            console.error('Error getting scripts status:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get scripts status',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
};

export const runScript: ApiEndpoint<RunScriptRequest, RunScriptResponse> = {
    method: 'post',
    path: '/api/admin/scripts/run/:scriptName',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const scriptName = req.params.scriptName;
            
            if (!scriptName) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Script name is required',
                        code: ErrorCode.BAD_REQUEST
                    }
                });
                return;
            }

            const result = await scriptManager.runScript(scriptName);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error running script:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to run script',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
};

export const runAllScripts: ApiEndpoint<void, RunAllScriptsResponse> = {
    method: 'post',
    path: '/api/admin/scripts/run-all',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const results = await scriptManager.runAllScripts();
            const successfulScripts = results.filter(r => r.success).length;

            res.json({
                success: true,
                data: {
                    success: successfulScripts === results.length,
                    results,
                    totalScripts: results.length,
                    successfulScripts
                }
            });
        } catch (error) {
            console.error('Error running all scripts:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to run all scripts',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
};