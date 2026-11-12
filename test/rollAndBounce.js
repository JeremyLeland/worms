// Detour from walking to see if I can get proper bouncing and rolling
// I'm wondering if movement will end up being closer to this
//  - with some slight control at shallower slopes

import * as MaskMap from '../src/MaskMap.js';
import * as Worms from '../src/Worms.js';

import * as Collisions from '../src/common/Collisions.js';
import { GameCanvas } from '../src/common/GameCanvas.js';
import { KeyInput } from '../src/common/KeyInput.js';
import * as Util from '../src/common/Util.js';
import { vec2 } from '../lib/gl-matrix.js';

const Terrain = {
  Empty: 0,
  Dirt: 1,
  Rock: 2,
};

const map = MaskMap.create( 160, 120, 1 );

MaskMap.setTerrainCircle( map, 30, 30, 30, 0 );
MaskMap.setTerrainCircle( map, 80, 40, 60, 0 );
MaskMap.setTerrainCircle( map, 120, 60, 30, 0 );

MaskMap.setTerrainCircle( map, 40, 40, 10, 1 );
MaskMap.setTerrainCircle( map, 74, 50, 30, 1 );
MaskMap.setTerrainCircle( map, 100, 45, 20, 1 );

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 100, 90 ],
  vel: [ 0, 0 ],
  radius: 8,
  isMovingUp: false,
  isMovingLeft: false,
  isMovingDown: false,
  isMovingRight: false,
  isJumping: false,
  isShooting: false,
  isShootingRope: false,
  health: 100,
};

let debugInfo;

const Gravity = 0.0005;
const PlayerMoveSpeed = 0.03;
const PlayerJumpSpeed = 0.2; //0.1;
const PlayerRopeNudgeSpeed = 0.001;
const PlayerRopeLengthSpeed = 0.075;

const MoveMaxSlope = 1.3;
const GroundSnapDist = 1;

const BulletSpeed = 0.5;
const BulletRecoil = 0.01;
const RopeSpeed = 0.4;
const CasingSpeed = 0.1;
const CasingRotSpeed = 0.02;

const RopeSpringConstant = 0.0001;
const RopeSpringDamping = 0.01;     // Critical Damping: 2 * sqrt( k * m ), trying 0.5 * critical damping
const RopeSwingDamping = 0.001;

const mousePos = [ 20.4, 20 ];

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
  ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );
  ctx.drawImage( foregroundImage, 0, 0 );

  ctx.fillStyle = '#fff8';
  Util.drawPoint( ctx, player.pos, player.radius );

// }


  // gameCanvas.update = ( dt ) => {
  const dt = 10;

  // const moveDir = player.isMovingLeft ? -1 : player.isMovingRight ? 1 : 0;
  // player.vel[ 0 ] = moveDir * PlayerMoveSpeed;

  //
  // Forces
  //
  const GravityVec = vec2.fromValues( 0, Gravity );

  vec2.scaleAndAdd( player.vel, player.vel, GravityVec, dt )

  // vec2.scaleAndAdd( player.vel, player.vel, forces, dt );
  
  //
  // Rolling
  //
  let timeLeft = dt;

  for ( let step = 0; step < 2; step ++ ) {
    const closest = Worms.getTouch( map, player, GroundSnapDist );

    if ( closest.pos ) {
      // Snap to ground
      const groundNormal = vec2.sub( [], player.pos, closest.pos );
      vec2.normalize( groundNormal, groundNormal );

      const normalVelocity = vec2.dot( player.vel, groundNormal );

      console.log( 'normalVelocity', normalVelocity );

      if ( normalVelocity <= 0.1 ) {
        vec2.scaleAndAdd( player.pos, closest.pos, groundNormal, player.radius );

        if ( normalVelocity < 0 ) {
          vec2.scaleAndAdd( player.vel, player.vel, groundNormal, -normalVelocity );
        }

        if ( timeLeft <= 0 ) {
          break;
        }

        // const tangentDir = Math.sign( groundNormal[ 0 ] );  
        // const groundTangent = [ -tangentDir * groundNormal[ 1 ], tangentDir * groundNormal[ 0 ] ];

        // ctx.lineWidth = 0.2;
        // ctx.strokeStyle = 'cyan';
        // Util.drawLine( ctx, closest.pos, vec2.scaleAndAdd( [], closest.pos, groundTangent, timeLeft ) );

        // const gravityAlongSlope = vec2.dot( GravityVec, groundTangent );
        // const acceleration = gravityAlongSlope * ( 5 / 7 );   // "for a solid sphere rolling without slipping"

        ctx.strokeStyle = 'orange';
        Util.drawLine( ctx, closest.pos, vec2.scaleAndAdd( [], closest.pos, player.vel, 1000 ) );

        // const slope = Math.atan2( groundNormal[ 0 ], -groundNormal[ 1 ] );
        // const onGround = Math.abs( slope ) < Math.PI / 2;

        // vec2.scaleAndAdd( player.vel, player.vel, groundTangent, acceleration * timeLeft );
        vec2.scaleAndAdd( player.pos, player.pos, player.vel, timeLeft );
      }

      timeLeft -= dt;
    }
    else {
      vec2.scaleAndAdd( player.pos, player.pos, player.vel, timeLeft );
    }
  }

  ctx.fillStyle = '#fff';
  Util.drawPoint( ctx, player.pos, player.radius );

  // else {
  //   let timeLeft = dt;
  
  //   for ( let step = 0; step < 2; step ++ ) {
  //     const bestHit = Worms.getHit( map, player, timeLeft );

  //     if ( bestHit.time < Infinity ) {
  //       vec2.scaleAndAdd( player.pos, player.pos, player.vel, bestHit.time );

  //       // Left/Right wall
  //       if ( bestHit.line[ 0 ] === bestHit.line[ 2 ] ) {
  //         console.log( 'Hit left/right, stopping x movement' );
  //         player.vel[ 0 ] = 0;
  //       }

  //       // Ceiling/Floor
  //       else {
  //         // Floor
  //         if ( bestHit.line[ 0 ] < bestHit.line[ 2 ] ) {
  //           player.vel[ 1 ] = 0;  //player.isJumping ? -PlayerJumpSpeed : 0;
  //         }

  //         // Ceiling
  //         else {
  //           player.vel[ 1 ] = 0;
  //         }
  //       }

  //       timeLeft -= bestHit.time;
  //     }
  //     else {
  //       vec2.scaleAndAdd( player.pos, player.pos, player.vel, timeLeft );

  //       break;
  //     }
  //   }
  // }
}



const keyInput = new KeyInput( () => gameCanvas.redraw() );

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


function pointerInput( e ) {
  if ( e.buttons === 2 ) {
    player.pos[ 0 ] = gameCanvas.getX( e.x );
    player.pos[ 1 ] = gameCanvas.getY( e.y );
    vec2.set( player.vel, 0, 0 );

    gameCanvas.redraw();
  }
}

document.addEventListener( 'pointerdown', pointerInput );
document.addEventListener( 'pointermove', pointerInput );

// gameCanvas.start();
