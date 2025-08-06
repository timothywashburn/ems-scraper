import { prisma } from '@/lib/prisma';
import { populateRoomsScript } from '@/scripts/populate-rooms';
import { populateBuildingsScript } from '@/scripts/populate-buildings';
import { populateRoomTypesScript } from '@/scripts/populate-room-types';
import { populateStatusesScript } from "@/scripts/populate-statuses";
import { ScriptInfo, RunScriptResponse } from '@timothyw/ems-scraper-types';

export interface ScriptConfig {
    name: string;
    tableName: keyof typeof prisma;
    handler: () => Promise<void>;
}

export class ScriptManager {
    private scripts: Map<string, ScriptConfig> = new Map();

    constructor() {
        this.registerScripts();
    }

    private registerScripts() {
        this.addScript(populateBuildingsScript);
        this.addScript(populateRoomTypesScript);
        this.addScript(populateRoomsScript);
        this.addScript(populateStatusesScript);
        console.log(`Registered ${this.scripts.size} scripts`);
    }

    addScript(script: ScriptConfig) {
        this.scripts.set(script.name, script);
    }

    async getScriptsStatus(): Promise<ScriptInfo[]> {
        const scriptsStatus: ScriptInfo[] = [];

        for (const [scriptName, script] of this.scripts) {
            const table = prisma[script.tableName] as any;
            const count = await table.count();

            scriptsStatus.push({
                name: script.name,
                tableName: String(script.tableName),
                recordCount: count,
                status: count === 0 ? 'empty' : 'populated'
            });
        }

        return scriptsStatus;
    }

    async runScript(scriptName: string): Promise<RunScriptResponse> {
        const script = this.scripts.get(scriptName);
        if (!script) {
            return {
                success: false,
                scriptName,
                message: `Script '${scriptName}' not found`
            };
        }

        try {
            console.log(`\n--- Running ${script.name} ---`);
            const table = prisma[script.tableName] as any;
            const beforeCount = await table.count();

            await script.handler();

            const afterCount = await table.count();
            const recordsProcessed = afterCount - beforeCount;

            console.log(`✓ Script '${script.name}' completed successfully`);

            return {
                success: true,
                scriptName,
                message: `Script completed successfully`,
                recordsProcessed
            };
        } catch (error) {
            console.error(`✗ Script '${script.name}' failed:`, error);
            return {
                success: false,
                scriptName,
                message: `Script failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    async runAllScripts(): Promise<RunScriptResponse[]> {
        console.log('='.repeat(60));
        console.log('Starting script execution...');
        console.log('='.repeat(60));

        const results: RunScriptResponse[] = [];

        for (const [scriptName, script] of this.scripts) {
            const result = await this.runScript(scriptName);
            results.push(result);
        }

        console.log('\n' + '='.repeat(60));
        console.log('All scripts completed');
        console.log('='.repeat(60));

        return results;
    }

    async runAllScriptsIfEmpty(): Promise<void> {
        console.log('='.repeat(60));
        console.log('Starting script execution (empty tables only)...');
        console.log('='.repeat(60));

        for (const [scriptName, script] of this.scripts) {
            console.log(`\n--- ${script.name} ---`);
            const table = prisma[script.tableName] as any;
            const count = await table.count();

            if (count === 0) {
                console.log(`Table '${String(script.tableName)}' is empty, running script...`);
                await script.handler();
                console.log(`✓ Script completed successfully`);
            } else {
                console.log(`Table '${String(script.tableName)}' has ${count} records, skipping`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('All scripts completed');
        console.log('='.repeat(60));
    }
}

export const scriptManager = new ScriptManager();