import * as THREE from 'three';

function main() {

    // Set up the canvas and renderer
    // ================================
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

    // Set up the camera
    // ================================
    const fov = 75;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;

    // Set up the scene and lights
    // ================================
    const scene = new THREE.Scene();

    {
        const color = 0xFFFFFF;
        const intensity = 3;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    // Set up the box prefab
    // ================================
    const cubes = [];
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Set up asset loading
    // ================================
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    
    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');

    loadManager.onLoad = () => {
        loadingElem.style.display = 'none';

        makeInstance(geometry, -2);
        makeInstance(geometry, 0);
        makeInstance(geometry, 2);
    }

    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal;
        progressBarElem.style.transform = `scaleX(${progress})`;
    };

    const materials = [
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-1.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-2.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-3.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-4.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-5.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-6.jpg')}),
    ];

    function render(time) {

        time *= 0.001; // convert time to seconds

        // Dynamic updating of aspect ratio
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        renderer.render(scene, camera);

        requestAnimationFrame(render);

    }

    function makeInstance(geometry, x) {

        const cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
        cubes.push(cube);

        cube.position.x = x;

        return cube;

    }

    requestAnimationFrame(render);

    // ================
    // Helper functions
    // ================

    function loadColorTexture(path) {
        const texture = loader.load(path);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

}

main();

// ================
// Misc
// ================

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = (canvas.width !== width || canvas.height !== height);
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}