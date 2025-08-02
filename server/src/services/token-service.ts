import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export interface ApiToken {
    id: number;
    token: string;
    is_admin: boolean;
    comment: string;
    created_at: Date;
    last_used: Date | null;
}

export class TokenService {
    private static instance: TokenService;

    private constructor() {
    }

    static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    generateToken(): string {
        return randomBytes(32).toString('hex');
    }

    async createToken(comment: string, isAdmin: boolean): Promise<ApiToken> {
        const token = this.generateToken();

        return prisma.api_tokens.create({
            data: {
                token,
                is_admin: isAdmin,
                comment,
            },
        });
    }

    async validateToken(token: string): Promise<ApiToken | null> {
        const apiToken = await prisma.api_tokens.findFirst({
            where: {
                token,
            },
        });

        if (apiToken) {
            // Update last_used timestamp
            await prisma.api_tokens.update({
                where: { id: apiToken.id },
                data: { last_used: new Date() },
            });
        }

        return apiToken;
    }

    async ensureInitialTokenExists(): Promise<void> {
        const tokenCount = await prisma.api_tokens.count();

        if (tokenCount === 0) {
            const token = await this.createToken('admin', true);
            console.log('🔑 Created initial admin token:', token.token);
            console.log('⚠️  Save this token securely - it will not be shown again!');
        }
    }
}