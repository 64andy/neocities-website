const NUM_COLUMNS = 5
const ALL_CHARS = "abcdefghijklmnopqrstuvwxyz";
const ENTER = "Enter";
const BACKSPACE = "Backspace";


/**
 * States if we're entering the word, or its colours 
 * @readonly
 * @enum {String}
 */
const KeyboardState = {
    Chars: "Chars",
    Colours: "Colours",
}

/**
 * Represents how correct each character is (i.e. their colour)
 * @readonly
 * @enum {String}
 */
const CharPosition = {
    Correct: 'char-correct',
    CharInWrongPosition: 'char-wrong-spot',
    WrongChar: 'char-wrong-char',
    Nothing: 'char-nothing',
}

const CharToColour = {
    // Correct character correct spot
    'g': CharPosition.Correct,      // (g)reen
    // Correct character wrong spot
    'y': CharPosition.CharInWrongPosition,    // (y)ellow
    // Wrong character wrong spot
    // (Multiple bindings, just for me)
    'b': CharPosition.WrongChar,    // (b)lack [in wordle it's black]
    'r': CharPosition.WrongChar,    // (r)ed [because here it's red]
    '.': CharPosition.WrongChar,    // My original CLI version used this key
}

// =======================================
// -------------- KEYBOARDS --------------
// =======================================
class ColourKeyboard {
    /** @type {CharPosition[]} */
    wordColours;

    constructor() {
        this.wordColours = [];
    }

    receiveKey(key) {
        // "Backspace" doesn't add a character, treat it differently
        if (key == BACKSPACE) {
            this.backspace();
            return;
        }
        
        const colour = CharToColour[key.toLowerCase()];
        if (colour == undefined) {
            return;
        }

        // If the word is full, don't type.
        if (this.wordColours.length >= NUM_COLUMNS) {
            return false;
        }

        this.wordColours.push(colour);
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
    /** @type {string[]} */
    currentWord;

    constructor() {
        this.currentWord = []
    }

    receiveKey(key) {
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
     * @param {CharacterKeyboard} charKeyboard 
     * @param {ColourKeyboard} colourKeyboard 
     * @param {CurrentGuessDisplayer} renderer 
     * @param {Corpus} solver 
     */
    constructor(charKeyboard, colourKeyboard, renderer, solver) {
        this.charKeyboard = charKeyboard;
        this.colourKeyboard = colourKeyboard;
        this.renderer = renderer;
        this.solver = solver;
        this.state = KeyboardState.Chars;
    }

    /**
     * Sends the incoming key into the relevant keyboard
     * @param {string} key A key stroke from the user/rendered keyboard
     */
    handleKey(key) {
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
        this.renderer.displayWord(
            this.charKeyboard.currentWord,
            this.colourKeyboard.wordColours
        );
    }

    #toColourState() {
        document.querySelector("#char-keyboard").classList.add("hidden");
        document.querySelector("#input-word").classList.add("hidden");
        document.querySelector("#colour-keyboard").classList.remove("hidden");
        document.querySelector("#input-colours").classList.remove("hidden");
        this.state = KeyboardState.Colours;
    }

    #toCharsState() {
        document.querySelector("#colour-keyboard").classList.add("hidden");
        document.querySelector("#input-colours").classList.add("hidden");
        document.querySelector("#char-keyboard").classList.remove("hidden");
        document.querySelector("#input-word").classList.remove("hidden");
        this.state = KeyboardState.Chars;

        // Send the answer to the solver
        const chars = this.charKeyboard.currentWord;
        const colours = this.colourKeyboard.wordColours;
        this.solver.refineAnswer(chars, colours)
        // Display what we know
        document.querySelector("#answer-info").innerHTML = `
            Possible answers: ${this.solver.possibleAnswers.length}<br>
            Suggested: ${this.solver.suggestWord()}
        `;
        // Get ready for the next round
        this.charKeyboard.reset();
        this.colourKeyboard.reset();
        this.renderer.addNewRow();
    }

    enter() {
        switch (this.state) {
            case KeyboardState.Chars:
                if (this.charKeyboard.currentWord.length == NUM_COLUMNS) {
                    this.#toColourState();
                }
                break;
            case KeyboardState.Colours:
                if (this.colourKeyboard.wordColours.length == NUM_COLUMNS) {
                    this.#toCharsState();
                }
                break;
            default:
                console.error(this.state);
                throw new Error(`Unknown State: ${this.state}`);
        }
    }

}

class CurrentGuessDisplayer {
    /** @type {HTMLElement} */ template;
    /** @type {HTMLElement} */ container;
    /**
     * Used for displaying what the user's typed so far
     * @param {HTMLElement} template 
     * @param {HTMLElement} container 
     */
    constructor(template, container) {
        this.template = template;
        this.container = container;
    }

