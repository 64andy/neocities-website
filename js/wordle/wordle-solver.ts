const NUM_COLUMNS = 5
const ALL_CHARS = "abcdefghijklmnopqrstuvwxyz";
const ENTER = "Enter";
const BACKSPACE = "Backspace";


/**
 * States if we're entering the word, or its colours 
 */
enum KeyboardState {
    Chars,
    Colours
}

/**
 * Represents how correct each character is (i.e. their colour).
 * 
 * Note: The enum values represent the CSS class of each type's style.
 */
enum CharPosition {
    Unknown = 'char-nothing',            // Default state
    Correct = 'char-correct',            // Char is in this spot
    WrongPosition = 'char-wrong-spot',   // Char is elsewhere
    WrongChar = 'char-wrong-char',       // Char isn't in this word
}

/** [Colour keyboard]: Maps keys to colours, so you can type the colours */
const CharToColour: Map<string, CharPosition> = new Map();
// Correct character correct spot
CharToColour.set('g', CharPosition.Correct);          // (g)reen
// Correct character wrong spot
CharToColour.set('y', CharPosition.WrongPosition);    // (y)ellow
// Wrong character wrong spot
// (Multiple bindings, just for me)
CharToColour.set('b', CharPosition.WrongChar);        // (b)lack [in wordle it's black]
CharToColour.set('r', CharPosition.WrongChar);        // (r)ed [because here it's red]
CharToColour.set('.', CharPosition.WrongChar);        // My original CLI version used this key


/**
 * Represents a guess made by the user
 */
interface PlayerGuess {
    /** The word that the player guessed */
    word: string;
    /** The colours of each character in the word */
    colours: CharPosition[];
} 

// =======================================
// -------------- KEYBOARDS --------------
// =======================================
class ColourKeyboard {
    private wordColours: CharPosition[];

    constructor() {
        this.wordColours = [];
    }

    /** Give this function the key which */
    receiveKey(key: string) {
        // "Backspace" doesn't add a character, treat it differently
        if (key == BACKSPACE) {
            this.backspace();
            return;
        }
        
        const colour = CharToColour.get(key.toLowerCase());
        if (colour == undefined) {
            return;
        }

        // If the word is full, don't type.
        if (this.wordColours.length >= NUM_COLUMNS) {
            return false;
        }

        this.wordColours.push(colour);
    }

    getColours(): CharPosition[] {
        return this.wordColours;
    }

    backspace() {
        if (this.wordColours.length > 0) {
            this.wordColours.pop();
        }
    }

    reset() {
        this.wordColours = [];
    }
}

class CharacterKeyboard {
    private currentWord: string[];

    constructor() {
        this.currentWord = []
    }

    receiveKey(key: string) {
        // "Backspace" doesn't add a character, treat it differently
        if (key == BACKSPACE) {
            this.backspace();
            return;
        }
        key = key.toLowerCase();
        if (!/^[a-z]$/.test(key)) {  // Ignore "CapsLock", "4", "$", etc.
            return;
        }

        // If the word is full, don't type.
        if (this.currentWord.length >= NUM_COLUMNS) {
            return false;
        }

        this.currentWord.push(key);
    }

    getWord(): string {
        return this.currentWord.join('');
    }

    backspace() {
        if (this.currentWord.length > 0) {
            this.currentWord.pop();
        }
    }

    reset() {
        this.currentWord = [];
    }
}

class Game {
    /**
     * Handles the inputs & display of the solver
     */
    charKeyboard: CharacterKeyboard;
    colourKeyboard: ColourKeyboard;
    renderer: CurrentGuessDisplayer;
    answerRenderer: SuggestionDisplayer;
    solver: Corpus;
    state: KeyboardState;

    constructor(charKeyboard: CharacterKeyboard,
                colourKeyboard: ColourKeyboard,
                renderer: CurrentGuessDisplayer,
                answerRenderer: SuggestionDisplayer,
                solver: Corpus) {
        this.charKeyboard = charKeyboard;
        this.colourKeyboard = colourKeyboard;
        this.renderer = renderer;
        this.answerRenderer = answerRenderer;
        this.solver = solver;
        this.state = KeyboardState.Chars;
    }

