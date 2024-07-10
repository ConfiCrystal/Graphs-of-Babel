// Document Init
const canvas = document.getElementById("forceCanvas");
const ctx = canvas.getContext("2d");

const newNodeName = document.getElementById("nodeName");
const newRelNodeA = document.getElementById("nodeA");
const newRelNodeB = document.getElementById("nodeB");
const nodeInterface = document.getElementById("nodes");
const relationInterface = document.getElementById("relations");

// Canvas Constants
const xSize = 1700;
ySize = 550;

const xCenter = xSize / 2;
yCenter = ySize / 2;

const nodeColor = "rgb(200 180 200)";
const nodeFactor = 30;
const lineColor = "rgb(100 80 100)";
const backgroundColor = "rgb(7, 0, 7)";
const textColor = "rgb(250, 30, 30)";
const defaultFont = "bold 13px Lucida Console";
const pixelsPerChar = 4.1;
const textOffset = 3;

const massFactor = 2;
const friction = 0.125;

// Operational Vars
// Spring forces
const hooke = 0.001;
// Electron forces
const coulomb = 30;
// Gravity forces
const g = 0.0001;
// Animation frame
anim = null;
// Nodes to draw
nodesToDraw = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Entire system
class System {
    nodes;
    distances;

    constructor(nodes) {
        this.nodes = nodes;
    }
    
    // Recalculates all distances between nodes
    calculateDistances() {
        let distances = [];
        const len = this.nodes.length;
        for (let i = 0; i < len; i++) {
            let nodeA = this.nodes[i];
            let x = nodeA.x;
            let y = nodeA.y;
            let adj = [];
    
            for (let j = i + 1; j < len; j++) {
                let nodeB = this.nodes[j];
                let distance = Math.sqrt(Math.pow(x - nodeB.x, 2) + Math.pow(y - nodeB.y, 2));
                if (distance == 0) distance = 1;
                adj.push(distance);
            }
            distances.push(adj);
        }
        this.distances = distances;
    }

    // Finds all forces and modifies all velocities accordingly
    calculateForces() {
        const len = this.nodes.length

        for (let i = 0; i < len; i++) {
            let node = this.nodes[i];

            // Attraction to center
            let x = xCenter - node.x;
            let y = yCenter - node.y;
            let fG = g * Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) * Math.max(node.relations.length * massFactor, massFactor);
            x *= fG;
            y *= fG;

            node.force(x, y);
        }

