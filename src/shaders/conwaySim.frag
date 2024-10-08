/////////////////////////////////////////////
// Conway's Game of Life simulation shader //
// Kalev Mölder     molder.kalev@gmail.com //
/////////////////////////////////////////////

//  game state is stored in framebuffer textures which are read and written to
//  from this shader
//
//  state layout in RGBA:
//      R: 0==dead, 1==alive
//      G: age 0.0 -> 1.0
//      B: ghost trail. 0.0 -> 1.0 trailing pixels that are left behind when cell dies
//      A: not used

varying vec2 vUv;

uniform vec4        uRandomVec; // random vec4 value at each frame

uniform sampler2D   uInputTex; // game of life state from previous render
uniform vec2        uInputTexSize; // state texture size in pixels

uniform float       uFrameNumber; // current simulation frame number

uniform int         uPlaceRandom; // set 1 to place random pattern on this frame

uniform sampler2D   uPatternTex; // texture containing some game of life patterns
uniform vec2        uPatternTexTiles; // number of tiles in the texture
uniform vec2        uPatternTexTileSize; // tile size in pixels

uniform int         uMouseDown; // 1 == mouse button held down
uniform vec2        uMousePos;  // mouse position in uv space

// convenience function that returns true if current cell is alive
bool isAlive(vec4 cellState){
    return cellState.r > 0.5;
}

/* 
    a matrix of relevant cell states.
    this structure stores the game state of 3 x 3 cells with
    current cell being in the center.

    the matrix layout:
        [0][1][2]
        [3][4][5]    <- 4 is the current cell
        [6][7][8]
*/
struct GameStateArea {
    vec4 states[9];
};

// reads current and adjecent cell states into the struct.
// this is meant to be used only once to avoid rereading the state
// in different functions.
GameStateArea getGameState(vec2 uv){
    GameStateArea stateArea;
    vec2 offset = vec2(1.0) / uInputTexSize;
    for(int y = -1; y <= 1; y++){
        for(int x = -1; x <= 1; x++){
            stateArea.states[(x+1) + (y+1)*3] = texture(
                uInputTex, 
                uv + vec2( float(x), float(y) ) * offset
            );
        }
    }
    return stateArea;
}

// convenience function to get the current cell from GameStateArea struct.
vec4 getCurrentState(GameStateArea stateArea){
    return stateArea.states[4]; // returning the center pixel
}

// returns the count of alive adjecent cells around the current cell.
int countAdjecentAlive(GameStateArea stateArea){
    int res = 0;
    for(int i = 0; i < 9; i++){
        if(i == 4){ continue; }
        if(isAlive(stateArea.states[i])){
            res++;
        }
    }
    return res;
}

// calculates the next state for current cell
// according to the rules of the Game of Life
// with one exception: too old cells die as well
vec4 simulate(vec4 inputState, GameStateArea stateArea){

    vec4 state = inputState;
    int adjecentCount = countAdjecentAlive(stateArea);

    if(isAlive(state)){ // currently alive cell
        if(adjecentCount < 2 || adjecentCount > 3){
            state.r = 0.0;
        }
    }else{ // currently dead cell
        if(adjecentCount == 3){
            state.r = 1.0;
        }
    }

    return state;
}

// it is best to run this every skipping one
// simulation frame. this way cells that
// regenerate very often, can also be aged.
vec4 simulateAge(vec4 inputState){
    vec4 state = inputState;
    if(isAlive(state)){
        state.g += 1.0 / 255.0; // incrementing age
        if(state.g >= 1.0){
            // killing the cell of old age
            state.r = 0.0;
        }
    }else{
        state.g = 0.0;
    }

    return state;
}

// picks a pattern tile from uPatternTex texture
// and places it to a random location in the game world
vec4 placeRandomPattern(vec4 inputState, vec2 uv, vec2 pos){
    vec4 state = inputState;
    vec4 R = uRandomVec;

    // chooses which sub-tile to use from pattern tex
    vec2 tileUVOffset = vec2(
        floor(R.z * uPatternTexTiles.x) / uPatternTexTiles.x,
        floor(R.w * uPatternTexTiles.y) / uPatternTexTiles.y
    );

    vec2 tileUV = ((uv - pos) * uInputTexSize) / uPatternTexTileSize;
    if(tileUV.x >= 0.0 && tileUV.x <= 1.0 && tileUV.y >= 0.0 && tileUV.y <= 1.0){
        vec2 subTileUV = tileUV / uPatternTexTiles;
        subTileUV += tileUVOffset;
        float pattern = texture(uPatternTex, subTileUV).r;
        state.r = pattern;
        state.g = 0.0;
    }

    return state;
}

void main(){
    vec4 outputState = vec4(0.0);

    // first frame renders 0.0 to make sure the buffer is empty
    if(uFrameNumber > 0.0){

        

        // reading the 3x3 state area
        GameStateArea inputStateArea = getGameState(vUv);

        outputState = getCurrentState(inputStateArea);
        // simulating game of life
        outputState = simulate(outputState, inputStateArea);

        if(uMouseDown == 1){
            // adding new patterns into the world
            // at mouse position but only every 5 frames
            // too much activity otherwise
            outputState = placeRandomPattern(outputState, vUv, uMousePos);
        }

        // simulating age for game of life
        outputState = simulateAge(outputState);

        // placing a random pattern tile periodically
        if(uPlaceRandom == 1){
            vec4 R = uRandomVec;
            vec2 pos = R.xy; // position where to place the pattern ( does not need to be pixel perfect. nearest filter will snap correctly )
            outputState = placeRandomPattern(outputState, vUv, pos);
        }
    }

    gl_FragColor = outputState;
}