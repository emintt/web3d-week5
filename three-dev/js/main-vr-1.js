import * as THREE from 'three';
import { GLTFLoader, OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { mod } from 'three/webgpu';


let camera, scene, renderer;

//////////////
//Initialize variables
//////////////
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let group;



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
    .load( 'meadow_2_1k.hdr', function ( texture ) {

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      // render();

      // model
      // const loader = new GLTFLoader().setPath( 'gltf/' );
      // loader.load( 'basic-models.glb', async function ( glb ) {

      //   const model = glb.scene;

      //   // wait until the model can be added to the scene without blocking due to shader compilation

      //   await renderer.compileAsync( model, camera, scene );

      //   scene.add( model );

      //   // render();

      // } );

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

    // controllers

    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );
    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart );
    controller2.addEventListener( 'selectend', onSelectEnd );
    scene.add( controller2 );

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );


    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    // controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    // Tähän oma malli
    // model
    const loader = new GLTFLoader().setPath( 'gundy/' );
    loader.load( 'scene.gltf', async function ( gltf ) {

      const model = gltf.scene;

      // wait until the model can be added to the scene without blocking due to shader compilation

      await renderer.compileAsync( model, camera, scene );
      model.position.set(0, 0.1, 0);
      model.scale.set(0.003,0.003, 0.003);
      model.rotation.y = THREE.MathUtils.degToRad(180);
      model.rotation.x = THREE.MathUtils.degToRad(-36.5);
      // scene.add( model );
      controllerGrip2.add(model);

      // render();

    } );
    scene.add( controllerGrip2 );

    //

    const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

    const line = new THREE.Line( geometry );
    line.name = 'line';
    line.scale.z = 5;

    controller1.add( line.clone() );
    controller2.add( line.clone() );

    raycaster = new THREE.Raycaster();

    //
    function onSelectStart(event) {}
    function onSelectEnd(event) {}

    function onSelectStart( event ) {

      const controller = event.target;

      const intersections = getIntersections( controller );

      if ( intersections.length > 0 ) {

        const intersection = intersections[ 0 ];

        const object = intersection.object;
        object.material.emissive.b = 1;
        controller.attach( object );

        controller.userData.selected = object;

      }

      controller.userData.targetRayMode = event.data.targetRayMode;

    }

    function onSelectEnd( event ) {

      const controller = event.target;

      if ( controller.userData.selected !== undefined ) {

        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        group.attach( object );

        controller.userData.selected = undefined;

      }

    }

    function getIntersections( controller ) {

      controller.updateMatrixWorld();

      raycaster.setFromXRController( controller );

      return raycaster.intersectObjects( group.children, false );

    }

    function intersectObjects( controller ) {

      // Do not highlight in mobile-ar

      if ( controller.userData.targetRayMode === 'screen' ) return;

      // Do not highlight when already selected

      if ( controller.userData.selected !== undefined ) return;

      const line = controller.getObjectByName( 'line' );
      const intersections = getIntersections( controller );

      if ( intersections.length > 0 ) {

        const intersection = intersections[ 0 ];

        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push( object );

        line.scale.z = intersection.distance;

      } else {

        line.scale.z = 5;

      }

    }

    function cleanIntersected() {

      while ( intersected.length ) {

        const object = intersected.pop();
        object.material.emissive.r = 0;

      }

    }

    //


  }
    
}

renderer.setAnimationLoop( function () {

	renderer.render( scene, camera );

} );
  
function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  // render();

}