        for (let i = 0; i < len; i++) {
            let nodeA = this.nodes[i];

            for (let j = 0; j < len - i - 1; j++) {
                let nodeB = this.nodes[i + 1 + j];
                let distance = this.distances[i][j];

                // Direction
                let dx = (nodeB.x - nodeA.x) / distance;
                let dy = (nodeB.y - nodeA.y) / distance;

                // Elastic
                let fE = hooke * distance;
                let relation = nodeA.relations.filter(rel => rel.name === nodeB.name).length;
                fE *= relation
                
                // Coulomb
                const massA = Math.max(nodeA.relations.length * massFactor, massFactor);
                const massB = Math.max(nodeB.relations.length * massFactor, massFactor);
                let fC = coulomb / distance * (massA + massB);

                // Total
                let fT = fE - fC;
                dx *= fT;
                dy *= fT;

                nodeA.forceAdd(dx, dy);
                nodeB.forceAdd(-dx, -dy);
            }
        }
    }

    // Move all nodes one step
    move() {
        for (const node of this.nodes) node.move();
    }

    // Draws all nodes
    draw() {
        nodesToDraw = [];
        for (const node of this.nodes) node.draw();

        ctx.fillStyle = nodeColor;
        for (const node of nodesToDraw) {
            const x = node[0];
            const y = node[1];
            const r = node[2];

            // Node
            ctx.fillStyle = nodeColor;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fill();
        }

        for (const node of nodesToDraw) {
            const x = node[0];
            const y = node[1];
            const r = node[2];
            const name = node[3];
            
            // Name
            ctx.fillStyle = textColor;
            ctx.beginPath();
            ctx.font = defaultFont;
            ctx.fillText(name, x - name.length * pixelsPerChar, y + textOffset);
        }
    }

    // One step of simulation
    simulate() {
        this.calculateDistances();
        this.calculateForces();
        this.move();
        clear();
        this.draw();
    }

    // Adds one node
    addNode(node) {
        this.nodes.push(node);
    }

    // Adds one relation
    addRelation(nameA, nameB) {
        const len = this.nodes.length
        for (let i = 0; i < len; i++) {
            let nodeA = this.nodes[i];
            if (nodeA.name === nameA) {
                for (let j = 0; j < len; j++) {
                    let nodeB = this.nodes[j];
                    if (nodeB.name === nameB) {
                        nodeA.relations.push(nodeB);
                        nodeB.relations.push(nodeA);
                    }
                }

            }
        }
    }

    // Simulates over time
    animate() {
        this.simulate();

        anim = requestAnimationFrame(() => this.animate());
    }

    cancel() {
        cancelAnimationFrame(anim);
    }

    removeNode(name) {
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];
            if (node.name === name) {
                for (const rel of node.relations.slice()) this.removeRelation(node.name, rel.name);
                this.nodes.splice(i, 1);
                break;
            }
        }
    }

    removeRelation(nameA, nameB) {
        const len = this.nodes.length
        for (let i = 0; i < len; i++) {
            let nodeA = this.nodes[i];
            if (nodeA.name === nameA) {
                for (let j = 0; j < len; j++) {
                    let nodeB = this.nodes[j];
                    if (nodeB.name === nameB) {
                        nodeA.relations.splice(nodeA.relations.map(e => e.name).indexOf(nameB), 1);
                        nodeB.relations.splice(nodeB.relations.map(e => e.name).indexOf(nameA), 1);
                    }
                }

            }
        }
    }
}

// One node
class Node {
    constructor(x, y, vx, vy, name) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.name = name;

        // For drawing purposes, relational calculations done through the system
        this.relations = [];
    }

    // Change the velocity
    force(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }
    forceAdd(vx, vy) {
        this.vx += vx;
        this.vy += vy;
    }

    // Move one time unit
    move() {
        const vx = this.vx;
        const vy = this.vy;
        const mass = Math.max(this.relations.length * massFactor, massFactor);
        if (Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2)) / mass < friction) return;

        this.x += vx / mass;
        this.y += vy / mass;
    }

    // Draw the node
    draw() {
        const relations = this.relations;
        const radius = Math.log(Math.max(relations.length * nodeFactor, nodeFactor)) / Math.log(1.21);
        const x = this.x;
        const y = this.y;

        nodesToDraw.push([x, y, radius, this.name]);

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        for (const relation of relations) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(relation.x, relation.y);
            ctx.stroke();
        }
    }
}

// HTML interfacing
function addNode (name = newNodeName.value) {
    // No duplicates (not using a hashmap to make distance/force calculations faster)
    for (node of s.nodes) {
        if (node.name === name) return;
    }

    // System
    newNode = new Node(Math.random() * xSize, Math.random() * ySize, 0, 0, name);
    s.addNode(newNode);

    // New relation selector
    optA = document.createElement("option");
    optA.innerHTML = name;
    optB = document.createElement("option");
    optB.innerHTML = name;
    newRelNodeA.appendChild(optA);
    newRelNodeB.appendChild(optB);

    // Node display and removal
    newNodeInterface = document.createElement("container");

    newNodeInvis = document.createElement("invisible");
    newNodeInvis.value = name;

    newNodeContent = document.createElement("content");
    newNodeContent.innerHTML = name;
    if (name === "") newNodeContent.innerHTML = "\"\"";

    newNodeRemove = document.createElement("button");
    newNodeRemove.innerHTML = "X";
    newNodeRemove.onclick = button => {
        // Node interface and system
        parent = button.target.parentElement;
        name = parent.getElementsByTagName("invisible")[0].value;
        s.removeNode(name);
        parent.remove();

        // Select menu
        optionsA = newRelNodeA.getElementsByTagName("option");
        optionsB = newRelNodeB.getElementsByTagName("option");

        for (option of optionsA) {
            if (option.innerHTML === name) {
                newRelNodeA.removeChild(option);
                break;
            }
        }
        for (option of optionsB) {
            if (option.innerHTML === name) {
                newRelNodeB.removeChild(option);
                break;
            }
        }

        // Relation interface
        relations = [].slice.call(relationInterface.getElementsByTagName("container"));
        for (relation of relations) {
            invisibles = relation.getElementsByTagName("invisible");
            for (invisible of invisibles) {
                if (invisible.value === name) {
                    relationInterface.removeChild(relation);
                    break;
                }
            }
        }
    }

    newNodeInterface.appendChild(newNodeContent);
    newNodeInterface.appendChild(newNodeRemove);
    newNodeInterface.appendChild(newNodeInvis);

    nodeInterface.appendChild(newNodeInterface);

}

