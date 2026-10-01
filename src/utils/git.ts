import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export function isGitRepo(cwd: string = process.cwd()): boolean {
	try {
		execSync("git rev-parse --git-dir", { cwd, stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

// Resolve to main repo's .layer/ when inside a git worktree
export function getGitRoot(cwd: string = process.cwd()): string {
	try {
		const commonDir = execSync("git rev-parse --git-common-dir", { cwd }).toString().trim();
		// Worktree: common-dir ends with .git, not .git/worktrees/...
		if (commonDir.endsWith(".git")) {
			return execSync("git rev-parse --show-toplevel", {
				cwd: join(commonDir, ".."),
			})
				.toString()
				.trim();
		}
		return execSync("git rev-parse --show-toplevel", { cwd }).toString().trim();
	} catch {
		return cwd;
	}
}

export function getChangedFiles(cwd: string = process.cwd()): string[] {
	try {
		const output = execSync("git diff HEAD~1 --name-only", { cwd }).toString().trim();
		return output ? output.split("\n") : [];
	} catch {
		// Fall back to staged + unstaged changes if no previous commit
		try {
			const output = execSync("git diff --name-only HEAD", { cwd }).toString().trim();
			return output ? output.split("\n") : [];
		} catch {
			return [];
		}
	}
}

export function getStagedFiles(cwd: string = process.cwd()): string[] {
	try {
		const output = execSync("git diff --cached --name-only", { cwd }).toString().trim();
		return output ? output.split("\n") : [];
	} catch {
		return [];
	}
}

export function stageFiles(paths: string[], cwd: string = process.cwd()): void {
	if (paths.length === 0) return;
	execSync(`git add ${paths.map((p) => `"${p}"`).join(" ")}`, { cwd });
}

export function commit(message: string, cwd: string = process.cwd()): void {
	execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd });
}

export function hasUncommittedChanges(paths: string[], cwd: string = process.cwd()): boolean {
	try {
		const output = execSync(`git status --porcelain ${paths.map((p) => `"${p}"`).join(" ")}`, { cwd }).toString().trim();
		return output.length > 0;
	} catch {
		return false;
	}
}
