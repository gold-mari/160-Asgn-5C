import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/Addons.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';

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
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 4, 5);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 2, 0);
    controls.update();

    // Set up the scene and lights
    // ================================
    const scene = new THREE.Scene();

    {
        // Hemisphere light
        {
            const skyColor = 0x444444;
            const groundColor = 0x00ffaa;
            const intensity = 1;
            const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
            scene.add(light);
        }

        // Spotlight down
        {
            const color = 0xffffff;
            const intensity = 250;
            const light = new THREE.SpotLight(color, intensity);
            light.position.set(0, 10, 0);
            light.target.position.set(0, 0, 0);
            light.angle = Math.PI * 0.25;
            light.penumbra = 0.75;
            scene.add(light);
            scene.add(light.target);

            // const helper = new THREE.SpotLightHelper(light);
            // scene.add(helper);
        }

        // Spotlight fumo
        {
            const color = 0xffffff;
            const intensity = 250;
            const light = new THREE.SpotLight(color, intensity);
            light.position.set(2, 3, 5);
            light.target.position.set(0, 2, 0);
            light.angle = Math.PI * 0.05;
            light.penumbra = .25;
            scene.add(light);
            scene.add(light.target);

            // const helper = new THREE.SpotLightHelper(light);
            // scene.add(helper);
        }

        // Point light
        {
            const color = 0xFF8800;
            const intensity = 400;
            const light = new THREE.PointLight(color, intensity);
            light.position.set(1, 5, -2);
            scene.add(light);

            // const helper = new THREE.PointLightHelper(light);
            // scene.add(helper);
        }
    }

    // Set up loaders
    // ================================
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);

    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');

    loadManager.onLoad = () => {
        loadingElem.style.display = 'none';
        start();
    }

    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal;
        progressBarElem.style.transform = `scaleX(${progress})`;
    };

    // Set up the ground plane
    // ================================
    const planeSize = 40;
 
    const planeTex = loader.load('./resources/images/checker.png');
    planeTex.wrapS = THREE.RepeatWrapping;
    planeTex.wrapT = THREE.RepeatWrapping;
    planeTex.magFilter = THREE.NearestFilter;
    planeTex.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    planeTex.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshStandardMaterial({
        color: 0x22ffcc,
        map: planeTex,
        side: THREE.DoubleSide,
    });

    // Set up the skybox
    // ================================

    {
        const texture = loader.load("./resources/images/sky.png", () => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            scene.background = texture;
        });
    }

    // Set up the box prefab
    // ================================
    const cubes = [];
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Define box material array
    // ================================
    const materials = [
        new THREE.MeshStandardMaterial({map: loadColorTexture('./resources/images/flower-1.jpg')}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('./resources/images/flower-2.jpg')}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('./resources/images/flower-3.jpg')}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('./resources/images/flower-4.jpg')}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('./resources/images/flower-5.jpg')}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('./resources/images/flower-6.jpg')}),
    ];

    // Set up the fumo !
    {
        const mtlLoader = new MTLLoader();
        const objLoader = new OBJLoader();

        mtlLoader.load("./resources/models/fumo/fumo.mtl", (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl);
            objLoader.load("./resources/models/fumo/fumo.obj", (root) => {
                scene.add(root);
            });
        });
    }

    function start() {
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = Math.PI * -.5;
        scene.add(plane);

        makeInstance(geometry, [-2, 2, 0]);
        // makeInstance(geometry, [0, 2, 0]);
        makeInstance(geometry, [2, 2, 0]);
    }

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

    function makeInstance(geometry, [x, y, z]) {

        const cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
        cubes.push(cube);

        cube.position.set(x, y, z);

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