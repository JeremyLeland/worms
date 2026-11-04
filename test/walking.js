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

const map = MaskMap.create( 32, 24, Terrain.Dirt );

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 16.5, 13.5 ],
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

const Gravity = 0.0001; //0.0005;
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


gameCanvas.draw = ( ctx ) => {
  ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );
  ctx.drawImage( foregroundImage, 0, 0 );

  // Worms.drawEntities( ctx, entities );

  ctx.fillStyle = '#fff6';
  Util.drawPoint( ctx, player.pos, player.radius );

  
  const minX = player.pos[ 0 ] - player.radius;
  const minY = player.pos[ 1 ] - player.radius;
  const maxX = player.pos[ 0 ] + player.radius;
  const maxY = player.pos[ 1 ] + player.radius;

  const SnapDist = 1;
  
  const testLeft = Math.floor( minX - SnapDist );
  const testTop  = Math.floor( minY - SnapDist );
  const testRight = Math.floor( maxX + SnapDist );
  const testBottom = Math.floor( maxY + SnapDist );

  const closest = {
    dist: SnapDist,
  };
  
  for ( let testRow = testTop; testRow <= testBottom; testRow ++ ) {
    for ( let testCol = testLeft; testCol <= testRight; testCol ++ ) {
      
      ctx.lineWidth = 0.05;
      ctx.strokeStyle = '#fff4';
      if ( MaskMap.getTerrain( map, testCol, testRow, ctx ) ) {
        
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

          const val = Math.max( 0, 1 - dist ) * 255;

          ctx.fillStyle = `rgb( 0, 0, ${ val })`;
          Util.drawPoint( ctx, [ closestX, closestY ], 0.1 );

        } );
      }
    }
  }

  if ( closest.pos ) {
    ctx.fillStyle = 'white';
    Util.drawPoint( ctx, closest.pos, 0.1 );

    const norm = vec2.sub( [], player.pos, closest.pos );
    vec2.normalize( norm, norm );

    Util.drawLine( ctx, closest.pos, vec2.scaleAndAdd( [], closest.pos, norm, SnapDist ) );

    const moveDir = player.isMovingLeft ? -1 : player.isMovingRight ? 1 : 0;
    const moveVec = [ -moveDir * norm[ 1 ], moveDir * norm[ 0 ] ];

    Util.drawLine( ctx, player.pos, vec2.scaleAndAdd( [], player.pos, moveVec, SnapDist ) );
  }
}



// const keyInput = new KeyInput();

// keyInput.Keys = {
//   PlayerUp: 'w',
//   PlayerLeft: 'a',
//   PlayerDown: 's',
//   PlayerRight: 'd',
//   PlayerJump: ' ',
//   ToggleUpdates: 'p',
// };

// keyInput.Actions = {
//   PlayerUp:     x => player.isMovingUp = x,
//   PlayerLeft:   x => player.isMovingLeft = x,
//   PlayerDown:   x => player.isMovingDown = x,
//   PlayerRight:  x => player.isMovingRight = x,
//   PlayerJump:   x => player.isJumping = x,

//   ToggleUpdates: x => { if ( x ) gameCanvas.toggle() },
// };

function keyInput( e ) {
  player.isMovingLeft = e.key === 'a';
  player.isMovingRight = e.key === 'd';

  gameCanvas.redraw();
}

document.addEventListener( 'keydown', keyInput );
document.addEventListener( 'keyup', keyInput );

function pointerInput( e ) {
  if ( e.buttons === 2 ) {
    player.pos[ 0 ] = gameCanvas.getX( e.x );
    player.pos[ 1 ] = gameCanvas.getY( e.y );

    gameCanvas.redraw();
  }
}

document.addEventListener( 'pointerdown', pointerInput );
document.addEventListener( 'pointermove', pointerInput );

// gameCanvas.start();
