import { Tool } from '@google/genai';
import { clinicalTools, executeClinicalTool } from './clinical-agent';
import { logisticsTools, executeLogisticsTool } from './logistics-agent';
import { marketingTools, executeMarketingTool } from './marketing-agent';
import { financeTools, executeFinanceTool } from './finance-agent';
import { synthesisTools, executeSynthesisTool } from './synthesis-agent';

// ─── TIERED TOOL DEFINITIONS ──────────────────────────────────────────────────

// RESIDENT: Wellness, Personal Chores, House Events, Recovery Resources
export const residentTierTools: Tool[] = [
    {
        functionDeclarations: [
            ...clinicalTools[0].functionDeclarations!.filter(f => 
                ['log_mood', 'get_wellness_summary', 'log_meeting_attendance', 'get_meeting_attendance', 'find_aa_meetings', 'get_my_courses', 'create_journal_entry', 'get_journal_entries', 'get_crisis_resources', 'get_sobriety_stats'].includes(f.name!)
            ),
            ...logisticsTools[0].functionDeclarations!.filter(f => 
                ['get_upcoming_events', 'get_pending_chores'].includes(f.name!)
            ),
        ]
    }
];

// OPERATOR: All Clinical, All Logistics, Marketing, Finance
export const operatorTierTools: Tool[] = [
    {
        functionDeclarations: [
            ...clinicalTools[0].functionDeclarations!,
            ...logisticsTools[0].functionDeclarations!,
            ...marketingTools[0].functionDeclarations!,
            ...financeTools[0].functionDeclarations!,
        ]
    }
];

// SUPERADMIN: Everything + Global Synthesis
export const superAdminTierTools: Tool[] = [
    {
        functionDeclarations: [
            ...operatorTierTools[0].functionDeclarations!,
            ...synthesisTools[0].functionDeclarations!,
        ]
    }
];

// ─── UNIFIED EXECUTOR ─────────────────────────────────────────────────────────

export async function executeTieredTool(
    toolName: string,
    args: Record<string, unknown>,
    context: { 
        tier: 'resident' | 'operator' | 'superadmin';
        tenantId?: string; 
        uid: string; 
        sobrietyDate?: Date | null;
    }
): Promise<Record<string, unknown>> {
    // 1. Check Clinical Agent
    if (clinicalTools[0].functionDeclarations?.some(f => f.name === toolName)) {
        return executeClinicalTool(toolName, args, context);
    }

    // 2. Check Logistics Agent
    if (logisticsTools[0].functionDeclarations?.some(f => f.name === toolName)) {
        return executeLogisticsTool(toolName, args, context);
    }

    // 3. Check Marketing Agent
    if (marketingTools[0].functionDeclarations?.some(f => f.name === toolName)) {
        if (!context.tenantId) return { error: 'Tenant context required for marketing' };
        return executeMarketingTool(toolName, args, { tenantId: context.tenantId, uid: context.uid });
    }

    // 4. Check Finance Agent
    if (financeTools[0].functionDeclarations?.some(f => f.name === toolName)) {
        if (!context.tenantId) return { error: 'Tenant context required for finance' };
        return executeFinanceTool(toolName, args, { tenantId: context.tenantId, uid: context.uid });
    }

    // 5. Check Synthesis Agent (SuperAdmin Only)
    if (synthesisTools[0].functionDeclarations?.some(f => f.name === toolName)) {
        if (context.tier !== 'superadmin') return { error: 'Unauthorized: Synthesis tools restricted to SuperAdmin' };
        return executeSynthesisTool(toolName, args, { uid: context.uid });
    }

    return { error: `Tool ${toolName} not found in any expert agent registry` };
}
