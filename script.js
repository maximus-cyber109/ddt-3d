// Wait for window load to ensure all resources are loaded
window.addEventListener('load', function() {
    console.log('✓ Page fully loaded, starting 3D scene...');
    init3DScene();
});

function init3DScene() {
    const loadingScreen = document.getElementById('loading-screen');
    const container = document.getElementById('canvas-container');

    if (!container) {
        console.error('Canvas container not found');
        return;
    }

    // Verify libraries loaded
    if (!window.THREE) {
        console.error('THREE not available');
        return;
    }

    const THREE = window.THREE;
    const MTLLoader = window.MTLLoader;
    const OBJLoader = window.OBJLoader;

    console.log('✓ THREE.js libraries ready');

    // Three.js Scene Setup
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Lighting Setup
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

    // Simple Auto-Rotate
    let model;
    let autoRotateSpeed = 0.015;

    // Loading Manager
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = () => {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            console.log('✓ Model loaded successfully');
        }, 500);
    };

    loadingManager.onError = (url) => {
        console.error('Error loading:', url);
        loadingScreen.innerHTML = '<div class="loader"></div><p>Error loading model. Check paths.</p>';
    };

    // Load OBJ/MTL Model
    const mtlLoader = new MTLLoader(loadingManager);
    const objLoader = new OBJLoader(loadingManager);

    mtlLoader.setPath('models/');
    mtlLoader.load('source.mtl', (materials) => {
        console.log('✓ MTL loaded');
        materials.preload();
        
        objLoader.setMaterials(materials);
        objLoader.setPath('models/');
        objLoader.load('source.obj', (object) => {
            console.log('✓ OBJ loaded');
            model = object;

            // Calculate bounds and center
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            model.position.sub(center);

            // Scale model
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;
            model.scale.setScalar(scale);

            // Initial tilt
            model.rotation.x = Math.PI / 10;
            model.rotation.z = -Math.PI / 20;

            scene.add(model);
            console.log('✓ Model added to scene');
        }, 
        undefined,
        (error) => {
            console.error('OBJ loading error:', error);
            loadingScreen.innerHTML = '<div class="loader"></div><p>Error: Check models/source.obj</p>';
        });
    }, undefined, (error) => {
        console.error('MTL loading error:', error);
        loadingScreen.innerHTML = '<div class="loader"></div><p>Error: Check models/source.mtl</p>';
    });

    // Animation Loop - Simple auto-rotate
    function animate() {
        requestAnimationFrame(animate);

        if (model) {
            model.rotation.y += autoRotateSpeed;
        }

        renderer.render(scene, camera);
    }

    animate();

    // Mouse interaction - pause rotation on hover
    container.addEventListener('mouseenter', () => {
        autoRotateSpeed = 0;
    });

    container.addEventListener('mouseleave', () => {
        autoRotateSpeed = 0.015;
    });

    // Touch interaction
    container.addEventListener('touchstart', () => {
        autoRotateSpeed = 0;
    });

    container.addEventListener('touchend', () => {
        autoRotateSpeed = 0.015;
    });

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Initialize Lenis smooth scroll
    initLenisScroll(model, container);

    // Initialize coupon copy
    initCoupon();
}

// Lenis Smooth Scroll Setup
function initLenisScroll(model, container) {
    if (typeof Lenis === 'undefined') {
        console.warn('Lenis not available, skipping smooth scroll');
        return;
    }

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // GSAP + ScrollTrigger animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        const sections = document.querySelectorAll('.content-section');
        sections.forEach((section) => {
            const position = section.getAttribute('data-position');
            const targetX = position === 'left' ? -25 : 25;

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
                            y: (position === 'left' ? Math.PI / 4 : -Math.PI / 4) * progress,
                            duration: 0.3,
                        });
                    }
                }
            });
        });

        console.log('✓ Lenis smooth scroll initialized');
    }
}

// Coupon Copy Handler
function initCoupon() {
    const copyBtn = document.getElementById('copyBtn');
    const couponCode = document.getElementById('couponCode');

    if (copyBtn && couponCode) {
        copyBtn.addEventListener('click', () => {
            const code = couponCode.textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 2500);
                console.log('✓ Coupon copied');
            }).catch(() => {
                console.log('Fallback copy method');
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
}
