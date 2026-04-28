const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'apps', 'dashboard', 'public', 'maps');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

class MapBuilder {
    constructor(name) {
        this.name = name;
        this.nodes = [];
        this.edges = [];
        this.exits = [];
        this.meshes = [];
        this.nodeCounter = 1;
        this.roomCounter = 1;
        this.meshCounter = 1;
    }

    addNode(type, x, y) {
        let id = (type === "exit" ? "EX" : "N") + this.nodeCounter++;
        this.nodes.push({ id, type, x, y });
        return id;
    }

    addMesh(type, id, x, y, z, w, h, d) {
        this.meshes.push({
            type,
            id,
            pos: { x, y, z },
            size: { w, h, d },
            label: id
        });
    }

    addEdge(n1, n2) {
        if (!this.edges.find(e => (e.from === n1 && e.to === n2) || (e.from === n2 && e.to === n1))) {
            this.edges.push({ from: n1, to: n2 });
        }
    }

    addExit(exitId, nodeId) {
        this.exits.push({ id: exitId, node: nodeId });
    }

    makeRoom(x, y, w, d, optId = null) {
        let nId = this.addNode("room", x, y);
        let mId = optId || "R" + this.roomCounter++;
        this.addMesh("room", mId, x, 1.5, y, w, 3.0, d);
        return nId;
    }

    makeCorridor(x, y, w, d) {
        let nId = this.addNode("corridor", x, y);
        let mId = "C" + this.meshCounter++;
        this.addMesh("corridor", mId, x, 1.5, y, w, 3.0, d);
        return nId;
    }
    
    makeJunction(x, y, w, d) {
        let nId = this.addNode("junction", x, y);
        let mId = "J" + this.meshCounter++;
        this.addMesh("junction", mId, x, 1.5, y, w, 3.0, d);
        return nId;
    }

    makeOpenSpace(x, y, w, d) {
        let nId = this.addNode("open_space", x, y);
        let mId = "O" + this.meshCounter++;
        this.addMesh("open_space", mId, x, 1.5, y, w, 3.0, d);
        return nId;
    }

    bindExit(exitId, nodeId, x, z) {
        let nId = this.addNode("exit", x, z);
        this.addEdge(nId, nodeId);
        this.addExit(exitId, nId);
        this.addMesh("exit", exitId, x, 1.5, z, 2, 3.0, 2);
    }

    export(filename) {
        const outPath = path.join(outDir, filename);
        fs.writeFileSync(outPath, JSON.stringify({
            map_name: this.name,
            nodes: this.nodes,
            edges: this.edges,
            exits: this.exits,
            meshes: this.meshes
        }, null, 2));
        console.log("Generated:", filename);
    }
}

// 1. HOSPITAL LAYOUT (Central spine + rows of rooms + nurse stations)
function generateHospital() {
    let map = new MapBuilder("Hospital");
    
    // Central Spine
    let spineNodes = [];
    for (let i = 0; i < 7; i++) {
        let cy = i * 6;
        let cId = map.makeCorridor(0, cy, 4, 6);
        spineNodes.push(cId);
        if (i > 0) map.addEdge(spineNodes[i-1], spineNodes[i]);
        
        // Add left room
        let lrId = map.makeRoom(-5, cy, 6, 5);
        map.addEdge(lrId, cId);
        
        // Add right room
        let rrId = map.makeRoom(5, cy, 6, 5);
        map.addEdge(rrId, cId);
    }

    // Perpendicular wings (Nurse stations)
    let n1 = map.makeJunction(0, 36, 4, 4);
    map.addEdge(spineNodes[6], n1);
    
    let lw1 = map.makeCorridor(-6, 36, 6, 4);
    let rw1 = map.makeCorridor(6, 36, 6, 4);
    map.addEdge(n1, lw1);
    map.addEdge(n1, rw1);

    for(let i = 1; i <= 3; i++) {
        let r1 = map.makeRoom(-6 - (i*6), 36, 6, 5);
        map.addEdge(r1, lw1); // Link to left wing hub
        
        let r2 = map.makeRoom(6 + (i*6), 36, 6, 5);
        map.addEdge(r2, rw1); // Link to right wing hub
    }

    // Exits
    map.bindExit("E1", spineNodes[0], 0, -5);     // South main entrance
    map.bindExit("E2", lw1, -12, 36);             // West emergency
    map.bindExit("E3", rw1, 12, 36);              // East wing exit
    map.bindExit("E4", spineNodes[3], -10, 18);   // Side stair 1 (linked via room)
    map.bindExit("E5", spineNodes[5], 10, 30);    // Side stair 2
    map.bindExit("E6", n1, 0, 42);                // North rear exit

    map.export("hospital_layout.json");
}

