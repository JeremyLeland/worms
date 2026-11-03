// Take into account areas above, below, and to sides of us
// Not just vertex...we care about some parts and not others
// Keep the idea, but be less focused on the vertex types?
// Also allow movement through air

import * as MaskMap from '../src/MaskMap.js';

import { GameCanvas } from '../src/common/GameCanvas.js';
import * as Util from '../src/common/Util.js';
import { vec2 } from '../lib/gl-matrix.js';

// const map = {
//   cols: 32,
//   rows: 24,
//   data: [
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,
//     1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,
//     1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,
//     1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,
//     1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,
//     1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,
//     1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,
//     1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//   ],
// };

const map = {
  cols: 64,
  rows: 48,
  data: [
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,0,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  ],
};

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 42.8, 37.6 ],
  vel: [ 0, 0 ],
  radius: 4,
  isMovingUp: false,
  isMovingLeft: false,
  isMovingDown: false,
  isMovingRight: false,
  isJumping: false,
  isShooting: false,
  isShootingRope: false,
  health: 100,
};

const PlayerMove = 0.1; // * dt 


const mousePos = [ 21, 20 ];

let entities = [ player ];


const backgroundImage = new OffscreenCanvas( map.cols, map.rows );
const backgroundCtx = backgroundImage.getContext( '2d' );
backgroundCtx.fillStyle = '#321';
backgroundCtx.fillRect( 0, 0, map.cols, map.rows );

const foregroundImage = new OffscreenCanvas( map.cols, map.rows );
const foregroundCtx = foregroundImage.getContext( '2d' );
foregroundCtx.fillStyle = 'rgb(200, 100, 20)';
foregroundCtx.fillRect( 0, 0, map.cols, map.rows );


const gameCanvas = new GameCanvas();
gameCanvas.setBounds( 0, 0, map.cols, map.rows );


