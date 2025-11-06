import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const loadingScreen = document.getElementById('loading-screen');

// Loading Manager
const loadingManager = new THREE.LoadingManager();

loadingManager.onLoad = () => {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 500);
};

loadingManager.onProgress = (url, loaded, total) => {
    console.log(`Loading: ${Math.round((loaded / total) * 100)}%`);
};

loadingManager.onError = (url) => {
    console.error('Error loading:', url);
    loadingScreen.innerHTML = '<p>Error loading model</p>';
};

// Three.js Scene
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true 
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
container.appendChild(renderer.domElement);

// Lighting - Premium
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(8, 6, 8);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-8, 3, -8);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(0, -8, 4);
scene.add(rimLight);

// Controls - ROTATION ONLY (no zoom, no pan)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;
controls.enableZoom = false;    // NO ZOOM
controls.enablePan = false;     // NO PAN
controls.enableRotate = true;   // YES ROTATION

// Load Model
const loader = new GLTFLoader(loadingManager);
let model;

loader.load(
    './models/source.glb',
    (gltf) => {
        model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.setScalar(scale);
        
        model.rotation.x = Math.PI / 10;
        model.rotation.z = -Math.PI / 20;
        
        scene.add(model);
        console.log('✓ Model loaded');
    },
    (progress) => {
        if (progress.total > 0) {
            console.log(`Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        }
    },
    (error) => {
        console.error('Error:', error);
    }
);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    if (controls.isUserInteracting) {
        controls.autoRotate = false;
    }
    
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Resume auto-rotate on mobile after touch
let touchTimeout;
document.addEventListener('touchend', () => {
    clearTimeout(touchTimeout);
    touchTimeout = setTimeout(() => {
        controls.autoRotate = true;
    }, 2000);
});

// Copy Coupon
const copyBtn = document.getElementById('copyBtn');
const couponCode = document.getElementById('couponCode');

if (copyBtn && couponCode) {
    copyBtn.addEventListener('click', () => {
        const code = couponCode.textContent;
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.classList.add('copied');
            setTimeout(() => copyBtn.classList.remove('copied'), 2500);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            copyBtn.classList.add('copied');
            setTimeout(() => copyBtn.classList.remove('copied'), 2500);
        });
    });
}

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

console.log('✓ Script ready');
