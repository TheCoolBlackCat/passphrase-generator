import { Answers } from "prompts";

export interface WordList {
    words: Array<string>;
    wordsByLength: Record<number, Array<string>>;
    stats: {
        shortestWordLength: number
        longestWordLength: number
        availableWordSizes: Array<number>
    }
}

export type CLIOptions = Answers<'length' | 'separator' | 'capitalise' | 'addNumber' | 'showStats'>;
