import { GPGPU } from './gpgpu';
import conwayVert from './shaders/basic.vert?raw';
import conwaySimFrag from './shaders/conwaySim.frag?raw';
import patternTexUrl from './resources/patterns.png';

import { NearestFilter, ShaderMaterial, Texture, TextureLoader, WebGLRenderer } from "three";

export class Conway extends GPGPU{
    textureLoader : TextureLoader;
    texPatterns: Texture;

    /**
     * Simulates conway's Game of Life on the gpu
     * @description framebuffer data:
     * R: 0.0 == dead cell 1.0 == alive cell
     * G: 0.0 -> 1.0 cell age
     * B: unused
     * A: unused
     * @param renderer ThreeJS renderer to use
     * @param w data texture width
     * @param h data texture height
     */
    constructor(renderer:WebGLRenderer, w:number, h:number){
        // output geometry and material rendered in the main pass
        const mat = new ShaderMaterial({
            vertexShader: conwayVert,
            fragmentShader: conwaySimFrag,
            uniforms:{
                "uRandomVec":{value:[0.0, 0.0, 0.0, 0.0]},
                "uFrameNumber":{value:0},
                "uPatternTex":{value:null},
                "uPatternTexTiles":{value:[16, 1]},
                "uPatternTexTileSize":{value:[16,16]},
                "uInputTex":{value:null},
                "uInputTexSize":{value:[0,0]},
                "uMouseDown":{value:0},
                "uMousePos":{value:[0,0]}
            }
        });
        super(renderer, w, h, mat);

        // pattern texture containing 16 game of life
        // moving patterns
        this.textureLoader = new TextureLoader();
        this.texPatterns = this.textureLoader.load(patternTexUrl);
        this.texPatterns.magFilter = NearestFilter;
        this.texPatterns.minFilter = NearestFilter;

        this.material.uniforms["uPatternTex"].value = this.texPatterns;
    }

    setupUniforms(): void {
        // supplying random vec4 for the shader at every frame
        this.material.uniforms["uRandomVec"].value = [Math.random(),Math.random(), Math.random(), Math.random()];
    }

    afterRender():void{
        // no need for this shader
    }
}