export class KeyInput {
  Keys;
  Actions;

  #callback;

  constructor( callback = () => {} ) {
    document.addEventListener( 'keydown', e => this.handleKeyInput( e, true  ) );
    document.addEventListener( 'keyup',   e => this.handleKeyInput( e, false ) );

    this.#callback = callback;
  }

  handleKeyInput( e, isDown ) {
    for ( const action in this.Keys ) {
      if ( e.key === this.Keys[ action ] ) {
        this.Actions[ action ]( isDown );
      }
    }

    this.#callback();
  }

}


