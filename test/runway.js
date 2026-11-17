import { GameCanvas } from '../src/common/GameCanvas.js';

const gameCanvas = new GameCanvas();
gameCanvas.setBounds( -3, -3, 3, 3 );

gameCanvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.01;

  // ctx.moveTo( -1, 0.5 );
  // ctx.lineTo( 0, 1 );
  // ctx.lineTo( 1, 0.5 );
  // ctx.lineTo( -0.7, -0.25 );
  // ctx.lineTo( 0, -0.6 );
  // ctx.lineTo( 0.5, -0.3 );
  // ctx.lineTo( 1, -0.5 );

  // https://patheditor.dev/ is a handy tool for making these
  // M -0.56 0.48 C -0.26 0.91 0.51 0.67 0.5 0.48 C 0.51 0.29 0.35 0.05 0.11 0.03 C -0.4 -0.08 -0.34 -0.53 -0.01 -0.43 C 0.28 -0.33 0.71 -0.11 0.71 -0.43 C 0.7 -0.81 0.23 -1.05 -0.45 -0.8 C -0.84 -0.63 -0.81 -0.19 -0.39 0.01 C 0.29 0.26 0.3 0.43 0.19 0.5 C -0.02 0.59 -0.14 0.61 -0.56 0.48

  ctx.moveTo( -1, 0 );
  ctx.bezierCurveTo( -1,1.5, 1,1.5, 1,0 );

  ctx.moveTo( 0, 0 );
  ctx.bezierCurveTo( 0,1, -1,1, -1,0 );

  ctx.strokeStyle = 'salmon';
  ctx.stroke();


  ctx.strokeStyle = 'gray';
  ctx.strokeRect( -1, -1, 2, 2 );

  ctx.fillStyle = 'gray';
  ctx.fillRect( -0.01, -0.01, 0.02, 0.02 );
}