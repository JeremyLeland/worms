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
  pos: [ 16, 12 ],
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
  // ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, Terrain.Empty );
  ctx.drawImage( foregroundImage, 0, 0 );

  ctx.fillStyle = 'green';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );

  const L1 = [ 13, 18 ], L2 = [ 20, 18 ];
  const norm = [ L2[ 1 ] - L1[ 1 ], L1[ 0 ] - L2[ 0 ] ];
  vec2.normalize( norm, norm );

  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 0.1;
  Util.drawLine( ctx, L1, L2 );

  const dist = boxDistToLine( ...player.pos, player.radius, ...L1, ...L2 );

  console.log( dist );

  // const hit = Worms.getHit( map, player, 1, ( entity, line ) => timeToBoxHitLine( ...entity.pos, ...entity.vel, entity.radius, ...line ), ctx );

  // if ( hit.line ) {
  //   ctx.strokeStyle = 'yellow';
  //   Util.drawLine2( ctx, hit.line, true );
    
  //   const hitPos = vec2.scaleAndAdd( [], player.pos, player.vel, hit.time );
    
  //   ctx.fillStyle = ctx.strokeStyle = 'white';
  //   Util.drawPoint( ctx, hitPos, 0.2 );
  //   ctx.strokeRect( hitPos[ 0 ] - player.radius, hitPos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );
  // }
}


document.addEventListener( 'pointermove', e => {
  mousePos[ 0 ] = gameCanvas.getX( e.x );
  mousePos[ 1 ] = gameCanvas.getY( e.y );

  gameCanvas.redraw();
} );

document.addEventListener( 'pointerdown', e => {
  if ( e.buttons === 2 ) {
    player.pos[ 0 ] = gameCanvas.getX( e.x );
    player.pos[ 1 ] = gameCanvas.getY( e.y );

    gameCanvas.redraw();
  }
} );

export function boxDistToLine( x, y, radius, x1, y1, x2, y2 ) {

  // Seems easier to just check everything than figure out what needs to be checked

  const A = [ x - radius, y - radius ];
  const B = [ x + radius, y - radius ];
  const C = [ x + radius, y + radius ];
  const D = [ x - radius, y + radius ];
  
  return Math.min(
    pointDistToLine( ...A, x1, y1, x2, y2 ),
    pointDistToLine( ...B, x1, y1, x2, y2 ),
    pointDistToLine( ...C, x1, y1, x2, y2 ),
    pointDistToLine( ...D, x1, y1, x2, y2 ),

    // and the reverse (in case target line is smaller than us)
    pointDistToLine( x1, y1, A, B ),
    pointDistToLine( x2, y2, A, B ),
    pointDistToLine( x1, y1, B, C ),
    pointDistToLine( x2, y2, B, C ),
    pointDistToLine( x1, y1, C, D ),
    pointDistToLine( x2, y2, C, D ),
    pointDistToLine( x1, y1, D, A ),
    pointDistToLine( x2, y2, D, A ),
  );
}

function pointDistToLine( x, y, x1, y1, x2, y2 ) {
  const px = x2 - x1;
  const py = y2 - y1;
  const D = ( px * px ) + ( py * py );

  const u = ( ( x - x1 ) * px + ( y - y1 ) * py ) / D;

  if ( 0 <= u && u <= 1 ) {
    const len = Math.sqrt( D );
    const normX = py / len;
    const normY = -px / len;

    return ( x - x1 ) * normX + ( y - y1 ) * normY;
  }
  else {
    return Infinity;
  }
}
