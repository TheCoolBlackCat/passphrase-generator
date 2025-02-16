import zxcvbn from "zxcvbn";

export const capitalizeWord = (word: string) => word[0].toUpperCase() + word.slice(1);
export const randomItem = <T>(wordList: Array<T>) => wordList[Math.floor(Math.random() * wordList.length)];

export const printPasswordStats = (passphrase: string) => {
    console.log('-------------STATS-----------')
    console.log('Length:', passphrase.length)
    const stats = zxcvbn(passphrase)
    console.log(`Score (higher is better): ${stats.score}/4`)
    console.log('Guesses needed to crack:', stats.guesses)
    console.log('Crack Time (offline, fastest):', stats.crack_times_display.offline_fast_hashing_1e10_per_second)
    console.log('Crack Time (online, no limit):', stats.crack_times_display.online_no_throttling_10_per_second)
    console.log('Crack Time (online, rate-limited):', stats.crack_times_display.online_throttling_100_per_hour)
    console.log('(Source: Dropbox zxcvbn)')
    console.log('-----------------------------')
}