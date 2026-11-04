// Take into account areas above, below, and to sides of us
// Not just vertex...we care about some parts and not others
// Keep the idea, but be less focused on the vertex types?
// Also allow movement through air

import * as MaskMap from '../src/MaskMap.js';

import { GameCanvas } from '../src/common/GameCanvas.js';
import * as Util from '../src/common/Util.js';
import { vec2 } from '../lib/gl-matrix.js';


const map = MaskMap.create( 160, 120, 1 );

MaskMap.setTerrainCircle( map, 30, 30, 30, 0 );
MaskMap.setTerrainCircle( map, 80, 40, 60, 0 );
MaskMap.setTerrainCircle( map, 120, 60, 30, 0 );

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


gameCanvas.update = ( dt ) => {
  const minX = player.pos[ 0 ] - player.radius;
  const minY = player.pos[ 1 ] - player.radius;
  const maxX = player.pos[ 0 ] + player.radius;
  const maxY = player.pos[ 1 ] + player.radius;

  const left   = Math.round( minX );
  const top    = Math.round( minY );
  const right  = Math.round( maxX );
  const bottom = Math.round( maxY );

  const toLeft   = minX - left;
  const toTop    = minY - top
  const toRight  = right - maxX;
  const toBottom = bottom - maxY;

  let hasLeft = false;
  let hasTop = false;
  let hasRight = false;
  let hasBottom = false;

  for ( let y = top; y < bottom && !hasLeft; y ++ ) {
    hasLeft = !!MaskMap.getTerrain( map, left - 1, y );
  }

  for ( let x = left; x < right && !hasTop; x ++ ) {
    hasTop = !!MaskMap.getTerrain( map, x, top - 1 );
  }

  for ( let y = top; y < bottom && !hasRight; y ++ ) {
    hasRight = !!MaskMap.getTerrain( map, right, y );
  }

  for ( let x = left; x < right && !hasBottom; x ++ ) {
    hasBottom = !!MaskMap.getTerrain( map, x, bottom );
  }

  const SW = MaskMap.getTerrain( map, left - 1, bottom );
  const SE = MaskMap.getTerrain( map, right, bottom );

  const dir = player.isMovingLeft ? -1 : player.isMovingRight ? 1 : 0;

  const hasFront = dir < 0 ? hasLeft : hasRight;
  const hasBack  = dir < 0 ? hasRight : hasLeft;

  const toFront = dir < 0 ? toLeft : toRight;
  const toBack  = dir < 0 ? toRight : toLeft;

  const frontCorner = dir < 0 ? SW : SE;
  const backCorner  = dir < 0 ? SE : SW;

  const frontIndex = dir < 0 ? left - 1 : right;
  const backIndex  = dir < 0 ? right : left - 1;


  const PlayerMove = 0.02 * dt;


  if ( dir !== 0 ) {
  
    // Climbing down long wall behind us (shouldn't happen in game, but enabling for testing)
    if ( hasBack && !hasBottom ) {
      console.log( `Climbing down long wall behind us (shouldn't happen in game, but enabling for testing)` );

      player.pos[ 0 ] -= dir * toBack;
      player.pos[ 1 ] += PlayerMove;
    }
    
    // Climbing down inner corner behind us
    else if ( hasBack && hasBottom /* && SE */ ) {
      console.log( `Climbing down inner corner behind us` );

      const moveDown = Math.max( 0, Math.min( toBottom, PlayerMove ) );

      if ( toBottom > 0 && toBack < toBottom ) {
        player.pos[ 0 ] -= dir * toBack;
        player.pos[ 1 ] += moveDown;
      }
      else {
        player.pos[ 0 ] += dir * Math.max( 0, toFront );
        player.pos[ 1 ] += toBottom;
      }

      player.pos[ 0 ] += dir * ( PlayerMove - moveDown );
    }
    
    // Climbing up inner corner in front of us
    else if ( MaskMap.getTerrain( map, frontIndex, bottom - 1 ) && hasBottom ) {
      console.log( `Climbing up inner corner in front of us` );

      const moveForward = Math.max( 0, Math.min( toFront, PlayerMove ) );

      // "toBottom < toFront" handles where we're actually close to top
      if ( toFront > 0 && toBottom < toFront ) {
        player.pos[ 1 ] += toBottom;
        player.pos[ 0 ] += dir * moveForward;
      }
      else {
        player.pos[ 0 ] += dir * toFront;
        player.pos[ 1 ] -= Math.max( 0, toTop );
      }

      // only climb up if it's exactly 1 up
      let canClimbForward = !hasTop;

      for ( let y = top; y < bottom - 1 && canClimbForward; y ++ ) {
        canClimbForward = !MaskMap.getTerrain( map, frontIndex, y );
      }

      if ( canClimbForward ) {
        player.pos[ 1 ] -= PlayerMove - moveForward;
      }
    }

    // Climbing up over outer corner in front of us
    else if ( !hasFront && !hasBottom && frontCorner ) {
      console.log( `Climbing up over outer corner in front of us` );

      const moveUp = Math.max( 0, Math.min( toTop, PlayerMove ) );

      // "toBottom < toLeft" handles overlap
      if ( toTop > 0 && toBottom < toFront ) {
        player.pos[ 0 ] += dir * toFront;
        player.pos[ 1 ] -= moveUp;
      }
      else {
        player.pos[ 0 ] += dir * Math.max( 0, toFront );
        player.pos[ 1 ] += toBottom;
      }

      player.pos[ 0 ] += dir * ( PlayerMove - moveUp );
    }

    // Starting over the edge of an outer corner behind us
    else if ( !hasRight && !hasBottom && backCorner ) {
      console.log( `Starting over the edge of an outer corner behind us` );

      const moveForward = Math.max( 0, Math.min( toFront, PlayerMove ) );

      if ( toFront > 0 && toBack < toBottom ) {
        player.pos[ 0 ] += dir * moveForward;
        player.pos[ 1 ] += toBottom;
      }
      else {
        player.pos[ 0 ] -= dir * toBack;
        player.pos[ 1 ] += Math.max( 0, toBottom );
      }

      // only climb down if it's exactly 1 down
      if ( MaskMap.getTerrain( map, backIndex + dir, bottom + 1 ) ) {
        player.pos[ 1 ] += PlayerMove - moveForward;
      }
    }

    else {
      console.log( `Moving forward` );

      // Flat floor
      if ( hasBottom ) {
        player.pos[ 1 ] += toBottom;
      }

      const moveForward = hasFront ? Math.max( 0, Math.min( toFront, PlayerMove ) ) : PlayerMove;
      player.pos[ 0 ] += dir * moveForward;
    }
  }
}

gameCanvas.draw = ( ctx ) => {

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage( backgroundImage, 0, 0 );
  
  MaskMap.makeMaskTransparent( foregroundCtx, map, 0 );
  ctx.drawImage( foregroundImage, 0, 0 );
  
  ctx.lineWidth = 0.1;

  ctx.fillStyle = '#aaaa';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );
}

gameCanvas.start();

document.addEventListener( 'keydown', e => {
  player.isMovingLeft = e.key == 'a';
  player.isMovingRight = e.key == 'd';

  // gameCanvas.redraw();
} );

document.addEventListener( 'keyup', e => {
  player.isMovingLeft = false;
  player.isMovingRight = false;
} );

function pointerInput( e ) {
  mousePos[ 0 ] = gameCanvas.getX( e.x );
  mousePos[ 1 ] = gameCanvas.getY( e.y );

  if ( e.buttons === 2 ) {
    vec2.copy( player.pos, mousePos );
    
    // gameCanvas.redraw();
  }
}

document.addEventListener( 'pointermove', pointerInput );
document.addEventListener( 'pointerdown', pointerInput );
