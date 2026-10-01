import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { findArchivedById, getAllDomains, readArchiveFile, readExpertiseFile, writeArchiveFile, writeExpertiseFile } from "../utils/expertise.ts";
import { getRecordSummary } from "../schemas/record.ts";

export function registerRestoreCommand(program: Command): void {
	program
		.command("restore <id>")
		.description("Restore a soft-archived record back to active expertise")
		.action((id: string) => {
			const cwd = process.cwd();
			readConfig(cwd);

			const found = findArchivedById(id, cwd);
			if (!found) {
				console.error(chalk.red(`✗ Archived record "${id}" not found.`));
				console.log(chalk.dim("  Use `lr list` to see active records, or check .layer/archive/ directly."));
				process.exitCode = 1;
				return;
			}

			const { record, domain } = found;
			const restored = { ...record };
			delete (restored as Partial<typeof record>).status;
			delete (restored as Partial<typeof record>).archived_at;
			delete (restored as Partial<typeof record>).archive_reason;

			// Remove from archive
			const archived = readArchiveFile(domain, cwd).filter((r) => r.id !== id);
			writeArchiveFile(domain, archived, cwd);

			// Append back to active
			const active = readExpertiseFile(domain, cwd);
			writeExpertiseFile(domain, [...active, restored], cwd);

			console.log(chalk.green(`✓ Restored ${id} → ${domain}/${record.type}`));
			console.log(chalk.dim(`  ${getRecordSummary(record).slice(0, 70)}`));
		});
}
