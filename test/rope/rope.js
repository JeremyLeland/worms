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
  radius: 10,
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

const RopeSpringConstant = 0.0001;

// Critical Damping: 2 * sqrt( k * m )
const RopeSpringDamping = 0.5 * 2 * Math.sqrt( RopeSpringConstant )   // assume mass of 1


const RopeSwingDamping = 0.0002;

const mousePos = [ 20.4, 20 ];


const gameCanvas = new GameCanvas();
gameCanvas.setBounds( 0, 0, 320, 240 );

gameCanvas.update = ( dt ) => {

  // debugInfo.strings = [];

  //
  // Change rope length
  //
  let ropeSpeed = 0;

  // TODO: Use tanh here to deal with cases where we are close to min/max length?
  if ( player.isMovingUp && player.rope.length > 10 ) {
    ropeSpeed = -0.1;
  }
  else if ( player.isMovingDown && player.rope.length < 200 ) {
    ropeSpeed = 0.1;
  }

  player.rope.length += ropeSpeed * dt;

  // debugInfo.strings.push( `ropeSpeed: ${ ropeSpeed }` );
  // debugInfo.strings.push( `ropeLength: ${ player.rope.length }` );

  //
  // Apply forces
  //

  const forces = vec2.fromValues( 0, Gravity );

  const ropeVec = vec2.subtract( [], player.pos, player.rope.pos );
  // const ropeDir = vec2.normalize( [], ropeVec );
  const ropeDist = vec2.length( ropeVec );

  // debugInfo.strings.push( `ropeDist: ${ ropeDist }` );

  if ( ropeDist > 0 ) {
    const ropeDir = vec2.scale( [], ropeVec, 1 / ropeDist );  // cheaper than normalize?

    const velocityAlongRope = vec2.dot( player.vel, ropeDir );
    const radialError = velocityAlongRope - ropeSpeed;

    if ( ropeDist > player.rope.length ) {
      // Damped spring: F = -kx - cv
      const displacement = Math.max( 0, ropeDist - player.rope.length );
      const springForce = -RopeSpringConstant * displacement - RopeSpringDamping * radialError;
      
      vec2.scaleAndAdd( forces, forces, ropeDir, springForce );
    }

    const radialVelocity = vec2.scale( [], ropeDir, velocityAlongRope );    // TODO: or radialError?
    const tangentialVelocity = vec2.subtract( [], player.vel, radialVelocity );

    // debugInfo.strings.push( `radialVelocity: ${ radialVelocity }` );
    // debugInfo.strings.push( `tangentialVelocity: ${ tangentialVelocity }` );

    vec2.scaleAndAdd( forces, forces, tangentialVelocity, -RopeSwingDamping );
  }

  // debugInfo.strings.push( `forces: ${ forces }` );

  vec2.scaleAndAdd( player.vel, player.vel, forces, dt );
  vec2.scaleAndAdd( player.pos, player.pos, player.vel, dt );
}

gameCanvas.draw = ( ctx ) => {

  ctx.fillStyle = 'green';
  Util.drawPoint( ctx, player.pos, player.radius );
  
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 0.4;
  Util.drawLine( ctx, player.pos, player.rope.pos );

  ctx.font = '6px Arial';
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';  // top, hanging, middle, alphabetic, ideographic, bottom
  ctx.textAlign = 'left';      // left, right, center, start, end

  // debugInfo.strings.forEach( ( string, index ) => {
  //   ctx.fillText( string, 0, index * 6 );
  // } );

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
    player.rope.length = vec2.distance( player.pos, player.rope.pos );
  }
  else if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );
    vec2.set( player.vel, 0, 0 );

    console.log( 'moved to ', player.pos );

    player.rope.length = vec2.distance( player.pos, player.rope.pos );
  }

  // gameCanvas.redraw();
}


gameCanvas.start();


