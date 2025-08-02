import { ApiEndpoint, AuthType, ErrorCode } from '@/types/api-types';
import { TokenService } from '@/services/token-service';

interface ValidateTokenRequest {
    token: string;
}

interface ValidateTokenResponse {
    valid: boolean;
    is_admin?: boolean;
}

export const validateTokenEndpoint: ApiEndpoint<ValidateTokenRequest, ValidateTokenResponse> = {
    method: 'post',
    path: '/api/validate-token',
    auth: AuthType.NONE,
    handler: async (req, res) => {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Token is required',
                    code: ErrorCode.VALIDATION_ERROR,
                },
            });
            return;
        }

        const tokenService = TokenService.getInstance();
        const validToken = await tokenService.validateToken(token);

        if (validToken) {
            res.json({
                success: true,
                data: {
                    valid: true,
                    is_admin: validToken.is_admin,
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