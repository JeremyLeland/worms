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

MaskMap.setTerrainCircle( map, 30, 30, 30, 0 );
MaskMap.setTerrainCircle( map, 80, 40, 60, 0 );
MaskMap.setTerrainCircle( map, 120, 60, 30, 0 );

MaskMap.setTerrainCircle( map, 150, 70, 70, 0 );

// MaskMap.setTerrainCircle( map, 40, 40, 10, 1 );
// MaskMap.setTerrainCircle( map, 74, 50, 30, 1 );
// MaskMap.setTerrainCircle( map, 100, 45, 20, 1 );

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 135, 50 ],
  vel: [ 0, 0 ],
  rope: {
    pos: [ 100, 0 ],
    length: 50,
  },
  health: 100,
  radius: 8,
  color: 'green',

  weapon: {
    type: 'rifle',
    shotsLeft: 10,
    delay: 0,
    isReloading: false,
  },

  lookAngle: 0,

  isMovingUp: false,
  isMovingLeft: false,
  isMovingDown: false,
  isMovingRight: false,
  isJumping: false,
  isShooting: false,
  isShootingRope: false,
  isDigging: false,
};

const debugInfo = {};

const Gravity = 0.0005;
const PlayerMoveSpeed = 0.03;
const PlayerJumpSpeed = 0.12;
const PlayerRopeNudgeSpeed = 0.001;
const PlayerRopeLengthSpeed = 0.075;
const PlayerDigDistance = 2;

const MoveMaxSlope = 1;
const GroundSnapDist = 1;

const BulletSpeed = 0.5;
const BulletRecoil = 0.01;

const RifleShots = 10;
const RifleShootDelay = 150;
const RifleReloadDelay = 2000;

const CasingSpeed = 0.1;
const CasingRotSpeed = 0.02;

const RopeSpeed = 0.4;
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
const foregroundCtx = foregroundImage.getContext( '2d', { willReadFrequently: true } );
foregroundCtx.fillStyle = 'rgb(200, 100, 20)';
foregroundCtx.fillRect( 0, 0, map.cols, map.rows );

// const shadowLayerImage = new OffscreenCanvas( map.cols, map.rows );
// const shadowLayerCtx = shadowLayerImage.getContext( '2d' );

const gameCanvas = new GameCanvas();
gameCanvas.setBounds( 0, 0, map.cols, map.rows );

