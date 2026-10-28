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