gameCanvas.draw = ( ctx ) => {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, 0 );
  ctx.drawImage( foregroundImage, 0, 0 );

  
  ctx.lineWidth = 0.1;

  const minX = player.pos[ 0 ] - player.radius;
  const minY = player.pos[ 1 ] - player.radius;
  const maxX = player.pos[ 0 ] + player.radius;
  const maxY = player.pos[ 1 ] + player.radius;

  const left   = Math.round( minX );
  const top    = Math.round( minY );
  const right  = Math.round( maxX );
  const bottom = Math.round( maxY );

  const toLeft   = minX - left;
  const toTop    = minY - top
  const toRight  = right - maxX;
  const toBottom = bottom - maxY;

  let hasLeft = false;
  let hasTop = false;
  let hasRight = false;
  let hasBottom = false;

  ctx.strokeStyle = 'yellow';

  for ( let y = top; y < bottom && !hasLeft; y ++ ) {
    hasLeft = !!MaskMap.getTerrain( map, left - 1, y, ctx );
  }

  for ( let x = left; x < right && !hasTop; x ++ ) {
    hasTop = !!MaskMap.getTerrain( map, x, top - 1, ctx );
  }

  for ( let y = top; y < bottom && !hasRight; y ++ ) {
    hasRight = !!MaskMap.getTerrain( map, right, y, ctx );
  }

  for ( let x = left; x < right && !hasBottom; x ++ ) {
    hasBottom = !!MaskMap.getTerrain( map, x, bottom, ctx );
  }

  ctx.strokeStyle = 'cyan';

  const SW = MaskMap.getTerrain( map, left - 1, bottom, ctx );
  const SE = MaskMap.getTerrain( map, right, bottom, ctx );


  if ( player.isMovingLeft ) {
  
    // Climbing down long wall behind us (shouldn't happen in game, but enabling for testing)
    if ( hasRight && !hasBottom ) {
      console.log( `Climbing down long wall behind us (shouldn't happen in game, but enabling for testing)` );

      player.pos[ 0 ] += toRight;
      player.pos[ 1 ] += PlayerMove;
    }
    
    // Climbing down inner corner behind us
    else if ( hasRight && hasBottom /* && SE */ ) {
      console.log( `Climbing down inner corner behind us` );

      const moveDown = Math.max( 0, Math.min( toBottom, PlayerMove ) );

      if ( toBottom > 0 && toRight < toBottom ) {
        player.pos[ 0 ] += toRight;
        player.pos[ 1 ] += moveDown;
      }
      else {
        player.pos[ 0 ] -= Math.max( 0, toLeft );
        player.pos[ 1 ] += toBottom;
      }

      player.pos[ 0 ] -= PlayerMove - moveDown;
    }
    
    // Climbing up inner corner in front of us
    else if ( MaskMap.getTerrain( map, left - 1, bottom - 1, ctx ) && hasBottom /* && SW */ ) {
      console.log( `Climbing up inner corner in front of us` );

      const moveLeft = Math.max( 0, Math.min( toLeft, PlayerMove ) );

      // "toBottom < toLeft" handles where we're actually close to top
      if ( toLeft > 0 && toBottom < toLeft ) {
        player.pos[ 1 ] += toBottom;
        player.pos[ 0 ] -= moveLeft;
      }
      else {
        player.pos[ 0 ] -= toLeft;
        player.pos[ 1 ] -= Math.max( 0, toTop );
      }

      // only climb up if it's exactly 1 up
      let canClimbLeft = !hasTop;

      for ( let y = top; y < bottom - 1 && canClimbLeft; y ++ ) {
        canClimbLeft = !MaskMap.getTerrain( map, left - 1, y, ctx );
      }

      if ( canClimbLeft ) {
        player.pos[ 1 ] -= PlayerMove - moveLeft;
      }
    }

    // Climbing up over outer corner in front of us
    else if ( !hasLeft && !hasBottom && SW ) {
      console.log( `Climbing up over outer corner in front of us` );

      const moveUp = Math.max( 0, Math.min( toTop, PlayerMove ) );

      // "toBottom < toLeft" handles overlap
      if ( toTop > 0 && toBottom < toLeft ) {
        player.pos[ 0 ] -= toLeft;
        player.pos[ 1 ] -= moveUp;
      }
      else {
        player.pos[ 0 ] -= Math.max( 0, toLeft );
        player.pos[ 1 ] += toBottom;
      }

      player.pos[ 0 ] -= PlayerMove - moveUp;
    }

    // Starting over the edge of an outer corner behind us
    else if ( !hasRight && !hasBottom && SE ) {
      console.log( `Starting over the edge of an outer corner behind us` );

      const moveLeft = Math.max( 0, Math.min( toLeft, PlayerMove ) );

      if ( toLeft > 0 && toRight < toBottom ) {
        player.pos[ 0 ] -= moveLeft;
        player.pos[ 1 ] += toBottom;
      }
      else {
        player.pos[ 0 ] += toRight;
        player.pos[ 1 ] += Math.max( 0, toBottom );
      }

      // only climb down if it's exactly 1 down
      if ( MaskMap.getTerrain( map, right - 1, bottom + 1, ctx ) ) {
        player.pos[ 1 ] += PlayerMove - moveLeft;
      }
    }

    else {
      console.log( `Moving left` );

      // Flat floor
      if ( hasBottom ) {
        player.pos[ 1 ] += toBottom;
      }

      const moveLeft = hasLeft ? Math.max( 0, Math.min( toLeft, PlayerMove ) ) : PlayerMove;
      player.pos[ 0 ] -= moveLeft;
    }
  }
  else if ( player.isMovingRight ) {

    // Climbing down long wall behind us (shouldn't happen in game, but enabling for testing)
    if ( hasLeft && !hasBottom ) {
      player.pos[ 0 ] -= toLeft;
      player.pos[ 1 ] += PlayerMove;
    }

    // Climbing down inner corner behind us
    else if ( hasLeft && hasBottom /* && SW */ ) {
      const moveDown = Math.max( 0, Math.min( toBottom, PlayerMove ) );

      if ( toBottom > 0 && toLeft < toBottom ) {
        player.pos[ 0 ] -= toLeft;
        player.pos[ 1 ] += moveDown;
      }
      else {
        player.pos[ 0 ] += Math.max( 0, toRight );
        player.pos[ 1 ] += toBottom;
      }

      player.pos[ 0 ] += PlayerMove - moveDown;
    }

    // Climbing up inner corner in front of us
    else if ( MaskMap.getTerrain( map, right, bottom - 1, ctx ) && hasBottom /* && SE */ ) {
      const moveRight = Math.max( 0, Math.min( toRight, PlayerMove ) );

      if ( toRight > 0 && toBottom < toRight ) {
        player.pos[ 1 ] += toBottom;
        player.pos[ 0 ] += moveRight;
      }
      else {
        player.pos[ 0 ] += toRight;
        player.pos[ 1 ] -= Math.max( 0, toTop );
      }

      // only climb up if it's exactly 1 up
      let canClimbRight = !hasTop;

      for ( let y = top; y < bottom - 1 && canClimbRight; y ++ ) {
        canClimbRight = !MaskMap.getTerrain( map, right, y, ctx );
      }

      if ( canClimbRight ) {
        player.pos[ 1 ] -= PlayerMove - moveRight;
      }
    }

    // Climbing up over outer corner in front of us
    else if ( !hasRight && !hasBottom && SE ) {
      const moveUp = Math.max( 0, Math.min( toTop, PlayerMove ) );

      // "toBottom < toRight" handles overlap
      if ( toTop > 0 && toBottom < toRight ) {
        player.pos[ 0 ] += toRight;
        player.pos[ 1 ] -= moveUp;
      }
      else {
        player.pos[ 0 ] += Math.max( 0, toRight );
        player.pos[ 1 ] += toBottom;
      }

      player.pos[ 0 ] += PlayerMove - moveUp;
    }

    // Starting over the edge of an outer corner behind us
    else if ( !hasLeft && !hasBottom && SW ) {
      const moveRight = Math.max( 0, Math.min( toRight, PlayerMove ) );

      if ( toRight > 0 && toLeft < toBottom ) {
        player.pos[ 0 ] += moveRight;
        player.pos[ 1 ] += toBottom;
      }
      else {
        player.pos[ 0 ] -= toLeft;
        player.pos[ 1 ] += Math.max( 0, toBottom );
      }

      // only climb down if it's exactly 1 down
      if ( MaskMap.getTerrain( map, left, bottom + 1, ctx ) ) {
        player.pos[ 1 ] += PlayerMove - moveRight;
      }
    }

    else {  
      // Flat floor
      if ( hasBottom ) {
        player.pos[ 1 ] += toBottom;
      }
      
      const moveRight = hasRight ? Math.max( 0, Math.min( toRight, PlayerMove ) ) : PlayerMove;
      player.pos[ 0 ] += moveRight;
    }
  }

  ctx.fillStyle = '#aaaa';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );

  ctx.fillStyle = ctx.strokeStyle = 'white';
  Util.drawLine( ctx, [ minX, minY ], [ left, top ] );
  Util.drawLine( ctx, [ maxX, minY ], [ right, top ] );
  Util.drawLine( ctx, [ minX, maxY ], [ left, bottom ] );
  Util.drawLine( ctx, [ maxX, maxY ], [ right, bottom ] );

  Util.drawPoint( ctx, [ left, top ], 0.1 );
  Util.drawPoint( ctx, [ right, top ], 0.1 );
  Util.drawPoint( ctx, [ left, bottom ], 0.1 );
  Util.drawPoint( ctx, [ right, bottom ], 0.1 );

  player.isMovingLeft = false;
  player.isMovingRight = false;
}

document.addEventListener( 'keydown', e => {
  player.isMovingLeft = e.key == 'a';
  player.isMovingRight = e.key == 'd';

  gameCanvas.redraw();
} );

function pointerInput( e ) {
  mousePos[ 0 ] = gameCanvas.getX( e.x );
  mousePos[ 1 ] = gameCanvas.getY( e.y );

  if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );
    
    gameCanvas.redraw();
  }
}

document.addEventListener( 'pointermove', pointerInput );
document.addEventListener( 'pointerdown', pointerInput );
