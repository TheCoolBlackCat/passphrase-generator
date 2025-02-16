#!/usr/bin/env node

import prompts, { Answers, PromptObject } from "prompts";
import fs from "fs/promises";
import { info, log } from "console";
import { Command } from 'commander';


interface WordList {
    words: Array<string>;
    wordsByLength: Record<number, Array<string>>;
    stats: {
        shortestWordLength: number
        availableWordSizes: Array<number>
    }
}

async function migrateWordsList() {
    info("Migrating words list...");
    const wordsFile = await fs.readFile("eff_wordlist.txt", "utf8");
    const wordList = wordsFile.split("\n");
    const words = wordList.reduce((acc: WordList['words'], word: string) => {
      const split = word.split("\t");
      if (split.length > 1) {
        return [...acc, split[1]];
      }
      return acc;
    }, []);

    let shortestWordLength = Infinity;
    const wordsByLength = words.reduce((acc: WordList['wordsByLength'], word: string) => {
        const length = word.length;
        if (!acc[length]) {
            acc[length] = [];
        }
        acc[length].push(word);
        shortestWordLength = Math.min(shortestWordLength, length)
        return acc;
    }, {});
    const availableWordSizes = Object.keys(wordsByLength).map(key => Number(key)).sort((a, b) => b - a)
  
    const jsonWords = JSON.stringify({words, wordsByLength, stats: {shortestWordLength, availableWordSizes}} satisfies WordList);
    await fs.writeFile("words.json", jsonWords);
    info("Words list migrated successfully");
}

async function getWordList(): Promise<WordList> {
    try {
        await fs.access("words.json");
    } catch (error) {
        throw new Error("Unable to find words.json file.");
    }
    const words = await fs.readFile("words.json", "utf8");
    return JSON.parse(words);
}

const capitalizeWord = (word: string) => word[0].toUpperCase() + word.slice(1)
const pickWordRandomly = (wordList: Array<string>) => wordList[Math.floor(Math.random() * wordList.length)]

async function generatePassphrase({words, wordsByLength, stats}: WordList, length: number, wordCount: number, separator: string, capitalise: boolean, numberToJoin: number | undefined) {
    if (length < stats.shortestWordLength) {
        throw new Error(`Password length can't be shorter than the length of the shortest word, which is ${stats.shortestWordLength} characters long.`)
    }
    const numberOfSeperators = wordCount - 1
    const targetLengthWithoutSeperators = length
        - (numberOfSeperators*separator.length)
        - (numberToJoin ? numberToJoin.toString().length : 0)

    // console.log(`length=${length}, wordCount=${wordCount}, wordsByLength[${minWordLength}]`)
    // console.log('availableWordSizes:', stats.availableWordSizes)

    let generatedLength = 0
    let lengthToFill = 0
    let pickedWords: Array<string> = []
    let needToAddNumber = !!numberToJoin
    do {
        const wordLength = stats.availableWordSizes.reduce((currentLength: number, wordLength: number) => {
            if (wordLength <= lengthToFill && wordLength > currentLength) {
                return wordLength
            }
            return currentLength
        }, stats.availableWordSizes[0])
        const randomWord = pickWordRandomly(wordsByLength[wordLength])
        const shouldAddNumberThisTime = needToAddNumber && (Math.random() > 0.5)
        if (shouldAddNumberThisTime) {
            needToAddNumber = false
        }
        pickedWords.push(randomWord + (shouldAddNumberThisTime ? numberToJoin : ''))
        generatedLength += randomWord.length
        lengthToFill = targetLengthWithoutSeperators - generatedLength
    }
    while(generatedLength < targetLengthWithoutSeperators && lengthToFill >= stats.shortestWordLength)

    if (capitalise) {
        pickedWords = pickedWords.map(word => capitalizeWord(word))
    }
    return pickedWords.join(separator) + (needToAddNumber ? numberToJoin : '');
}

async function main() {
    const program = new Command();
    program
        .option('-l, --length <number>', 'length of passphrase', '20')
        .option('-s, --separator <char>', 'separator between words', '-')
        .option('-c, --capitalise <boolean>', 'capitalize each word', 'true')
        .option('-n, --add-number <boolean>', 'add random number', 'true')
        .option('-i, --interactive', 'use interactive prompt mode')
        .option('--migrate', 'migrate eff_wordlist.txt file to JSON');

    program.parse();

    let options: Answers<'length' | 'separator' | 'capitalise' | 'addNumber'>;
    
    if (program.opts().migrate) {
        return await migrateWordsList();
    }
    else if (program.opts().interactive || process.argv.length === 2) {
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
            addNumber: opts.addNumber === 'true'
        };
    }

    const wordList = await getWordList();
    const numberToJoin = options.addNumber ? Math.floor(Math.random() * 100) : undefined
    const passphrase = await generatePassphrase(wordList, options.length, 4, options.separator, options.capitalise, numberToJoin)
    console.log(passphrase, passphrase.length)
}

main().catch((err) => {
  console.error("Unable to generate password:", err);
  process.exit(1);
});

