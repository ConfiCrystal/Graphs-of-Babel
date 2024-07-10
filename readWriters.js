// DOCUMENT INIT
const form = document.getElementById("RWI");
const NInput = document.getElementById("N");

const canvas = document.getElementById("RWC");
const ctx = canvas.getContext("2d");

// CANVAS SIZE
const xSize = 1700;
const ySize = 850;

// MOUSE POSITION
mouseX = 0;
mouseY = 0;

// ANCHOR POSITION
anchorX = 0;
anchorY = 0;

// CANVAS SECTIONS
const header = 30;
const footer = 200;
const footerY = ySize - footer;
const buffer = 50;
const vertical = ySize - buffer * 2 - header - footer;

const headerTextOffsetX = -10;
const headerTextOffsetY = header + 10;
const footerThick = 10;

// CANVAS BODY SUBSECTIONS
const rootX = 50;
const spaceX = (xSize - 50) / 4;
const tryX = rootX + spaceX;
const activateX = tryX + spaceX;
const resolveX = activateX + spaceX;

// NODE DRAWING
const height = 30;
const widthPerC = 15;

const selectThick = 5;
const arrowThick = 3;
const arrowOffset = 80;
const arrowX = 7;
const arrowY = 5;

// FOOTER DRAWING
const footerXOffset = 15;
const footerYTitle = 25;
const footerYState1 = 65;
const footerYState2 = 85;
const footerYTurn1 = 125;
const footerYTurn2 = 145;
const footerYFace = 185;
const face = [":3", ":D", ":>", "c:", ":)", ":]"]

// INITIAL N
const first = 3;

// INITAL NODES
node = Node(0, 0, []);
nodesT = [];
nodesR = [];
nodesN = [];

// COLOURS
const colorT = "#e9add2";
const colorR = "#eed9ad";
const colorN = "#9ecaee";
const colorRoot = "#eeeeee";
const colorArrow = "";

// OBJECTS
function Node(x, y, state) {
    this.x = x
    this.y = y
    this.state = state
}

// CANVAS BASE
function setSize() {
    canvas.width = xSize;
    canvas.height = ySize;
}

function clear() {
    ctx.fillStyle = "rgb(7 0 7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHeader() {
    ctx.font = "30px Lucida Console";
    const fontHeight = 33;

    ctx.fillStyle = colorRoot;
    ctx.fillText("Current", rootX + headerTextOffsetX, headerTextOffsetY);
    ctx.fillText("Status", rootX + headerTextOffsetX, headerTextOffsetY + fontHeight);

    ctx.fillStyle = colorT;
    ctx.fillText("Request", tryX + headerTextOffsetX, headerTextOffsetY);
    ctx.fillText("Activation", tryX + headerTextOffsetX, headerTextOffsetY + fontHeight);

    ctx.fillStyle = colorR;
    ctx.fillText("Complete", activateX + headerTextOffsetX, headerTextOffsetY);
    ctx.fillText("Activation", activateX + headerTextOffsetX, headerTextOffsetY + fontHeight);

    ctx.fillStyle = colorN;
    ctx.fillText("Resolve", resolveX + headerTextOffsetX, headerTextOffsetY);
    ctx.fillText("Deactivation", resolveX + headerTextOffsetX, headerTextOffsetY + fontHeight);
}

