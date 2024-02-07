const NUM_COLUMNS = 5
const ENTER = "Enter";
const BACKSPACE = "Backspace";

/**
 * States if we're entering the word, or its colours 
 * @readonly
 * @enum {Symbol}
 */
const KeyboardState = {
    Chars: Symbol("Chars"),
    Colours: Symbol("Colours"),
}

/**
 * Represents how correct each character is (i.e. their colour)
 * @readonly
 * @enum {Symbol}
 */
const CharPosition = {
    Correct: Symbol('char-correct'),
    WrongSpot: Symbol('char-wrong-spot'),
    Nothing: Symbol('char-nothing'),
}

const CharToColour = {
    'g': CharPosition.Correct,
    'y': CharPosition.WrongSpot,
    'b': CharPosition.Nothing,
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
        key = key.toLowerCase();
        if (!Object.keys(CharToColour).includes(key)) {    // Only these colours allowed
            return;
        }

        // If the word is full, don't type.
        if (this.wordColours.length >= NUM_COLUMNS) {
            return false;
        }

        this.wordColours.push(key);
    }

    backspace() {
        if (this.wordColours.length > 0) {
            this.wordColours.pop();
        }
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
}

class TypingController {
    /**
     * Handles keyboard 
     * @param {CharacterKeyboard} charKeyboard 
     * @param {ColourKeyboard} colourKeyboard 
     * @param {CurrentGuessDisplayer} renderer 
     */
    constructor(charKeyboard, colourKeyboard, renderer) {
        this.charKeyboard = charKeyboard;
        this.colourKeyboard = colourKeyboard;
        this.renderer = renderer;
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
            this.#enter();
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

    #enter() {
        console.log("Cool you hit enter, doing nothing until you implement this");
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
                characterElement.classList.remove(possibleColour.description)
            });
            // Then add the right one
            characterElement.classList.add(colour.description);
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
