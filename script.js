// Three.js Scene Setup - DDT Rollins Pro Landing Page
// All libraries loaded before this script executes

let scene, camera, renderer, controls;
let model;
let isLoading = true;

function init() {
    // Verify THREE.js loaded
    if (typeof THREE === 'undefined') {
        console.error('THREE.js failed to load');
        return;
    }

    // Get canvas and container
    const canvas = document.getElementById('webgl-canvas');
    const container = document.getElementById('canvas-container');

    if (!canvas || !container) {
        console.error('Canvas or container not found in DOM');
        return;
    }

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure black background
    scene.fog = new THREE.Fog(0x000000, 50, 100);

    // Camera setup - responsive to window size
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width === 0 || height === 0) {
        console.error('Container has zero dimensions');
        return;
    }

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 80);

    // Renderer setup - High performance
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    // Lighting Setup - Realistic 3D rendering
    // Main key light (front)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(50, 50, 50);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    // Fill light (side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-50, 30, 50);
    scene.add(fillLight);

    // Rim light (back)
    const rimLight = new THREE.DirectionalLight(0x404040, 0.5);
    rimLight.position.set(0, 20, -80);
    scene.add(rimLight);

    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // OrbitControls - Smooth camera interaction
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05; // Ultra-smooth
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.minDistance = 30;
    controls.maxDistance = 150;
    
    controls.target.set(0, 0, 0);
    controls.update();

    // Load model
    loadModel();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Stop auto-rotate on user interaction
    renderer.domElement.addEventListener('mousedown', () => {
        controls.autoRotate = false;
    });

    renderer.domElement.addEventListener('touchstart', () => {
        controls.autoRotate = false;
    });

    // Resume auto-rotate after 5 seconds of inactivity
    let autoRotateTimeout;
    function resetAutoRotate() {
        clearTimeout(autoRotateTimeout);
        autoRotateTimeout = setTimeout(() => {
            controls.autoRotate = true;
        }, 5000);
    }

    renderer.domElement.addEventListener('mouseup', resetAutoRotate);
    renderer.domElement.addEventListener('touchend', resetAutoRotate);

    // Start animation loop
    animate();
}

// Load OBJ and MTL model
function loadModel() {
    const mtlLoader = new THREE.MTLLoader();
    const objLoader = new THREE.OBJLoader();

    const modelPath = 'models/';
    
    mtlLoader.setPath(modelPath);
    mtlLoader.load('source.mtl', (materials) => {
        materials.preload();
        
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);
        objLoader.load('source.obj', (object) => {
            model = object;
            
            setupModel(model);
            
            model.position.set(0, 0, 0);
            model.scale.set(2, 2, 2);
            
            scene.add(model);
            finishLoading();
        }, 
        (xhr) => {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log(percentComplete + '% loaded');
        },
        (error) => {
            console.error('Error loading model:', error);
            finishLoading();
        });
    }, undefined, (error) => {
        console.error('Error loading MTL:', error);
        finishLoading();
    });
}

// Setup model properties
function setupModel(model) {
    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
                child.material.side = THREE.DoubleSide;
                child.material.metalness = 0.3;
                child.material.roughness = 0.6;
            }
        }
    });
}

// Finish loading and hide spinner
function finishLoading() {
    isLoading = false;
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.opacity = '0';
        spinner.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            spinner.style.display = 'none';
        }, 300);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (controls) {
        controls.update();
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    if (camera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    if (renderer) {
        renderer.setSize(width, height);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
