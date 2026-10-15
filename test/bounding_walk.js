// Test out walking up and down the sides of squares
// Test with big squares to make it clearer what's happening
// And try it with bounding boxes to get rid of that stupid literal corner case

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

const map = MaskMap.create( 32, 24, Terrain.Dirt );

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 14, 12 ],
  vel: [ 0, 0 ],
  radius: 2,
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

const Gravity = 0.00005;
const PlayerMoveSpeed = 0.003;
const PlayerJumpSpeed = 0.1;
const PlayerRopeNudgeSpeed = 0.001;
const PlayerRopeLengthSpeed = 0.075;


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


MaskMap.setTerrainRect( map, 5, 8, 20, 5, Terrain.Empty );
MaskMap.setTerrainRect( map, 2, 10, 25, 6, Terrain.Empty );
MaskMap.setTerrainRect( map, 5, 7, 4, 6, Terrain.Empty );
// MaskMap.setTerrainRect( map, 20, 4, 8, 15, Terrain.Empty );
MaskMap.setTerrainRect( map, 15, 4, 8, 15, Terrain.Empty );

// MaskMap.setTerrainRect( map, 10, 16, 10, 1, Terrain.Empty );
// MaskMap.setTerrainRect( map, 15, 17, 5, 1, Terrain.Empty );


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

const touchFunc = ( entity, line ) => Collisions.boxDistToLine( ...entity.pos, entity.radius, ...line );
const hitFunc = ( entity, line ) => Collisions.timeToBoxHitLine( ...entity.pos, ...entity.vel, entity.radius, ...line );

