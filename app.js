// ==========================================
// 1. CONFIGURACIÓN DEL LIENZO (CANVAS)
// ==========================================
const canvas = document.getElementById('canvas-bg');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Coordenadas para interacción con el ratón (Paralaje)
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;

document.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.4;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.4;
});

// Vértices base de un octaedro regular en un espacio 3D
const baseVertices = [
    {x: 0,  y: 1,  z: 0},  
    {x: 1,  y: 0,  z: 0},  
    {x: 0,  y: 0,  z: 1},  
    {x: -1, y: 0,  z: 0},  
    {x: 0,  y: 0,  z: -1}, 
    {x: 0,  y: -1, z: 0}   
];

// Mapeo topológico de las 8 caras triangulares del octaedro
const faces = [, [0, 2, 3], [0, 3, 4], [0, 4, 1],
, [5, 3, 2], [5, 4, 3], [5, 1, 4]
];

// ==========================================
// 2. CLASE ENCAPSULADA: PIPELINE DE GRÁFICOS 3D
// ==========================================
class Octahedron {
    constructor() {
        // Distribución espacial volumétrica considerando el scroll vertical del portafolio
        this.x = (Math.random() - 0.5) * canvas.width * 1.5;
        this.y = (Math.random() - 0.3) * canvas.height * 3;
        this.z = Math.random() * 200 - 100;
        
        this.size = Math.random() * 35 + 15;
        
        this.angleX = Math.random() * Math.PI;
        this.angleY = Math.random() * Math.PI;

        this.speedX = (Math.random() - 0.5) * 0.005;
        this.speedY = (Math.random() - 0.5) * 0.005;

        this.isWireframe = Math.random() > 0.4;
    }

    update() {
        this.angleX += this.speedX;
        this.angleY += this.speedY;
    }

    draw(offsetX, offsetY) {
        let scrollYOffset = window.scrollY * 0.4; // Factor de efecto de paralaje en scroll
        let posX = this.x + offsetX + (canvas.width / 2);
        let posY = this.y + offsetY + (canvas.height / 2) - scrollYOffset;

        // Culling vertical: descarta objetos fuera de la pantalla para optimizar CPU
        if (posY < -100 || posY > canvas.height + 100) return;

        let projectedVertices = [];

        baseVertices.forEach(v => {
            // Rotaciones matriciales en ejes X e Y
            let y1 = v.y * Math.cos(this.angleX) - v.z * Math.sin(this.angleX);
            let z1 = v.y * Math.sin(this.angleX) + v.z * Math.cos(this.angleX);

            let x2 = v.x * Math.cos(this.angleY) + z1 * Math.sin(this.angleY);
            let z2 = -v.x * Math.sin(this.angleY) + z1 * Math.cos(this.angleY);

            // Proyección matemática de perspectiva cónica
            let scale = 500 / (500 + z2); 
            projectedVertices.push({
                x: posX + x2 * this.size * scale,
                y: posY + y1 * this.size * scale
            });
        });

        faces.forEach((face, index) => {
            let p1 = projectedVertices[face[0]];
            let p2 = projectedVertices[face[1]];
            let p3 = projectedVertices[face[2]];

            // Algoritmo Backface Culling (elimina caras ocultas traseras)
            let crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

            if (crossProduct > 0) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();

                if (this.isWireframe) {
                    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    let fillGrad = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
                    fillGrad.addColorStop(0, '#0c101b');
                    fillGrad.addColorStop(1, index % 2 === 0 ? '#1b152b' : '#0c101b');
                    ctx.fillStyle = fillGrad;
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(157, 78, 221, 0.2)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
    }
}

// ==========================================
// 3. INICIALIZACIÓN Y BUCLE DE RENDER
// ==========================================
// Optimización de rendimiento adaptativa para dispositivos móviles
const isMobile = window.innerWidth < 768;
const totalObjects = isMobile ? 12 : 32; 

const octahedrons = Array.from({ length: totalObjects }, () => new Octahedron());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Interpolación lineal suave para amortiguar el movimiento del mouse
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    octahedrons.forEach(oct => {
        oct.update();
        oct.draw(mouseX, mouseY);
    });

    requestAnimationFrame(animate);
}
animate();

// ==========================================
// 4. INTERACCIONES DEL DOM PROTEGIDAS (DOM READY)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Cursor Dinámico de Terminal ---
    const formInputs = document.querySelectorAll('.form-group input, .form-group textarea');

    formInputs.forEach(input => {
        const group = input.closest('.form-group');
        const label = group.querySelector('label');
        const originalText = label.textContent;

        input.addEventListener('focus', () => {
            label.innerHTML = `${originalText} <span class="terminal-cursor">_</span>`;
        });

        input.addEventListener('blur', () => {
            label.textContent = originalText;
        });
    });

    // --- Transmisión de Datos Segura (Formspree AJAX Pipeline) ---
    const form = document.getElementById('contact-form');
    const statusSpan = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    if (form) {
        form.addEventListener('submit', async function(event) {
            // DETIENE EL COMPORTAMIENTO POR DEFECTO (Evita recarga de página)
            event.preventDefault(); 
            
            // Bloquear botón e indicar procesamiento en la interfaz gráfica
            submitBtn.disabled = true;
            statusSpan.className = 'status-terminal-text loading';
            statusSpan.textContent = '[ TRANSMITIENDO DATOS... ]';
            
            const data = new FormData(event.target);
            
            try {
                const response = await fetch(event.target.action, {
                    method: form.method,
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    statusSpan.className = 'status-terminal-text success';
                    statusSpan.textContent = '✓ TRANSMISIÓN COMPLETADA CON ÉXITO.';
                    form.reset(); // Limpia los campos del formulario
                } else {
                    statusSpan.className = 'status-terminal-text error';
                    statusSpan.textContent = '❌ ERROR EN TRANSMISIÓN: CONEXIÓN RECHAZADA.';
                }
            } catch (error) {
                statusSpan.className = 'status-terminal-text error';
                statusSpan.textContent = '❌ ERROR: ENLACE SATURADO u OFFLINE.';
            } finally {
                // Reactivar el flujo del botón tras unos segundos
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    } else {
        console.warn("Módulo de formulario no inicializado: Asegúrate de que exista id='contact-form' en el HTML.");
    }
});
