import * as MaskMap from '../src/MaskMap.js';

import { GameCanvas } from '../src/common/GameCanvas.js';
import * as Util from '../src/common/Util.js';
import { vec2 } from '../lib/gl-matrix.js';

const map = {
  cols: 32,
  rows: 24,
  data: [
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  ],
};

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


const mousePos = [ 21, 20 ];

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
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, 0 );
  ctx.drawImage( foregroundImage, 0, 0 );

  ctx.fillStyle = 'green';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );

  ctx.lineWidth = 0.1;

  const minX = player.pos[ 0 ] - player.radius + EPSILON;
  const minY = player.pos[ 1 ] - player.radius + EPSILON;
  const maxX = player.pos[ 0 ] + player.radius - EPSILON;
  const maxY = player.pos[ 1 ] + player.radius - EPSILON;
  
  const fromLeft = minX - Math.round( minX );
  const fromTop  = minY - Math.round( minY );
  const fromRight = Math.round( maxX ) - maxX;
  const fromBottom = Math.round( maxY ) - maxY;

  ctx.strokeStyle = fromLeft < 0 ? 'yellow' : 'white';
  Util.drawLine( ctx, [ minX, player.pos[ 1 ] ], [ minX - fromLeft, player.pos[ 1 ] ] );

  ctx.strokeStyle = fromTop < 0 ? 'yellow' : 'white';
  Util.drawLine( ctx, [ player.pos[ 0 ], minY ], [ player.pos[ 0 ], minY - fromTop ] );

  ctx.strokeStyle = fromRight < 0 ? 'yellow' : 'white';
  Util.drawLine( ctx, [ maxX, player.pos[ 1 ] ], [ maxX + fromRight, player.pos[ 1 ] ] );

  ctx.strokeStyle = fromBottom < 0 ? 'yellow' : 'white';
  Util.drawLine( ctx, [ player.pos[ 0 ], maxY ], [ player.pos[ 0 ], maxY + fromBottom ] );

  const posSW = [ Math.round( minX - 1 ), Math.floor( maxY ) ];
  const posSE = [ Math.round( maxX ), Math.floor( maxY ) ];

  const SW = MaskMap.getTerrain( map, ...posSW );
  const SE = MaskMap.getTerrain( map, ...posSE );

  ctx.strokeStyle = SW ? 'red' : 'lime';
  ctx.strokeRect( ...posSW, 1, 1 );
  ctx.strokeStyle = SE ? 'red' : 'lime';
  ctx.strokeRect( ...posSE, 1, 1 );
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
