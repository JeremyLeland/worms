// Test out spring movement (for ninja rope)

import { GameCanvas } from '../../src/common/GameCanvas.js';
import { KeyInput } from '../../src/common/KeyInput.js';
import * as Collisions from '../../src/common/Collisions.js';
import * as Util from '../../src/common/Util.js';
import { vec2 } from '../../lib/gl-matrix.js';


let player = {
  type: 'player',
  pos: [ 30, 30 ],
  vel: [ 0, 0 ],
  rope: {
    pos: [ 100, 10 ],
    length: 50,
  },
  radius: 8,
  isMovingLeft: false,
  isMovingRight: false,
  isJumping: false,
  health: 100,
};

const debugInfo = {};

const Gravity = 0.0005;
const PlayerMoveSpeed = 0.03;
const PlayerJumpSpeed = 0.1;

const RopeSpringConstant = 0.00001;
const RopeSpringDamping = 0.001;

const RopeSwingDamping = 0.0005;

const mousePos = [ 20.4, 20 ];


const gameCanvas = new GameCanvas();
gameCanvas.setBounds( 0, 0, 320, 240 );

gameCanvas.update = ( dt ) => {


  player.vel[ 1 ] += Gravity * dt;

  const ropeVec = vec2.subtract( [], player.pos, player.rope.pos );
  const ropeDir = vec2.normalize( [], ropeVec );
  const ropeDist = vec2.length( ropeVec );

  const displacement = Math.max( 0, ropeDist - player.rope.length );
    
    const velocityAlongRope = vec2.dot( player.vel, ropeDir );

  const force = -RopeSpringConstant * displacement - RopeSpringDamping * velocityAlongRope;

  vec2.scaleAndAdd( player.vel, player.vel, ropeDir, force * dt );

  vec2.scale( player.vel, player.vel, Math.max( 0, 1 - RopeSwingDamping * dt ) );

  vec2.scaleAndAdd( player.pos, player.pos, player.vel, dt );


}

gameCanvas.draw = ( ctx ) => {

  ctx.fillStyle = 'green';
  Util.drawPoint( ctx, player.pos, player.radius );
  
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 0.4;
  Util.drawLine( ctx, player.pos, player.rope.pos );
}

const keyInput = new KeyInput();

keyInput.Keys = {
  PlayerLeft: 'a',
  PlayerRight: 'd',
  PlayerJump: ' ',
  ToggleUpdates: 'p',
};

keyInput.Actions = {
  PlayerLeft:   x => player.isMovingLeft = x,
  PlayerRight:  x => player.isMovingRight = x,
  PlayerJump:   x => player.isJumping = x,

  ToggleUpdates: x => { if ( x ) gameCanvas.toggle() },
};

document.addEventListener( 'pointerdown', pointerInput );
document.addEventListener( 'pointerup', pointerInput );
document.addEventListener( 'pointermove', pointerInput );

function pointerInput( e ) {
  vec2.set( mousePos, gameCanvas.getX( e.x ), gameCanvas.getY( e.y ) );

  if ( e.buttons === 1 ) {
    vec2.copy( player.rope.pos, mousePos );
  }
  else if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );
    vec2.set( player.vel, 0, 0 );

    console.log( 'moved to ', player.pos );
  }

  // gameCanvas.redraw();
}


gameCanvas.start();


