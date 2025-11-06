// Three.js Scene Setup - Single OBJ Model with 2 Rotating Cameras
// Production-ready code optimized for your exact file structure

let scene, camera, renderer, controls;
let model;
let isLoading = true;

function init() {
    // Get canvas and container
    const canvas = document.getElementById('webgl-canvas');
    const container = document.getElementById('canvas-container');

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure black background
    scene.fog = new THREE.Fog(0x000000, 50, 100);

    // Camera setup - responsive to window size
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 80);

    // Renderer setup - High performance
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    // Lighting Setup - Realistic 3D rendering [web:17]
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

    // OrbitControls - Smooth camera interaction [web:17]
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable smooth damping
    controls.dampingFactor = 0.05; // Ultra-smooth (lower = smoother)
    controls.autoRotate = true; // Auto-rotate on load
    controls.autoRotateSpeed = 2; // Rotation speed
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.minDistance = 30;
    controls.maxDistance = 150;
    
    // Set camera to look at center
    controls.target.set(0, 0, 0);
    controls.update();

    // Load single OBJ/MTL model
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

// Load single OBJ and MTL model [web:14][web:18]
function loadModel() {
    const mtlLoader = new THREE.MTLLoader();
    const objLoader = new THREE.OBJLoader();

    // Set path to models folder
    const modelPath = 'models/';
    
    // Load MTL (materials)
    mtlLoader.setPath(modelPath);
    mtlLoader.load('source.mtl', (materials) => {
        materials.preload();
        
        // Load OBJ with materials
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);
        objLoader.load('source.obj', (object) => {
            model = object;
            
            // Setup model properties
            setupModel(model);
            
            // Center and scale model
            model.position.set(0, 0, 0);
            model.scale.set(2, 2, 2); // Adjust scale as needed
            
            scene.add(model);

            // Finish loading
            finishLoading();
        }, 
        // Progress callback (optional)
        (xhr) => {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log(percentComplete + '% loaded');
        },
        // Error callback
        (error) => {
            console.error('Error loading model:', error);
            finishLoading();
        });
    });
}

// Setup model properties and identify rotating cameras
function setupModel(model) {
    let cameraCount = 0;
    
    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Improve material rendering
            if (child.material) {
                child.material.side = THREE.DoubleSide;
                child.material.metalness = 0.3;
                child.material.roughness = 0.6;
            }
            
            // Log mesh names to identify camera objects
            if (child.name) {
                console.log('Mesh found:', child.name);
                cameraCount++;
            }
        }
    });
    
    console.log('Total meshes in model:', cameraCount);
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

// Animation loop - Smooth rendering [web:17]
function animate() {
    requestAnimationFrame(animate);

    // Update controls for smooth damping
    controls.update();

    // The cameras inside your OBJ are already rotating - no need to manually rotate
    // If you need to apply additional rotation to the entire model:
    if (model) {
        // Uncomment the line below for subtle overall rotation:
        // model.rotation.y += 0.0005;
    }

    // Render scene
    renderer.render(scene, camera);
}

// Handle window resize - Responsive design
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
