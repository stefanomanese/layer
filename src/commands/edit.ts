import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { findRecordById, readExpertiseFile, validateRecord, writeExpertiseFile } from "../utils/expertise.ts";
import type { LayerRecord } from "../schemas/record.ts";

interface EditOptions {
	description?: string;
	content?: string;
	name?: string;
	title?: string;
	rationale?: string;
	resolution?: string;
	url?: string;
	files?: string;
	tags?: string;
	classification?: string;
}

export function registerEditCommand(program: Command): void {
	program
		.command("edit <id>")
		.description("Update fields on an existing record")
		.option("--description <text>")
		.option("--content <text>")
		.option("--name <text>")
		.option("--title <text>")
		.option("--rationale <text>")
		.option("--resolution <text>")
		.option("--url <text>")
		.option("--files <paths>", "Comma-separated file anchors")
		.option("--tags <tags>", "Comma-separated tags")
		.option("--classification <level>", "foundational | tactical | observational")
		.action((id: string, opts: EditOptions) => {
			const cwd = process.cwd();
			readConfig(cwd);

			const found = findRecordById(id, cwd);
			if (!found) {
				console.error(chalk.red(`✗ Record "${id}" not found.`));
				process.exitCode = 1;
				return;
			}

			const { record, domain } = found;
			const updated: LayerRecord = { ...record } as LayerRecord;

			if (opts.content ?? opts.description) {
				const val = opts.content ?? opts.description ?? "";
				if ("content" in updated) (updated as { content: string }).content = val;
				else if ("description" in updated) (updated as { description: string }).description = val;
			}
			if (opts.name && "name" in updated) (updated as { name: string }).name = opts.name;
			if (opts.title && "title" in updated) (updated as { title: string }).title = opts.title;
			if (opts.rationale && "rationale" in updated) (updated as { rationale: string }).rationale = opts.rationale;
			if (opts.resolution && "resolution" in updated) (updated as { resolution?: string }).resolution = opts.resolution;
			if (opts.url && "url" in updated) (updated as { url?: string }).url = opts.url;
			if (opts.files) updated.files = opts.files.split(",").map((f) => f.trim());
			if (opts.tags) updated.tags = opts.tags.split(",").map((t) => t.trim());
			if (opts.classification) updated.classification = opts.classification as LayerRecord["classification"];

			const errors = validateRecord(updated);
			if (errors.length > 0) {
				console.error(chalk.red("✗ Validation failed:"));
				for (const e of errors) console.error(chalk.red(`  ${e}`));
				process.exitCode = 1;
				return;
			}

			const records = readExpertiseFile(domain, cwd);
			const idx = records.findIndex((r) => r.id === id);
			if (idx !== -1) records[idx] = updated;
			writeExpertiseFile(domain, records, cwd);

			console.log(chalk.green(`✓ Updated ${id}`));
		});
}