// 2. OFFICE LAYOUT (grid, meeting rooms, cubicle clusters)
function generateOffice() {
    let map = new MapBuilder("Office");
    
    let nodes = {};
    // Create an underlying grid
    for(let gx=0; gx<4; gx++) {
        for(let gy=0; gy<4; gy++) {
            let cx = gx * 10;
            let cy = gy * 10;
            
            // Mix of cubicles and offices
            let id;
            if (gx === 0 || gx === 3) {
                // outer row = closed office / meeting
                id = map.makeRoom(cx, cy, 8, 8);
            } else if (gx === 1 && gy === 1) {
                // junction center
                id = map.makeJunction(cx, cy, 6, 6);
            } else {
                // open space cubicles
                id = map.makeOpenSpace(cx, cy, 8, 8);
                // Also add small corridors connecting them
            }
            nodes[`${gx}_${gy}`] = id;
            
            if (gx > 0) {
                let pid = nodes[`${gx-1}_${gy}`];
                let cid = map.makeCorridor(cx - 5, cy, 3, 2);
                map.addEdge(pid, cid);
                map.addEdge(cid, id);
            }
            if (gy > 0) {
                let pid = nodes[`${gx}_${gy-1}`];
                let cid = map.makeCorridor(cx, cy - 5, 2, 3);
                map.addEdge(pid, cid);
                map.addEdge(cid, id);
            }
        }
    }

    // Exits
    map.bindExit("E1", nodes["0_0"], -5, -5);
    map.bindExit("E2", nodes["3_0"], 35, -5);
    map.bindExit("E3", nodes["0_3"], -5, 35);
    map.bindExit("E4", nodes["3_3"], 35, 35);
    map.bindExit("E5", nodes["1_0"], 10, -5);
    map.bindExit("E6", nodes["2_3"], 20, 35);

    map.export("office_layout.json");
}

// 3. MALL LAYOUT (Atrium, shop clusters, wide corridors)
function generateMall() {
    let map = new MapBuilder("Mall");
    
    // Large Atrium in center
    let atriumId = map.makeOpenSpace(0, 0, 20, 20);
    
    let branches = [
        { dx: 0, dy: -1 }, // North
        { dx: 0, dy: 1 },  // South
        { dx: -1, dy: 0 }, // West
        { dx: 1, dy: 0 }   // East
    ];
    
    let exitsPlaced = 0;
    
    branches.forEach((b, idx) => {
        let prevId = atriumId;
        for (let i = 1; i <= 3; i++) {
            let dist = 10 + i * 8;
            let cx = b.dx * dist;
            let cy = b.dy * dist;
            
            let cid;
            if (i === 3) {
                cid = map.makeJunction(cx, cy, 10, 10);
            } else {
                cid = map.makeCorridor(cx, cy, 8, 8);
            }
            map.addEdge(prevId, cid);
            prevId = cid;
            
            // Shops on flanks
            if (b.dx === 0) {
                // Vertical corridor, shops on sides (East/West)
                let s1 = map.makeRoom(cx - 8, cy, 6, 6);
                let s2 = map.makeRoom(cx + 8, cy, 6, 6);
                map.addEdge(s1, cid);
                map.addEdge(s2, cid);
            } else {
                // Horizontal corridor, shops on sides (North/South)
                let s1 = map.makeRoom(cx, cy - 8, 6, 6);
                let s2 = map.makeRoom(cx, cy + 8, 6, 6);
                map.addEdge(s1, cid);
                map.addEdge(s2, cid);
            }
            
            if (i === 3 && exitsPlaced < 4) {
                exitsPlaced++;
                map.bindExit(`E${exitsPlaced}`, cid, cx + b.dx*10, cy + b.dy*10);
            }
        }
    });

    // We still need E5 and E6. Add random exits on some side shops.
    map.bindExit("E5", map.nodes[4].id, -15, -15);
    map.bindExit("E6", map.nodes[10].id, 15, 15);

    map.export("mall_layout.json");
}

