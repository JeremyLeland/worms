// Test out walking up and down the sides of squares
// Test with big squares to make it clearer what's happening

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

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 92, 92 ],
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
const PlayerJumpSpeed = 0.1;
const PlayerRopeNudgeSpeed = 0.001;
const PlayerRopeLengthSpeed = 0.075;

const MoveMaxSlope = 1;
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

gameCanvas.update = ( dt ) => {

  const moveDir = player.isMovingLeft ? -1 : player.isMovingRight ? 1 : 0;

  player.vel[ 0 ] = moveDir * PlayerMoveSpeed;

  //
  // Forces
  //
  const forces = vec2.fromValues( 0, Gravity );

  vec2.scaleAndAdd( player.vel, player.vel, forces, dt );
  
  //
  // Walking
  //
  const closest = {
    dist: GroundSnapDist,
  };

  // Don't snap back if we're trying to jump
  if ( vec2.length( player.vel ) < PlayerJumpSpeed / 2 ) {
    const minX = player.pos[ 0 ] - player.radius;
    const minY = player.pos[ 1 ] - player.radius;
    const maxX = player.pos[ 0 ] + player.radius;
    const maxY = player.pos[ 1 ] + player.radius;
    
    const testLeft = Math.floor( minX - GroundSnapDist );
    const testTop  = Math.floor( minY - GroundSnapDist );
    const testRight = Math.floor( maxX + GroundSnapDist );
    const testBottom = Math.floor( maxY + GroundSnapDist );
    
    for ( let testRow = testTop; testRow <= testBottom; testRow ++ ) {
      for ( let testCol = testLeft; testCol <= testRight; testCol ++ ) {
        
        if ( MaskMap.getTerrain( map, testCol, testRow ) ) {
          
          const lines = [
            [ testCol, testRow + 1, testCol, testRow ],         // left
            [ testCol, testRow, testCol + 1, testRow ],         // top
            [ testCol + 1, testRow, testCol + 1, testRow + 1 ], // right
            [ testCol + 1, testRow + 1, testCol, testRow + 1 ], // bottom
          ];

          lines.forEach( line => {
            
            const [ x, y ] = player.pos;
            const [ x1, y1, x2, y2 ] = line;

            const px = x2 - x1;
            const py = y2 - y1;
            const D = ( px * px ) + ( py * py );

            const t = D === 0 ? 0 : Math.max( 0, Math.min( 1, ( ( x - x1 ) * px + ( y - y1 ) * py ) / D ) );

            const closestX = x1 + t * px;
            const closestY = y1 + t * py;

            const dist = Math.hypot( x - closestX, y - closestY ) - player.radius;

            if ( dist < closest.dist ) {
              closest.dist = dist;
              closest.pos = [ closestX, closestY ];
            }
          } );
        }
      }
    }
  }

  if ( closest.pos ) {
    // Snap to ground
    const norm = vec2.sub( [], player.pos, closest.pos );
    vec2.normalize( norm, norm );

    const slope = Math.atan2( norm[ 0 ], -norm[ 1 ] );
    const onGround = Math.abs( slope ) < Math.PI / 2;
    
    // Back out of any overlap, or snap if we're on ground
    if ( closest.dist < 0 || onGround ) {
      vec2.scaleAndAdd( player.pos, closest.pos, norm, player.radius );
    }

    if ( onGround ) { 
      const moveDir = player.isMovingLeft ? -1 : player.isMovingRight ? 1 : 0;
      
      // Move along slope
      // Make sure we can always go down a slope, just not up
      if ( -moveDir * slope < MoveMaxSlope ) {
        const moveVec = [ -moveDir * norm[ 1 ], moveDir * norm[ 0 ] ];
        
        vec2.scaleAndAdd( player.pos, player.pos, moveVec, PlayerMoveSpeed * dt );
        vec2.set( player.vel, 0, 0 );
      }
      
      if ( player.isJumping ) {
        vec2.set( player.vel, 0, -PlayerJumpSpeed );
      }
    }
    
  }
  else {
    let timeLeft = dt;
  
    for ( let step = 0; step < 2; step ++ ) {
      const bestHit = Worms.getHit( map, player, timeLeft );

      if ( bestHit.time < Infinity ) {
        vec2.scaleAndAdd( player.pos, player.pos, player.vel, bestHit.time );

        // Left/Right wall
        if ( bestHit.line[ 0 ] === bestHit.line[ 2 ] ) {
          player.vel[ 0 ] = 0;
        }

        // Ceiling/Floor
        else {
          // Floor
          if ( bestHit.line[ 0 ] < bestHit.line[ 2 ] ) {
            player.vel[ 1 ] = 0;  //player.isJumping ? -PlayerJumpSpeed : 0;
          }

          // Ceiling
          else {
            player.vel[ 1 ] = 0;
          }
        }

        timeLeft -= bestHit.time;
      }
      else {
        vec2.scaleAndAdd( player.pos, player.pos, player.vel, timeLeft );

        break;
      }
    }
  }
}

gameCanvas.draw = ( ctx ) => {
  ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );
  ctx.drawImage( foregroundImage, 0, 0 );

  // Worms.drawEntities( ctx, entities );

  ctx.fillStyle = '#fff6';
  Util.drawPoint( ctx, player.pos, player.radius );
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

gameCanvas.start();
