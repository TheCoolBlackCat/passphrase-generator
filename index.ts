#!/usr/bin/env node

import prompts from "prompts";
import fs from "fs/promises";
import { info, log } from "console";


interface WordList {
    words: Array<string>;
    wordsByLength: Record<number, Array<string>>;
    stats: {
        shortestWordLength: number
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
  
    const jsonWords = JSON.stringify({words, wordsByLength, stats: {shortestWordLength}} satisfies WordList);
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
    const targetLengthWithoutSeperators = length - (numberOfSeperators*separator.length) - (numberToJoin ? numberToJoin.toString().length : 0)
    const minWordLength = Math.floor(targetLengthWithoutSeperators / wordCount)
    console.log(`length=${length}, wordCount=${wordCount}, wordsByLength[${minWordLength}]`)

    const availableWordLengths = Object.keys(wordsByLength).map(key => Number(key)).sort((a, b) => b - a)
    console.log('availableWordLengths:', availableWordLengths)

    let generatedLength = 0
    let lengthToFill = -1
    let pickedWords: Array<string> = []
    let needToAddNumber = !!numberToJoin
    do {
        const wordLength = availableWordLengths.reduce((currentLength: number, wordLength: number) => {
            if (wordLength <= lengthToFill && wordLength > currentLength) {
                return wordLength
            }
            return currentLength
        }, availableWordLengths[0])
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
    // await migrateWordsList();

  const response = await prompts([
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

  if (!response.length) {
    console.log("Operation cancelled");
    process.exit(1);
  }

  const wordList = await getWordList();
  const numberToJoin = response.addNumber ? Math.floor(Math.random() * 100) : undefined
  const passphrase = await generatePassphrase(wordList, response.length, 4, response.separator, response.capitalise, numberToJoin)
  console.log(passphrase, passphrase.length)
}

main().catch((err) => {
  console.error("Unable to generate password:", err);
  process.exit(1);
});

