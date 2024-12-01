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


// create a new empty group to include imported models you want to interact with
let group = new THREE.Group();
group.name = 'Interaction-Group';


// initialize marker for teleport and referencespace of headset
// initialize the INTERSECTION array for teleport
let marker, baseReferenceSpace;
let INTERSECTION;
// create a new empty group to include imported models you want
// to teleport with
let teleportgroup = new THREE.Group();
teleportgroup.name = 'Teleport-Group';



init();

function init() {
  const container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 200 );
  camera.position.set(10, 3, 2 );
  // camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  
  // add the group to the scenne
  scene.add(group);

  // add the empty group to the scene
  scene.add(teleportgroup);

  marker = new THREE.Mesh(
    new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x808080 })
  );
  scene.add(marker);

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.shadowMap.enabled = true; // turn on shadows in the renderer
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
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

  // Add directional light 
  const light = new THREE.DirectionalLight( 0xffffff, 1.5 );
  light.position.set( 15, 15, 15 ); //default 0 1 0; light shining from top
  
  light.castShadow = true; // default false
  scene.add( light );

  //Set up shadow properties for the light
  light.shadow.mapSize.width = 4096; // default 512
  light.shadow.mapSize.height = 4096; // default 512
  light.shadow.camera.near = 0.5; // default 0.5
  light.shadow.camera.far = 500; // default 500

  light.shadow.camera.top = 200;
  light.shadow.camera.bottom = - 200;
  light.shadow.camera.left = - 200;
  light.shadow.camera.right = 200;
  light.shadow.normalBias = 1;

  // //Create a sphere that cast shadows (but does not receive them)
  // const sphereGeometry = new THREE.SphereGeometry( 5, 32, 32 );
  // const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
  // const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
  // sphere.castShadow = true; //default is false
  // sphere.receiveShadow = false; //default
  // scene.add( sphere );

  // //Create a plane that receives shadows (but does not cast them)
  // const planeGeometry = new THREE.PlaneGeometry( 20, 20, 32, 32 );
  // const planeMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } )
  // const plane = new THREE.Mesh( planeGeometry, planeMaterial );
  // plane.receiveShadow = true;
  // scene.add( plane );

  const helper = new THREE.DirectionalLightHelper( light, 5 );
  scene.add( helper );

  // document.body.appendChild( VRButton.createButton( renderer ) );


   
  new RGBELoader()
    .setPath( 'hdr/' )
    .load( 'meadow_2_1k.hdr', function ( texture ) {

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      // render();

      // model
      const loader = new GLTFLoader().setPath( 'gltf/' );
      loader.load( 'lowpolyworld-empty-land.glb', async function ( gltf ) {

        const model = gltf.scene;
        gltf.scene.traverse(function (node) {
          if (node.material) {
            node.material.side = THREE.FrontSide;
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // wait until the model can be added to the scene without blocking due to shader compilation

        await renderer.compileAsync( model, camera, scene );

        teleportgroup.add( model );

        // render();

      } );

      loader.load( 'lowpolyworld-interactions.glb', async function ( gltf ) {

        const model = gltf.scene;

        gltf.scene.traverse(function (node) {
          if (node.material) {
            node.material.side = THREE.FrontSide;
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // wait until the model can be added to the scene without blocking due to shader compilation

        await renderer.compileAsync( model, camera, scene );

        group.add( model );

        // render();

      } );

      loader.load( 'bottle/WaterBottle.gltf', async function ( gltf ) {

        const bottle = gltf.scene;
        bottle.name = 'Bottle';
        bottle.scale.set(10, 10, 10);
        bottle.position.set( 10, 1.25, -3);
     
        gltf.scene.traverse(function (node) {
          if (node.material) {
            node.material.side = THREE.FrontSide;
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // wait until the model can be added to the scene without blocking due to shader compilation

        await renderer.compileAsync( bottle, camera, scene );

        group.add( bottle );

        // render();

      });

   

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


    renderer.xr.addEventListener(
      'sessionstart',
      () => (baseReferenceSpace = renderer.xr.getReferenceSpace())
    );

      
    // controllers
    

    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );

    // Add now the listeners for the squeezebuttons.
    controller1.addEventListener('squeezestart', onSqueezeStart);
    controller1.addEventListener('squeezeend', onSqueezeEnd);

    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart );
    controller2.addEventListener( 'selectend', onSelectEnd );

    controller2.addEventListener('squeezestart', onSqueezeStart);
    controller2.addEventListener('squeezeend', onSqueezeEnd);

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
      model.rotation.y = THREE.MathUtils.degToRad(180);
      model.rotation.x = THREE.MathUtils.degToRad(-36.5);
      model.position.set(0, 0.01, 0);
      model.scale.set(0.0003,0.0003, 0.0003);

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

    function onSqueezeStart() {
      this.userData.isSqueezing = true;
      console.log('Controller squeeze started');
    }
    function onSqueezeEnd() {
      this.userData.isSqueezing = false;
      console.log('Controller squeeze ended');
      if (INTERSECTION) {
        const offsetPosition = {
        x: -INTERSECTION.x,
        y: -INTERSECTION.y,
        z: -INTERSECTION.z,
        w: 1,
        };
        const offsetRotation = new THREE.Quaternion();
        const transform = new XRRigidTransform(offsetPosition, offsetRotation);
        const teleportSpaceOffset =
       baseReferenceSpace.getOffsetReferenceSpace(transform);
        renderer.xr.setReferenceSpace(teleportSpaceOffset);
      }
    }

    
  }


  console.log(scene);
}
//
// function onSelectStart(event) {}
// function onSelectEnd(event) {}

function onSelectStart( event ) {

  const controller = event.target;

  const intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ];

    const object = intersection.object;


    
    // // Traverse up the parent hierarchy
    // while (!modelarray.includes(object.name)) {
    //   object = object.parent;
    //   // Check if the parent's name matches any in the array
    //   if (modelarray.includes(object.name)) {
    //     // If a match is found, select this parent object
    //     console.log('Parent found:', object.name);
    //     break; // Stop traversing further once we find the correct parent
    //   }
    // }
    

    // object.material.emissive.b = 1;
    controller.attach( object );

    controller.userData.selected = object;

  }

  controller.userData.targetRayMode = event.data.targetRayMode;

}

function onSelectEnd( event ) {

  const controller = event.target;

  if ( controller.userData.selected !== undefined ) {

    const object = controller.userData.selected;
    // object.material.emissive.b = 0;
    group.attach( object );

    controller.userData.selected = undefined;

  }

}

function getIntersections( controller ) {

  controller.updateMatrixWorld();

  raycaster.setFromXRController( controller );

  // return raycaster.intersectObjects( group.children, false );
  return raycaster.intersectObjects(group.children, true);
  // return raycaster.intersectObjects(scene.children, true);


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
    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = true;
        node.material.opacity = 0.5;
      }
    });

    // object.material.emissive.r = 1;
    intersected.push( object );

    line.scale.z = intersection.distance;

  } else {

    line.scale.z = 5;

  }

}

function cleanIntersected() {

  while ( intersected.length ) {

    const object = intersected.pop();
    // object.material.emissive.r = 0;

    // tähän koodi
    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = false;
        node.material.opacity = 1;
      }
    });
  }

}

//

renderer.setAnimationLoop( function () {

  cleanIntersected();
  moveMarker();
  intersectObjects(controller1);
  intersectObjects(controller2);
  // controls.update();

	renderer.render( scene, camera );

} );

function moveMarker() {
  INTERSECTION = undefined;
  if (controller1.userData.isSqueezing === true) {
    tempMatrix.identity().extractRotation(controller1.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    //const intersects = raycaster.intersectObjects([floor]);
    const intersects = raycaster.intersectObjects(teleportgroup.children, true);
    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
      console.log(intersects[0]);
      console.log(INTERSECTION);
    }
  } else if (controller2.userData.isSqueezing === true) {
    tempMatrix.identity().extractRotation(controller2.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    // const intersects = raycaster.intersectObjects([floor]);
    const intersects = raycaster.intersectObjects(teleportgroup.children, true);
    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
    }
  }
  if (INTERSECTION) marker.position.copy(INTERSECTION);
  marker.visible = INTERSECTION !== undefined;
}
  
function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  // render();

}

