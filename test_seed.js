const fs = require('fs');

try {
    const wordsContent = fs.readFileSync('words.js', 'utf8');
    const listPart = wordsContent.replace('const wordsList =', '');
    const globalWords = eval(listPart);

    function getDailyWord(index, dateObj) {
        const d = dateObj || new Date();
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        const seedStr = `${dateStr}-${index}-NEON-TERMO`;

        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash |= 0;
        }
        const positiveHash = Math.abs(hash);
        return globalWords[positiveHash % globalWords.length];
    }

    // Verify Offsets logic
    // Termo: 0
    // Duetto: 1, 2
    // Quarteto: 3, 4, 5, 6

    console.log("--- UNIQUE WORD CHECK ---");
    const t0 = getDailyWord(0);
    const d1 = getDailyWord(1);
    const d2 = getDailyWord(2);
    const q3 = getDailyWord(3);
    const q4 = getDailyWord(4);

    console.log("Termo (0): " + t0);
    console.log("Duetto (1): " + d1);
    console.log("Duetto (2): " + d2);
    console.log("Quarteto (3): " + q3);
    console.log("Quarteto (4): " + q4);

    const words = [t0, d1, d2, q3, q4];
    const unique = new Set(words);

    if (unique.size === words.length) {
        console.log("PASS: All " + words.length + " words are unique.");
    } else {
        console.log("FAIL: Duplicates found (" + unique.size + " unique vs " + words.length + " total).");
    }

} catch (e) {
    console.error(e);
}