    /**
     * Sends the incoming key into the relevant keyboard
     * @param key A key stroke from the user/rendered keyboard
     */
    handleKey(key: string) {
        // "Enter" progresses the state instead of modifying the
        // inputted characters.
        if (key == ENTER) {
            this.enter();
            return;
        }

        switch (this.state) {
            case KeyboardState.Chars:
                this.charKeyboard.receiveKey(key);
                break;
                
            case KeyboardState.Colours:
                this.colourKeyboard.receiveKey(key);
                break;
            
            default:
                console.error(this.state);
                throw new Error(`Unknown state`);
        }
        this.renderer.displayWord({
            word: this.charKeyboard.getWord(),
            colours: this.colourKeyboard.getColours()
        });
    }

    private toColourState() {
        document.querySelector("#char-keyboard")?.classList.add("hidden");
        document.querySelector("#input-word")?.classList.add("hidden");
        document.querySelector("#colour-keyboard")?.classList.remove("hidden");
        document.querySelector("#input-colours")?.classList.remove("hidden");
        this.state = KeyboardState.Colours;
    }

    private toCharsState() {
        document.querySelector("#colour-keyboard")?.classList.add("hidden");
        document.querySelector("#input-colours")?.classList.add("hidden");
        document.querySelector("#char-keyboard")?.classList.remove("hidden");
        document.querySelector("#input-word")?.classList.remove("hidden");
        this.state = KeyboardState.Chars;

        // Send the answer to the solver
        const chars = this.charKeyboard.getWord();
        const colours = this.colourKeyboard.getColours();
        this.solver.refineAnswer(chars, colours)
        // Display what we know
        this.answerRenderer.display();
        // Get ready for the next round
        this.charKeyboard.reset();
        this.colourKeyboard.reset();
        this.renderer.addNewRow();
    }

    enter() {
        switch (this.state) {
            case KeyboardState.Chars:
                if (this.charKeyboard.getWord().length == NUM_COLUMNS) {
                    this.toColourState();
                }
                break;
            case KeyboardState.Colours:
                if (this.colourKeyboard.getColours().length == NUM_COLUMNS) {
                    this.toCharsState();
                }
                break;
            default:
                console.error(this.state);
                throw new Error(`Unknown State: ${this.state}`);
        }
    }

}

class CurrentGuessDisplayer {
    /**
     * Used for displaying what the user's typed so far
     */
    template: HTMLElement;
    container: HTMLElement;
    numRows: number;

    constructor(template: HTMLElement, container: HTMLElement) {
        this.template = template;
        this.container = container;
        this.numRows = 0;
    }

    displayWord(guess: PlayerGuess) {
        const rowElement = this.container.lastElementChild;
        if (rowElement === null) {
            throw new Error(`There are no "guess" rows being rendered, at least 1 is expected`);
        }
        for (let i = 0; i < NUM_COLUMNS; i++) {
            // Where to render to
            const characterElement = rowElement.querySelector(`.word-char[data-col='${i}']`);
            if (characterElement == null) {
                throw new Error(`Couldn't find a box matching ".word-char[data-col='${i}']"`);
            }
            const char = guess.word[i] || "";
            const colour = guess.colours[i] || CharPosition.Unknown;
            // First, remove any other colouring class that might've been there
            Object.values(CharPosition).forEach(possibleColour => {
                characterElement.classList.remove(possibleColour)
            });
            // Then add the right one
            characterElement.classList.add(colour);
            // Finally, insert the character
            characterElement.textContent = char.toUpperCase();
        }
    }

    addNewRow() {
        this.container.append(this.template.cloneNode(true));   // Deep copy
        const newRow = this.container.querySelector<HTMLElement>(":last-child");
        if (newRow == null) throw new Error("We just added a new row and it doesn't exist");
        newRow.dataset.row = (++this.numRows).toString();
    }
}

class SuggestionDisplayer {
    container: HTMLElement;
    solver: Corpus;
    static MAX_SIZE = 10;
    constructor(container: HTMLElement, solver: Corpus) {
        this.container = container;
        this.solver = solver;
    }

