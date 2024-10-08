# Conway's game of life computed on the GPU
A demonstration of simulating the game of life
using framebuffers and shaders.

Built using Vite, Typescript and ThreeJS.

## Live demo
Can be viewed live at: http://files.tinkering.ee/lifesim/

## Running locally
    open the terminal
    git clone https://github.com/artkalev/lifeSim.git
    cd lifeSim
    npm install
    npm run dev
    navigate to the adress show in the terminal (usually http://localhost:5173/)

## Description
Visuals consist of two main parts:
    Conway's Game of Life
    2D stylised water wave simulation

The game of life follows classic rules with one exeption. Alive cells also die of old age. This removes static looking patterns after a few frames to clean up the space.

There are some predefined patterns that are scattered into the game world at fixed interval. These are interesting mover patterns that will collide with some other patterns creating chaos.

## interactivity
Life patterns can be "painted" both with mouse on pc or finger on mobile devices.