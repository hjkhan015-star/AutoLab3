/* part-canvas.js — a CanvasTexture painted by a draw callback (road asphalt, tyre tread, tread plate, balancer dial …).
   One builder for every page; the caller passes THREE and decides the texture options. Release with disposeCanvasTexture. */

/** A w × h canvas, painted by draw(ctx, w, h) when a draw callback is given (no 2-D context is requested otherwise). */
export function paintCanvas(w, h, draw = null) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  if (draw) draw(c.getContext('2d'), w, h);
  return c;
}

/** Wrap a canvas in a CanvasTexture.
    opts: { srgb = true (false → NoColorSpace for data maps), wrap = false (RepeatWrapping on both axes), repeat = null ([x, y]), anisotropy = 0 (0 = leave the default) }. */
export function textureFromCanvas(THREE, canvas, { srgb = true, wrap = false, repeat = null, anisotropy = 0 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) { if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace; }
  else tex.colorSpace = THREE.NoColorSpace;
  if (wrap) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (repeat) tex.repeat.set(repeat[0], repeat[1]);
  if (anisotropy) tex.anisotropy = anisotropy;
  return tex;
}

/** Paint a w × h canvas with draw(ctx, w, h) and wrap it in a CanvasTexture (options as textureFromCanvas). */
export function canvasTexture(THREE, w, h, draw, opts) {
  return textureFromCanvas(THREE, paintCanvas(w, h, draw), opts);
}

/** Release the texture and drop its canvas. */
export function disposeCanvasTexture(tex) {
  tex.dispose();
  if (tex.image) { tex.image.width = tex.image.height = 0; }
}