function drawFooter() {
    const s = node.state;
    const arr = sp(s);
    const state = arr[0];
    const turn = arr[1];

    // Turn color
    const blue = 50;
    green = 200;
    red = 100;
    const colorI = 100 / (state.length - 1);
    for (i = 0; i < turn.length; i++) {
        color = "rgb(" + red + " " + green + " " + blue + ")";
        state[turn[i]] = [state[turn[i]], color, i];

        green -= colorI;
        red += colorI;
    }

    const horizontal = xSize - buffer * 2;
    footerX = buffer;
    footerI = horizontal / state.length;

    // For each ReadWriter
    faceI = 0;
    for (i = 0; i < state.length; i++) {
        // box
        ctx.beginPath();
        ctx.fillStyle = state[i][1];
        ctx.roundRect(footerX, footerY, footerI, footer, footerThick);
        ctx.fill();

        // Text
        // RW number
        ctx.fillStyle = "rgb(7, 0, 7)";
        ctx.font = "22px Lucida Console";
        ctx.fillText("RW #" + i, footerX + footerXOffset, footerY + footerYTitle);

        // State
        ctx.font = "18px Lucida Console";
        RWS = "";
        switch (state[i][0]) {
            case "N":
                RWS = "Inactive";
                break;
            case "RR":
                RWS = "Requesting Read";
                break;
            case "RW":
                RWS = "Requesting Write";
                break;
            case "R":
                RWS = "Reading";
                break;
            case "W":
                RWS = "Writing";
                break;
        }
        ctx.fillText("State: ", footerX + footerXOffset, footerY + footerYState1);
        ctx.fillText(RWS, footerX + footerXOffset, footerY + footerYState2);

        // Turn
        ctx.fillText("Turn: ", footerX + footerXOffset, footerY + footerYTurn1);
        
        turnNum = state[i][2] + 1;
        suffix = "th";
        switch(turnNum) {
            case 1:
                suffix = "st";
                break;
            case 2:
                suffix = "nd";
                break;
            case 3:
                suffix = "rd";
                break;
        }
        ctx.fillText(turnNum + suffix, footerX + footerXOffset, footerY + footerYTurn2);

        // Face
        ctx.font = "22px Lucida Console";
        ctx.fillText(face[faceI], footerX + footerXOffset, footerY + footerYFace);

        // Iterate
        footerX += footerI;
        faceI = (faceI + 1) % face.length;
    }
}

// READWRITER LOGIC
// NEW INPUT N
function reset(N) {
    state = []
    for (i = 0; i < N; i++) {
        state = state.concat(["N"])
    }
    for (i = 0; i < N; i++) {
        state = state.concat([i])
    }
    node = new Node(rootX, header + buffer + vertical / 2, state)

    regenerate();
    
    drawNodes(false);
}

// DETERMINE POSSIBLE TR TW STATES
function tryN (state) {
    out = [];

    for (i = 0; i < state.length; i++) {
        if (state[i] === "N") {
            tr = state.slice();
            tr[i] = "RR";
            out = out.concat([tr]);

            tw = state.slice();
            tw[i] = "RW";
            out = out.concat([tw]);
        }
    }

    processOut(out, tryX);

    return out;
}

// DETERMINE POSSIBLE R W STATES
function tryT(state, turn, r) {
    out = [];

    for (i = 0; i < turn.length; i++) {
        t = turn[i]
        current = state[t]

        if (current === "RR") {
            R = state.slice();
            R[t] = "R";
            out = out.concat([R]);

            break;
        } else if (current === "RW" && !r) {
            W = state.slice();
            W[t] = "W";
            out = out.concat([W])

            break;
        }
    }

    processOut(out, activateX);

    return out;
}

// CHECK FOR EXISTING W
function checkW (state) {
    for (i = 0; i < state.length; i++) {
        if (state[i] === "W") return i;
    }
    return -1;
}

// CHECK FOR EXISTING R
function checkR(state) {
    for (i = 0; i < state.length; i++) {
        if (state[i] === "R") return true;
    }
    return false
}

// DETERMINE POSSIBLE N STATES
function resolve(state, turn) {
    out = [];

    for (i = 0; i < state.length; i++) {
        if (state[i] === "R" || state[i] === "W") {
            n = state.slice();
            n[i] = "N";

            j = turn.findIndex((element) => element == i)
            t = turn.slice(0, j).concat(turn.slice(j + 1));
            t = t.concat([turn[j]]);

            out = out.concat([n.concat(t)]);
        }
    }

    processOut(out, resolveX);

    return out;
}

// SUPPLEMENTAL FUNCTION FOR ALL STATE DETERMINING FUNCTIONS
function processOut(out, x) {
    const iter = vertical / out.length;
    yIter = buffer + header;

    for (i = 0; i < out.length; i++) {
        out[i] = [x, yIter, out[i]];
        yIter += iter;
    }

    for (i = 0; i < out.length; i++) {
        out[i][1] += iter / 2;
    }
    
}

// FIND DESTINATION STATES FROM CURRENT ROOT
function regenerate() {
    nodesT = [];
    nodesR = [];
    nodesN = [];
    const s = node.state;

    const arr = sp(s);
    const state = arr[0];
    const turn = arr[1];

    nodesT = nodesT.concat(tryN(state));
    
    if(checkW(state) == -1) nodesR = nodesR.concat(tryT(state, turn, checkR(state)));

    nodesN = nodesN.concat(resolve(state, turn));
}

