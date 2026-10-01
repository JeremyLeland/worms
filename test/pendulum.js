// Test out spring movement (for ninja rope)

import { GameCanvas } from '../src/common/GameCanvas.js';
import { KeyInput } from '../src/common/KeyInput.js';
import * as Collisions from '../src/common/Collisions.js';
import * as Util from '../src/common/Util.js';
import { vec2 } from '../lib/gl-matrix.js';


let player = {
  type: 'player',
  pos: [ 30, 30 ],
  vel: [ 0, 0 ],
  rope: {
    pos: [ 100, 10 ],
    length: 50,
  },
  radius: 8,
  isMovingUp: false,
  isMovingLeft: false,
  isMovingDown: false,
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
  let ropeSpeed = 0;

  // TODO: Use tanh here to deal with cases where we are close to min/max length?
  if ( player.isMovingUp && player.rope.length > 10 ) {
    ropeSpeed = -0.1;
  }
  else if ( player.isMovingDown && player.rope.length < 200 ) {
    ropeSpeed = 0.1;
  }

  player.rope.length += ropeSpeed * dt;

  player.vel[ 1 ] += Gravity * dt;

  const ropeVec = vec2.subtract( [], player.pos, player.rope.pos );
  // const ropeDir = vec2.normalize( [], ropeVec );
  const ropeDist = vec2.length( ropeVec );

  if ( ropeDist > player.rope.length ) {
    const ropeDir = vec2.scale( [], ropeVec, 1 / ropeDist );  // cheaper than normalize?

    // Put the player exactly on the rope (so we can shorten it up)
    vec2.scaleAndAdd(
      player.pos,
      player.rope.pos,
      ropeDir,
      player.rope.length
    );

    // Radial velocity required by changing rope
    const radialVelocity = vec2.dot( player.vel, ropeDir );   // velocity along rope
    const radialError = radialVelocity - ropeSpeed;           // minus the amount needed to change rope size

    vec2.scaleAndAdd( player.vel, player.vel, ropeDir, -radialError );
    
    // Damping of swinging motion (just the tangential component of movement)
    const tangentX = -ropeDir[ 1 ];
    const tangentY = ropeDir[ 0 ];
    const tangentialVelocity = player.vel[ 0 ] * tangentX + player.vel[ 1 ] * tangentY;
    const damping = Math.max( 0, 1 - RopeSwingDamping * dt );

    const newTangentialVelocity = tangentialVelocity * damping;

    player.vel[ 0 ] = ropeDir[ 0 ] * ropeSpeed + tangentX * newTangentialVelocity;
    player.vel[ 1 ] = ropeDir[ 1 ] * ropeSpeed + tangentY * newTangentialVelocity;
  }

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
  PlayerUp: 'w',
  PlayerLeft: 'a',
  PlayerDown: 's',
  PlayerRight: 'd',
  PlayerJump: ' ',
  ToggleUpdates: 'p',
};

keyInput.Actions = {
  PlayerUp:     x => player.isMovingUp = x,
  PlayerLeft:   x => player.isMovingLeft = x,
  PlayerDown:   x => player.isMovingDown = x,
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


