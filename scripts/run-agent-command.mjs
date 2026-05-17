import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ANSI_PATTERN =
  /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const parseArgs = (args) => {
  const options = {
    logName: "agent-command",
    maxChars: undefined,
    tailLines: undefined,
    command: undefined,
    commandArgs: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      options.command = args[index + 1];
      options.commandArgs = args.slice(index + 2);
      break;
    }

    if (arg === "--log-name") {
      options.logName = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--max-chars") {
      options.maxChars = Number.parseInt(args[index + 1], 10);
      index += 1;
      continue;
    }

    if (arg === "--tail-lines") {
      options.tailLines = Number.parseInt(args[index + 1], 10);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.command) {
    throw new Error("Missing command. Use: node scripts/run-agent-command.mjs [options] -- <command> [...args]");
  }

  if (options.maxChars !== undefined && (!Number.isFinite(options.maxChars) || options.maxChars < 1)) {
    throw new Error("--max-chars must be a positive integer");
  }

  if (options.tailLines !== undefined && (!Number.isFinite(options.tailLines) || options.tailLines < 1)) {
    throw new Error("--tail-lines must be a positive integer");
  }

  return options;
};

const clipOutput = (output, { maxChars, tailLines }) => {
  if (tailLines !== undefined) {
    return output.split(/\r?\n/).slice(-tailLines).join("\n");
  }

  if (maxChars !== undefined && output.length > maxChars) {
    return output.slice(0, maxChars);
  }

  return output;
};

const quoteWindowsArg = (arg) => {
  if (!/[\s"]/u.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
};

const commandForPlatform = (command, commandArgs) => {
  if (process.platform !== "win32") {
    return { command, args: commandArgs };
  }

  if (command === "node") {
    return { command: process.execPath, args: commandArgs };
  }

  if (command !== "pnpm" && command !== "npm" && command !== "npx") {
    return { command, args: commandArgs };
  }

  return {
    command: process.env.ComSpec ?? "cmd.exe",
    args: ["/d", "/s", "/c", [command, ...commandArgs].map(quoteWindowsArg).join(" ")],
  };
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const logPath = resolve(repoRoot, ".agent-logs", `${options.logName}.log`);
  let output = "";

  const platformCommand = commandForPlatform(options.command, options.commandArgs);
  const child = spawn(platformCommand.command, platformCommand.args, {
    cwd: repoRoot,
    windowsHide: true,
  });

  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  const exitCode = await new Promise((resolveExit) => {
    child.on("error", (error) => {
      output += `${error.message}\n`;
      resolveExit(1);
    });

    child.on("close", (code) => {
      resolveExit(code ?? 1);
    });
  });

  const cleanOutput = output.replace(ANSI_PATTERN, "");
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, cleanOutput);

  const displayed = clipOutput(cleanOutput, options);
  if (displayed.length > 0) {
    process.stdout.write(displayed.endsWith("\n") ? displayed : `${displayed}\n`);
  }

  process.stdout.write(`\nFull output: ${logPath}\n`);
  process.exit(exitCode);
};

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
