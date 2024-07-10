// DOCUMENT INIT
const form = document.getElementById("inputString");
const inputString = document.getElementById("string");
const scrollbar = document.getElementById("scrollbar");

const canvas = document.getElementById("NPDAC");
const ctx = canvas.getContext("2d");

// CANVAS SIZE
const xSize = 1700;
const ySize = 650;

// OPERATIONAL VARS
alphabet = new Set();
colorMap = new Map();
states = [];
index = 0;

inputLength = 0;

// CANVAS CONSTANTS
const positions = new Map();
positions.set("init", [200, 400]);
positions.set("odd", [400, 300]);
positions.set("even", [400, 500]);
positions.set("XBurn", [600, 400]);
positions.set("XBuild", [800, 400]);
positions.set("XBurn2", [1000, 400]);
positions.set("XFinal", [1200, 400]);
const titleX = 120;
const titleY = 150;

const names = new Map();
names.set("init", "Start");
names.set("odd", "Odd");
names.set("even", "Even");
names.set("Burn", "Burn");
names.set("Build", "Build");
names.set("Burn2", "Burn");
names.set("Final", "Final");

const nodeColor = "rgb(180 150 180)";
const indicatorColor = "rgb(80, 0, 80)"
const backgroundColor = "rgb(7 0 7)";
const textColor = "#fd72c8";
const textHighlight = "rgb(100 150 100)";
const pixelsPerChar = 7;
const pixelsPerCharBounded = 4.8;
const pixelsPerCharTitle = 30.125;
const defaultFont = "16px Lucida Console";
const titleFont = "50px Lucida Console";
const minimumNodeSize = 40;
const indicatorThickness = 5;

// CANVAS BASE
function setSize() {
    canvas.width = xSize;
    canvas.height = ySize;
}

function clear() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// DRAW STATES
function draw() {
    const current = states[index];

    // DRAW NODES
    const it = positions.keys();
    for (const item of it) {
        drawNode(item);
    }

    // DRAW STRING
    ctx.beginPath();
    ctx.fillStyle = textColor;
    ctx.font = titleFont;
    const input = string.value;

    if (index == 0) {
        ctx.fillText(input, titleX, titleY); 
        translate();
        return;
    }

    const i = index - 1;
    const first = input.slice(0, i);
    const firstLength = first.length;
    ctx.fillText(first, titleX, titleY);
    
    ctx.fillStyle = textHighlight;
    ctx.fillText(input.slice(i, i + 1), titleX + firstLength * pixelsPerCharTitle, titleY);
    
    ctx.fillStyle = textColor;
    ctx.fillText(input.slice(i + 1), titleX + firstLength * pixelsPerCharTitle + pixelsPerCharTitle, titleY);

    translate();
}

// DRAW ONE NODE
function drawNode(state) {
    node = positions.get(state);
    x = node[0];
    y = node[1];
    name = names.get(state);
    if (name === "undefined") name = names.get(state.slice(1));

    // CIRCLE
    ctx.fillStyle = nodeColor;
    ctx.beginPath();
    const radius = Math.max(name.length * pixelsPerChar, minimumNodeSize)
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // TEXT
    const textOffset = 5;
    ctx.fillStyle = backgroundColor;
    ctx.font = defaultFont;
    ctx.fillText(name, x - name.length * pixelsPerCharBounded, y + textOffset);

    // CURRENT STATE INDICATORS
    current = states[index];
    stacks = current.get(state);

    // DEALS WITH XBurn and XBuild
    omit = state.slice(1);
    burnBuild = false;
    if (omit === "Burn" || omit === "Build" || omit === "Burn2" || omit === "Final") {
        targets = parseBurnBuild(current, omit);

        stacks = [];
        for (key of targets) {
            stacks = stacks.concat([[current.get(key), key.slice(0,1)]]);
        }
        burnBuild = true;
    }
    
    // DIFFERENT PROPORTIONS OF TOTAL ARC LENGTH ARE USED FOR EACH INDICATOR
    if (!stacks) return;
    length = 0;
    for (i of stacks) length++;

    rotation = 0;
    rotationIter = 2 * Math.PI / length;

    // DRAW INDICATORS
    for (stack of stacks) {
        ctx.beginPath();
        if (burnBuild) {
            ctx.strokeStyle = colorMap.get(stack[1]);
        } else {
            ctx.strokeStyle = indicatorColor;
        }
        ctx.lineWidth = indicatorThickness;
        ctx.arc(x, y, radius, rotation, rotation + rotationIter);
        ctx.stroke();

        rotation += rotationIter;
    }
}

function drawSuccess() {
    return;
}

function drawFailure() {
    return;
}

// RETURNS ALL XBurn OR XBuild BASED ON INPUT
function parseBurnBuild(map, burnBuild) {
    const it = map.keys();
    out = [];
    for (key of it) {
        if (key.slice(1) === burnBuild) out = out.concat([key]);
    }

    return out;
}

// OPERATIONAL LOGIC
function reset(input) {
    clear();
    
    // INIT STATE
    states = [];
    states.push(new Map());
    states[0].set("init", [[]]);
    index = 0;

    // GET ALPHA
    alphabet = new Set();
    for (c of input) {
        alphabet.add(c);
    }

    // COLOR SETTINGS
    numMix = Math.ceil(alphabet.size / 3);
    if (numMix < 1) numMix = 1;

    colorIter = 127 / numMix;
    colorMap = new Map();

    RGB = [numMix, 0, 0];
    RGBCurrent = 0;
    
    for (char of alphabet) {
        colorMap.set(char, "rgb(" + RGB[0] * colorIter + " " + RGB[1] * colorIter + " " + RGB[2] * colorIter + ")");

        if (RGB[RGBCurrent] == 0) RGBCurrent = (RGBCurrent + 1) % 3;
        RGB[RGBCurrent] -= 1;
        RGB[(RGBCurrent + 1) % 3] += 1;
    }

    draw();
}

