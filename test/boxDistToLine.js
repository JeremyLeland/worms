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
  pos: [ 17.4, 16.4 ],
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


  ctx.lineWidth = 0.1;

  const x = player.pos[ 0 ];
  const y = player.pos[ 1 ];
  const minX = x - player.radius;
  const maxX = x + player.radius;
  const minY = y - player.radius;
  const maxY = y + player.radius;

  const best = {
    dist: Infinity,
  };

  const testLeft   = Math.floor( minX - 1 );
  const testTop    = Math.floor( minY - 1 );
  const testRight  = Math.floor( maxX + 1 );
  const testBottom = Math.floor( maxY + 1 );

  for ( let testRow = testTop; testRow <= testBottom; testRow ++ ) {
    for ( let testCol = testLeft; testCol <= testRight; testCol ++ ) {

      if ( map.data[ testCol + testRow * map.cols ] !== 0 ) {
        if ( minY < testRow + 1 && testRow < maxY ) {
          if ( testCol < x ) {
            const xDist = minX - ( testCol + 1 );
            
            ctx.strokeStyle = xDist < 0 ? 'red' : 'lime';
            Util.drawLine( ctx, [ testCol + 1, testRow + 0.5 ], [ testCol + 1 + xDist, testRow + 0.5 ] );

            if ( Math.abs( xDist ) < Math.abs( best.dist ) ) {
              best.dist = xDist;
              best.normal = [ 1, 0 ];
            }
          }
          else {
            const xDist = testCol - maxX;
            
            ctx.strokeStyle = xDist < 0 ? 'red' : 'lime';
            Util.drawLine( ctx, [ testCol, testRow + 0.5 ], [ testCol - xDist, testRow + 0.5 ] );

            if ( Math.abs( xDist ) < Math.abs( best.dist ) ) {
              best.dist = xDist;
              best.normal = [ -1, 0 ];
            }
          }
        }

        if ( minX < testCol + 1 && testCol < maxX ) {
          if ( testRow < y ) {
            const yDist = minY - ( testRow + 1 );
            
            ctx.strokeStyle = yDist < 0 ? 'red' : 'lime';
            Util.drawLine( ctx, [ testCol + 0.5, testRow + 1 ], [ testCol + 0.5, testRow + 1 + yDist ] );
            
            if ( Math.abs( yDist ) < Math.abs( best.dist ) ) {
              best.dist = yDist;
              best.normal = [ 0, 1 ];
            }
          }
          else {
            const yDist = testRow - maxY;

            ctx.strokeStyle = yDist < 0 ? 'red' : 'lime';
            Util.drawLine( ctx, [ testCol + 0.5, testRow ], [ testCol + 0.5, testRow - yDist ] );
            
            if ( Math.abs( yDist ) < Math.abs( best.dist ) ) {
              best.dist = yDist;
              best.normal = [ 0, -1 ];
            }
          }
        }
      }
      
    }
  }

  if ( best.dist < Infinity ) { 
    ctx.fillStyle = '#fff4';
    ctx.fillRect( minX - best.dist * best.normal[ 0 ], minY - best.dist * best.normal[ 1 ], player.radius * 2, player.radius * 2 );
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
