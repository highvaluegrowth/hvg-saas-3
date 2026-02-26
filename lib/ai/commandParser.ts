export interface SlashCommand {
    command: string;
    args: string;
}

/** Parses "/events 3" → { command: "events", args: "3" } or null for plain text */
export function parseSlashCommand(input: string): SlashCommand | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;
    const [rawCmd, ...rest] = trimmed.slice(1).split(' ');
    if (!rawCmd) return null;
    return { command: rawCmd.toLowerCase(), args: rest.join(' ').trim() };
}

/** Maps a slash command string to its description for autocomplete */
export const SLASH_COMMAND_REGISTRY: { command: string; description: string; roles: ('resident' | 'operator')[] }[] = [
    { command: '/events', description: 'Show upcoming events', roles: ['resident', 'operator'] },
    { command: '/chores', description: 'Show your pending chores', roles: ['resident', 'operator'] },
    { command: '/rides', description: 'Show ride requests', roles: ['resident', 'operator'] },
    { command: '/sobriety', description: 'Show sobriety streak', roles: ['resident'] },
    { command: '/mood', description: 'Log mood (great/good/okay/struggling/crisis)', roles: ['resident'] },
    { command: '/assign', description: '/assign @resident [task] — Assign a chore', roles: ['operator'] },
    { command: '/schedule', description: '/schedule [title] [date] — Create an event', roles: ['operator'] },
    { command: '/help', description: 'Show all available commands', roles: ['resident', 'operator'] },
];

/**
 * Converts a slash command into a natural-language prompt that Gemini
 * understands and can respond to using its tool-calling capabilities.
 */
export function slashCommandToPrompt(cmd: SlashCommand, role: string): string {
    const isOperator = role !== 'resident';
    switch (cmd.command) {
        case 'events':
            return cmd.args
                ? `Show me events for the next ${cmd.args} days.`
                : 'Show me my upcoming events for the next 7 days.';
        case 'chores':
            return 'Show me all pending chores assigned to me.';
        case 'rides':
            return isOperator
                ? 'Show me all pending ride requests that need approval or scheduling.'
                : 'Show me my upcoming ride request status.';
        case 'sobriety':
            return 'Show me my sobriety stats and streak.';
        case 'mood':
            return cmd.args
                ? `Log my mood as ${cmd.args}.`
                : 'Help me log my current mood.';
        case 'assign':
            return cmd.args
                ? `Assign this chore: ${cmd.args}`
                : 'Help me assign a chore to a resident.';
        case 'schedule':
            return cmd.args
                ? `Schedule an event: ${cmd.args}`
                : 'Help me create a new event.';
        case 'help':
            return 'Show me all the slash commands I can use in this chat.';
        default:
            return `/${cmd.command} ${cmd.args}`.trim();
    }
}
