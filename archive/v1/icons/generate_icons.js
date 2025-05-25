// This script generates placeholder icons for the extension
// It's not part of the extension itself, but a helper for development

function generateIcon(size, color) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size / 16);
  ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, size - ctx.lineWidth, size - ctx.lineWidth);

  // Text
  ctx.fillStyle = color;
  ctx.font = `bold ${size/3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI', size/2, size/2 - size/10);
  ctx.fillText('RE', size/2, size/2 + size/6);

  return canvas.toDataURL('image/png');
}

// Generate icons of different sizes
const sizes = [16, 48, 128];
const color = '#1a73e8'; // Google blue

sizes.forEach(size => {
  const dataUrl = generateIcon(size, color);

  // Create a link to download the icon
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `icon${size}.png`;

  // Append to document and click to trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`Generated icon${size}.png`);
});
