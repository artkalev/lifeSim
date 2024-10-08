/////////////////////////////////////////////
// Nonrealistic 2D fluid simulation shader //
// Kalev Mölder     molder.kalev@gmail.com //
/////////////////////////////////////////////

// simulates the next state of the water height.

// state data is packed as vec2 into the unsigned byte RGBA
// to increase simulation accuracy.

uniform int         uOnlyDiffuse; // only applies wave diffusion if set to 1

uniform sampler2D   uInputTex; // packed input state 
uniform vec2        uInputTexSize;  // input state size

uniform sampler2D   uConwayTex; // game of life state (readonly)

uniform int         uFrameNumber; // simulation frame number

varying vec2        vUv; // uv from vertex shader

// constant used in packing and unpacking
#define BYTE_SIZE 255.0

// unpacks input unsigned byte RGBA
// into vec2 with range 0.0 -> 1.0
vec2 unpackData(vec4 packedData){
    vec2 res = vec2(0.0);
    res.x = packedData.r + packedData.g / BYTE_SIZE;
    res.y = packedData.b + packedData.a / BYTE_SIZE;
    return res;
}

// packs input vec2 in range 0.0 -> 1.0
// into unsigned byte RGBA
vec4 packData(vec2 data){
    vec4 res = vec4(0.0);
    vec2 XY = data * BYTE_SIZE;    
    res.r = floor(XY.x) / BYTE_SIZE;
    res.g = fract(XY.x);
    res.b = floor(XY.y) / BYTE_SIZE;
    res.a = fract(XY.y);
    return res;
}

// gets unpacked averaged 3x3 pixel states
vec2 getAverageAdjecentState(vec2 uv){
    vec2 avg = vec2(0.0);
    vec2 offset = vec2(1.0) / uInputTexSize;
    for(int iy = -1; iy <= 1; iy++){
        for(int ix = -1; ix <= 1; ix++){
            vec2 s = unpackData(texture(uInputTex, uv + vec2(ix, iy) * offset)) * 2.0 -1.0;
            avg += s;
        }
    }
    return avg / 9.0;
}

// diffuses the wave "energy" into adjecent pixels
// this is run multiple times per frame by application.
vec2 diffuseWaves(vec2 inputState, vec2 uv){
    vec2 state = inputState;
    vec2 avg = getAverageAdjecentState(uv);
    if(abs(state.y) < abs(avg.y)){
        state.y = (state.y + avg.y*0.5) / 1.5;
    }
    return state;
}

// adds new waves for living cells in the game of life state.
// also makes waves oscillate and lose energy
vec2 simulateWave(vec2 inputState, vec4 conwayState){
    vec2 state = inputState;

    if(conwayState.r > 0.5){
        // maximum amplitude wave created when live cell is present
        state.x = 1.0;
        state.y = -1.0;
    }

    // tuned with the constants for specific
    // speed and behavior.
    state.x = mix(state.x, state.y, 0.7);
    if(abs(state.x - state.y) < 0.0001){ state.y = -state.y*0.6; }
    return state;
}

void main(){
    if(uOnlyDiffuse == 1){
        // diffusion is better to apply separately
        vec4 packedData = texture(uInputTex, vUv);
        vec2 unpackedData = unpackData(packedData)*2.0 - 1.0;
        vec2 outputState = diffuseWaves(unpackedData, vUv);
        vec4 repackedData = packData(outputState*0.5+0.5);
        gl_FragColor = repackedData;
    }else{
        if(uFrameNumber == 0){
            // initialize data for first frame
            gl_FragColor = vec4(packData(vec2(0.5, 0.5)));  
        }else{

            // apply simulation but no diffusion
            vec4 packedData = texture(uInputTex, vUv);
            vec4 conwayState = texture(uConwayTex, vUv);
            vec2 unpackedData = unpackData(packedData)*2.0 - 1.0;
            vec2 outputState = simulateWave(unpackedData, conwayState);
            outputState *= 0.99;
            vec4 repackedData = packData(outputState*0.5+0.5);
            gl_FragColor = repackedData;
        }
    }
}