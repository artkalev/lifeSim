import { Mesh, NearestFilter, NoColorSpace, OrthographicCamera, PlaneGeometry, RepeatWrapping, RGBAFormat, Scene, ShaderMaterial, UnsignedByteType, WebGLRenderer, WebGLRenderTarget } from "three";

const rtGeo = new PlaneGeometry(2, 2, 1, 1);
const rtCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
rtCamera.position.set(0,0,1);

export abstract class GPGPU{
    /** 2 renderTargets that are switched between for reading and writing */
    renderTargets:WebGLRenderTarget[];
    width:number;
    height:number;
    activeRenderTarget:number;
    inactiveRenderTarget:number;
    frameNumber:number;

    /** main shader material that will compute the results */
    material:ShaderMaterial;
    /** ThreeJS renderer to use */
    renderer:WebGLRenderer;

    rtScene:Scene;
    rtMesh:Mesh;

    /**
     * Base class for gpu computed shader effects
     * @param renderer ThreeJS renderer to use
     * @param width width of the data texture
     * @param height height of the data texture
     * @param material shader material that is used for compute. 
     */
    constructor(renderer:WebGLRenderer, width:number, height:number, material:ShaderMaterial) {
        this.renderer = renderer;
        this.material = material;
        this.material.uniforms["uInputTex"] = {value:null};
        this.material.uniforms["uInputTexSize"] = {value:[0,0]};
        this.material.uniforms["uFrameNumber"] = {value:0};
        this.material.depthTest = false;
        this.renderTargets = [
            new WebGLRenderTarget(width, height, {
                magFilter:NearestFilter, minFilter:NearestFilter, 
                wrapS:RepeatWrapping, wrapT:RepeatWrapping,
                type:UnsignedByteType, format:RGBAFormat,
                colorSpace:NoColorSpace, depthBuffer:false
            }),
            new WebGLRenderTarget(width, height, {
                magFilter:NearestFilter, minFilter:NearestFilter,
                wrapS:RepeatWrapping, wrapT:RepeatWrapping,
                type:UnsignedByteType, format:RGBAFormat,
                colorSpace:NoColorSpace, depthBuffer:false
            })
        ];
        this.width = width;
        this.height = height;
        this.activeRenderTarget = 0;
        this.inactiveRenderTarget = 1;
        this.frameNumber = 0;

        this.rtScene = new Scene();
        this.rtMesh = new Mesh(rtGeo, this.material);
        this.rtScene.add(this.rtMesh);
    }

    /**
     * Setup uniform values here every frame before compute is executed
     */
    abstract setupUniforms():void;

    /**
     * Do any extra rendering passes here
     */
    abstract afterRender():void;

    resize(width:number, height:number){
        this.width = width;
        this.height = height;
        for(let i = 0; i < this.renderTargets.length; i++){
            this.renderTargets[i].setSize(this.width,this.height);
        }
    }

    render():void{
        this.renderer.setRenderTarget(this.renderTargets[this.activeRenderTarget]);
        this.renderer.render(this.rtScene, rtCamera);
        this.renderer.setRenderTarget(null);
    }

    /**
     * Swaps active and inactive framebuffer indices and sets the uInputTex uniform accordingly
     */
    swapBuffers():void{
        this.activeRenderTarget = this.activeRenderTarget == 0 ? 1 : 0;
        this.inactiveRenderTarget = this.activeRenderTarget == 0 ? 1 : 0;
        this.material.uniforms["uInputTex"].value = this.renderTargets[this.inactiveRenderTarget].texture;
        this.material.uniforms["uInputTexSize"].value = [this.width, this.height];
    }

    update(){
        this.swapBuffers();

        this.material.uniforms["uFrameNumber"].value = this.frameNumber;

        this.setupUniforms();
        this.material.needsUpdate = true;

        this.render(); 
        this.afterRender();

        this.frameNumber++;
    }

    getActiveTexture(){
        return this.renderTargets[this.activeRenderTarget].texture;
    }
}