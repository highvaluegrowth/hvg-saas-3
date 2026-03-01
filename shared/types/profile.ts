// Profile sub-types for the HVG user profile builder

export type Religion =
    | 'christian'
    | 'muslim'
    | 'buddhist'
    | 'jewish'
    | 'hindu'
    | 'agnostic'
    | 'atheist';

export type ChristianDenomination =
    | 'catholic' | 'eastern_orthodox' | 'oriental_orthodox' | 'protestant'
    | 'lutheran' | 'anglican' | 'presbyterian' | 'methodist' | 'baptist'
    | 'anabaptism' | 'pentecostal' | 'restoration' | 'non_denominational' | 'other';

export type JewishDenomination =
    | 'messianic' | 'orthodox' | 'conservative' | 'reform'
    | 'deconstructionist' | 'humanist' | 'non_denominational' | 'other';

export type MuslimDenomination =
    | 'sunni' | 'shia' | 'ibadi' | 'non_denominational' | 'other';

export type HinduDenomination =
    | 'vaishnavism' | 'shaivism' | 'shaktism' | 'smartism' | 'non_denominational' | 'other';

export type BuddhistDenomination =
    | 'theravada' | 'mahayana' | 'vajrayana' | 'non_denominational' | 'other';

export type AgnosticVariant =
    | 'strong_hard' | 'weak_soft' | 'atheism' | 'theism'
    | 'apathetic_pragmatic' | 'ignosticism' | 'other';

export type AtheistVariant =
    | 'new_atheism' | 'secular_humanism' | 'science_as_religion' | 'political_religion'
    | 'misotheism' | 'without_progress' | 'mystical' | 'other';

export type Denomination =
    | ChristianDenomination
    | JewishDenomination
    | MuslimDenomination
    | HinduDenomination
    | BuddhistDenomination
    | AgnosticVariant
    | AtheistVariant;

export interface FaithProfile {
    religion: Religion;
    denomination?: Denomination;
}

// ─────────────────────────────────────────────────────────────────────────────

export type SobrietyStatus = 'recovery' | 'active_addiction' | 'detoxing';

export type Substance =
    | 'amphetamine' | 'barbiturates' | 'benzodiazepines' | 'cannabis'
    | 'cocaine' | 'fentanyl' | 'ghb' | 'heroin' | 'hydrocodone'
    | 'ketamine' | 'lsd' | 'mescaline' | 'methamphetamine' | 'mdma'
    | 'oxycodone' | 'pcp' | 'synthetic_cannabinoids' | 'synthetic_cathinones';

export interface SubstanceEntry {
    id: string;
    substance: Substance;
    startDate: string; // MM/YYYY
}

// ─────────────────────────────────────────────────────────────────────────────

export type GoalCategory = 'recovery' | 'fitness' | 'professional' | 'personal';

export interface Goal {
    id: string;
    category: GoalCategory;
    specific: string;       // "I will start walking"
    measurable: string;     // "30 min, 5x/week"
    achievable: string;     // "Start 15 min, build up"
    relevant: string;       // "Improve cardiovascular health"
    timeBound: string;      // "Over the next 3 months"
    dueDate?: string;       // ISO date string
    createdAt: string;      // ISO date string
}

// ─────────────────────────────────────────────────────────────────────────────

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillEntry {
    id: string;
    description: string;
    level: SkillLevel;
    yearsPracticed: number;
}

export interface WorkEntry {
    id: string;
    company: string;
    position: string;
    start: string;        // MM/YYYY
    end?: string;         // MM/YYYY or undefined = "present"
}

export interface EducationEntry {
    id: string;
    institution: string;
    focus: string;
    start: string;        // MM/YYYY
    end?: string;         // MM/YYYY or undefined = "present"
}

export interface Capabilities {
    skills: SkillEntry[];
    workExperience: WorkEntry[];
    education: EducationEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────

export type MoralQuestionType = 'trolley' | 'two_options' | 'likert_7';

export interface MoralResponse {
    questionId: string;
    type: MoralQuestionType;
    answer: string | number;
    answeredAt: string; // ISO date string
}