gameCanvas.update = ( dt ) => {
  const newEntities = [];

  entities.forEach( entity => {

    if ( entity.health <= 0 ) {
      return;
    }

    //
    // Forces
    //
    const forces = vec2.fromValues( 0, Gravity );


    // Rope forces
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

    // TODO: Need to figure out how to stop moving in the air without messing up other movement
    // if ( entity.type === 'player' && entity.rope === undefined ) {
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


    vec2.scaleAndAdd( entity.vel, entity.vel, forces, dt );


    //
    // Movement
    //

    let timeLeft = dt;

    for ( let step = 0; step < 2; step ++ ) {

      const hit = Worms.getHit( map, entity, timeLeft );

      if ( /*0 < bestHit.time &&*/ hit.time < timeLeft ) {
        vec2.scaleAndAdd( entity.pos, entity.pos, entity.vel, hit.time );
        timeLeft -= hit.time;

        //
        // Some bullets immediately die (so skip everything else)
        //
        if ( entity.type === 'bullet' ) {
          entity.health = 0;

          // TODO: Should these changes be made outside the update?
          MaskMap.setTerrainCircle( map, entity.pos[ 0 ], entity.pos[ 1 ], entity.radius * 4, Terrain.Empty );

          break;
        }

        const groundNormal = vec2.sub( [], entity.pos, hit.pos );
        vec2.normalize( groundNormal, groundNormal );

        const normalVelocity = vec2.dot( entity.vel, groundNormal );

        if ( normalVelocity < 0 ) {
          vec2.scaleAndAdd( entity.pos, hit.pos, groundNormal, entity.radius );
          vec2.scaleAndAdd( entity.vel, entity.vel, groundNormal, -normalVelocity );
        }

        //
        // Players can walk on ground instead of roll
        //
        if ( entity.type === 'player' ) {
          const slope = Math.atan2( groundNormal[ 0 ], -groundNormal[ 1 ] );

          if ( Math.abs( slope ) < MoveMaxSlope ) {
            const moveDir = entity.isMovingLeft ? -1 : entity.isMovingRight ? 1 : 0;

            const moveVec = [ -moveDir * groundNormal[ 1 ], moveDir * groundNormal[ 0 ] ];
            vec2.scale( entity.vel, moveVec, PlayerMoveSpeed );

            // Just go ahead and walk, then back us out of the ground
            // Feels inelegant, but seems to work for now
            vec2.scaleAndAdd( entity.pos, entity.pos, entity.vel, timeLeft );
            timeLeft = 0;

            const touch = Worms.getTouch( map, entity, GroundSnapDist );

            if ( touch.pos ) {
              // Snap to ground
              const groundNormal = vec2.sub( [], entity.pos, touch.pos );
              vec2.normalize( groundNormal, groundNormal );

              const normalVelocity = vec2.dot( entity.vel, groundNormal );

              if ( normalVelocity < 0 ) {
                vec2.scaleAndAdd( entity.pos, touch.pos, groundNormal, entity.radius );
                vec2.scaleAndAdd( entity.vel, entity.vel, groundNormal, -normalVelocity );
              }
            }


            if ( entity.isJumping ) {
              entity.vel[ 1 ] = -PlayerJumpSpeed;
            }
          }
        }

        //
        // Collision response for other entities
        //
        if ( entity.type === 'casing' ) {
          entity.rotVel = 0;
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

    if ( entity.rotVel ) {
      entity.rot += entity.rotVel * dt;
    }

    if ( entity.trail ) {
      entity.trail.unshift(
        {
          pos: vec2.clone( entity.pos ),
          vel: vec2.clone( entity.vel ),
          life: Worms.BulletTrailLife,
        }
      );
    }

    if ( entity.weapon ) {
      if ( entity.weapon.delay > 0 ) {
        entity.weapon.delay -= dt;

        if ( entity.weapon.delay <= 0 && entity.weapon.isReloading ) {
          entity.weapon.shotsLeft += RifleShots;
          entity.weapon.isReloading = false;
        }
      }
    }

    if ( entity.id === 'player1' ) {
      entity.lookAngle = Math.atan2( mousePos[ 1 ] - entity.pos[ 1 ], mousePos[ 0 ] - entity.pos[ 0 ] );
    }


    //
    // Other actions
    //
    const lookVec = [ Math.cos( entity.lookAngle ), Math.sin( entity.lookAngle ) ];

    if ( entity.isShooting && entity.weapon.delay <= 0 ) {
      // Bullet first...
      newEntities.push( {
        type: 'bullet',
        pos: vec2.scaleAndAdd( [], entity.pos, lookVec, entity.radius ),
        vel: vec2.scaleAndAdd( [], entity.vel, lookVec, BulletSpeed ),
        radius: 1,
        health: 1,
        trail: [],
      } );

      // ...then recoil...
      vec2.scaleAndAdd( entity.vel, entity.vel, lookVec, -BulletRecoil );

      // ...then casing (so it includes recoil)
      const isFacingLeft = entity.lookAngle < -Math.PI / 2 || Math.PI / 2 < entity.lookAngle;

      const casingAngle = entity.lookAngle + 2 * ( isFacingLeft ? 1 : -1 );
      const casingVec = [ Math.cos( casingAngle ), Math.sin( casingAngle ) ];

      newEntities.push( {
        type: 'casing',
        pos: vec2.clone( entity.pos ),
        vel: vec2.scaleAndAdd( [], entity.vel, casingVec, ( 0.75 + 0.5 * Math.random() ) * CasingSpeed ),
        rot: entity.lookAngle + ( -0.5 + Math.random() ) * 1,
        rotVel: ( isFacingLeft ? 1 : -1 ) * ( 0.75 + 0.5 * Math.random() ) * CasingRotSpeed,
        radius: 1,
        health: 1,
      } );

      entity.weapon.shotsLeft --;
      if ( entity.weapon.shotsLeft > 0 ) {
        entity.weapon.delay += RifleShootDelay;
      }
      else {
        entity.weapon.delay += RifleReloadDelay;
        entity.weapon.isReloading = true;
      }
    }

    if ( entity.isShootingRope ) {
      delete entity.rope;

      newEntities.push( {
        type: 'rope',
        pos: vec2.scaleAndAdd( [], entity.pos, lookVec, entity.radius ),
        vel: vec2.scale( [], lookVec, RopeSpeed ),
        rot: 0,
        rotVel: 0.001,
        radius: 1,
        health: 1,
        parentId: entity.id,
      } );

      entity.isShootingRope = false;  // one rope per right-click
    }

    // Jumping cancels rope
    if ( entity.isJumping && entity.rope ) {
      delete entity.rope;
    }

    // TODO: Time delay between digs, like guns?
    if ( entity.isDigging ) {
      const digPos = vec2.scaleAndAdd( [], entity.pos, lookVec, PlayerDigDistance );
      MaskMap.setTerrainCircle( map, digPos[ 0 ], digPos[ 1 ], entity.radius * 1.1, Terrain.Empty );
    }
  } );

  // Update bullet trails
  entities.forEach( entity => {
    if ( entity.type === 'bullet' ) {
      // entity.trail ??= [];

      entity.trail.forEach( part => part.life -= dt );

      // Trim old particles (leave one negative life behind to figure out the tail)
      const firstNegative = entity.trail.findIndex( e => e.life < 0 );

      if ( firstNegative > -1 ) {
        entity.trail.splice( firstNegative + 1 );
      }

      // if ( entity.health > 0 ) {
      //   entity.trail.unshift(
      //     {
      //       pos: vec2.clone( entity.pos ),
      //       vel: vec2.clone( entity.vel ),
      //       life: Worms.BulletTrailLife,
      //     }
      //   );
      // }
    }
  } );

  // Remove expired entities
  entities = entities.filter( e => e.health > 0 || e.trail );

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



// const keyInput = new KeyInput( /*() => { gameCanvas.update( 10 ); gameCanvas.redraw() }*/ );

// keyInput.Keys = {
const Keys = {
  PlayerUp: 'w',
  PlayerLeft: 'a',
  PlayerDown: 's',
  PlayerRight: 'd',
  PlayerJump: ' ',
  ToggleUpdates: 'p',
  StepFrame: 'o',
};

document.addEventListener( 'keydown', e => {
  if ( e.key === Keys.PlayerJump )  player.isJumping = true;

  else if ( e.key === Keys.PlayerUp )    player.isMovingUp   = true;
  else if ( e.key === Keys.PlayerDown )  player.isMovingDown = true;

  else if ( e.key === Keys.PlayerLeft ) {
    if ( player.isMovingRight ) {
      player.isDigging = true;
    }
    else {
      player.isMovingLeft = true;
    }
  }

  else if ( e.key === Keys.PlayerRight ) {
    if ( player.isMovingLeft ) {
      player.isDigging = true;
    }
    else {
      player.isMovingRight = true;
    }
  }

  else if ( e.key === Keys.ToggleUpdates )  gameCanvas.toggle();
  else if ( e.key === Keys.StepFrame ) {
    gameCanvas.update( 10 );
    gameCanvas.redraw();
  }

} );

document.addEventListener( 'keyup', e => {
  if ( e.key === Keys.PlayerJump )  player.isJumping = false;

  else if ( e.key === Keys.PlayerUp )    player.isMovingUp   = false;
  else if ( e.key === Keys.PlayerDown )  player.isMovingDown = false;

  else if ( e.key === Keys.PlayerLeft ) {
    player.isMovingLeft = false;

    if ( player.isDigging ) {
      player.isDigging = false;
      player.isMovingRight = true;
    }
  }
  else if ( e.key === Keys.PlayerRight ) {
    player.isMovingRight = false;

    if ( player.isDigging ) {
      player.isDigging = false;
      player.isMovingLeft = true;
    }
  }
} );

// keyInput.Actions = {
//   PlayerUp:     x => player.isMovingUp = x,
//   PlayerLeft:   x => player.isMovingLeft = x,
//   PlayerDown:   x => player.isMovingDown = x,
//   PlayerRight:  x => player.isMovingRight = x,
//   PlayerJump:   x => player.isJumping = x,

//   ToggleUpdates: x => { if ( x ) gameCanvas.toggle() },
// };


document.addEventListener( 'pointerdown', e => {
  player.isShooting = e.buttons & 1;
  player.isShootingRope = e.buttons & 2;

  // if ( e.buttons === 2 ) {
  //   vec2.set( player.pos, gameCanvas.getX( e.x ), gameCanvas.getY( e.y ) );
  //   vec2.set( player.vel, 0, 0 );
  // }
} );

document.addEventListener( 'pointerup', e => {
  player.isShooting = e.buttons & 1;
  // isShootingRope should be cleared once rope is shot
} );

document.addEventListener( 'pointermove', e => {
  vec2.set( mousePos, gameCanvas.getX( e.x ), gameCanvas.getY( e.y ) );
} );

gameCanvas.start();