function mapAppend(map, key, value) {
    if (map.has(key)) {
        map.set(key, map.get(key).concat([value]));
    } else {
        map.set(key, [value]);
    }
}

// TRANSITION ONE STATE
function process(state, old, map) {
    const input = string.value;
    const inputC = input[index];

    // ALL TRANSITIONAL LOGIC
    // STARTING STATE, GOES TO ODD
    if (state == "init") {
        for (stack of old.get(state)) {
            newStack = stack.slice();
            newStack.push(inputC);
            mapAppend(map, "odd", newStack);
            mapAppend(map, inputC + "Burn", newStack);
        }
    // ODD, FINAL STATE (CANNOT BE ww), GOES TO EVEN AND FIRST BURN
    } else if (state === "odd") {
        for (stack of old.get(state)) {
            newStack = stack.slice();
            newStack.push(inputC);
            mapAppend(map, "even", newStack);
            mapAppend(map, inputC + "Burn", newStack);
        }
    // EVEN, GOES TO ODD AND FIRST BURN
    } else if (state === "even") {
        for (stack of old.get(state)) {
            newStack = stack.slice();
            newStack.push(inputC);
            mapAppend(map, "odd", newStack);
            mapAppend(map, inputC + "Burn", newStack);
        }
    // FIRST BURN, KEEPS TRACK OF THE CHARACTER IT STARTED WITH, BURNS stack.length CHARACTERS BEFORE GOING TO BUILD
    } else if (state.slice(1) === "Burn") {
        for (stack of old.get(state)) {
            newStack = stack.slice();

            if (newStack.length == 1) {
                mapAppend(map, state.slice(0, 1) + "Build", []);

                // 0 CHARACTER BUILD (USEFUL FOR input.length == 2)
                // REQUIRED BECAUSE THIS IMPLEMENTATION DOESN'T USE e MOVES
                if (inputC != state.slice(0, 1)) {
                    mapAppend(map, state.slice(0, 1) + "Final", []);
                }
            } else {
                newStack.pop();
                mapAppend(map, state, newStack)
            }
        }
    // BUILD, CONTINUES KEEPING TRACK OF THE CHARACTER IT STARTED WITH, EVERY MATCHING CHARACTER GOES TO SECOND BURN
    } else if (state.slice(1) === "Build") {
        for (stack of old.get(state)) {
            newStack = stack.slice();
            newStack.push(inputC);
            mapAppend(map, state, newStack);
            if (inputC != state.slice(0, 1)) {
                mapAppend(map, state.slice(0, 1) + "Burn2", newStack);
            }
        }
    // SECOND BURN, BURNS REMAINING stack.length, GOES TO FINAL AS A FINAL STATE ONCE FINISHED BURNING, LEAVES FINAL IF THE STRING IS LONGER
    } else if (state.slice(1) === "Burn2") {
        for (stack of old.get(state)) {
            newStack = stack.slice();

            if (newStack.length == 1) {
                mapAppend(map, state.slice(0, 1) + "Final", []);
            } else {
                newStack.pop();
                mapAppend(map, state, newStack);
            }
        }
    }
}

// TRANSITION ALL STATES
function transition() {
    if (index >= inputLength) {
        return;
    }

    clear();

    if (states.length > index + 1) index += 1;
    else {
        current = states[index];
        next = new Map();

        const it = current.keys();
        for (state of it) process(state, current, next);
        states.push(next);

        index += 1;
    }

    draw();
    if (index >= inputLength) terminateNPDA();
}

// REVERSE ON STEP (MEMOIZATION)
function reverse() {
    if (index == 0) return;

    clear();

    index -= 1;

    draw();
}

// END OF STRING REACHED, CHECK TERMINAL STATES
function terminateNPDA() {
    const final = states[index];
    
    const it = final.keys();
    for (state of it) {
        if (state == "odd" || state == "final") {
            return success();
        }
    }

    return failure();
}

function success() {
    drawSuccess();
}

function failure() {
    drawFailure();
}

// TRANSLATE TO BOTTOM SCROLLBAR ELEMENT
function translate() {
    // CLEAR
    while (scrollbar.firstChild) {
        scrollbar.removeChild(scrollbar.lastChild);
    }

    // REFILL
    const current = states[index];
    const it = current.keys();
    for (state of it) {
        // NAME OF STATE
        name = names.get(state);

        color = "undefined";
        if (name === "undefined") {
            name = names.get(state.slice(1));
            if (state.slice(state.length - 1) === "2") name += " 2";

            color = state.slice(0, 1);
            name += " " + color;
        } else if (state.slice(state.length - 1) === "2") name += " 2";

        // THE STACK
        for (stack of current.get(state)) {
            const elem = document.createElement("container");
            const content = document.createElement("content");

            if (color !== "undefined") elem.style.backgroundColor = colorMap.get(color);
    
            content.textContent = name + "\n[" + stack + "]";

            elem.appendChild(content);
            scrollbar.appendChild(elem);
        }
    }
}

// LISTENERS
// CHANGE STRING
form.addEventListener('input', () => {
    const input = string.value;
    inputLength = input.length;
    reset(input);
});

// TRANSITION RIGHT ARROW / REVERSE LEFT ARROW
document.addEventListener("keydown", event => {
    if (event.code == "ArrowRight") {
        transition();
        event.preventDefault();
    } else if (event.code == "ArrowLeft") {
        reverse();
        event.preventDefault();
    }
});

function main() {
    setSize();
    reset("");
}

main();