gameCanvas.update = ( dt ) => {
  debugInfo = {};

  const newEntities = [];

  entities.forEach( entity => {

    

    // if ( entity.isMovingLeft ) {
    //   entity.vel[ 0 ] = -PlayerMoveSpeed;
    // }
    // else if ( entity.isMovingRight ) {
    //   entity.vel[ 0 ] = PlayerMoveSpeed;
    // }
    // else {
    //   entity.vel[ 0 ] = 0;
    // }

    //
    // See if we should be attached to a wall/floor first?
    //
    const x = player.pos[ 0 ];
    const y = player.pos[ 1 ];
    const r = player.radius;
    const minX = x - r;
    const maxX = x + r;
    const minY = y - r;
    const maxY = y + r;
  
    const best = {
      dist: Infinity,
    };
  
    const testLeft   = Math.floor( minX - 1 );
    const testTop    = Math.floor( minY - 1 );
    const testRight  = Math.floor( maxX + 1 );
    const testBottom = Math.floor( maxY + 1 );
  
    for ( let testRow = testTop; testRow <= testBottom; testRow ++ ) {
      for ( let testCol = testLeft; testCol <= testRight; testCol ++ ) {
  
        if ( map.data[ testCol + testRow * map.cols ] !== 0 ) {
          if ( minY < testRow + 1 && testRow < maxY ) {
            if ( testCol < x ) {
              const xDist = minX - ( testCol + 1 );
              
              if ( Math.abs( xDist ) < Math.abs( best.dist ) ) {
                best.dist = xDist;
                best.normal = [ 1, 0 ];
              }
            }
            else {
              const xDist = testCol - maxX;
              
              if ( Math.abs( xDist ) < Math.abs( best.dist ) ) {
                best.dist = xDist;
                best.normal = [ -1, 0 ];
              }
            }
          }
  
          if ( minX < testCol + 1 && testCol < maxX ) {
            if ( testRow < y ) {
              const yDist = minY - ( testRow + 1 );
              
              if ( Math.abs( yDist ) < Math.abs( best.dist ) ) {
                best.dist = yDist;
                best.normal = [ 0, 1 ];
              }
            }
            else {
              const yDist = testRow - maxY;
  
              if ( Math.abs( yDist ) < Math.abs( best.dist ) ) {
                best.dist = yDist;
                best.normal = [ 0, -1 ];
              }
            }
          }
        }
      }
    }

    const moveDir = entity.isMovingLeft ? -1 : entity.isMovingRight ? 1 : 0;

    if ( best.dist < 0.5 && best.normal[ 1 ] <= 0 ) {
      vec2.scaleAndAdd( entity.pos, entity.pos, best.normal, -best.dist );

      const moveVec = [ -moveDir * best.normal[ 1 ], moveDir * best.normal[ 0 ] ];

      vec2.scale( entity.vel, moveVec, PlayerMoveSpeed );
    }
    else {
      const forces = vec2.fromValues( 0, Gravity );
      
      vec2.scaleAndAdd( entity.vel, entity.vel, forces, dt );

      vec2.scaleAndAdd( entity.vel, entity.vel, [ moveDir, 0 ], PlayerMoveSpeed );

    }


    //
    // Apply forces
    //
    
    // const forces = vec2.fromValues( 0, Gravity );
    
    // vec2.scaleAndAdd( entity.vel, entity.vel, forces, dt );

    let timeLeft = dt;

    // console.log();

    for ( let step = 0; step < 2; step ++ ) {

      const bestHit = Worms.getHit( map, entity, timeLeft, hitFunc );

      if ( bestHit.time < Infinity ) {
        // console.log( bestHit );

        debugInfo.bestHit = bestHit;

        vec2.scaleAndAdd( entity.pos, entity.pos, entity.vel, bestHit.time );

        // Move out of collision a bit?
        //  - lets us fall, but not climb
        // vec2.scaleAndAdd( entity.pos, entity.pos, bestHit.norm, 0.01 );

        // Walk along edge

        // const moveDir = entity.isMovingLeft ? -1 : entity.isMovingRight ? 1 : 0;
        // const moveVec = [ -moveDir * bestHit.norm[ 1 ], moveDir * bestHit.norm[ 0 ] ];

        // debugInfo.moveVec = moveVec;

        // vec2.scale( entity.vel, moveVec, PlayerMoveSpeed );

        // console.log( `after step ${ step }, player vel `, player.vel );

        // Left/Right wall
        if ( bestHit.line[ 0 ] === bestHit.line[ 2 ] ) {
          // Climb wall if it's only 1 tall
          //  - if we're moving left, the line we hit is at testX + 1
          //  - use the correct bestHit.line y based on orientation
          // const testCol = Math.floor( bestHit.line[ 0 ] ) + ( entity.vel[ 0 ] < 0 ? -1 : 0 );
          // const testRow = Math.floor( bestHit.line[ entity.vel[ 0 ] < 0 ? 1 : 3 ] ) - 1;

          // if ( 0 <= testRow && map.data[ testCol + testRow * map.cols ] == Terrain.Empty ) {
            entity.vel[ 1 ] = -PlayerMoveSpeed;   // TOOD: slower as we get toward top so we don't "hop" so much?
          // }

          entity.vel[ 0 ] = 0;  //entity.isMovingLeft ? -PlayerMoveSpeed : entity.isMovingRight ? PlayerMoveSpeed : 0;
          
          console.log( 'wall' );

        }

        // Ceiling/Floor
        else {
          // Floor
          if ( bestHit.line[ 0 ] < bestHit.line[ 2 ] ) {
            entity.vel[ 0 ] = entity.isMovingLeft ? -PlayerMoveSpeed : entity.isMovingRight ? PlayerMoveSpeed : 0;
            entity.vel[ 1 ] = entity.isJumping ? -PlayerJumpSpeed : 0;

            console.log( 'floor' );

          }

          // Ceiling
          else {
            entity.vel[ 1 ] = 0;
          }
        }

        timeLeft -= bestHit.time;

        
      }
      else {
        vec2.scaleAndAdd( entity.pos, entity.pos, entity.vel, timeLeft );

        break;
      }
    }
  } );

  // Remove expired entities
  entities = entities.filter( e => e.health > 0 );

  // Add new entities
  entities.push( ...newEntities );
}

gameCanvas.draw = ( ctx ) => {
  ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );
  ctx.drawImage( foregroundImage, 0, 0 );

  ctx.fillStyle = 'green';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );

  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 0.1;
  Util.drawLine( ctx, player.pos, vec2.scaleAndAdd( [], player.pos, player.vel, 100 ) );
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

document.addEventListener( 'pointerdown', e => {
  if ( e.buttons === 2 ) {
    player.pos[ 0 ] = gameCanvas.getX( e.x );
    player.pos[ 1 ] = gameCanvas.getY( e.y );
  }
} );

gameCanvas.start();
