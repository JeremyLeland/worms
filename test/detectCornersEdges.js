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
  pos: [ 17.2, 16.9 ],
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


const mousePos = [ 21, 20 ];

let entities = [ player ];


MaskMap.setTerrainRect( map, 5, 8, 20, 5, Terrain.Empty );
MaskMap.setTerrainRect( map, 2, 10, 25, 6, Terrain.Empty );
MaskMap.setTerrainRect( map, 5, 7, 4, 6, Terrain.Empty );
// MaskMap.setTerrainRect( map, 20, 4, 8, 15, Terrain.Empty );
MaskMap.setTerrainRect( map, 15, 4, 5, 15, Terrain.Empty );

MaskMap.setTerrainRect( map, 10, 16, 10, 2, Terrain.Empty );
MaskMap.setTerrainRect( map, 15, 17, 5, 1, Terrain.Empty );


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

  ctx.fillStyle = 'green';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );


  ctx.lineWidth = 0.1;


  const x = player.pos[ 0 ];
  const y = player.pos[ 1 ];
  const r = player.radius;
  const minX = x - r;
  const maxX = x + r;
  const minY = y - r;
  const maxY = y + r;

  const testLeft   = Math.round( minX );
  const testRight  = Math.round( maxX );
  const testTop    = Math.round( minY );
  const testBottom = Math.round( maxY );

  const leftW1  = [ testLeft - 1, testBottom - 2 ];
  const leftW2  = [ testLeft - 1, testBottom - 1 ];
  // const leftSW = [ testLeft - 1, testBottom     ];
  const leftS  = [ testLeft    , testBottom     ];

  // const rightE1  = [ testRight    , testBottom - 2 ];
  // const rightE2  = [ testRight    , testBottom - 1 ];
  const rightSE = [ testRight    , testBottom     ];
  const rightS  = [ testRight - 1, testBottom     ];

  ctx.fillStyle = 'cyan';
  Util.drawPoint( ctx, leftS, 0.1 );
  Util.drawPoint( ctx, rightSE, 0.1 );

  [ leftW1, leftW2, /*leftSW,*/ leftS, /*rightE1, rightE2,*/ rightSE, rightS ].forEach( pos => {
    ctx.strokeStyle = MaskMap.getTerrain( map, ...pos ) ? 'white' : 'gray';
    ctx.strokeRect( ...pos, 1, 1 );
  } );

  // Left climb
  if ( MaskMap.getTerrain( map, ...leftS ) !== Terrain.Empty ) {
    if ( MaskMap.getTerrain( map, ...leftW1 ) === Terrain.Empty &&
         MaskMap.getTerrain( map, ...leftW2 ) !== Terrain.Empty ) {
      console.log( 'Can climb left' );
    }
    else { 
      console.log( 'Can walk left' );
    }
  }
}


document.addEventListener( 'pointermove', e => {
  mousePos[ 0 ] = gameCanvas.getX( e.x );
  mousePos[ 1 ] = gameCanvas.getY( e.y );

  if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );
    
    gameCanvas.redraw();
  }

} );

document.addEventListener( 'pointerdown', e => {
  mousePos[ 0 ] = gameCanvas.getX( e.x );
  mousePos[ 1 ] = gameCanvas.getY( e.y );

  if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );

    gameCanvas.redraw();
  }
} );
