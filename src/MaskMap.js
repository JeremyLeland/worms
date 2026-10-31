export function create( cols, rows, defaultValue = 0 ) {
  return {
    cols: cols,
    rows: rows,
    data: Array( cols * rows ).fill( defaultValue ),
  }
}

export function getTerrain( map, x, y ) {
  const col = Math.floor( x );
  const row = Math.floor( y );
  
  if ( 0 <= col && col < map.cols && 0 <= row && row < map.rows ) {
    const mapIndex = col + row * map.cols;
    return map.data[ mapIndex ];
  }
  else {
    return Infinity;
  }
}

export const Vertex = {
  North: 0b1100,
  South: 0b0011,
  East:  0b0101,
  West:  0b1010,

  InnerSE: 0b0111,
  InnerSW: 0b1011,
  InnerNE: 0b1101,
  InnerNW: 0b1110,

  OuterNW: 0b1000,
  OuterNE: 0b0100,
  OuterSW: 0b0010,
  OuterSE: 0b0001,

  NW_SE: 0b1001,
  NE_SW: 0b0110,
};

export function getVertex( map, x, y ) {
  const col = Math.round( x );
  const row = Math.round( y );

  return getTerrain( map, col - 1, row - 1 ) << 3 |
         getTerrain( map, col    , row - 1 ) << 2 |
         getTerrain( map, col - 1, row     ) << 1 |
         getTerrain( map, col    , row     );
}

export function setTerrain( map, x, y, value ) {
  const col = Math.floor( x );
  const row = Math.floor( y );

  if ( 0 <= col && col < map.cols && 0 <= row && row < map.rows ) {
    const mapIndex = col + row * map.cols;
    map.data[ mapIndex ] = value;
  }
}

export function setTerrainCircle( map, cx, cy, radius, value ) {
  for ( let y = cy - radius; y < cy + radius; y ++ ) {
    for ( let x = cx - radius; x < cx + radius; x ++ ) {
      if ( Math.hypot( x - cx, y - cy ) < radius ) {
        setTerrain( map, x, y, value );
      }
    }
  }
}

export function setTerrainRect( map, left, top, width, height, value ) {
  for ( let y = top; y < top + height; y ++ ) {
    for ( let x = left; x < left + width; x ++ ) {
      setTerrain( map, x, y, value );
    }
  }
}

export function makeMaskTransparent( ctx, map, maskValue ) {
  const imageData = ctx.getImageData( 0, 0, map.cols, map.rows );
  const data = imageData.data;
  
  // Leave image alone, just toggle transparency
  map.data.forEach( ( value, index ) => {
    data[ 4 * index + 3 ] = value === maskValue ? 0 : 255;
  } );

  ctx.putImageData( imageData, 0, 0 );
}