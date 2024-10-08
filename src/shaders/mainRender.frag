///////////////////////////////////////////////
// Rendering shader of Conway's Game of Life //
// Kalev Mölder       molder.kalev@gmail.com //
///////////////////////////////////////////////

// renders the input game of life and fluid sim
// state by coloring and shading.

precision highp float;

uniform sampler2D   uConwayStateTex; // conways game of life state
uniform sampler2D   uFluidStateTex; // fluid sim state (packed vec2)
uniform vec2        uTexSize;       // both state textures size

#define BYTE_SIZE 255.0

// unpacks input unsigned byte RGBA
// into vec2 with range 0.0 -> 1.0
vec2 unpackData(vec4 packedData){
    vec2 res = vec2(0.0);
    res.x = packedData.r + packedData.g / BYTE_SIZE;
    res.y = packedData.b + packedData.a / BYTE_SIZE;
    return res;
}

// convenience function to both unpack and sample
// the fluid sim texture. 
vec2 sampleFluidData(vec2 uv){
    return unpackData(texture(uFluidStateTex, uv)) * 2.0 - 1.0;
}

varying vec2 vUv;

/* 
    inverse interpolate 
    returns 0.0 -> 1.0 range
    from input value between minimum and maximum range
*/
float inverseInterpolate(float s, float minVal, float maxVal){
    float start = s - minVal;
    return clamp(start + start * (maxVal - minVal), 0.0, 1.0);
}

vec3 getFluidNormal(vec2 uv){
    vec3 n = vec3(0.0);
    float h00 = sampleFluidData(uv).x;
    float h10 = sampleFluidData(uv + vec2(1.0 / uTexSize.x, 0.0)).x;
    float h01 = sampleFluidData(uv + vec2(0.0, 1.0 / uTexSize.y)).x;
    n.x = h10 - h00;
    n.y = -(h01 - h00);
    n.z = 0.5;
    n = normalize(n);
    return n;
}

float getFluidShading(vec2 uv, vec3 lightDir){
    vec3 normal = getFluidNormal(uv);
    float res = 0.0;

    float d = max(0.0, dot(normal, lightDir));

    res += pow(d, 8.0);
    //res += pow(d, 256.0);

    return res;
}

void main(){
    vec4 conwayState = texture(uConwayStateTex, vUv);
    vec4 fluidState = texture(uFluidStateTex, vUv);
    vec2 unpackedFluid = unpackData(fluidState);
    vec4 outRGBA = vec4(0.0, 0.0, 0.0, 1.0);
    outRGBA.rgb = conwayState.rrr * (1.0 - conwayState.g);

    vec3 lightDir = normalize(vec3(0.1, -1.0, 3.0));

    vec3 fluidColor = mix(
        vec3(0.0, 0.3, 0.3),
        vec3(0.0, 0.5, 0.5),
        getFluidShading(vUv, lightDir)
    );

    outRGBA.rgb += fluidColor;

    gl_FragColor = outRGBA;
}