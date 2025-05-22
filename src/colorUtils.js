//  Darkens color by a specified percentage "amount"
// Default, 30% darken
export function darkenColor(hex, amount = 0.3) {
  // hex: "#rrggbb"
  hex = hex.replace(/^#/, '');

  // "#rgb" → "#rrggbb"
  if (hex.length === 3)
    hex = hex.split('').map(c => c + c).join('');

  const num = parseInt(hex, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  // convert to hex
  const darkNum = (1 << 24) + (r << 16) + (g << 8) + b;
  const darkHex = darkNum.toString(16).slice(1);
  return "#" + darkHex;
}
