// ----------------------------------------------------------------------------------
// ---------- Cupola View with Video Parallax ----------
// ----------------------------------------------------------------------------------
const cupola = document.querySelector('.cupola-view');
const video = document.getElementById('cupolaVideo');

cupola.addEventListener('mousemove', (e) => {
    let rect = cupola.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
    let y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
    video.style.transition = 'transform 0.1s ease-out';
    video.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
});

cupola.addEventListener('mouseleave', () => {
    video.style.transition = 'transform 0.3s ease-in-out';
    video.style.transform = `translate(0,0) scale(1)`;
});


// ----------------------------------------------------------------------------------
// ---------- NBL Microgravity Simulator (Updated Physics and UI) ----------
// ----------------------------------------------------------------------------------
const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");
const taskTargetName = document.getElementById('taskTargetName');
const statusMessage = document.getElementById('statusMessage'); // Get the new message element

// Image Assets
const astronautImg = new Image();
astronautImg.src = "NBLwebp/astronaut_eva.png"; // Movable astronaut
const bgImg = new Image();
bgImg.src = "NBLwebp/NBL.webp"; // Static background

// Astronaut physics (TUNED FOR MICROGRAVITY/COASTING)
let astronaut = {
    x: 0, 
    y: 0,
    vx: 0, 
    vy: 0, 
    size: 250, 
    thrust: 0.2, // Small, precise force for microgravity
    drag: 0.99, // Very low drag for long coasting
    buoyancy_drift: 0 // NO CONSTANT DOWNWARD FORCE
};

// Target for the task (Realistic Component Box)
let target = {
    x: 0, 
    y: 0,
    size: 20, // Component box size
    isTaskComplete: false,
    stabilityTimer: 0,
    requiredStabilityTime: 120 // ~2 seconds
};

let keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);


// --- SETUP FUNCTIONS ---

function resizeCanvas() {
    canvas.width = canvas.clientWidth; 
    canvas.height = canvas.clientHeight;
    setupInitialPositions(); 
}

function setupInitialPositions() {
    // Set astronaut starting position (center of canvas)
    astronaut.x = canvas.width / 1;
    astronaut.y = canvas.height / 5;
    
    // Set target position (near the center structure in the NBL background)
    target.x = canvas.width * 0.56; 
    target.y = canvas.height * 0.65;
}


// ------------------- CORE GAME LOGIC -------------------

function updateAstronaut() {
    if (target.isTaskComplete) return; 

    // 1. Thrust Application
    let forceX = 0;
    let forceY = 0;

    if (keys["arrowup"] || keys["w"]) forceY -= astronaut.thrust;
    if (keys["arrowdown"] || keys["s"]) forceY += astronaut.thrust;
    if (keys["arrowleft"] || keys["a"]) forceX -= astronaut.thrust;
    if (keys["arrowright"] || keys["d"]) forceX += astronaut.thrust;

    astronaut.vx += forceX;
    astronaut.vy += forceY;

    // 2. Physics Update (Low Drag for coasting)
    astronaut.vx *= astronaut.drag;
    astronaut.vy *= astronaut.drag;

    // 3. Update Position and Boundary Check
    astronaut.x += astronaut.vx;
    astronaut.y += astronaut.vy;

    const halfSize = astronaut.size / 2;
    astronaut.x = Math.max(halfSize, Math.min(canvas.width - halfSize, astronaut.x));
    astronaut.y = Math.max(halfSize, Math.min(canvas.height - halfSize, astronaut.y));

    // 4. Task Logic: Distance and Stability Check 
    const distSq = Math.pow(astronaut.x - target.x, 2) + Math.pow(astronaut.y - target.y, 2);
    // Target area is based on the distance between the center points
    const targetAreaSq = Math.pow((target.size / 2) + halfSize, 2) * 2; 
    
    // Stability required: Very slow movement
    const stabilityThreshold = 0.05; 
    const isStable = (Math.abs(astronaut.vx) < stabilityThreshold) && 
                     (Math.abs(astronaut.vy) < stabilityThreshold);

    if (distSq < targetAreaSq && isStable) {
        target.stabilityTimer++;
        
        if (target.stabilityTimer >= target.requiredStabilityTime && !target.isTaskComplete) {
            target.isTaskComplete = true;
            taskTargetName.textContent = "TASK COMPLETE!";

            // *** PERSISTENT MESSAGE DISPLAY ***
            statusMessage.innerHTML = "Task Complete! NBL training perfects tools and complex procedures. This directly benefits Earth by informing the design of **remote-controlled surgery** and deep-sea exploration.";
            statusMessage.style.visibility = 'visible';
            statusMessage.style.opacity = 1;
            
            // Hide the message after a delay
            setTimeout(() => {
                statusMessage.style.opacity = 0;
                statusMessage.style.visibility = 'hidden';
            }, 8000); 
        }
    } else {
        target.stabilityTimer = 0;
    }
}

// ------------------- DRAWING FUNCTION -------------------

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw NBL background (Cover logic)
    if (bgImg.complete) {
        const hRatio = canvas.width / bgImg.width;
        const vRatio = canvas.height / bgImg.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (canvas.width - bgImg.width * ratio) / 2;
        const centerShiftY = (canvas.height - bgImg.height * ratio) / 2;
        
        ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, 
                      centerShiftX, centerShiftY, bgImg.width * ratio, bgImg.height * ratio);
    } else {
        ctx.fillStyle = "#00204a"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Target (Realistic Component Box)
    const halfTargetSize = target.size / 2;
    
    // Draw Progress Bar (simulating component attachment)
    if (target.stabilityTimer > 0 && !target.isTaskComplete) {
        ctx.fillStyle = '#ffeb3b'; 
        const progressHeight = (target.stabilityTimer / target.requiredStabilityTime) * target.size;
        
        // Draw the progress bar inside the box from the bottom up
        ctx.fillRect(target.x - halfTargetSize, 
                     target.y + halfTargetSize - progressHeight, 
                     target.size, 
                     progressHeight);
    }

    // Draw the box itself
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.fillStyle = target.isTaskComplete ? 'lime' : '#CC0000'; // Dark red/maroon for component
    ctx.fillRect(target.x - halfTargetSize, target.y - halfTargetSize, target.size, target.size);
    ctx.strokeRect(target.x - halfTargetSize, target.y - halfTargetSize, target.size, target.size);


    // 3. Update and Draw Astronaut
    updateAstronaut();
    
    const halfAstronautSize = astronaut.size / 2;
    
    // Draw astronaut (centered) - uses image or fallback
    if (astronautImg.complete) {
        ctx.drawImage(astronautImg, 
                      astronaut.x - halfAstronautSize, 
                      astronaut.y - halfAstronautSize, 
                      astronaut.size, 
                      astronaut.size);
    } else {
        // FALLBACK DRAWING: The movable silver circle
        ctx.beginPath();
        ctx.arc(astronaut.x, astronaut.y, halfAstronautSize, 0, Math.PI * 2);
        ctx.fillStyle = 'silver';
        ctx.fill();
        ctx.closePath();
    }

    requestAnimationFrame(draw);
}

// --- INITIALIZATION ---
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); 

// Start the animation loop
bgImg.onload = draw;

if (bgImg.complete) draw();
