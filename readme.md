# Conway's game of life computed on the GPU
A demonstration of simulating the game of life
using framebuffers and shaders.

Built using Vite, Typescript and ThreeJS.

## Running locally
    open the terminal
    clone the repo
    cd into the directory
    npm install
    npm run dev

## Description
Visuals consist of two main parts:
    Conway's Game of Life
    2D stylised water wave simulation

The game of life follows classic rules with one exeption. Alive cells also die of old age. This removes static looking patterns after a few frames to clean up the space.

There are some predefined patterns that are scattered into the game world at fixed interval. These are interesting mover patterns that will certainly collide with some other patterns creating chaos.

## interactivity
Holding down left mouse button adds life patterns at the cursor position in the game world. 