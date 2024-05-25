import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/Addons.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';

// const resourcesPath = "https://gold-mari.github.io/160-Asgn-5B/";
const resourcesPath = "";

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
    camera.position.set(0, 9, 10);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 7, 0);
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
            light.position.set(0, 15, 0);
            light.target.position.set(0, 5, 0);
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
            light.position.set(2, 8, 5);
            light.target.position.set(0, 7, 0);
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
            light.position.set(1, 10, -2);
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
 
    const planeTex = loader.load("resources/images/checker.png");
    planeTex.wrapS = THREE.RepeatWrapping;
    planeTex.wrapT = THREE.RepeatWrapping;
    planeTex.magFilter = THREE.NearestFilter;
    planeTex.colorSpace = THREE.SRGBColorSpace;
    planeTex.repeat.set(planeSize/2, planeSize/2);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshStandardMaterial({
        color: 0x22ffcc,
        map: planeTex,
        side: THREE.DoubleSide,
    });

    const pillarMat = new THREE.MeshStandardMaterial().copy(planeMat);
    pillarMat.map = planeTex.clone();
    pillarMat.map.repeat.set(planeSize/20, planeSize/2);

    // Set up the skybox
    // ================================

    {
        const texture = loader.load("resources/images/sky.png", () => {
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
    const box = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Define box material array
    // ================================
    const flowerMat = [
        new THREE.MeshStandardMaterial({map: loadColorTexture("resources/images/flower-1.jpg")}),
        new THREE.MeshStandardMaterial({map: loadColorTexture("resources/images/flower-2.jpg")}),
        new THREE.MeshStandardMaterial({map: loadColorTexture("resources/images/flower-3.jpg")}),
        new THREE.MeshStandardMaterial({map: loadColorTexture("resources/images/flower-4.jpg")}),
        new THREE.MeshStandardMaterial({map: loadColorTexture("resources/images/flower-5.jpg")}),
        new THREE.MeshStandardMaterial({map: loadColorTexture("resources/images/flower-5.jpg")}),
    ];

    // Set up the fumo !
    let fumo;
    {
        const mtlLoader = new MTLLoader();
        const objLoader = new OBJLoader();

        mtlLoader.load("resources/models/fumo/fumo.mtl", (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl);
            objLoader.load("resources/models/fumo/fumo.obj", (obj) => {
                scene.add(obj);
                fumo = obj;
                fumo.position.set(0, 5, 0);
            });
        });
    }

    function start() {
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = Math.PI * -.5;
        scene.add(plane);

        // Add steps
        for (let i=5; i>0; i--) {
            const stepGeo = new THREE.CylinderGeometry( 10+i, 10+i, 1, 32 );
            makeInstance(stepGeo, pillarMat, [0, 5-i+0.5, 0]);
        }

        // Add spinning cubes
        addSpinningGeometryAt(box, flowerMat, [-2, 7, 0]);
        addSpinningGeometryAt(box, flowerMat, [2, 7, 0]);

        // Add pillars
        let radius = 8;
        let height = 20
        for (let i=0; i<13; i++) {
            let angle = (i/13) * 2 * Math.PI;
            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius;
            // console.log(`angle: ${angle} | x: ${x} | z: ${z}`);
            let pillar = makeInstance(box, pillarMat, [x, height/2+5, z]);
            pillar.scale.set(1, height, 1);
        }

        // Add roof
        const roofTopGeo = new THREE.CylinderGeometry( 0, 9, 4, 32 );
        const roofBaseGeo = new THREE.CylinderGeometry( 9, 10, 4, 32 );
        const roofRimGeo = new THREE.CylinderGeometry( 11, 11, 1, 32 );
        makeInstance(roofBaseGeo, pillarMat, [0, 27, 0]);
        makeInstance(roofTopGeo, pillarMat, [0, 31, 0]);
        makeInstance(roofRimGeo, pillarMat, [0, 25, 0]);
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

        {
            const speed = 5;
            const rot = time * speed;
            if (fumo != undefined) {
                fumo.rotation.y = rot;
            }
        }

        renderer.render(scene, camera);

        requestAnimationFrame(render);

    }

    function addSpinningGeometryAt(geometry, material, [x, y, z]) {
        const cube = makeInstance(geometry, material, [x, y, z]);
        cubes.push(cube);

        return cube;
    }

    function makeInstance(geometry, material, [x, y, z]) {

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

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