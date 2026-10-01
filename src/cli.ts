#!/usr/bin/env bun
import { Command } from "commander";
import { registerInitCommand } from "./commands/init.ts";
import { registerAddCommand } from "./commands/add.ts";
import { registerRecordCommand } from "./commands/record.ts";
import { registerPrimeCommand } from "./commands/prime.ts";
import { registerListCommand } from "./commands/list.ts";
import { registerEditCommand } from "./commands/edit.ts";
import { registerDeleteCommand } from "./commands/delete.ts";
import { registerPruneCommand } from "./commands/prune.ts";
import { registerRestoreCommand } from "./commands/restore.ts";
import { registerSearchCommand } from "./commands/search.ts";
import { registerLearnCommand } from "./commands/learn.ts";
import { registerSyncCommand } from "./commands/sync.ts";
import { registerDoctorCommand } from "./commands/doctor.ts";
import { registerStatusCommand } from "./commands/status.ts";
import { registerSetupCommand } from "./commands/setup.ts";

const program = new Command();

program
	.name("lr")
	.description("Layer — agentic context persistence for any codebase")
	.version("0.1.0");

registerInitCommand(program);
registerAddCommand(program);
registerRecordCommand(program);
registerPrimeCommand(program);
registerListCommand(program);
registerEditCommand(program);
registerDeleteCommand(program);
registerPruneCommand(program);
registerRestoreCommand(program);
registerSearchCommand(program);
registerLearnCommand(program);
registerSyncCommand(program);
registerDoctorCommand(program);
registerStatusCommand(program);
registerSetupCommand(program);

program.parse();
