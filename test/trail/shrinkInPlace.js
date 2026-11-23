// Try a trail made up of particles that shrink over time
// This avoids increasing/decreasing length calculations
// ...but potentially has jittery tail

import * as Worms from '../../src/Worms.js';

import * as Collisions from '../../src/common/Collisions.js';
import { GameCanvas } from '../../src/common/GameCanvas.js';
import { KeyInput } from '../../src/common/KeyInput.js';
import * as Util from '../../src/common/Util.js';
import { vec2 } from '../../lib/gl-matrix.js';


const trail = [
  {
    pos: [ 30, 30 ],
    vel: [ 1, 1 ],
    life: 3000,
  },
  {
    pos: [ 20, 20 ],
    vel: [ 1, 1 ],
    life: 2000,
  },
  {
    pos: [ 10, 10 ],
    vel: [ 1, 1 ],
    life: 1000,
  },
];

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

  const points = [];

  for ( let i = trail.length - 1; i > 0; i -- ) {
    const part = trail[ i ];

    const normal = [ -part.vel[ 1 ], part.vel[ 0 ] ];
    vec2.normalize( normal, normal );

    const radius = part.life / 1000;

    // Util.drawPoint( ctx, part.pos, part.life / 1000 );

    // if ( part.life > 0 ) {
      const left  = vec2.scaleAndAdd( [], part.pos, normal, -radius );
      const right = vec2.scaleAndAdd( [], part.pos, normal, radius );

      points.unshift( left );
      points.push( right );

      // ctx.fillStyle = 'green';
      // Util.drawPoint( ctx, left, 1 );
      // ctx.fillStyle = 'red';
      // Util.drawPoint( ctx, right, 1 );

      // ctx.strokeStyle = part.life < 0 ? 'red' : 'gray';
      // Util.drawLine( ctx, left, right );
    // }
  }

  ctx.beginPath();
  points.forEach( p => ctx.lineTo( ...p ) );

  ctx.strokeStyle = '#aaaa';
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
