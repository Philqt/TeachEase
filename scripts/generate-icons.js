const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
}

async function generateIcons() {
    try {
        // Generate base icon
        await sharp({
            create: {
                width: 1024,
                height: 1024,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .png()
        .toFile(path.join(assetsDir, 'icon.png'));

        // Generate adaptive icon
        await sharp({
            create: {
                width: 1024,
                height: 1024,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .png()
        .toFile(path.join(assetsDir, 'adaptive-icon.png'));

        // Generate splash screen
        await sharp({
            create: {
                width: 2048,
                height: 2048,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .png()
        .toFile(path.join(assetsDir, 'splash.png'));

        console.log('Icons generated successfully');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
