#!/usr/bin/env tsx

import prompts from "prompts";
import { Command } from 'commander';
import type { CLIOptions } from "./types";
import { readWordList, migrateWordsList } from "./words";
import { printPasswordStats } from "./utils";
import { generatePassphraseWithMaxLength } from "./generate";
import { pathToFileURL } from "node:url";

interface CommanderOptions {
    length: string;
    separator: string;
    capitalise: boolean;
    addNumber: boolean;
    interactive?: boolean;
    stats?: boolean;
    migrate?: boolean;
}

async function runPasswordGenerator(programOptions: CommanderOptions) {
    if (programOptions.migrate) {
        await migrateWordsList();
    }

    let parameters: CLIOptions;
    if (programOptions.interactive) {
        console.log('🔐 Passphrase Generator');
        parameters = await prompts([
            {
                type: "number",
                name: "length",
                message: "What is the length restriction on your password?",
                initial: 20,
                min: 4,
            },
            {
                type: "text",
                name: "separator",
                message: "What separator would you like to use?",
                initial: "-",
            },
            {
                type: "confirm",
                name: "capitalise",
                message: "Would you like to capitalise each word?",
                initial: true,
            },
            {
                  type: "confirm",
                  name: "addNumber",
                  message: "Would you like to add a random number in the string?",
                  initial: true,
            },
            {
                type: "confirm",
                name: "showStats",
                message: "Would you like to show some password stats?",
                initial: false,
            }
        ]);

        if (!parameters.length) {
            console.log("Operation cancelled");
            process.exit(1);
        }
    } else {
        console.log('Using CLI options');
        parameters = {
            length: parseInt(programOptions.length),
            separator: programOptions.separator,
            capitalise: programOptions.capitalise === true,
            addNumber: programOptions.addNumber === true,
            showStats: programOptions.stats
        };
    }

    console.log(`Generating passphrase with options: ${JSON.stringify(parameters, null, 2)}`);

    const wordList = await readWordList();
    const numberToJoin = parameters.addNumber ? Math.floor(Math.random() * 100) : undefined
    const passphrase = await generatePassphraseWithMaxLength(wordList, parameters.length, parameters.separator, parameters.capitalise, numberToJoin)
    if (parameters.showStats) {
        printPasswordStats(passphrase)
    }
    return passphrase;
}

async function createProgram() {
    const program = new Command();
    program
        .option('-l, --length <number>', 'length of passphrase', '20')
        .option('-s, --separator <char>', 'separator between words', '-')
        .option('-c, --capitalise <boolean>', 'capitalize each word', true)
        .option('-n, --add-number <boolean>', 'add random number', true)
        .option('-i, --interactive', 'use interactive prompt mode')
        .option('--stats', 'show password stats', false)
        .option('--migrate', 'migrate eff_wordlist.txt file to JSON');
    return program;
}

export async function generatePassphrase(args: Array<string> = []) {
    const program = await createProgram();
    console.log('args', args);
    // We need the first 2 args to avoid Commander parsing issues
    await program.parseAsync(['','', ...args]);
    const opts = program.opts<CommanderOptions>()
    console.log('opts', opts);
    return await runPasswordGenerator(opts);
}

async function main() {
    const program = await createProgram();
    await program.parseAsync(); // Use CLI args
    const opts = program.opts<CommanderOptions>()
    const passphrase = await runPasswordGenerator(opts);
    console.log(passphrase)
}

const runMain = () => main().catch(console.error);

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    runMain();
}

export default runMain;
