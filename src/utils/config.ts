import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

export interface DomainConfig {
	description?: string;
}

export interface ClassificationDefaults {
	shelf_life: {
		tactical: number;
		observational: number;
	};
}

export interface LayerConfig {
	version: string;
	domains: Record<string, DomainConfig>;
	classification_defaults: ClassificationDefaults;
}

const DEFAULT_SHELF_LIFE: ClassificationDefaults = {
	shelf_life: { tactical: 90, observational: 30 },
};

export function getLayerDir(cwd: string = process.cwd()): string {
	return join(cwd, ".layer");
}

export function getConfigPath(cwd: string = process.cwd()): string {
	return join(getLayerDir(cwd), "layer.config.yaml");
}

export function layerExists(cwd: string = process.cwd()): boolean {
	return existsSync(getConfigPath(cwd));
}

export function readConfig(cwd: string = process.cwd()): LayerConfig {
	const configPath = getConfigPath(cwd);
	if (!existsSync(configPath)) {
		throw new Error(`No .layer/ found in ${cwd}. Run \`lr init\` first.`);
	}
	const raw = yaml.load(readFileSync(configPath, "utf-8")) as Partial<LayerConfig>;
	return {
		version: raw.version ?? "1",
		domains: raw.domains ?? {},
		classification_defaults: raw.classification_defaults ?? DEFAULT_SHELF_LIFE,
	};
}

export function writeConfig(config: LayerConfig, cwd: string = process.cwd()): void {
	const configPath = getConfigPath(cwd);
	writeFileSync(configPath, yaml.dump(config), "utf-8");
}

export function assertDomainExists(domain: string, config: LayerConfig): void {
	if (!config.domains[domain]) {
		const available = Object.keys(config.domains);
		const hint = available.length > 0 ? `Available: ${available.join(", ")}` : "No domains yet — run `lr add <domain>` first.";
		throw new Error(`Unknown domain "${domain}". ${hint}`);
	}
}

export function getShelfLifeDays(
	classification: "tactical" | "observational",
	config: LayerConfig,
): number {
	return config.classification_defaults.shelf_life[classification];
}
