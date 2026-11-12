import * as MaskMap from '../src/MaskMap.js';
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
        ctx.scale( entity.radius, entity.radius );

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

export function getTouch( map, entity, touchDist, debugCtx ) {
  const closest = {
    dist: touchDist,
  };

  const minX = entity.pos[ 0 ] - entity.radius;
  const minY = entity.pos[ 1 ] - entity.radius;
  const maxX = entity.pos[ 0 ] + entity.radius;
  const maxY = entity.pos[ 1 ] + entity.radius;
  
  const testLeft = Math.floor( minX - touchDist );
  const testTop  = Math.floor( minY - touchDist );
  const testRight = Math.floor( maxX + touchDist );
  const testBottom = Math.floor( maxY + touchDist );
  
  for ( let testRow = testTop; testRow <= testBottom; testRow ++ ) {
    for ( let testCol = testLeft; testCol <= testRight; testCol ++ ) {
      
      if ( MaskMap.getTerrain( map, testCol, testRow ) ) {
        
        // TODO: Make this a constant array of lines with offsets, and add testCol/testRow in below?
        const lines = [
          [ testCol, testRow + 1, testCol, testRow ],         // left
          [ testCol, testRow, testCol + 1, testRow ],         // top
          [ testCol + 1, testRow, testCol + 1, testRow + 1 ], // right
          [ testCol + 1, testRow + 1, testCol, testRow + 1 ], // bottom
        ];

        lines.forEach( line => {
          
          const [ x, y ] = entity.pos;
          const [ x1, y1, x2, y2 ] = line;

          const px = x2 - x1;
          const py = y2 - y1;
          const D = ( px * px ) + ( py * py );

          const t = D === 0 ? 0 : Math.max( 0, Math.min( 1, ( ( x - x1 ) * px + ( y - y1 ) * py ) / D ) );

          const closestX = x1 + t * px;
          const closestY = y1 + t * py;

          const dist = Math.hypot( x - closestX, y - closestY ) - entity.radius;

          if ( dist < closest.dist ) {
            closest.dist = dist;
            closest.pos = [ closestX, closestY ];
          }
        } );
      }
    }
  }

  return closest;
}

export function getHit( map, entity, dt, debugCtx ) {
  // console.log( ' getHit' );

  let bestHit = {
    time: Infinity,
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
        const [ x, y ] = entity.pos;
        const [ dx, dy ] = entity.vel;
        const r = entity.radius;

        // TODO: Make this a constant array of lines with offsets, and add testCol/testRow in below?
        const lines = [
          [ testCol, testRow + 1, testCol, testRow ],         // left
          [ testCol, testRow, testCol + 1, testRow ],         // top
          [ testCol + 1, testRow, testCol + 1, testRow + 1 ], // right
          [ testCol + 1, testRow + 1, testCol, testRow + 1 ], // bottom
        ];

        lines.forEach( line => {
          const hitTime = Collisions.timeToCircleHitLine( x, y, dx, dy, r, ...line );

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