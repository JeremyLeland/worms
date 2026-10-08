import * as MaskMap from '../src/MaskMap.js';

import { GameCanvas } from '../src/common/GameCanvas.js';
import { KeyInput } from '../src/common/KeyInput.js';
import * as Collisions from '../src/common/Collisions.js';
import * as Util from '../src/common/Util.js';
import { vec2 } from '../lib/gl-matrix.js';

const Terrain = {
  Empty: 0,
  Dirt: 1,
  Rock: 2,
};

const map = MaskMap.create( 320, 240, Terrain.Dirt );

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 200, 40 ],
  vel: [ 0, 0 ],
  // rope: {
  //   pos: [ 200, 10 ],
  //   length: 50,
  // },
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

const debugInfo = {};

const Gravity = 0.0005;
const PlayerMoveSpeed = 0.03;
const PlayerJumpSpeed = 0.1;
const PlayerRopeNudgeSpeed = 0.001;
const PlayerRopeLengthSpeed = 0.075;


const BulletSpeed = 0.5;
const RopeSpeed = 0.4;

const RopeSpringConstant = 0.0001;
const RopeSpringDamping = 0.01;     // Critical Damping: 2 * sqrt( k * m ), trying 0.5 * critical damping
const RopeSwingDamping = 0.0002;

const mousePos = [ 20.4, 20 ];

let entities = [ player ];


MaskMap.setTerrainRect( map, 5, 8, 20, 5, Terrain.Empty );
MaskMap.setTerrainRect( map, 2, 10, 25, 6, Terrain.Empty );
MaskMap.setTerrainRect( map, 5, 7, 4, 6, Terrain.Empty );
MaskMap.setTerrainRect( map, 20, 4, 8, 15, Terrain.Empty );
MaskMap.setTerrainRect( map, 10, 16, 10, 1, Terrain.Empty );
MaskMap.setTerrainRect( map, 15, 17, 5, 1, Terrain.Empty );