// SPLIT STATE INTO STATE AND TURN
function sp(arr) {
    const mid = arr.length / 2;
    const state = arr.slice(0, mid);
    const turn = arr.slice(mid);

    return [state, turn];
}

// DRAW A NODE AND ITS ARROW
function drawNode(no, color, hasTurn, isClick, isRoot) {
    const x = no[0];
    y = no[1];
    s = [];
    h = 0;
    
    // Different dimensions if including turn display
    if (hasTurn) {
        arr = no[2];
        mid = arr.length / 2;

        s.push(arr.slice(0, mid));
        s.push(arr.slice(mid));

        h = height * 2;
        y -= height / 2;
    } else {
        s.push(no[2]);
        h = height
    }

    text = s[0].toString();

    // Arrow (not if root)
    if (isRoot) {
        anchorX = x + widthPerC * text.length;
        anchorY = y + h / 2;
    } else {
        // Line
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        const finalY = y + h / 2;
        ctx.bezierCurveTo(x - arrowOffset, anchorY, x - arrowOffset, y + h / 2, x, finalY);
        ctx.strokeStyle = color;
        ctx.lineWidth = arrowThick;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.moveTo(x, finalY);
        ctx.lineTo(x - arrowX, finalY + arrowY);
        ctx.lineTo(x - arrowX, finalY - arrowY);
        ctx.fillStyle = color;
        ctx.fill();
    }

    //  Box
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.roundRect(x, y, widthPerC * text.length, h, selectThick);
    ctx.fill();

    // Mouse logic
    if (ctx.isPointInPath(mouseX, mouseY)) {
        if (isClick) {
            if (hasTurn) {
                st = s[0].concat(s[1]);
                node = new Node(rootX, header + buffer + vertical / 2, st);
            } else {
                check = sp(node.state);
                st = s[0].concat(check[1]);
                node = new Node(rootX, header + buffer + vertical / 2, st);
            }
            regenerate();
            drawNodes(false);

            return true;
        } else {
            ctx.strokeStyle = "#ff3737";
            ctx.lineWidth = 5;
            ctx.roundRect(x, y, widthPerC * text.length, h, 5);
            ctx.stroke();
        }
    }

    // Text
    ctx.fillStyle = "rgb(7, 0, 7)";
    ctx.font = "18px Lucida Console";
    const fontOffset = 6;
    if (hasTurn) {
        textTurn = s[1].toString()

        ctx.fillText(text, x + text.length * 2, y + h / 4 + fontOffset);
        ctx.fillText(textTurn, x + text.length * 7 - textTurn.length * 5, y + h * 3 / 4 + fontOffset);
    } else {
        ctx.fillText(text, x + text.length * 2, y + h / 2 + fontOffset);
    }

    return false;
}

// DRAW ALL DESTINATIONS STATES FROM CURRENT ROOT
function drawNodes(isClick) {
    clear();

    // Root
    // Return if click --> change root
    if (drawNode([node.x, node.y, node.state], colorRoot, true, isClick, true)) return;

    // Resolve
    for (i = 0; i < nodesN.length; i++) {
        n = nodesN[i];
        if (drawNode(n, colorN, true, isClick, false)) return;
    }

    /// Activate
    for (i = 0; i < nodesR.length; i++) {
        n = nodesR[i];
        if (drawNode(n, colorR, false, isClick, false)) return;
    }

    // Request
    for (i = 0; i < nodesT.length; i++) {
        n = nodesT[i];
        if (drawNode(n, colorT, false, isClick, false)) return;
    }

    drawHeader();
    drawFooter();
}


// LISTENERS
// CHANGE N
form.addEventListener('input', () => {
    const N = NInput.value;
    reset(N);
})

// MOUSE MOVE
canvas.addEventListener('mousemove', (event) => {
    mouseX = event.offsetX;
    mouseY = event.offsetY;

    drawNodes(false);
})

// CLICK (TRAVERSE STATE)
canvas.addEventListener('click', (event) => {
    mouseX = event.offsetX;
    mouseY = event.offsetY;

    drawNodes(true);
})

function main() {
    setSize();
    reset(first);
}

main();