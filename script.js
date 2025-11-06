import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
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
    loadingScreen.innerHTML = '<p>Error: Check if models exist</p>';
};

// Three.js Scene
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

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

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x7dd3c0, 0.6);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(0, -5, 3);
scene.add(rimLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.enableZoom = false;
controls.enablePan = false;

// Load Model - OBJ/MTL
const mtlLoader = new MTLLoader(loadingManager);
const objLoader = new OBJLoader(loadingManager);
let model;

mtlLoader.setPath('models/');
mtlLoader.load('source.mtl', (materials) => {
    materials.preload();
    objLoader.setMaterials(materials);
    objLoader.setPath('models/');
    objLoader.load('source.obj', (obj) => {
        model = obj;
        
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
        
        initScrollAnimations();
    });
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Lenis Smooth Scroll
let lenis;

window.addEventListener('load', () => {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    
    console.log('✓ Lenis ready');
});

// Scroll Animations
function initScrollAnimations() {
    const sections = gsap.utils.toArray('.content-section');
    
    sections.forEach((section) => {
        const position = section.getAttribute('data-position');
        const isMobile = window.innerWidth < 968;
        const targetX = isMobile ? 0 : (position === 'left' ? -25 : 25);
        const rotationY = position === 'left' ? Math.PI / 4 : -Math.PI / 4;
        
        ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                
                gsap.to(container, {
                    x: `${targetX * progress}vw`,
                    duration: 0.3,
                });
                
                if (model) {
                    gsap.to(model.rotation, {
                        y: rotationY * progress,
                        duration: 0.3,
                    });
                }
            }
        });
    });
    
    ScrollTrigger.create({
        trigger: '.cta-section',
        start: 'top center',
        end: 'center center',
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;
            
            gsap.to(container, {
                x: 0,
                scale: 1.1,
                duration: 0.5,
            });
            
            if (model) {
                gsap.to(model.rotation, {
                    y: Math.PI * 2 * progress,
                    duration: 0.5,
                });
            }
            
            controls.autoRotate = true;
        }
    });
    
    console.log('✓ Scroll animations initialized');
}

// Copy Coupon
const copyBtn = document.getElementById('copyBtn');
const couponCode = document.getElementById('couponCode');

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

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    ScrollTrigger.refresh();
});
