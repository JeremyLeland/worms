import * as MaskMap from '../src/MaskMap.js';
import * as Worms from '../src/Worms.js';

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
  pos: [ 18, 17 ],
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

const EPSILON = 1e-6;

let debugInfo;


const mousePos = [ 21, 20 ];

let entities = [ player ];


MaskMap.setTerrainRect( map, 5, 8, 20, 5, Terrain.Empty );
MaskMap.setTerrainRect( map, 2, 10, 25, 6, Terrain.Empty );
MaskMap.setTerrainRect( map, 5, 7, 4, 6, Terrain.Empty );
// MaskMap.setTerrainRect( map, 20, 4, 8, 15, Terrain.Empty );
MaskMap.setTerrainRect( map, 15, 4, 5, 15, Terrain.Empty );

MaskMap.setTerrainRect( map, 10, 16, 15, 2, Terrain.Empty );
MaskMap.setTerrainRect( map, 15, 17, 10, 1, Terrain.Empty );


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
  // ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );
  ctx.drawImage( foregroundImage, 0, 0 );


  ctx.lineWidth = 0.1;

  // const x = player.pos[ 0 ];
  // const y = player.pos[ 1 ];
  // const r = player.radius - EPSILON;
  
  // const minX = Math.floor( x - r );
  // const maxX = Math.floor( x + r );
  // const minY = Math.floor( y - r );
  // const maxY = Math.floor( y + r );

  // const test = {
  //   W2: { pos: [ minX - 1, maxY - 1 ] },
  //   W1: { pos: [ minX - 1, maxY     ] },
  //   SW: { pos: [ minX - 1, maxY + 1 ] },
  //   S1: { pos: [ minX    , maxY + 1 ] },

  //   E2: { pos: [ maxX + 1, maxY - 1 ] },
  //   E1: { pos: [ maxX + 1, maxY     ] },
  //   SE: { pos: [ maxX + 1, maxY + 1 ] },
  //   S2: { pos: [ maxX    , maxY + 1 ] },
  // }

  const PlayerMove = 0.4;

  if ( player.isMovingLeft ) {
    player.pos[ 0 ] -= PlayerMove;

    const x = player.pos[ 0 ];
    const y = player.pos[ 1 ];
    const r = player.radius - EPSILON;

    let overlap = 0;

    // Check left wall
    // TODO: rest of the left
    if ( getTerrain( x - r, y + r, ctx ) ) {
      overlap = Math.ceil( x - r ) - ( x - r );

      console.log( 'left', overlap );

      player.pos[ 0 ] += overlap;
    }

    // Climb up left
    if ( getTerrain( x - r, y + r, ctx ) && !getTerrain( x - r, y + r - 1, ctx ) ) {
      console.log( 'climbing up left by ', overlap );

      player.pos[ 1 ] -= overlap;

      const vertOverlap = Math.floor( y + r ) - ( player.pos[ 1 ] + r );

      console.log( 'outside corner left', vertOverlap );

      if ( vertOverlap > 0 ) {
        player.pos[ 1 ] += vertOverlap;
        player.pos[ 0 ] -= vertOverlap;
      }
    }

    // // Climb down right
    // if ( /*!test.E1.val &&*/ !test.S2.val && test.SE.val ) {
    //   player.pos[ 0 ] += PlayerMove;
    //   player.pos[ 1 ] += PlayerMove;
    // }
  }

  if ( player.isMovingRight ) {
    player.pos[ 0 ] += PlayerMove;

    const x = player.pos[ 0 ];
    const y = player.pos[ 1 ];
    const r = player.radius - EPSILON;

    // Check right wall
    // TODO: rest of the right
    if ( getTerrain( x + r, y + r, ctx ) ) {
      const overlap = ( x + r ) - Math.floor( x + r );

      console.log( 'right', overlap );

      player.pos[ 0 ] -= overlap;
    
      // Climb up right
      if ( getTerrain( x + r, y + r, ctx ) && !getTerrain( x + r, y + r - 1, ctx ) ) {
        console.log( 'climbing up right by', overlap );

        player.pos[ 1 ] -= overlap;

        const vertOvershoot = Math.floor( y + r ) - ( player.pos[ 1 ] + r );

        console.log( 'outside corner right', vertOvershoot );

        if ( vertOvershoot > 0 ) {
          player.pos[ 1 ] += vertOvershoot;
          player.pos[ 0 ] += vertOvershoot;
        }
      }
    }

    // Climb down left
    else if ( getTerrain( x - r - 1, y + r + 1, ctx ) && !getTerrain( x - r, y + r + 1, ctx ) ) {
      const overshoot = ( x - r ) - Math.floor( x - r );

      console.log( 'right overshoot', overshoot );

      player.pos[ 0 ] -= overshoot;
      player.pos[ 1 ] += overshoot;
    }
    else if ( getTerrain( x - r - 1, y + r, ctx ) && !getTerrain( x - r, y + r, ctx ) ) {
      const overshoot = ( x - r ) - Math.floor( x - r );

      console.log( 'right overshoot', overshoot );

      player.pos[ 0 ] -= overshoot;
      player.pos[ 1 ] += overshoot;

      const vertOverlap = ( player.pos[ 1 ] + r ) - Math.ceil( y + r );

      console.log( 'right vert overlap', vertOverlap );

      if ( vertOverlap > 0 ) {
        player.pos[ 1 ] -= vertOverlap;
        player.pos[ 0 ] += vertOverlap;
      }
    }
  }

  console.log( player.pos );

  ctx.fillStyle = 'green';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );
}

function getTerrain( x, y, debugCtx ) {
  const val = MaskMap.getTerrain( map, x, y ) > 0;

  if ( debugCtx ) {
    debugCtx.strokeStyle = val ? 'white' : 'gray';
    debugCtx.strokeRect( Math.floor( x ), Math.floor( y ), 1, 1 );
  }

  return val;
}

document.addEventListener( 'keydown', e => {
  player.isMovingLeft = e.key == 'a';
  player.isMovingRight = e.key == 'd';

  gameCanvas.redraw();
} );

function pointerInput( e ) {
  mousePos[ 0 ] = gameCanvas.getX( e.x );
  mousePos[ 1 ] = gameCanvas.getY( e.y );

  if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );
    
    gameCanvas.redraw();
  }
}

document.addEventListener( 'pointermove', pointerInput );
document.addEventListener( 'pointerdown', pointerInput );
