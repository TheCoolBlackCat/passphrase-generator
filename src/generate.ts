import { WordList } from "./types"
import { capitalizeWord, randomItem } from "./utils"

export async function generatePassphraseWithMaxLength({wordsByLength, stats}: WordList, length: number, separator: string, capitalise: boolean, numberToJoin: number | undefined): Promise<string> {
    if (length < stats.shortestWordLength) {
        throw new Error(`Password length can't be shorter than the length of the shortest word, which is ${stats.shortestWordLength} characters long.`)
    }

    const targetLengthOfJustWords = length - (numberToJoin ? numberToJoin.toString().length : 0)

    // console.log(`length=${length}, wordCount=${wordCount}, wordsByLength[${minWordLength}]`)
    // console.log('availableWordSizes:', stats.availableWordSizes)

    let generatedLength = 0
    let lengthToFill = targetLengthOfJustWords
    let pickedWords: Array<string> = []
    let needToAddNumber = !!numberToJoin
    do {
        // Get the longest size word we can use to fill the available space
        const wordLength = stats.availableWordSizes.reduce((selectedWordLength: number, wordLength: number) => {
            if (wordLength <= lengthToFill && wordLength > selectedWordLength) {
                return wordLength
            }
            return selectedWordLength
        }, stats.longestWordLength)


        // Pick a random word of that length, and append it and maybe the number to the list
        const randomWord = randomItem(wordsByLength[wordLength])
        const shouldAddNumberThisTime = needToAddNumber && (Math.random() > 0.5)
        if (shouldAddNumberThisTime) {
            needToAddNumber = false
            pickedWords.push(randomWord + numberToJoin)
        } else {
            pickedWords.push(randomWord)
        }

        generatedLength += randomWord.length
        // Account for seperator length
        if ((lengthToFill - randomWord.length) > stats.shortestWordLength) {
            generatedLength += separator.length
        }
        lengthToFill = targetLengthOfJustWords - generatedLength
    }
    while(generatedLength < targetLengthOfJustWords && lengthToFill > stats.shortestWordLength)

    // Handle capitalisation, add separators and number if it still needs adding 
    if (capitalise) {
        pickedWords = pickedWords.map(word => capitalizeWord(word))
    }
    return pickedWords.join(separator) + (needToAddNumber ? numberToJoin : '');
}

// TODO: Generate passphrase "normally" from a given number of words, rather than total length
