import * as MaskMap from '../src/MaskMap.js';
import * as Worms from './Worms.js';

import { GameCanvas } from '../src/common/GameCanvas.js';
import { KeyInput } from '../src/common/KeyInput.js';
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

// const shadowLayerImage = new OffscreenCanvas( map.cols, map.rows );
// const shadowLayerCtx = shadowLayerImage.getContext( '2d' );

const gameCanvas = new GameCanvas();
gameCanvas.setBounds( 0, 0, map.cols, map.rows );

gameCanvas.update = ( dt ) => {
  const newEntities = [];

  entities.forEach( entity => {


    // TODO: At some point, this will be dependent on us detecting that we are on the ground and in walking mode
    if ( entity.type === 'player' && entity.rope === undefined ) {
      if ( entity.isMovingLeft ) {
        entity.vel[ 0 ] = -PlayerMoveSpeed;
      }
      else if ( entity.isMovingRight ) {
        entity.vel[ 0 ] = PlayerMoveSpeed;
      }
      else {
        entity.vel[ 0 ] = 0;
      }
    }

    // Jumping cancels rope
    if ( entity.rope && entity.isJumping ) {
      delete entity.rope;
    }

    if ( entity.isShooting ) {
      // Bullet first...
      const lineAngle = Math.atan2( mousePos[ 1 ] - entity.pos[ 1 ], mousePos[ 0 ] - entity.pos[ 0 ] );
      const lineVec = [ Math.cos( lineAngle ), Math.sin( lineAngle ) ];

      newEntities.push( {
        type: 'bullet',
        pos: vec2.scaleAndAdd( [], entity.pos, lineVec, entity.radius ),
        vel: vec2.scaleAndAdd( [], entity.vel, lineVec, BulletSpeed ),
        radius: 1,
        health: 1,
      } );

      // ...then recoil...
      vec2.scaleAndAdd( entity.vel, entity.vel, lineVec, -BulletRecoil );

      // ...then casing (so it includes recoil)
      const isFacingLeft = lineAngle < -Math.PI / 2 || Math.PI / 2 < lineAngle;

      const casingAngle = lineAngle + 2 * ( isFacingLeft ? 1 : -1 );
      const casingVec = [ Math.cos( casingAngle ), Math.sin( casingAngle ) ];

      newEntities.push( {
        type: 'casing',
        pos: vec2.clone( entity.pos ),
        vel: vec2.scaleAndAdd( [], entity.vel, casingVec, ( 0.75 + 0.5 * Math.random() ) * CasingSpeed ),
        rot: lineAngle + ( -0.5 + Math.random() ) * 1,
        rotVel: ( isFacingLeft ? 1 : -1 ) * ( 0.75 + 0.5 * Math.random() ) * CasingRotSpeed,
        radius: 1,
        health: 1,
      } );
    }

    if ( entity.isShootingRope ) {
      delete entity.rope;

      const lineAngle = Math.atan2( mousePos[ 1 ] - entity.pos[ 1 ], mousePos[ 0 ] - entity.pos[ 0 ] );
      const lineVec = [ Math.cos( lineAngle ), Math.sin( lineAngle ) ];

      newEntities.push( {
        type: 'rope',
        pos: vec2.scaleAndAdd( [], entity.pos, lineVec, entity.radius ),
        vel: vec2.scale( [], lineVec, RopeSpeed ),
        rot: 0,
        rotVel: 0.001,
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

    if ( entity.rotVel ) {
      entity.rot += entity.rotVel * dt;
    }

    // vec2.scaleAndAdd( entity.pos, entity.pos, entity.vel, dt );

    let timeLeft = dt;

    for ( let step = 0; step < 2; step ++ ) {
      const bestHit = Worms.getHit( map, entity, timeLeft );

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
            // TOOD: slower as we get toward top so we don't "hop" so much?
            entity.vel[ 1 ] = entity.isJumping ? -PlayerJumpSpeed : -PlayerMoveSpeed;
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
        else if ( entity.type === 'casing' ) {
          entity.rotVel = 0;
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
  ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );

  // shadowLayerCtx.clearRect( 0, 0, map.cols, map.rows );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );
  // shadowLayerCtx.drawImage( foregroundImage, 0, 0 );
  ctx.drawImage( foregroundImage, 0, 0 );

  Worms.drawEntities( ctx, entities );
  // drawEntities( shadowLayerCtx, entities );

  // ctx.shadowColor = '#0009';
  // ctx.shadowOffsetX = -9;
  // ctx.shadowOffsetY = 9;
  // ctx.shadowBlur = 0;
  
  // ctx.drawImage( shadowLayerImage, 0, 0 );
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
