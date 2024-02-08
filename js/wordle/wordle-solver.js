const NUM_COLUMNS = 5
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
    WrongSpot: 'char-wrong-spot',
    WrongChar: 'char-wrong-char',
    Nothing: 'char-nothing',
}

const CharToColour = {
    // Correct character correct spot
    'g': CharPosition.Correct,      // (g)reen
    // Correct character wrong spot
    'y': CharPosition.WrongSpot,    // (y)ellow
    // Wrong character wrong spot
    // (Multiple binding  just for me)
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

    enter() {
        switch (this.state) {
            case KeyboardState.Chars:
                if (this.charKeyboard.currentWord.length == NUM_COLUMNS) {
                    document.querySelector("#char-keyboard").classList.add("hidden");
                    document.querySelector("#input-word").classList.add("hidden");
                    document.querySelector("#colour-keyboard").classList.remove("hidden");
                    document.querySelector("#input-colours").classList.remove("hidden");
                    this.state = KeyboardState.Colours;
                }
                break;
            case KeyboardState.Colours:
                if (this.colourKeyboard.wordColours.length == NUM_COLUMNS) {
                    document.querySelector("#colour-keyboard").classList.add("hidden");
                    document.querySelector("#input-colours").classList.add("hidden");
                    document.querySelector("#char-keyboard").classList.remove("hidden");
                    document.querySelector("#input-word").classList.remove("hidden");
                    this.state = KeyboardState.Chars;

                    // TODO: Make this process the answer
                    this.charKeyboard.reset();
                    this.colourKeyboard.reset();
                    this.renderer.addNewRow();
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
