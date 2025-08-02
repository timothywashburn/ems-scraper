import { ApiEndpoint, AuthType, ErrorCode } from '@/types/api-types';
import { TokenService } from '@/services/token-service';

interface ValidateTokenRequest {
    token: string;
}

interface ValidateTokenResponse {
    valid: boolean;
    is_admin?: boolean;
    comment?: string;
    last_used?: Date | null;
}

export const validateTokenEndpoint: ApiEndpoint<ValidateTokenRequest, ValidateTokenResponse> = {
    method: 'post',
    path: '/api/validate-token',
    auth: AuthType.NONE,
    handler: async (req, res) => {
        const { token } = req.body;

        if (!token) {
            res.json({
                success: false,
                error: {
                    message: 'Token is required',
                    code: ErrorCode.MISSING_TOKEN
                },
            });
            return;
        }

        const tokenService = TokenService.getInstance();
        const apiToken = await tokenService.validateToken(token);

        if (apiToken) {
            res.json({
                success: true,
                data: {
                    valid: true,
                    is_admin: apiToken.is_admin,
                    comment: apiToken.comment,
                    last_used: apiToken.last_used,
                },
            });
        } else {
            res.json({
                success: true,
                data: {
                    valid: false,
                },
            });
        }
    },
};