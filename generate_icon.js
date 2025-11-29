import { Jimp } from 'jimp';

async function main() {
    const inputPath = '/Users/michaelbennaim/.gemini/antigravity/brain/4cb1804e-78f5-4164-8c51-9f8f80064013/uploaded_image_1764454429435.png';
    const outputPath = '/Users/michaelbennaim/Documents/Projets/Animal News/public/apple-touch-icon.png';
    const bordeaux = '#7C1653';

    try {
        console.log('Reading image...');
        const image = await Jimp.read(inputPath);

        // Create a new 180x180 image with bordeaux background
        const icon = new Jimp({ width: 180, height: 180, color: bordeaux });

        // Resize original image to fit in 150x150 (keeping aspect ratio)
        image.scaleToFit({ w: 150, h: 150 });

        // Process the image: 
        // Assumption: Input is White Logo on Transparent Background
        // Goal: Ensure it is Pure White and keep transparency
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const a = this.bitmap.data[idx + 3];

            if (a > 0) {
                // Non-transparent pixel -> Make Pure White
                this.bitmap.data[idx + 0] = 255;
                this.bitmap.data[idx + 1] = 255;
                this.bitmap.data[idx + 2] = 255;
                // Keep existing alpha (or force full opacity if needed, but keeping alpha is usually better for anti-aliasing edges)
            }
        });

        // Composite the processed logo onto the bordeaux background
        const x = (180 - image.bitmap.width) / 2;
        const y = (180 - image.bitmap.height) / 2;

        icon.composite(image, x, y);

        console.log('Writing output...');
        await icon.write(outputPath);
        console.log('Done!');

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
