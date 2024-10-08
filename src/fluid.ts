import { ShaderMaterial, WebGLRenderer } from "three";
import basicVert from './shaders/basic.vert?raw';
import fluidSimFrag from './shaders/fluidSim.frag?raw';
import { GPGPU } from "./gpgpu";
import { Conway } from "./conway";

export class Fluid extends GPGPU{

    /** computed conway state to use */
    conway:Conway;

    /**
     * Simulates 2D wave propagation on the GPU
     * @description framebuffer data:
     * RG: packed float current wave height
     * BA: packed float wave target
     * 
     * @param width data texture width
     * @param height data texture height
     * @param conway input conway game state
     */
    constructor(renderer:WebGLRenderer, width:number, height:number, conway:Conway){
        const mat = new ShaderMaterial({
            uniforms:{
                uFrameNumber:{value:0},
                uInputTex:{value:null},
                uInputTexSize:{value:null},
                uConwayTex:{value:null},
                uOnlyDiffuse:{value:0}
            },
            vertexShader:basicVert,
            fragmentShader:fluidSimFrag
        })
        super(renderer, width, height, mat);
        this.conway = conway;
    }

    setupUniforms(): void {
        this.material.uniforms["uOnlyDiffuse"].value = 0;
        this.material.uniforms["uConwayTex"].value = this.conway.getActiveTexture();
    }

    afterRender(): void {
        // multiple passes to diffuse the waves more
        this.material.uniforms["uOnlyDiffuse"].value = 1;
        this.material.needsUpdate = true;
        for(let i = 0; i < 8; i++){
            this.swapBuffers();
            this.render();
        }
    }
}