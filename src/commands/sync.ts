import type { Command } from "commander";
import chalk from "chalk";
import { getLayerDir, readConfig } from "../utils/config.ts";
import { getAllDomains, readExpertiseFile, validateRecord } from "../utils/expertise.ts";
import { commit, hasUncommittedChanges, isGitRepo, stageFiles } from "../utils/git.ts";

export function registerSyncCommand(program: Command): void {
	program
		.command("sync")
		.description("Validate, stage, and commit .layer/ files")
		.option("--no-commit", "Stage only — do not commit")
		.action((opts: { commit?: boolean }) => {
			const cwd = process.cwd();
			readConfig(cwd);

			// Validate all records first
			const domains = getAllDomains(cwd);
			let valid = true;

			for (const domain of domains) {
				const records = readExpertiseFile(domain, cwd);
				for (const r of records) {
					const errors = validateRecord(r);
					if (errors.length > 0) {
						console.error(chalk.red(`✗ Invalid record ${r.id} (${domain}/${r.type}):`));
						for (const e of errors) console.error(chalk.red(`  ${e}`));
						valid = false;
					}
				}
			}

			if (!valid) {
				console.error(chalk.red("\nSync aborted — fix validation errors first. Run `lr doctor` for details."));
				process.exitCode = 1;
				return;
			}

			if (!isGitRepo(cwd)) {
				console.log(chalk.yellow("⚠ Not a git repository — skipping stage/commit."));
				return;
			}

			const layerDir = getLayerDir(cwd);
			if (!hasUncommittedChanges([layerDir], cwd)) {
				console.log(chalk.dim("Nothing to sync — .layer/ is already up to date."));
				return;
			}

			stageFiles([layerDir], cwd);
			console.log(chalk.green("✓ Staged .layer/"));

			if (opts.commit !== false) {
				commit("layer: update expertise", cwd);
				console.log(chalk.green('✓ Committed "layer: update expertise"'));
			}
		});
}
