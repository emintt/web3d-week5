import * as THREE from 'three';
import { GLTFLoader, OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';



let camera, scene, renderer;


init();

function init() {
  const container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
  camera.position.set(10, 3, 2 );
  // camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  // renderer.setAnimationLoop();
  // renderer.xr.enabled = true;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;

  container.appendChild( renderer.domElement );


  // Add ambient light for visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // document.body.appendChild( VRButton.createButton( renderer ) );

  new RGBELoader()
    .setPath( 'hdr/' )
    .load( 'evening_road_01_puresky_4k.hdr', function ( texture ) {

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      // render();

      // model
      const loader = new GLTFLoader().setPath( 'gltf/' );
      loader.load( 'lowpolyworld.glb', async function ( glb ) {

        const model = glb.scene;

        // wait until the model can be added to the scene without blocking due to shader compilation

        await renderer.compileAsync( model, camera, scene );

        scene.add( model );

        // render();

      } );

    } );
    
   

    const controls = new OrbitControls( camera, renderer.domElement );
    // controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.target.set( 0, 0, - 0.2 );
    controls.update();

    window.addEventListener( 'resize', onWindowResize );

  initVR();

  function initVR() {
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.enabled = true;
  }
    
}

renderer.setAnimationLoop( function () {

	renderer.render( scene, camera );

} );
  
function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