MaskMap.setTerrainCircle( map, 30, 30, 20, Terrain.Empty );
MaskMap.setTerrainCircle( map, 50, 50, 30, Terrain.Empty );
MaskMap.setTerrainRect( map, 50, 30, 200, 40, Terrain.Empty );
MaskMap.setTerrainCircle( map, 200, 50, 40, Terrain.Empty );
MaskMap.setTerrainCircle( map, 250, 50, 20, Terrain.Empty );


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
  const newEntities = [];

  entities.forEach( entity => {


    // TODO: At some point, this will be dependent on us detecting that we are on the ground and in walking mode
    // if ( entity.isMovingLeft !== undefined && entity.rope === undefined ) {
    //   if ( entity.isMovingLeft ) {
    //     entity.vel[ 0 ] = -PlayerMoveSpeed;
    //   }
    //   else if ( entity.isMovingRight ) {
    //     entity.vel[ 0 ] = PlayerMoveSpeed;
    //   }
    //   else {
    //     entity.vel[ 0 ] = 0;
    //   }
    // }

    // Jumping cancels rope
    if ( entity.rope && entity.isJumping ) {
      delete entity.rope;
    }

    if ( entity.isShooting ) {
      const lineAngle = Math.atan2( mousePos[ 1 ] - entity.pos[ 1 ], mousePos[ 0 ] - entity.pos[ 0 ] );
      const lineVec = [ Math.cos( lineAngle ), Math.sin( lineAngle ) ];

      newEntities.push( {
        type: 'bullet',
        pos: vec2.scaleAndAdd( [], entity.pos, lineVec, entity.radius ),
        vel: vec2.scale( [], lineVec, BulletSpeed ),
        radius: 1,
        health: 1,
      } );

      // Recoil
      vec2.scaleAndAdd( entity.vel, entity.vel, lineVec, -0.01 );
    }

    if ( entity.isShootingRope ) {
      delete entity.rope;

      const lineAngle = Math.atan2( mousePos[ 1 ] - entity.pos[ 1 ], mousePos[ 0 ] - entity.pos[ 0 ] );
      const lineVec = [ Math.cos( lineAngle ), Math.sin( lineAngle ) ];

      newEntities.push( {
        type: 'rope',
        pos: vec2.scaleAndAdd( [], entity.pos, lineVec, entity.radius ),
        vel: vec2.scale( [], lineVec, RopeSpeed ),
        radius: 1,
        health: 1,
        parentId: entity.id,
      } );

      entity.isShootingRope = false;  // one rope per right-click
    }


    //
    // Apply forces
    //
    
    const forces = vec2.fromValues( 0, Gravity );
  
    if ( entity.rope ) {

      //
      // Swing left or right
      //

      if ( entity.isMovingLeft ) {
        entity.vel[ 0 ] -= PlayerRopeNudgeSpeed;
      }
      else if ( entity.isMovingRight ) {
        entity.vel[ 0 ] += PlayerRopeNudgeSpeed;
      }


      //
      // Change rope length
      //
      let ropeSpeed = 0;

      // TODO: Use tanh here to deal with cases where we are close to min/max length?
      if ( entity.isMovingUp && entity.rope.length > 10 ) {
        ropeSpeed = -PlayerRopeLengthSpeed;
      }
      else if ( entity.isMovingDown && entity.rope.length < 200 ) {
        ropeSpeed = PlayerRopeLengthSpeed;
      }

      entity.rope.length += ropeSpeed * dt;


      //
      // Apply rope forces
      //

      const ropeVec = vec2.subtract( [], entity.pos, entity.rope.pos );
      const ropeDist = vec2.length( ropeVec );
    
      if ( ropeDist > 0 ) {
        const ropeDir = vec2.scale( [], ropeVec, 1 / ropeDist );  // cheaper than normalize?
    
        const velocityAlongRope = vec2.dot( entity.vel, ropeDir );
        const radialError = velocityAlongRope - ropeSpeed;
    
        if ( ropeDist > entity.rope.length ) {
          // Damped spring: F = -kx - cv
          const displacement = Math.max( 0, ropeDist - entity.rope.length );
          const springForce = -RopeSpringConstant * displacement - RopeSpringDamping * radialError;
          
          vec2.scaleAndAdd( forces, forces, ropeDir, springForce );
        }
    
        const radialVelocity = vec2.scale( [], ropeDir, velocityAlongRope );    // TODO: or radialError?
        const tangentialVelocity = vec2.subtract( [], entity.vel, radialVelocity );
    
        vec2.scaleAndAdd( forces, forces, tangentialVelocity, -RopeSwingDamping );
      }
    }
  
    vec2.scaleAndAdd( entity.vel, entity.vel, forces, dt );
    // vec2.scaleAndAdd( entity.pos, entity.pos, entity.vel, dt );

    let timeLeft = dt;

    for ( let step = 0; step < 2; step ++ ) {
      const bestHit = getHit( map, entity, timeLeft );

      if ( bestHit.time < Infinity ) {
        vec2.scaleAndAdd( entity.pos, entity.pos, entity.vel, bestHit.time );

        // Left/Right wall
        if ( bestHit.line[ 0 ] === bestHit.line[ 2 ] ) {
          // Climb wall if it's only 1 tall
          //  - if we're moving left, the line we hit is at testX + 1
          //  - use the correct bestHit.line y based on orientation
          const testCol = Math.floor( bestHit.line[ 0 ] ) + ( entity.vel[ 0 ] < 0 ? -1 : 0 );
          const testRow = Math.floor( bestHit.line[ entity.vel[ 0 ] < 0 ? 1 : 3 ] ) - 1;

          if ( 0 <= testRow && map.data[ testCol + testRow * map.cols ] == Terrain.Empty ) {
            entity.vel[ 1 ] = -PlayerMoveSpeed;   // TOOD: slower as we get toward top so we don't "hop" so much?
          }

          entity.vel[ 0 ] = 0;
        }

        // Ceiling/Floor
        else {
          // Floor
          if ( bestHit.line[ 0 ] < bestHit.line[ 2 ] ) {
            entity.vel[ 1 ] = entity.isJumping ? -PlayerJumpSpeed : 0;
          }

          // Ceiling
          else {
            entity.vel[ 1 ] = 0;
          }
        }

        timeLeft -= bestHit.time;

        if ( entity.type === 'bullet' ) {
          entity.health = 0;

          MaskMap.setTerrainCircle( map, entity.pos[ 0 ], entity.pos[ 1 ], entity.radius * 4, Terrain.Empty );
          break;
        }
        else if ( entity.type === 'rope' ) {
          entity.health = 0;

          const parent = entities.find( e => e.id === entity.parentId );
          if ( parent ) {
            parent.rope = {
              pos: entity.pos,
              length: vec2.distance( parent.pos, entity.pos ),
            };
          }
        }
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
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  ctx.drawImage( foregroundImage, 0, 0 );

  entities.forEach( entity => {
    if ( entity.type === 'player' ) {
      ctx.fillStyle = 'green';
      Util.drawPoint( ctx, entity.pos, entity.radius );

      if ( entity.rope ) {
        drawRope( ctx, entity.pos, entity.rope.pos );
      }

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 0.1;
      Util.drawLine( ctx, entity.pos, mousePos );
    }
    else if ( entity.type === 'bullet' ) {
      ctx.fillStyle = 'white';
      Util.drawPoint( ctx, entity.pos, entity.radius );
    }
    else if ( entity.type === 'rope' ) {
      const parent = entities.find( e => e.id === entity.parentId );
      if ( parent ) {
        drawRope( ctx, parent.pos, entity.pos );
      }
    }
  } );
}

function drawRope( ctx, from, to ) {
  ctx.fillStyle = ctx.strokeStyle = 'yellow';
  Util.drawPoint( ctx, to, 1 );

  ctx.lineWidth = 0.4;
  Util.drawLine( ctx, from, to );
}

function getHit( map, entity, dt, debugCtx ) {
  // console.log( ' getHit' );

  let bestHit = {
    time: Infinity,
    line: null,
  };

  const goalPos = vec2.scaleAndAdd( [], entity.pos, entity.vel, dt );

  // Show which grids we need to check
  const testLeft   = Math.floor( Math.min( entity.pos[ 0 ], goalPos[ 0 ] ) - entity.radius );
  const testTop    = Math.floor( Math.min( entity.pos[ 1 ], goalPos[ 1 ] ) - entity.radius );
  const testRight  = Math.floor( Math.max( entity.pos[ 0 ], goalPos[ 0 ] ) + entity.radius );
  const testBottom = Math.floor( Math.max( entity.pos[ 1 ], goalPos[ 1 ] ) + entity.radius );

  // TODO: Would it ever make sense to throw out values that are outside of blue move line?
  //       Most moves are probably small enough that it wouldn't matter much
  //       Could potentially make a difference if bullets are moving fast
  //       Either way, curious if there's a quick way to throw these out based on distance from line
  //        - and how that compares to cost of checking

  // TODO: Would it make sense to test these in movement order so we bail early if we hit something?
  //        - Is it more expensive than testing all of them?

  for ( let testRow = testTop; testRow <= testBottom; testRow ++ ) {
    for ( let testCol = testLeft; testCol <= testRight; testCol ++ ) {

      if ( map.data[ testCol + testRow * map.cols ] === Terrain.Empty ) {
        if ( debugCtx ) {
          debugCtx.fillStyle = '#0f04';
          debugCtx.fillRect( testCol, testRow, 1, 1 );
        }
      }
      else {
        if ( debugCtx ) {
          debugCtx.fillStyle = '#f004';
          debugCtx.fillRect( testCol, testRow, 1, 1 );
        }

        // Test walls
        const [ x, y ] = entity.pos;
        const [ dx, dy ] = entity.vel;
        const r = entity.radius;

        const lines = [
          [ testCol, testRow + 1, testCol, testRow ],         // left
          [ testCol, testRow, testCol + 1, testRow ],         // top
          [ testCol + 1, testRow, testCol + 1, testRow + 1 ], // right
          [ testCol + 1, testRow + 1, testCol, testRow + 1 ], // bottom
        ];

        lines.forEach( line => {
          const hitTime = Collisions.timeToCircleHitLine( x, y, dx, dy, r, ...line );

          // if ( hitTime < Infinity ) {
          //   console.log( '  hitTime for ', line, ' is ', hitTime );
          // }

          // Make sure hitTime is within our update window, helps avoid other weirdness
          if ( hitTime < bestHit.time && hitTime < dt ) {
            bestHit.time = hitTime;
            bestHit.line = line;
          }

          if ( debugCtx ) {
            if ( hitTime < Infinity ) {
              const val = ( 1 - hitTime ) * 255;

              debugCtx.strokeStyle = `rgb( 128, ${ val }, 255 )`;
              debugCtx.lineWidth = 0.1;
              Util.drawLine2( debugCtx, line, true );
            }
          }
        } );
      }
    }
  }

  // console.log( ' bestHit = ', bestHit.line );

  return bestHit;
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
  player.isShooting = e.buttons & 1;
  player.isShootingRope = e.buttons & 2;
} );

document.addEventListener( 'pointerup', e => {
  player.isShooting = e.buttons & 1;
  // isShootingRope should be cleared once rope is shot
} );

document.addEventListener( 'pointermove', e => {
  vec2.set( mousePos, gameCanvas.getX( e.x ), gameCanvas.getY( e.y ) );
} );

gameCanvas.start();
