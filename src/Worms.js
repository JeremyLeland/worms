import * as Collisions from '../src/common/Collisions.js';
import * as Util from '../src/common/Util.js';

import { vec2 } from '../lib/gl-matrix.js';

export function drawEntities( ctx, entities ) {
  entities.forEach( entity => {
    if ( entity.type === 'player' ) {
      if ( entity.rope ) {
        drawRope( ctx, entity.pos, entity.rope.pos );
      }
      
      ctx.fillStyle = 'green';
      Util.drawPoint( ctx, entity.pos, entity.radius );
    }
    else if ( entity.type === 'bullet' ) {
      ctx.fillStyle = 'white';
      Util.drawPoint( ctx, entity.pos, entity.radius );
    }
    else if ( entity.type === 'casing' ) {
      ctx.save(); {
        ctx.translate( ...entity.pos );
        ctx.rotate( entity.rot );

        ctx.fillStyle = 'tan';
        ctx.fillRect( -1, -0.5, 2, 1 );
      }
      ctx.restore();
    }
    else if ( entity.type === 'rope' ) {
      const parent = entities.find( e => e.id === entity.parentId );
      if ( parent ) {
        drawRope( ctx, parent.pos, entity.pos );
      }
    }
  } );
}

function drawRope( ctx, from, to ) {
  ctx.fillStyle = ctx.strokeStyle = 'yellow';
  Util.drawPoint( ctx, to, 1 );

  ctx.lineWidth = 0.4;
  Util.drawLine( ctx, from, to );
  // Util.drawLinePixel( ctx, from, to );
}

export function getTouch( map, entity, debugCtx ) {
  const best = {
    dist: Infinity,
  };

  const x = entity.pos[ 0 ];
  const y = entity.pos[ 1 ];
  const r = entity.radius;
  const minX = x - r;
  const maxX = x + r;
  const minY = y - r;
  const maxY = y + r;

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

            if ( debugCtx ) {
              debugCtx.strokeStyle = xDist < 0 ? 'red' : 'lime';
              Util.drawLine( debugCtx, [ testCol + 1, testRow + 0.5 ], [ testCol + 1 + xDist, testRow + 0.5 ] );
            }
            
            if ( 0 < Math.abs( xDist ) && Math.abs( xDist ) < Math.abs( best.dist ) ) {
              best.dist = xDist;
              best.normal = [ 1, 0 ];
            }
          }
          else {
            const xDist = testCol - maxX;

            if ( debugCtx ) {
              debugCtx.strokeStyle = xDist < 0 ? 'red' : 'lime';
              Util.drawLine( debugCtx, [ testCol, testRow + 0.5 ], [ testCol - xDist, testRow + 0.5 ] );
            }
            
            if ( 0 < Math.abs( xDist ) && Math.abs( xDist ) < Math.abs( best.dist ) ) {
              best.dist = xDist;
              best.normal = [ -1, 0 ];
            }
          }
        }

        if ( minX < testCol + 1 && testCol < maxX ) {
          if ( testRow < y ) {
            const yDist = minY - ( testRow + 1 );

            if ( debugCtx ) {
              debugCtx.strokeStyle = yDist < 0 ? 'red' : 'lime';
              Util.drawLine( debugCtx, [ testCol + 0.5, testRow + 1 ], [ testCol + 0.5, testRow + 1 + yDist ] );
            }
            
            if ( 0 < Math.abs( yDist ) && Math.abs( yDist ) < Math.abs( best.dist ) ) {
              best.dist = yDist;
              best.normal = [ 0, 1 ];
            }
          }
          else {
            const yDist = testRow - maxY;

            if ( debugCtx ) {
              debugCtx.strokeStyle = yDist < 0 ? 'red' : 'lime';
              Util.drawLine( debugCtx, [ testCol + 0.5, testRow ], [ testCol + 0.5, testRow - yDist ] );
            }

            if ( 0 < Math.abs( yDist ) && Math.abs( yDist ) < Math.abs( best.dist ) ) {
              best.dist = yDist;
              best.normal = [ 0, -1 ];
            }
          }
        }
      }
    }
  }

  return best;
}

export function getHit( map, entity, dt, testFunc, debugCtx ) {
  // console.log( ' getHit' );

  let bestHit = {
    time: Infinity,
    line: null,
  };

  const goalPos = vec2.scaleAndAdd( [], entity.pos, entity.vel, dt );

  // Show which grids we need to check
  const testLeft   = Math.floor( Math.min( entity.pos[ 0 ], goalPos[ 0 ] ) - entity.radius );
  const testTop    = Math.floor( Math.min( entity.pos[ 1 ], goalPos[ 1 ] ) - entity.radius );
  const testRight  = Math.floor( Math.max( entity.pos[ 0 ], goalPos[ 0 ] ) + entity.radius );
  const testBottom = Math.floor( Math.max( entity.pos[ 1 ], goalPos[ 1 ] ) + entity.radius );

  // TODO: Would it ever make sense to throw out values that are outside of blue move line?
  //       Most moves are probably small enough that it wouldn't matter much
  //       Could potentially make a difference if bullets are moving fast
  //       Either way, curious if there's a quick way to throw these out based on distance from line
  //        - and how that compares to cost of checking

  // TODO: Would it make sense to test these in movement order so we bail early if we hit something?
  //        - Is it more expensive than testing all of them?

  for ( let testRow = testTop; testRow <= testBottom; testRow ++ ) {
    for ( let testCol = testLeft; testCol <= testRight; testCol ++ ) {

      if ( map.data[ testCol + testRow * map.cols ] === 0 ) {
        if ( debugCtx ) {
          debugCtx.fillStyle = '#0f04';
          debugCtx.fillRect( testCol, testRow, 1, 1 );
        }
      }
      else {
        if ( debugCtx ) {
          debugCtx.fillStyle = '#f004';
          debugCtx.fillRect( testCol, testRow, 1, 1 );
        }

        // Test walls
        const lines = [];

        if ( entity.vel[ 0 ] > 0 )  lines.push( [ testCol, testRow + 1, testCol, testRow ] );         // left
        if ( entity.vel[ 1 ] > 0 )  lines.push( [ testCol, testRow, testCol + 1, testRow ] );         // top
        if ( entity.vel[ 0 ] < 0 )  lines.push( [ testCol + 1, testRow, testCol + 1, testRow + 1 ] ); // right
        if ( entity.vel[ 1 ] < 0 )  lines.push( [ testCol + 1, testRow + 1, testCol, testRow + 1 ] ); // bottom
        
        lines.forEach( line => {
          // const hitTime = Collisions.timeToCircleHitLine( x, y, dx, dy, r, ...line );
          const hitTime = testFunc( entity, line );

          // if ( hitTime < Infinity ) {
          //   console.log( '  hitTime for ', line, ' is ', hitTime );
          // }

          // Make sure hitTime is within our update window, helps avoid other weirdness
          if ( hitTime < bestHit.time && hitTime < dt ) {
            bestHit.time = hitTime;
            bestHit.line = line;
          }

          if ( debugCtx ) {
            if ( hitTime < Infinity ) {
              const val = ( 1 - hitTime ) * 255;

              debugCtx.strokeStyle = `rgb( 128, ${ val }, 255 )`;
              debugCtx.lineWidth = 0.1;
              Util.drawLine2( debugCtx, line, true );
            }
          }
        } );
      }
    }
  }

  // console.log( ' bestHit = ', bestHit.line );

  return bestHit;
}