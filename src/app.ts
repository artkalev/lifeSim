import { Conway } from './conway';
import { Fluid } from './fluid';
import { Mesh, ShaderMaterial, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderer } from 'three';

// shader code strings
import basicVert from './shaders/basic.vert?raw';
import mainRenderFrag from './shaders/mainRender.frag?raw';

/**
 * Main entry class that manages compute and rendering
 */
export class App{
  scene:Scene;
  renderer:WebGLRenderer;
  camera:OrthographicCamera;

  texSize:number[];
  conway:Conway;
  fluid:Fluid;

  /** quad mesh for full screen shader drawing */
  quadMesh:Mesh;
  /** final render material */
  quadMeshMaterial:ShaderMaterial;

  constructor(){

    this.scene = new Scene();
    this.renderer = new WebGLRenderer({
      preserveDrawingBuffer: true
    });
    this.renderer.autoClear = false;
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0);

    this.conway = new Conway(this.renderer, 512, 512);
    this.fluid = new Fluid(this.renderer, 512, 512, this.conway);
    this.texSize = [0,0];

    this.quadMeshMaterial = new ShaderMaterial(
      {
        vertexShader:basicVert,
        fragmentShader:mainRenderFrag,
        uniforms:{
          "uConwayStateTex":{value:null},
          "uFluidStateTex":{value:null},
          "uTexSize":{value:[0,0]}
        }
      }
    );
    this.quadMesh = new Mesh(
      new PlaneGeometry(2,2,1,1), 
      this.quadMeshMaterial
    );
    this.scene.add(this.quadMesh);

    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = "appCanvas";

    // adding mouse interaction to game of life

    this.renderer.domElement.addEventListener("mousedown", ()=>{
      this.conway.material.uniforms["uMouseDown"].value = 1;
      this.conway.material.needsUpdate = true;
    });

    this.renderer.domElement.addEventListener("mousemove", (e:MouseEvent)=>{
      this.conway.material.uniforms["uMousePos"].value = [
        (e.clientX-16.0) / (e.target as HTMLCanvasElement).clientWidth,
        1.0 - (e.clientY+16.0) / (e.target as HTMLCanvasElement).clientHeight
      ];
      this.conway.material.needsUpdate = true;
    });

    this.renderer.domElement.addEventListener("mouseup", ()=>{
      this.conway.material.uniforms["uMouseDown"].value = 0;
      this.conway.material.needsUpdate = true;
    });


    // adding touch support to game of life
    this.renderer.domElement.addEventListener("touchmove", (e:TouchEvent)=>{
      e.preventDefault();
      this.conway.material.uniforms["uMouseDown"].value = 1;
      this.conway.material.uniforms["uMousePos"].value = [
        (e.touches[0].clientX-16) / (e.target as HTMLCanvasElement).clientWidth,
        1.0 - (e.touches[0].clientY+16) / (e.target as HTMLCanvasElement).clientHeight
      ];
    },{passive:false, capture:true});

    this.renderer.domElement.addEventListener("touchend", ()=>{
      this.conway.material.uniforms["uMouseDown"].value = 0;
    },{passive:false});


    // resize support

    window.addEventListener("resize", ()=>{
      this.resize();
    });

    // doing initial resize to get right size at the start
    this.resize();
  }

  resize(){
    // setting rendering to half resolution to see the
    // game of life cells better
    const w = window.innerWidth / 2;
    const h = window.innerHeight / 2;
    this.texSize = [w, h];
    this.renderer.setSize(w, h);
    this.conway.resize(w, h);
    this.fluid.resize(w,h);
  }

  update(){

    // does the GPGPU compute
    this.conway.update();
    this.fluid.update();

    // renders the compute results
    this.quadMeshMaterial.uniforms["uConwayStateTex"].value = this.conway.getActiveTexture();
    this.quadMeshMaterial.uniforms["uFluidStateTex"].value = this.fluid.getActiveTexture();
    this.quadMeshMaterial.uniforms["uTexSize"].value = this.texSize;
    this.renderer.render(this.scene, this.camera);
  }
}