function addRelation (nodeAName = newRelNodeA.value, nodeBName = newRelNodeB.value) {
    
    if (nodeAName == nodeBName) return;
    s.addRelation(nodeAName, nodeBName);

    // Relation display and removal
    newRelationInterface = document.createElement("container");

    newRelationContent = document.createElement("content");
    // We want the interface to display "", but we want the function to remove the relation between a node named "" and another node, so we must do this dance
    a = false;
    b = false;
    if (nodeAName === "") {
        nodeAName = "\"\"";
        a = true;
    }
    if (nodeBName === "") {
        nodeBName = "\'\'";
        b = true;
    }
    newRelationContent.innerHTML = nodeAName + " to\n" + nodeBName;
    if (a) nodeAName = "";
    if (b) nodeBName = "";

    newRelationInvisA = document.createElement("invisible");
    newRelationInvisB = document.createElement("invisible");
    newRelationInvisA.value = nodeAName;
    newRelationInvisB.value = nodeBName;

    newRelationRemove = document.createElement("button");
    newRelationRemove.innerHTML = "X";
    newRelationRemove.onclick = button => {
        parent = button.target.parentElement;
        invisibles = parent.getElementsByTagName("invisible");
        s.removeRelation(invisibles[0].value, invisibles[1].value);
        parent.remove();
    }

    newRelationInterface.appendChild(newRelationContent);
    newRelationInterface.appendChild(newRelationRemove);
    newRelationInterface.appendChild(newRelationInvisA);
    newRelationInterface.appendChild(newRelationInvisB);

    relationInterface.appendChild(newRelationInterface);
}

function loadFile(filePath) {
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    if (xmlhttp.status==200) result = xmlhttp.responseText;
    return result;
}

// Load in existing data
function load(file) {
    reset();
    data = loadFile(file);
    lines = data.split(/\r|\r?\n/g);
    lines.splice(0, 1);
    for (i = 0; i < lines.length; i++) {
        line = lines[i].split(",");
        countryA = line[4];
        countryB = line[6];
        // Placeholder nations in the Correlates of War database
        if (countryA === "-8" || countryB === "-8") continue;
        addNode(countryA);
        addNode(countryB);
        addRelation(countryA, countryB);
    }
    // Too much data, expand viewport
    ySize = 1500;
    yCenter = ySize / 2;
    setSize();
    return;
}

// Canvas base
function setSize(x = xSize, y = ySize) {
    canvas.width = x;
    canvas.height = y;
}

function clear() {
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

s = new System([]);
function main() {
    setSize();
    s.animate();
}

function reset() {
    s.cancel();
    s = new System([]);

    for (child of [].slice.call(newRelNodeA.children)) newRelNodeA.removeChild(child);
    for (child of [].slice.call(newRelNodeB.children)) newRelNodeB.removeChild(child);
    for (child of [].slice.call(nodeInterface.children)) nodeInterface.removeChild(child);
    for (child of [].slice.call(relationInterface.children)) relationInterface.removeChild(child);
    newNodeName.value = "";

    s.animate();
}

main();