    display() {
        this.container.innerHTML = `Possible answers: ${this.solver.possibleAnswers.length}<br>`
        if (this.solver.history.length == 0) {
            this.container.innerHTML += "Please input your guess";
        } else {
            this.container.innerHTML += "<ul>";
            this.solver.possibleAnswers
                .sort((a, b) => this.solver.scoreWord(b) - this.solver.scoreWord(a))
                .slice(0, SuggestionDisplayer.MAX_SIZE)
                .forEach(word => {
                    this.container.innerHTML += `<li>${word}</li>`;
                });
            if (this.solver.possibleAnswers.length > SuggestionDisplayer.MAX_SIZE) {
                this.container.innerHTML += `
                    <li>
                        [... ${this.solver.possibleAnswers.length} others]
                    </li>`;
            }
            this.container.innerHTML += "</ul>";
        }
    }

}

/**
 * Helper class for handling inclusive number ranges.
 */
class NumberRange {
    /** The lower range, inclusive */
    from: number;
    /** The upper range, inclusive */
    to: number;
    constructor(from: number, to: number) {
        if (from > to) {
            throw new RangeError(`LHS(${from}) can't be bigger than RHS(${to})`);
        }
        this.from = from;
        this.to = to;
    }

    /**
     * Returns a new range, which represents the numbers
     * contained in both.
     * 
     * @example
     * let a = new NumberRange(0, 5); // [0,1,2,*3,4,5*]
     * let b = new NumberRange(3, 8); // [*3,4,5*,6,7,8]
     * a.intersection(b); // Returns (3, 5)
     * 
     * @returns The intersection, or `null` if they don't overlap 
     */
    intersection(other: NumberRange): NumberRange | null {
        if (!this.isOverlapping(other)) {
            return null;
        }
        return new NumberRange(
            Math.max(this.from, other.from),
            Math.min(this.to, other.to)
        );
    }

    /**
     * Checks if the two ranges overlap
     */
    // https://bytes.com/topic/python/answers/457949-determing-whether-two-ranges-overlap#post1754426
    isOverlapping(other: NumberRange): boolean {
        return (this.from <= other.from && other.from <= this.to)
            || (other.from <= this.from && this.from <= other.to);
    }

    /**
     * Checks if the given number is within this range
     */
    includes(num: number): boolean {
        return this.from <= num && num <= this.to;
    }
}

/**
 * Contains all the possible answers to the current Wordle.
 * Refined down as the user gives us more hints.
 */
class Corpus {
    /** The guesses made by the user*/
    history: PlayerGuess[];
    /** All the possible answers, shrinks over time*/
    possibleAnswers: Array<string>;
    /** Characters that *can't* be in a given position */
    illegalCharsAtPosition: Array<Set<string>>;
    /** Characters that are *known* in the given slot */
    knownCharactersAtPosition: Array<string | null>;
    /** Characters we know *must* be in the answer */
    presentChars: Set<string>;
    /** Characters we know *can't* be in the answer */
    illegalCharacters: Set<string>;
    /** Characters we've seen (used to suggest words) */
    seenChars: Set<string>;

    constructor(all_possible_wordle_answers: Array<string>) {
        this.possibleAnswers = [...all_possible_wordle_answers];

        this.history = [];
        this.presentChars = new Set();
        this.illegalCharacters = new Set();
        this.seenChars = new Set();
        this.illegalCharsAtPosition = [];
        this.knownCharactersAtPosition = Array(NUM_COLUMNS).fill(null);
        for (let i = 0; i < NUM_COLUMNS; i++) {
            this.illegalCharsAtPosition.push(new Set());
        }
    }

