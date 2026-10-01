import type { Command } from "commander";
import chalk from "chalk";
import { assertDomainExists, readConfig } from "../utils/config.ts";
import { appendRecord, findDuplicate, readExpertiseFile, upsertRecord, validateRecord } from "../utils/expertise.ts";
import { generateId } from "../utils/ids.ts";
import { CLASSIFICATIONS, RECORD_TYPES, type Classification, type LayerRecord, type RecordType } from "../schemas/record.ts";

interface RecordOptions {
	description?: string;
	content?: string;
	name?: string;
	title?: string;
	rationale?: string;
	resolution?: string;
	url?: string;
	files?: string;
	classification?: string;
	tags?: string;
	force?: boolean;
}

export function registerRecordCommand(program: Command): void {
	program
		.command("record <domain> <type>")
		.description("Write a new expertise record")
		.option("--description <text>", "Required for most types")
		.option("--content <text>", "Required for convention (alias for --description)")
		.option("--name <text>", "Required for pattern, reference, guide")
		.option("--title <text>", "Required for decision")
		.option("--rationale <text>", "Required for decision")
		.option("--resolution <text>", "Optional for failure")
		.option("--url <text>", "Optional for reference")
		.option("--files <paths>", "Comma-separated file anchors (e.g. src/foo.ts,src/bar.ts)")
		.option("--classification <level>", "foundational | tactical | observational (default: tactical)")
		.option("--tags <tags>", "Comma-separated tags")
		.option("--force", "Override duplicate check")
		.action((domain: string, type: string, opts: RecordOptions) => {
			const cwd = process.cwd();
			const config = readConfig(cwd);

			if (!RECORD_TYPES.includes(type as RecordType)) {
				console.error(chalk.red(`✗ Unknown type "${type}". Valid types: ${RECORD_TYPES.join(", ")}`));
				process.exitCode = 1;
				return;
			}

			assertDomainExists(domain, config);

			const classification: Classification =
				(opts.classification as Classification | undefined) ?? "tactical";
			if (!CLASSIFICATIONS.includes(classification)) {
				console.error(chalk.red(`✗ Unknown classification "${classification}". Use: ${CLASSIFICATIONS.join(", ")}`));
				process.exitCode = 1;
				return;
			}

			const record = buildRecord(type as RecordType, domain, classification, opts);
			if (!record) return;

			const errors = validateRecord(record);
			if (errors.length > 0) {
				console.error(chalk.red("✗ Validation failed:"));
				for (const e of errors) console.error(chalk.red(`  ${e}`));
				process.exitCode = 1;
				return;
			}

			const existing = readExpertiseFile(domain, cwd);
			const duplicate = findDuplicate(record, existing);

			if (duplicate && !opts.force) {
				console.log(chalk.yellow(`⚠ Duplicate found (${duplicate.id}). Upserting.`));
				upsertRecord(domain, { ...record, id: duplicate.id }, duplicate.id, cwd);
				console.log(chalk.green(`✓ Updated ${duplicate.id} → ${domain}/${type}`));
				return;
			}

			appendRecord(domain, record, cwd);
			console.log(chalk.green(`✓ Recorded ${record.id} → ${domain}/${type}`));
		});
}

function buildRecord(
	type: RecordType,
	domain: string,
	classification: Classification,
	opts: RecordOptions,
): LayerRecord | null {
	const base = {
		id: generateId(),
		type,
		domain,
		classification,
		recorded_at: new Date().toISOString(),
		...(opts.files ? { files: opts.files.split(",").map((f) => f.trim()) } : {}),
		...(opts.tags ? { tags: opts.tags.split(",").map((t) => t.trim()) } : {}),
	};

	const desc = opts.description ?? opts.content;

	switch (type) {
		case "convention": {
			if (!desc) {
				console.error(chalk.red("✗ --description (or --content) is required for convention"));
				process.exitCode = 1;
				return null;
			}
			return { ...base, type: "convention", content: desc };
		}
		case "pattern": {
			if (!opts.name) {
				console.error(chalk.red("✗ --name is required for pattern"));
				process.exitCode = 1;
				return null;
			}
			if (!desc) {
				console.error(chalk.red("✗ --description is required for pattern"));
				process.exitCode = 1;
				return null;
			}
			return { ...base, type: "pattern", name: opts.name, description: desc };
		}
		case "failure": {
			if (!desc) {
				console.error(chalk.red("✗ --description is required for failure"));
				process.exitCode = 1;
				return null;
			}
			return { ...base, type: "failure", description: desc, ...(opts.resolution ? { resolution: opts.resolution } : {}) };
		}
		case "decision": {
			if (!opts.title) {
				console.error(chalk.red("✗ --title is required for decision"));
				process.exitCode = 1;
				return null;
			}
			if (!opts.rationale) {
				console.error(chalk.red("✗ --rationale is required for decision"));
				process.exitCode = 1;
				return null;
			}
			return { ...base, type: "decision", title: opts.title, rationale: opts.rationale };
		}
		case "reference": {
			if (!opts.name) {
				console.error(chalk.red("✗ --name is required for reference"));
				process.exitCode = 1;
				return null;
			}
			if (!desc) {
				console.error(chalk.red("✗ --description is required for reference"));
				process.exitCode = 1;
				return null;
			}
			return { ...base, type: "reference", name: opts.name, description: desc, ...(opts.url ? { url: opts.url } : {}) };
		}
		case "guide": {
			if (!opts.name) {
				console.error(chalk.red("✗ --name is required for guide"));
				process.exitCode = 1;
				return null;
			}
			if (!desc) {
				console.error(chalk.red("✗ --description is required for guide"));
				process.exitCode = 1;
				return null;
			}
			return { ...base, type: "guide", name: opts.name, description: desc };
		}
	}
}
