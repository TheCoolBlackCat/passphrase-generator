#!/usr/bin/env tsx

import prompts from "prompts";
import { Command } from 'commander';
import type { CLIOptions } from "./types";
import { readWordList, migrateWordsList } from "./words";
import { printPasswordStats } from "./utils";
import { generatePassphraseWithMaxLength } from "./generate";

async function main() {
    const program = new Command();
    program
        .option('-l, --length <number>', 'length of passphrase', '20')
        .option('-s, --separator <char>', 'separator between words', '-')
        .option('-c, --capitalise <boolean>', 'capitalize each word', 'true')
        .option('-n, --add-number <boolean>', 'add random number', 'true')
        .option('-i, --interactive', 'use interactive prompt mode')
        .option('--stats', 'show password stats', false)
        .option('--migrate', 'migrate eff_wordlist.txt file to JSON');

    program.parse();

    let options: CLIOptions
    
    if (program.opts().migrate) {
        await migrateWordsList();
    }

    if (program.opts().interactive || process.argv.length === 2) {
        options = await prompts([
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

        if (!options.length) {
            console.log("Operation cancelled");
            process.exit(1);
        }
    } else {
        const opts = program.opts();
        options = {
            length: parseInt(opts.length),
            separator: opts.separator,
            capitalise: opts.capitalise === 'true',
            addNumber: opts.addNumber === 'true',
            showStats: opts.stats
        };
    }

    const wordList = await readWordList();
    const numberToJoin = options.addNumber ? Math.floor(Math.random() * 100) : undefined
    const passphrase = await generatePassphraseWithMaxLength(wordList, options.length, options.separator, options.capitalise, numberToJoin)
    console.log(passphrase)
    if (options.showStats) {
        printPasswordStats(passphrase)
    }
}

const runMain = () => main().catch(console.error);

if (require.main === module) {
    runMain();
}

export default runMain;
