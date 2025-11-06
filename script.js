console.log('Script loaded');

window.addEventListener('load', function() {
    console.log('✓ Window load event fired');
    setTimeout(init3DScene, 500); // Wait 500ms for all libraries
});

function init3DScene() {
    console.log('Initializing 3D scene...');
    
    const loadingScreen = document.getElementById('loading-screen');
    const container = document.getElementById('canvas-container');

    if (!container) {
        console.error('❌ Canvas container not found');
        return;
    }

    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.error('❌ THREE.js not loaded');
        loadingScreen.innerHTML = '<p>Error: THREE.js failed to load</p>';
        return;
    }

    console.log('✓ THREE.js available');

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    console.log('✓ Renderer created');

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3c0, 0.6);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    let model;
    let autoRotateSpeed = 0.015;

    // Load Model
    const mtlLoader = new THREE.MTLLoader();
    const objLoader = new THREE.OBJLoader();

    console.log('Starting model load...');

    mtlLoader.setPath('models/');
    mtlLoader.load('source.mtl', 
        (materials) => {
            console.log('✓ MTL loaded');
            materials.preload();
            
            objLoader.setMaterials(materials);
            objLoader.setPath('models/');
            objLoader.load('source.obj', 
                (object) => {
                    console.log('✓ OBJ loaded');
                    model = object;

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
                    console.log('✓ Model added to scene - VISIBLE');

                    loadingScreen.classList.add('hidden');
                },
                (progress) => {
                    console.log(`OBJ loading: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                },
                (error) => {
                    console.error('❌ OBJ load error:', error);
                    loadingScreen.innerHTML = '<p>Error: Cannot load source.obj</p>';
                }
            );
        },
        (progress) => {
            console.log(`MTL loading: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        },
        (error) => {
            console.error('❌ MTL load error:', error);
            loadingScreen.innerHTML = '<p>Error: Cannot load source.mtl</p>';
        }
    );

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        if (model) {
            model.rotation.y += autoRotateSpeed;
        }

        renderer.render(scene, camera);
    }

    animate();
    console.log('✓ Animation loop started');

    // Pause on hover
    container.addEventListener('mouseenter', () => {
        autoRotateSpeed = 0;
    });

    container.addEventListener('mouseleave', () => {
        autoRotateSpeed = 0.015;
    });

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