// 4. AIRPORT LAYOUT (long branching corridors, gates, lounges)
function generateAirport() {
    let map = new MapBuilder("Airport");

    // Main terminal lounge
    let mainLounge = map.makeOpenSpace(0, 0, 30, 15);
    
    // Two very long wings
    let leftC = [mainLounge], rightC = [mainLounge];
    
    for (let i = 1; i <= 6; i++) {
        let lx = -i * 12; // left wing
        let rx = i * 12;  // right wing
        
        let cidL = map.makeCorridor(lx, 0, 10, 6);
        map.addEdge(leftC[i-1], cidL);
        leftC.push(cidL);
        
        let cidR = map.makeCorridor(rx, 0, 10, 6);
        map.addEdge(rightC[i-1], cidR);
        rightC.push(cidR);
        
        // Gates (Lounge / Waiting areas are OpenSpace/Junctions)
        let gL1 = map.makeOpenSpace(lx, 8, 8, 8); // Top gate
        let gL2 = map.makeOpenSpace(lx, -8, 8, 8); // Bottom gate
        map.addEdge(cidL, gL1);
        map.addEdge(cidL, gL2);
        
        let gR1 = map.makeOpenSpace(rx, 8, 8, 8); // Top gate
        let gR2 = map.makeOpenSpace(rx, -8, 8, 8); // Bottom gate
        map.addEdge(cidR, gR1);
        map.addEdge(cidR, gR2);
    }
    
    map.bindExit("E1", mainLounge, 0, -10);
    map.bindExit("E2", leftC[6], -80, 0);
    map.bindExit("E3", rightC[6], 80, 0);
    map.bindExit("E4", mainLounge, 0, 10);
    map.bindExit("E5", leftC[3], -40, -10);
    map.bindExit("E6", rightC[3], 40, -10);

    map.export("airport_layout.json");
}

// 5. HOTEL LAYOUT (Lobby + elevator bank + long hall + small rooms)
function generateHotel() {
    let map = new MapBuilder("Hotel");

    // Ground Floor / Lower Section Lobby
    let lobby = map.makeOpenSpace(0, 0, 20, 15);
    let liftLobby = map.makeJunction(0, 12, 10, 8);
    map.addEdge(lobby, liftLobby);
    
    // Main hallway (Y=20)
    let halls = [];
    for(let i = -4; i <= 4; i++) {
        let hx = i * 10;
        let hy = 20;
        let hid = map.makeCorridor(hx, hy, 10, 3);
        halls.push(hid);
        
        if (halls.length > 1) {
            map.addEdge(halls[halls.length - 2], hid);
        }
        
        if (i === 0) {
            // center connects to lift lobby
            map.addEdge(liftLobby, hid);
        }
        
        // Upper rooms
        let r1 = map.makeRoom(hx, hy + 6, 8, 7);
        map.addEdge(hid, r1);
        
        // Lower rooms (skip center where elevator might be)
        if (i !== 0 && i !== -1 && i !== 1) {
            let r2 = map.makeRoom(hx, hy - 6, 8, 7);
            map.addEdge(hid, r2);
        }
    }
    
    // Back service corridor
    let serviceHall = map.makeCorridor(0, 32, 40, 3);
    // Connect service hall to ends of main hallway
    let leftServLink = map.makeCorridor(-40, 26, 3, 8);
    let rightServLink = map.makeCorridor(40, 26, 3, 8);
    
    map.addEdge(halls[0], leftServLink);
    map.addEdge(leftServLink, serviceHall);
    
    map.addEdge(halls[halls.length-1], rightServLink);
    map.addEdge(rightServLink, serviceHall);

    // Exits
    map.bindExit("E1", lobby, 0, -10); // Main entrance
    map.bindExit("E2", lobby, -10, -5); // Side door 1
    map.bindExit("E3", lobby, 10, -5);  // Side door 2
    map.bindExit("E4", serviceHall, 0, 36); // Back loading dock
    map.bindExit("E5", leftServLink, -45, 26); // West stairs
    map.bindExit("E6", rightServLink, 45, 26); // East stairs

    map.export("hotel_layout.json");
}

function main() {
    console.log("Generating 5 Maps...");
    generateHospital();
    generateOffice();
    generateMall();
    generateAirport();
    generateHotel();
    console.log("Done.");
}

main();
