import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import chalk from "chalk";
import yaml from "js-yaml";
import { getLayerDir, getConfigPath, type LayerConfig } from "../utils/config.ts";
import { getExpertiseDir, getArchiveDir } from "../utils/expertise.ts";

export function registerInitCommand(program: Command): void {
	program
		.command("init")
		.description("Bootstrap .layer/ in the current project")
		.action(() => {
			const cwd = process.cwd();
			const layerDir = getLayerDir(cwd);
			const configPath = getConfigPath(cwd);

			if (existsSync(configPath)) {
				console.log(chalk.yellow("⚠ .layer/ already exists. Nothing changed."));
				return;
			}

			mkdirSync(getExpertiseDir(cwd), { recursive: true });
			mkdirSync(getArchiveDir(cwd), { recursive: true });

			const config: LayerConfig = {
				version: "1",
				domains: {},
				classification_defaults: {
					shelf_life: { tactical: 90, observational: 30 },
				},
			};
			writeFileSync(configPath, yaml.dump(config), "utf-8");

			// Add *.jsonl merge=union to .gitattributes
			const gitattributesPath = join(cwd, ".gitattributes");
			const mergeRule = "*.jsonl merge=union\n";
			if (existsSync(gitattributesPath)) {
				const existing = readFileSync(gitattributesPath, "utf-8");
				if (!existing.includes("merge=union")) {
					writeFileSync(gitattributesPath, existing + mergeRule, "utf-8");
				}
			} else {
				writeFileSync(gitattributesPath, mergeRule, "utf-8");
			}

			console.log(chalk.green("✓ Initialized .layer/"));
			console.log(`  ${chalk.dim(configPath)}`);
			console.log(`  ${chalk.dim(join(layerDir, "expertise/"))}`);
			console.log(`  ${chalk.dim(join(layerDir, "archive/"))}`);
			console.log("");
			console.log(`Next: ${chalk.cyan("lr add <domain>")} to define your first domain`);
		});
}
