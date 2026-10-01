import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { findRecordById, readExpertiseFile, writeExpertiseFile } from "../utils/expertise.ts";
import type { LayerRecord } from "../schemas/record.ts";

export function registerDeleteCommand(program: Command): void {
	program
		.command("delete <id>")
		.description("Permanently remove a record (irreversible)")
		.option("-y, --yes", "Skip confirmation prompt")
		.action(async (id: string, opts: { yes?: boolean }) => {
			const cwd = process.cwd();
			readConfig(cwd);

			const found = findRecordById(id, cwd);
			if (!found) {
				console.error(chalk.red(`✗ Record "${id}" not found.`));
				process.exitCode = 1;
				return;
			}

			const { record, domain } = found;
			console.log(`  ${chalk.cyan(record.type)} in ${chalk.bold(domain)}: ${getSummaryLine(record)}`);

			if (!opts.yes) {
				process.stdout.write(chalk.yellow(`Delete ${id}? This cannot be undone. [y/N] `));
				const answer = await readLine();
				if (answer.toLowerCase() !== "y") {
					console.log("Aborted.");
					return;
				}
			}

			const records = readExpertiseFile(domain, cwd).filter((r) => r.id !== id);
			writeExpertiseFile(domain, records, cwd);
			console.log(chalk.green(`✓ Deleted ${id}`));
		});
}

function getSummaryLine(record: LayerRecord): string {
	switch (record.type) {
		case "convention": return record.content.slice(0, 60);
		case "decision": return record.title.slice(0, 60);
		case "pattern": return record.name.slice(0, 60);
		case "reference": return record.name.slice(0, 60);
		case "guide": return record.name.slice(0, 60);
		case "failure": return record.description.slice(0, 60);
	}
}

async function readLine(): Promise<string> {
	return new Promise((resolve) => {
		let data = "";
		process.stdin.setEncoding("utf-8");
		process.stdin.resume();
		process.stdin.once("data", (chunk) => {
			data += chunk;
			process.stdin.pause();
			resolve(data.trim());
		});
	});
}
