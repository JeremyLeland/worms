// Try a trail made up of particles that shrink over time
// This avoids increasing/decreasing length calculations
// ...but potentially has jittery tail
//      - fixed by checking line collisions! Looks pretty good, I think

import * as Collisions from '../../src/common/Collisions.js';
import { GameCanvas } from '../../src/common/GameCanvas.js';
import { vec2 } from '../../lib/gl-matrix.js';


const trail = [];

for ( let i = 1; i < 10; i ++ ) {
  trail.unshift(
    {
      pos: [ i * 10, i * 10 ],
      vel: [ 1, 1 ],
      life: i * 1000,
    }
  );
}

const gameCanvas = new GameCanvas();
gameCanvas.setBounds( 0, 0, 100, 100 );

gameCanvas.update = ( dt ) => {
  trail.forEach( part => part.life -= dt );

  const firstNegative = trail.findIndex( e => e.life < 0 );

  if ( firstNegative > -1 ) {
    trail.splice( firstNegative + 1 );
  }
}

gameCanvas.draw = ( ctx ) => {

  ctx.fillStyle = "#123";
  ctx.fillRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

  ctx.lineWidth = 0.2;

  // NOTE: store rightPoints in reverse (so we can draw them in order when completing second half of path)
  const leftPoints = [];
  const rightPoints = [];

  for ( let i = 0; i < trail.length; i ++ ) {
    const part = trail[ i ];

    const normal = [ -part.vel[ 1 ], part.vel[ 0 ] ];
    vec2.normalize( normal, normal );

    const radius = part.life / 1000;

    // Util.drawPoint( ctx, part.pos, part.life / 1000 );

    const left  = vec2.scaleAndAdd( [], part.pos, normal, -radius );
    const right = vec2.scaleAndAdd( [], part.pos, normal, radius );

    if ( part.life < 0 ) {
      if ( trail.length > 1 ) {

        // ctx.strokeStyle = 'orange';
        // Util.drawLine( ctx, right, rightPoints.at( 0 ) );
        // ctx.strokeStyle = 'yellow';
        // Util.drawLine( ctx, left, leftPoints.at( -1 ) );

        // NOTE: Right points are stored in reverse, so use first instead of last
        const end = Collisions.getLineIntersection( ...left, ...leftPoints.at( -1 ), ...rightPoints.at( 0 ), ...right );

        if ( end ) {
          leftPoints.push( end );

          // ctx.fillStyle = 'red';
          // Util.drawPoint( ctx, end, 0.3 );
        }
      }
    }
    else {
      leftPoints.push( left );
      rightPoints.unshift( right );

      // ctx.fillStyle = 'green';
      // Util.drawPoint( ctx, left, 1 );
      // ctx.fillStyle = 'red';
      // Util.drawPoint( ctx, right, 1 );

      // ctx.strokeStyle = part.life < 0 ? 'red' : 'gray';
      // Util.drawLine( ctx, left, right );
    }
  }

  ctx.beginPath();
  leftPoints.forEach( p => ctx.lineTo( ...p ) );
  rightPoints.forEach( p => ctx.lineTo( ...p ) );

  ctx.fillStyle = '#aaaa';
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.stroke();
}


function pointerInput( e ) {
  const newPos = vec2.fromValues(
    gameCanvas.getX( e.x ),
    gameCanvas.getY( e.y ),
  );

  trail.unshift(
    {
      pos: newPos,
      vel: vec2.subtract( [], newPos, trail[ 0 ].pos ),
      life: 3000,
    }
  );
}

document.addEventListener( 'pointerdown', pointerInput );
document.addEventListener( 'pointermove', pointerInput );

gameCanvas.start();
