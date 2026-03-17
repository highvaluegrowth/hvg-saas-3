import { Tool } from '@google/genai';

export const financeTools: Tool[] = [
    {
        functionDeclarations: [
            // Future Stripe/Billing tools go here
        ]
    }
];

export async function executeFinanceTool(
    toolName: string,
    args: Record<string, unknown>,
    context: { tenantId: string; uid: string }
): Promise<Record<string, unknown>> {
    return { error: `Unknown finance tool: ${toolName}` };
}
