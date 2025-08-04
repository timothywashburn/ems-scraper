import { prisma } from '@/lib/prisma';
import { populateRoomsScript } from '@/scripts/populate-rooms';
import { populateBuildingsScript } from '@/scripts/populate-buildings';
import { populateRoomTypesScript } from '@/scripts/populate-room-types';
import { populateStatusesScript } from "@/scripts/populate-statuses";

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

    async runAllScripts(): Promise<void> {
        console.log('='.repeat(60));
        console.log('Starting script execution...');
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