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

  vec2.subtract( player.vel, mousePos, player.pos );

  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 0.1;
  Util.drawLine( ctx, player.pos, mousePos );
  ctx.strokeRect( mousePos[ 0 ] - player.radius, mousePos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );

  // const line = [ 18, 16, 18, 18 ];
  // Util.drawLine2( ctx, line, true );

  const hit = Worms.getHit( map, player, 1, ( entity, line ) => timeToBoxHitLine( ...entity.pos, ...entity.vel, entity.radius, ...line ), ctx );

  ctx.strokeStyle = 'yellow';
  Util.drawLine2( ctx, hit.line, true );

  const hitPos = vec2.scaleAndAdd( [], player.pos, player.vel, hit.time );

  ctx.fillStyle = ctx.strokeStyle = 'white';
  Util.drawPoint( ctx, hitPos, 0.2 );
  ctx.strokeRect( hitPos[ 0 ] - player.radius, hitPos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );
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


function timeToBoxHitLine( x, y, dx, dy, radius, x1, y1, x2, y2 ) {
  const xDir = Math.sign( dx );
  const yDir = Math.sign( dy );

  const Ax = x - xDir * radius;
  const Ay = y - yDir * radius;
  const Bx = x + xDir * radius;
  const By = y + yDir * radius;

  return Math.min(
    // Check the 3 points around the two lines facing the direction we are moving
    timeToPointHitLine( Ax, By, dx, dy, x1, y1, x2, y2 ),
    timeToPointHitLine( Bx, Ay, dx, dy, x1, y1, x2, y2 ),
    timeToPointHitLine( Bx, By, dx, dy, x1, y1, x2, y2 ),

    // and the reverse (in case target line is smaller than us)
    timeToPointHitLine( x1, y1, -dx, -dy, Ax, By, Bx, By ),
    timeToPointHitLine( x1, y1, -dx, -dy, Bx, By, Bx, Ay ),
    timeToPointHitLine( x2, y2, -dx, -dy, Ax, By, Bx, By ),
    timeToPointHitLine( x2, y2, -dx, -dy, Bx, By, Bx, Ay ),
  );
}

function timeToPointHitLine( x, y, dx, dy, x1, y1, x2, y2 ) {
  return getLineIntersection( x, y, x + dx, y + dy, x1, y1, x2, y2 );
}

function getLineIntersection( x1, y1, x2, y2, x3, y3, x4, y4 ) {
  const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );

  if ( D != 0 ) {
    const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
    const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;

    // Bounds check uB here so we can just return uA
    if ( 0 <= uA && uA <= 1 && 0 <= uB && uB <= 1 ) {
      return uA;
    }
    // return {
    //   uA: uA,
    //   uB: uB,
    //   // position: {
    //   //   x: x1 + ( x2 - x1 ) * uA,
    //   //   y: y1 + ( y2 - y1 ) * uA,
    //   // }
    // }
  }

  return Infinity;
}