    displayWord(word, colours) {
        const rowElement = this.container.lastElementChild;
        for (let i = 0; i < NUM_COLUMNS; i++) {
            // Where to render to
            const characterElement = rowElement.querySelector(`.word-char[data-col='${i}']`);
            if (characterElement == null) {
                throw new Error(`Couldn't find a box matching ".word-char[data-col='${i}']"`);
            }
            const char = word[i] || "";
            const colour = colours[i] || CharPosition.Nothing;
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
        const newRow = this.template.cloneNode(true);   // Deep clone
        newRow.dataset.row = this.numRows;
        this.container.append(newRow);
    }
}

/**
 * Helper class for handling inclusive number ranges.
 */
class NumberRange {
    /** @type {number} The lower range inclusive */ from;
    /** @type {number} The upper range inclusive */ to;
    constructor(from, to) {
        if (from > to) {
            throw new RangeError(`LHS(${from}) can't be bigger than RHS(${to})`);
        }
        this.from = from;
        this.to = to;
    }

    /**
     * Returns a new range containing the subrange that's part of both.
     * @param {Range} other 
     * @returns {Range}
     */
    intersection(other) {
        return new Range(
            Math.max(this.from, other.from),
            Math.min(this.to, other.to)
        );
    }
}

/**
 * Contains all the possible answers to the current Wordle.
 * Refined down as the user gives us more hints.
 */
class Corpus {
    /** @type {Array<string>} All the possible answers, shrinks over time*/
    possibleAnswers;
    /** @type {Array<Set<string>>} Has the possible characters at every position */
    possibleWordChars;
    /** @type {Array<string>} Characters we know *must* be in the answer*/
    presentChars;
    /** @type {Set<string>} Characters we haven't seen yet (used to suggest)*/
    unseenChars;

    /**
     * @param {Array<string>} words 
     */
    constructor(words) {
        this.possibleAnswers = [...words];

        this.presentChars = [];
        this.unseenChars = new Set(ALL_CHARS);
        this.possibleWordChars = [];
        for (let i = 0; i < NUM_COLUMNS; i++) {
            this.possibleWordChars.push(new Set(ALL_CHARS));
        }
    }

    /**
     * 
     * @param {string[]} word The characters of the word
     * @param {CharPosition[]} colours The colours of the word
     */
    refineAnswer(word, colours) {
        // ## Input validation ##
        // Correct lengths
        if (word.length != NUM_COLUMNS || colours.length != NUM_COLUMNS) {
            console.error(`Needed a ${NUM_COLUMNS} long word & colours, got `
                            +`(word=${JSON.stringify(word)}, colours=${JSON.stringify(colours)})`)
            return;
        }
        // Ensure the word contains valid chars
        if (!word.every(c => c.length == 1 && ALL_CHARS.includes(c))) {
            return;
        }
        // They are no longer unseen :D
        for (const char of word) {
            this.unseenChars.delete(char)
        }
        for (let pos = 0; pos < NUM_COLUMNS; pos++) {
            let char = word[pos];
            let colour = colours[pos];
            switch (colour) {
                case CharPosition.Correct:
                    // There can only be one possible value for that spot.
                    this.possibleWordChars[pos].clear()
                    this.possibleWordChars[pos].add(char);
                    break;
                case CharPosition.CharInWrongPosition:
                    // We know we should look for it again
                    this.presentChars.push(char);
                    this.possibleWordChars[pos].delete(char);
                    break;
                case CharPosition.WrongChar:
                    // Being conservative, because "black" doesn't
                    // necessarily mean "not in word".
                    // 
                    // If the word's "reach", and you guess "every", you'll
                    // get the colours "y..y.", where the 3rd pos states that
                    // e is black, despite being yellow previously.
                    //
                    // Repeated character colours account for how many times
                    // they occur in both your guess, and in the answer,
                    // so we also need to do that (separately)
                    // TODO: Account for duplicate chars 
                    this.possibleWordChars[pos].delete(char);
                    break;
            
                default:
                    console.error(colour);
                    throw new Error("Unknown colour");
            }
        }

        // Finally, reduce the valid words with this new info
        this.#reduce_valid_words()
    }

    /**
     * Checks if the given word fits the rules we've discovered
     * @param {string} word 
     * @returns {boolean}
     */
    #word_is_acceptable(word) {
        // Rule: Every "yellow" char is in the word
        if (!this.presentChars.every(c => word.includes(c))) {
            return false;
        }
        // Rule: Every position must only contain characters that can be there.
        // e.g. If an 'e' was black/yellow there before, don't put 'e' there again.
        for (let i=0; i<NUM_COLUMNS; i++) {
            let char = word[i];
            let validChars = this.possibleWordChars[i];
            if (!validChars.has(char)) {
                return false;
            }
        }
        return true;
    }

    #reduce_valid_words() {
        this.possibleAnswers = this.possibleAnswers.filter(ans => this.#word_is_acceptable(ans));
    }

    /**
     * Returns the current 'best suited' word.
     * The 'best suited' word is one with the most unseen characters
     * @returns {string}
     */
    suggestWord() {
        let bestWord = undefined;
        let bestUnseenChars = -1;
        // Count the number of chars a given word has, which haven't been
        // seen before.
        // God I wish Javascript sets had intersections.
        const overlap = w => {
            let nUnseen = 0;
            for (const char of new Set(w)) {
                if (this.unseenChars.has(char)) {
                    nUnseen += 1;
                }
            }
            return nUnseen;
        }
        for (const word of this.possibleAnswers) {
            let nOverlap = overlap(word);
            if (nOverlap > bestUnseenChars) {
                bestUnseenChars = nOverlap;
                bestWord = word;
            }
        }
        return bestWord;
    }
}
