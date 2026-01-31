// --- 1. FONDO 3D OPTIMIZADO ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: window.innerWidth > 768 // Desactivar antialias en móviles para ganar velocidad
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

const starsGeometry = new THREE.BufferGeometry();
const totalStars = window.innerWidth > 768 ? 3500 : 1500; // Menos partículas en móvil
const posArray = new Float32Array(totalStars * 3);

for(let i=0; i < totalStars * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starsMesh = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: 0.05, color: 0x00f2ff }));
scene.add(starsMesh);
camera.position.z = 5;

// Pausar renderizado si no es visible para ahorrar CPU
let isVisible = true;
const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
}, { threshold: 0.1 });
observer.observe(document.getElementById('canvas-container'));

function animate() {
    requestAnimationFrame(animate);
    if (isVisible) {
        starsMesh.rotation.y += 0.0006;
        starsMesh.rotation.x += 0.0001;
        renderer.render(scene, camera);
    }
}
animate();

// --- 2. CURSOR Y MENÚ ---
const cursor = document.querySelector('.cursor-custom');
if(window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
    });
}

const menuToggle = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

menuToggle.onclick = () => {
    menuToggle.classList.toggle('is-active');
    navLinks.classList.toggle('active');
};

document.querySelectorAll('.nav-links a').forEach(link => {
    link.onclick = () => {
        menuToggle.classList.remove('is-active');
        navLinks.classList.remove('active');
    };
});

// --- 3. AUDIO SYSTEM ---
const playlist = [
    { name: "DESTINO", file: "./music/Destino.mp3" },
    { name: "TAN LEJOS, TAN CERCA", file: "./music/Tan_Lejos_Tan_Cerca.mp3" },
    { name: "INVIERNO", file: "./music/Invierno.mp3" },
    { name: "ME DA IGUAL", file: "./music/Me_Da_Igual.mp3" },
    { name: "SUSTANCIA", file: "./music/Sustancia.mp3" },
    { name: "LA SOLUCIÓN", file: "./music/La_Solución.mp3" },
    { name: "NO ME DIGAS LA VERDAD", file: "./music/No_Me_Digas_la_Verdad.mp3" },
    { name: "TUS MENTIRAS", file: "./music/Tus_Mentiras.mp3" },
    { name: "NUESTRA HISTORIA", file: "./music/Nuestra_Historia.mp3" },
    { name: "TU VOZ", file: "./music/Tu_Voz.mp3" },
    { name: "MENDIGO", file: "./music/Mendigo.mp3" }
];

let trackIndex = 0;
const audio = document.getElementById('main-audio');
const playBtn = document.getElementById('play-pause');
const playIcon = document.getElementById('play-icon');
const led = document.getElementById('led');
const viz = document.getElementById('visualizer');
const displayName = document.getElementById('display-name');
const trackNumber = document.getElementById('track-number');
const trackListElement = document.getElementById('track-list');
const progressBar = document.getElementById('progress-bar');
const progressWrapper = document.getElementById('progress-wrapper');

// Generar visualizador
viz.innerHTML = '';
for(let i=0; i<15; i++) viz.appendChild(document.createElement('span'));
const bars = viz.querySelectorAll('span');

let audioCtx, analyser, source, dataArray;

async function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        drawVisualizer();
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();
}

function renderPlaylist() {
    trackListElement.innerHTML = '';
    playlist.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = `track-item ${index === trackIndex ? 'active' : ''}`;
        li.innerText = `${String(index + 1).padStart(2, '0')} // ${track.name}`;
        li.onclick = () => { trackIndex = index; playSelectedTrack(); };
        trackListElement.appendChild(li);
    });
}

function loadTrack(index) {
    audio.src = playlist[index].file;
    displayName.innerText = playlist[index].name;
    trackNumber.innerText = `TRK ${String(index + 1).padStart(2, '0')}`;
    renderPlaylist();
}

async function playSelectedTrack() {
    loadTrack(trackIndex);
    await initAudio();
    audio.play().then(() => updateUI(true)).catch(() => console.log("Esperando interacción"));
}

function updateUI(isPlaying) {
    if (isPlaying) {
        led.style.background = "#00ff88";
        led.style.boxShadow = "0 0 10px #00ff88";
        playIcon.src = "./img/boton-de-pausa.png";
    } else {
        led.style.background = "#330000";
        led.style.boxShadow = "none";
        playIcon.src = "./img/boton-de-play.png";
    }
}

playBtn.onclick = async () => {
    await initAudio();
    if (audio.paused) {
        audio.play().then(() => updateUI(true));
    } else {
        audio.pause();
        updateUI(false);
    }
};

document.getElementById('next-btn').onclick = () => { 
    trackIndex = (trackIndex + 1) % playlist.length; 
    playSelectedTrack(); 
};

document.getElementById('prev-btn').onclick = () => { 
    trackIndex = (trackIndex - 1 + playlist.length) % playlist.length; 
    playSelectedTrack(); 
};

audio.ontimeupdate = () => { 
    if(audio.duration) progressBar.style.width = (audio.currentTime / audio.duration) * 100 + "%"; 
};

progressWrapper.onclick = (e) => { 
    if(audio.duration) audio.currentTime = (e.offsetX / progressWrapper.clientWidth) * audio.duration; 
};

audio.onended = () => document.getElementById('next-btn').click();

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if(analyser && !audio.paused) {
        analyser.getByteFrequencyData(dataArray);
        bars.forEach((b, i) => { 
            const val = (dataArray[i] / 255) * 30;
            b.style.height = (val + 2) + "px"; 
        });
    } else {
        bars.forEach(b => b.style.height = "2px");
    }
}

// Inicialización de Track
renderPlaylist();
loadTrack(0);

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 4. GSAP ANIMATIONS ---
gsap.registerPlugin(ScrollTrigger);

// Animación de Galería
gsap.from(".bento-item", {
    scrollTrigger: {
        trigger: ".bento-grid",
        start: "top 85%",
        toggleActions: "play none none none"
    },
    y: 50,
    opacity: 0,
    stagger: 0.1,
    duration: 1,
    ease: "power2.out"
});

// Animación de Fechas
gsap.from(".tour-item", {
    scrollTrigger: {
        trigger: ".tour-grid",
        start: "top 90%"
    },
    x: -30,
    opacity: 0,
    stagger: 0.1,
    duration: 0.8
});