export type RecordType = "convention" | "pattern" | "failure" | "decision" | "reference" | "guide";
export type Classification = "foundational" | "tactical" | "observational";
export type ArchiveReason = "stale" | "superseded" | "manual";

interface BaseRecord {
	id: string;
	type: RecordType;
	domain: string;
	classification: Classification;
	recorded_at: string;
	tags?: string[];
	files?: string[];
	supersedes?: string[];
	status?: "active" | "archived";
	archived_at?: string;
	archive_reason?: ArchiveReason;
}

export interface ConventionRecord extends BaseRecord {
	type: "convention";
	content: string;
}

export interface PatternRecord extends BaseRecord {
	type: "pattern";
	name: string;
	description: string;
}

export interface FailureRecord extends BaseRecord {
	type: "failure";
	description: string;
	resolution?: string;
}

export interface DecisionRecord extends BaseRecord {
	type: "decision";
	title: string;
	rationale: string;
}

export interface ReferenceRecord extends BaseRecord {
	type: "reference";
	name: string;
	description: string;
	url?: string;
}

export interface GuideRecord extends BaseRecord {
	type: "guide";
	name: string;
	description: string;
}

export type LayerRecord =
	| ConventionRecord
	| PatternRecord
	| FailureRecord
	| DecisionRecord
	| ReferenceRecord
	| GuideRecord;

export const RECORD_TYPES: RecordType[] = [
	"convention",
	"pattern",
	"failure",
	"decision",
	"reference",
	"guide",
];

export const CLASSIFICATIONS: Classification[] = ["foundational", "tactical", "observational"];

// AJV JSON schemas for each record type
export const baseSchema = {
	type: "object",
	properties: {
		id: { type: "string", pattern: "^lr-[0-9a-f]{6}$" },
		type: { type: "string", enum: RECORD_TYPES },
		domain: { type: "string", minLength: 1 },
		classification: { type: "string", enum: CLASSIFICATIONS },
		recorded_at: { type: "string" },
		tags: { type: "array", items: { type: "string" } },
		files: { type: "array", items: { type: "string" } },
		supersedes: { type: "array", items: { type: "string" } },
		status: { type: "string", enum: ["active", "archived"] },
		archived_at: { type: "string" },
		archive_reason: { type: "string", enum: ["stale", "superseded", "manual"] },
	},
	required: ["id", "type", "domain", "classification", "recorded_at"],
};

export const recordSchemas: Record<RecordType, object> = {
	convention: {
		...baseSchema,
		properties: { ...baseSchema.properties, content: { type: "string", minLength: 1 } },
		required: [...baseSchema.required, "content"],
		additionalProperties: false,
	},
	pattern: {
		...baseSchema,
		properties: {
			...baseSchema.properties,
			name: { type: "string", minLength: 1 },
			description: { type: "string", minLength: 1 },
		},
		required: [...baseSchema.required, "name", "description"],
		additionalProperties: false,
	},
	failure: {
		...baseSchema,
		properties: {
			...baseSchema.properties,
			description: { type: "string", minLength: 1 },
			resolution: { type: "string" },
		},
		required: [...baseSchema.required, "description"],
		additionalProperties: false,
	},
	decision: {
		...baseSchema,
		properties: {
			...baseSchema.properties,
			title: { type: "string", minLength: 1 },
			rationale: { type: "string", minLength: 1 },
		},
		required: [...baseSchema.required, "title", "rationale"],
		additionalProperties: false,
	},
	reference: {
		...baseSchema,
		properties: {
			...baseSchema.properties,
			name: { type: "string", minLength: 1 },
			description: { type: "string", minLength: 1 },
			url: { type: "string" },
		},
		required: [...baseSchema.required, "name", "description"],
		additionalProperties: false,
	},
	guide: {
		...baseSchema,
		properties: {
			...baseSchema.properties,
			name: { type: "string", minLength: 1 },
			description: { type: "string", minLength: 1 },
		},
		required: [...baseSchema.required, "name", "description"],
		additionalProperties: false,
	},
};

// Named types upsert on name/title; unnamed types dedup on exact content match
export const NAMED_TYPES: RecordType[] = ["pattern", "decision", "reference", "guide"];
export const UNNAMED_TYPES: RecordType[] = ["convention", "failure"];

export function getRecordSummary(record: LayerRecord): string {
	switch (record.type) {
		case "convention":
			return record.content;
		case "pattern":
			return `${record.name} — ${record.description}`;
		case "failure":
			return record.description + (record.resolution ? ` → ${record.resolution}` : "");
		case "decision":
			return `${record.title} — ${record.rationale}`;
		case "reference":
			return `${record.name} — ${record.description}`;
		case "guide":
			return `${record.name} — ${record.description}`;
	}
}

export function getRecordName(record: LayerRecord): string | undefined {
	switch (record.type) {
		case "pattern":
		case "reference":
		case "guide":
			return record.name;
		case "decision":
			return record.title;
		default:
			return undefined;
	}
}
