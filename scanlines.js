// Scanlines functionality
function applyScanlines(context, width, height) {
    for (let y = 0; y < height; y += 2) {
        context.fillStyle = 'rgba(0, 0, 0, 0.1)'; // semi-transparent black for scanlines
        context.fillRect(0, y, width, 1); // draw scanline
    }
}

// Example usage:
// const canvas = document.getElementById('myCanvas');
// const context = canvas.getContext('2d');
// applyScanlines(context, canvas.width, canvas.height);