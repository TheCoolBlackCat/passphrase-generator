import fs from "fs/promises";
import type { WordList } from "./types";
import path from "path";

const moduleDir = path.parse(__dirname).dir

const EFF_LIST = path.resolve(moduleDir, "eff_wordlist.txt")
const WORDS_JSON = path.resolve(moduleDir, "words.json")

export async function migrateWordsList() {
    console.info("Migrating words list...");
    const wordsFile = await fs.readFile(EFF_LIST, "utf8");
    const wordList = wordsFile.split("\n");
    const words = wordList.reduce((acc: WordList['words'], word: string) => {
      const split = word.split("\t");
      if (split.length > 1) {
        return [...acc, split[1]];
      }
      return acc;
    }, []);

    const wordsByLength = words.reduce((acc: WordList['wordsByLength'], word: string) => {
        const length = word.length;
        if (!acc[length]) {
            acc[length] = [];
        }
        acc[length].push(word);
        return acc;
    }, {});
    const availableWordSizes = Object.keys(wordsByLength).map(key => Number(key)).sort((a, b) => b - a)
    const shortestWordLength = availableWordSizes[availableWordSizes.length - 1]
    const longestWordLength = availableWordSizes[0]
  
    const jsonWords = JSON.stringify({words, wordsByLength, stats: {shortestWordLength, longestWordLength, availableWordSizes}} satisfies WordList);
    await fs.writeFile(WORDS_JSON, jsonWords);
    console.info("Words list migrated successfully");
}

export async function readWordList(): Promise<WordList> {
    try {
        await fs.access(WORDS_JSON);
    } catch (error) {
        throw new Error(`Unable to find ${WORDS_JSON} file.`);
    }
    const words = await fs.readFile(WORDS_JSON, "utf8");
    return JSON.parse(words);
}