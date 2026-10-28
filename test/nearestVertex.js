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

  
  ctx.lineWidth = 0.1;

  const minX = player.pos[ 0 ] - player.radius;
  const minY = player.pos[ 1 ] - player.radius;
  const maxX = player.pos[ 0 ] + player.radius;
  const maxY = player.pos[ 1 ] + player.radius;

  const  W = [ Math.round( minX ), Math.round( maxY - 1 ) ];
  const SW = [ Math.round( minX ), Math.round( maxY ) ];
  const SE = [ Math.round( maxX ), Math.round( maxY ) ];
  const  E = [ Math.round( maxX ), Math.round( maxY - 1 ) ];

  const typeSW = getType( ...SW );
  const typeSE = getType( ...SE );

  console.log( typeSW.toString( 2 ).padStart( 4, 0 ), typeSE.toString( 2 ).padStart( 4, 0 ) );

  const PlayerMove = 0.4;

  if ( player.isMovingLeft ) {

    // Climbing down long wall (shouldn't happen in game, but enabling for testing)
    if ( typeSE === 0b0101 ) {
      player.pos[ 1 ] += PlayerMove;
    }

    // Climbing down inner corner behind us
    else if ( typeSE === 0b0111 ) {
      const toBottom = SE[ 1 ] - ( player.pos[ 1 ] + player.radius );

      player.pos[ 1 ] += toBottom;
      player.pos[ 0 ] -= PlayerMove - toBottom;
    }

    // Inner corner
    else if ( typeSW === 0b1011 ) {
      const toLeft = player.pos[ 0 ] - player.radius - SW[ 0 ];

      player.pos[ 0 ] -= toLeft;
      player.pos[ 1 ] -= PlayerMove - toLeft;
    }

    // Flat floor
    else if ( typeSW === 0b0011 || typeSE === 0b0011 ) {
      player.pos[ 0 ] -= PlayerMove;
    }

    // Outer corner
    else if ( typeSW === 0b0010 ) {
      const toTop = player.pos[ 1 ] + player.radius - SW[ 1 ];

      player.pos[ 1 ] -= toTop;
      player.pos[ 0 ] -= PlayerMove - toTop;
    }

    // Starting over the edge of an inner corner behind us
    else if ( typeSE === 0b0001 ) {
      const toLeft = player.pos[ 0 ] + player.radius - SE[ 0 ];

      player.pos[ 0 ] -= toLeft;
      player.pos[ 1 ] += PlayerMove - toLeft;
    }
  }
  else if ( player.isMovingRight ) {

    // Climbing down long wall (shouldn't happen in game, but enabling for testing)
    if ( typeSW === 0b1010 ) {
      player.pos[ 1 ] += PlayerMove;
    }

    // Climbing down inner corner behind us
    else if ( typeSW === 0b1011 ) {
      const toBottom = SW[ 1 ] - ( player.pos[ 1 ] + player.radius );

      player.pos[ 1 ] += toBottom;
      player.pos[ 0 ] += PlayerMove - toBottom;
    }

    // Inner corner
    else if ( typeSE === 0b0111 ) {
      const toRight = SE[ 0 ] - ( player.pos[ 0 ] + player.radius );

      player.pos[ 0 ] += toRight;
      player.pos[ 1 ] -= PlayerMove - toRight;
    }

    // Outer corner
    else if ( typeSE === 0b0001 ) {
      const toTop = player.pos[ 1 ] + player.radius - SE[ 1 ];

      player.pos[ 1 ] -= toTop;
      player.pos[ 0 ] += PlayerMove - toTop;
    }

    // Starting over the edge of an inner corner behind us
    else if ( typeSW === 0b0010 ) {
      const toRight = SW[ 0 ] - ( player.pos[ 0 ] - player.radius );

      player.pos[ 0 ] += toRight;
      player.pos[ 1 ] += PlayerMove - toRight;
    }

    // Flat floor
    else if ( typeSW === 0b0011 || typeSE === 0b0011 ) {
      player.pos[ 0 ] += PlayerMove;
    }
  }

  ctx.fillStyle = 'green';
  ctx.fillRect( player.pos[ 0 ] - player.radius, player.pos[ 1 ] - player.radius, player.radius * 2, player.radius * 2 );

  ctx.strokeStyle = 'white';
  Util.drawLine( ctx, [ minX, maxY ], SW );
  Util.drawLine( ctx, [ maxX, maxY ], SE );

  ctx.fillStyle = 'white';
  Util.drawPoint( ctx, SW, 0.1 );
  Util.drawPoint( ctx, SE, 0.1 );

}

function getType( col, row ) {
  return MaskMap.getTerrain( map, col - 1, row - 1 ) << 3 |
         MaskMap.getTerrain( map, col    , row - 1 ) << 2 |
         MaskMap.getTerrain( map, col - 1, row     ) << 1 |
         MaskMap.getTerrain( map, col    , row     );
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
