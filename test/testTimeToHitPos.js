// Detour from walking to see if I can get proper bouncing and rolling
// I'm wondering if movement will end up being closer to this
//  - with some slight control at shallower slopes

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

const map = MaskMap.create( 160, 120, 1 );

MaskMap.setTerrainCircle( map, 30, 30, 30, 0 );
MaskMap.setTerrainCircle( map, 80, 40, 60, 0 );
MaskMap.setTerrainCircle( map, 120, 60, 30, 0 );

MaskMap.setTerrainCircle( map, 40, 40, 10, 1 );
MaskMap.setTerrainCircle( map, 74, 50, 30, 1 );
MaskMap.setTerrainCircle( map, 100, 45, 20, 1 );

let player = {
  type: 'player',
  id: 'player1',
  pos: [ 80, 92 ],
  vel: [ 0, 0 ],
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



const mousePos = [ 78, 92 ];





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

  ctx.fillStyle = '#fff8';
  Util.drawPoint( ctx, player.pos, player.radius );

  vec2.subtract( player.vel, mousePos, player.pos );

  const newPos = vec2.add( [], player.pos, player.vel );

  ctx.lineWidth = 0.1;
  ctx.strokeStyle = 'cyan';
  Util.drawLine( ctx, player.pos, newPos );

  ctx.fillStyle = '#f004';
  Util.drawPoint( ctx, newPos, player.radius );

  const bestHit = Worms.getHit( map, player, 1, ctx );

  console.log( bestHit );

  if ( bestHit.time < Infinity ) { 
    const stopPos = vec2.scaleAndAdd( [], player.pos, player.vel, bestHit.time );
    
    ctx.fillStyle = '#ff08';
    Util.drawPoint( ctx, stopPos, player.radius );
    
    Util.drawLine2( ctx, bestHit.line, true );
    
    ctx.fillStyle = 'white';
    Util.drawPoint( ctx, bestHit.pos, 0.5 );
  }
}



function pointerInput( e ) {
  mousePos[ 0 ] = gameCanvas.getX( e.x );
  mousePos[ 1 ] = gameCanvas.getY( e.y );

  if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );

  }

  gameCanvas.redraw();
}

document.addEventListener( 'pointerdown', pointerInput );
document.addEventListener( 'pointermove', pointerInput );

// gameCanvas.start();
