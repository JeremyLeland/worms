export class GameCanvas {
  backgroundColor = '#000';

  centerHorizontally = true;
  centerVertically = true;

  letterbox = true;

  #lastTime;
  #isAnimated = false;

  #bounds = [ -5, -5, 5, 5 ];

  #scale = 1;
  #offsetX = 0;
  #offsetY = 0;

  constructor( canvas ) {
    if ( canvas ) {
      this.canvas = canvas;
    }
    else {
      this.canvas = document.createElement( 'canvas' );
      document.body.appendChild( this.canvas );

      Object.assign( this.canvas.style, {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        touchAction: 'none',
        userSelect: 'none',
      } );
    }

    this.ctx = this.canvas.getContext( '2d' );

    this.canvas.oncontextmenu = () => { return false };

    //
    // Resize canvas
    //

    new ResizeObserver( _ => {
      const cssWidth = this.canvas.clientWidth;
      const cssHeight = this.canvas.clientHeight;

      this.canvas.width = cssWidth * devicePixelRatio;
      this.canvas.height = cssHeight * devicePixelRatio;

      this.#updateScaleAndOffsets();

      this.redraw();
    } ).observe( this.canvas );
  }

  setBounds( x1, y1, x2, y2 ) {
    this.#bounds[ 0 ] = x1;
    this.#bounds[ 1 ] = y1;
    this.#bounds[ 2 ] = x2;
    this.#bounds[ 3 ] = y2;

    this.#updateScaleAndOffsets();

    // TODO: Mouse X/Y should also update when we scroll
    //       (not an issue at the moment, but could come up in games that scroll without mouse moving)
  }

  #updateScaleAndOffsets() {
    const cssWidth = this.canvas.clientWidth;
    const cssHeight = this.canvas.clientHeight;

    const minWidth = this.#bounds[ 2 ] - this.#bounds[ 0 ];
    const minHeight = this.#bounds[ 3 ] - this.#bounds[ 1 ];

    const xScale = cssWidth / minWidth;
    const yScale = cssHeight / minHeight;

    this.#scale = Math.min( xScale, yScale );

    this.#offsetX = this.#bounds[ 0 ] + ( this.centerHorizontally ? ( minWidth - cssWidth / this.#scale ) / 2 : 0 );
    this.#offsetY = this.#bounds[ 1 ] + ( this.centerVertically ? ( minHeight - cssHeight / this.#scale ) / 2 : 0 );
  }


  //
  // Animation (update loop)
  //
  #animate = ( now ) => {
    this.#lastTime ??= now;
    this.update( Math.min( now - this.#lastTime, 100 ) );   // prevent large updates from delays
    this.#lastTime = now;

    this.redraw();

    if ( this.#isAnimated ) {
      requestAnimationFrame( this.#animate );
    }
  }

  start() {
    if ( !this.#isAnimated ) {
      this.#isAnimated = true;
      requestAnimationFrame( this.#animate );
    }
  }

  stop() {
    this.#isAnimated = false;
  }

  toggle() {
    if ( this.#isAnimated ) {
      this.stop();
    }
    else {
      this.start();
    }
  }

  //
  // Drawing
  //
  redraw() {
    // scaleX, skewY, skewX, scaleY, translateX, translateY
    this.ctx.setTransform( devicePixelRatio, 0, 0, devicePixelRatio, 0, 0 );

    this.ctx.scale( this.#scale, this.#scale );
    this.ctx.translate( -this.#offsetX, -this.#offsetY );

    const canvasWidth = this.canvas.clientWidth / this.#scale;
    const canvasHeight = this.canvas.clientHeight / this.#scale;

    if ( this.backgroundColor ) {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect( this.#offsetX, this.#offsetY, canvasWidth, canvasHeight );
    }
    else {
      this.ctx.clearRect( this.#offsetX, this.#offsetY, canvasWidth, canvasHeight );
    }

    this.ctx.save(); {
      this.draw( this.ctx, this.#bounds );
    }
    this.ctx.restore();

    if ( this.letterbox ) {
      this.ctx.fillStyle = 'black';

      this.ctx.fillRect( this.#bounds[ 0 ], this.#offsetY, this.#offsetX - this.#bounds[ 0 ], canvasHeight );
      this.ctx.fillRect( this.#bounds[ 2 ], this.#offsetY, this.#bounds[ 2 ] - this.#offsetX, canvasHeight );

      this.ctx.fillRect( this.#offsetX, this.#bounds[ 1 ], canvasWidth, this.#offsetY - this.#bounds[ 1 ] );
      this.ctx.fillRect( this.#offsetX, this.#bounds[ 3 ], canvasWidth, this.#bounds[ 3 ] - this.#offsetY );
    }
  }

  getX( pointerX ) {
    return pointerX / this.#scale + this.#offsetX;
  }

  getY( pointerY ) {
    return pointerY / this.#scale + this.#offsetY;
  }

  //
  // Users override these functions
  //
  update( dt ) {}
  draw( ctx ) {}
}