    /**
     * 
     * @param word The characters of the word
     * @param colours The colours of the word
     */
    refineAnswer(word: string, colours: CharPosition[]) {
        // ## Input validation ##
        // Correct lengths
        if (word.length != NUM_COLUMNS || colours.length != NUM_COLUMNS) {
            console.error(`Needed a ${NUM_COLUMNS} long word & colours, got `
                        + `(word=${JSON.stringify(word)}, colours=${JSON.stringify(colours)})`)
            return;
        }
        // Ensure the word contains valid chars
        if (!Array.from(word).every(c => c.length == 1 && ALL_CHARS.includes(c))) {
            return;
        }

        this.history.push({word: word, colours: colours});
        // They are no longer unseen :D
        for (const char of word) {
            this.seenChars.add(char)
        }
        for (let pos = 0; pos < NUM_COLUMNS; pos++) {
            let char = word[pos];
            let colour = colours[pos];
            switch (colour) {
                case CharPosition.Correct:
                    // Yay we've found it
                    this.knownCharactersAtPosition[pos] = char;
                    break;
                case CharPosition.WrongPosition:
                    // We know we should look for it again
                    this.presentChars.add(char);
                    this.illegalCharsAtPosition[pos].add(char);
                    break;
                case CharPosition.WrongChar:
                    // `WrongChar` (black) doesn't
                    // necessarily mean "not in word".
                    // 
                    // If the word's "reach", and you guess "every", you'll
                    // get the colours "y..y.", where the 3rd pos states that
                    // e is black, despite being yellow previously.
                    //
                    // First, check if the letter is repeated elsewhere in the word
                    let letterValidElsewhereInWord = false;
                    for (let j=0; j<NUM_COLUMNS; j++) {
                        if (j === pos) continue;
                        if (word[j] === char) {
                            if (colour[j] === CharPosition.Correct || colour[j] === CharPosition.WrongPosition) {
                                letterValidElsewhereInWord = true;
                                break;
                            }
                        }
                    }
                    if (letterValidElsewhereInWord) {
                        // If it's valid elsewhere, then it's simply not valid here
                        this.illegalCharsAtPosition[pos].add(char);
                    } else {
                        // Otherwise, it's not in the word
                        this.illegalCharacters.add(char);
                    }
                    break;
            
                default:
                    console.error(colour);
                    throw new Error("Unknown colour");
            }
        }

        // Finally, reduce the valid words with this new info
        this.reduce_valid_words()
    }

    /**
     * Checks if the given word is possible with the information we've learned.
     */
    private word_is_acceptable(word: string): boolean {
        // Rule: Green characters must have the same char
        // in the same spot.
        // e.g. 'crane -> .g..g', the word must have an [r,e] in the same spots.
        for (const [pos, char] of this.knownCharactersAtPosition.entries()) {
            if (char !== null && word[pos] !== char) {
                return false;
            }
        }

        // Rule: Every "yellow" char must be in the word
        // e.g. If 'e' is yellow, then "plant" is invalid
        for (const c of this.presentChars) {
            if (!word.includes(c)) {
                return false;
            }
        }

        // Rule: Black characters aren't allowed anywhere in the word
        // e.g. 'crane -> .g..g', any words containing [c,a,n] aren't allowed
        // (The quirks of repeated characters are handled by `refineAnswer()`)
        for (const c of this.illegalCharacters) {
            if (word.includes(c)) {
                return false;
            }
        }

        // Rule: Every position must only contain characters that can be there.
        // e.g. If an 'e' was black/yellow there before, don't put 'e' there again.
        for (let i=0; i<NUM_COLUMNS; i++) {
            if (!this.illegalCharsAtPosition[i].has(word[i])) {
                return false;
            }
        }

        return true;
    }

    private reduce_valid_words() {
        this.possibleAnswers = this.possibleAnswers.filter(ans => this.word_is_acceptable(ans));
    }

    /**
     * Heuristic function to sort follow-up suggestions.
     * Scores words based on how many played characters it contains,
     *   so the follow-up suggestions
     */
    scoreWord(word: string): number {
        let nUnseen = 0;
        for (const char of Array.from(new Set(word))) {
            if (this.seenChars.has(char)) {
                nUnseen += 1;
            }
        }
        return nUnseen;
    }

    /**
     * Returns the current 'best suited' word.
     * The 'best suited' word is one with the most unseen characters
     */
    suggestWord(): string {
        let bestWord: string = this.possibleAnswers[0];
        let bestScore = -1;
        
        // Returns the highest scoring word of the `Corpus.scoreWord()` tester
        for (const word of this.possibleAnswers) {
            let score = this.scoreWord(word);
            if (score > bestScore) {
                bestScore = score;
                bestWord = word;
            }
        }
        return bestWord;
    }
}
