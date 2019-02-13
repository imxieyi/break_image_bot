var fs = require('fs');
var Jimp = require('jimp');

const MaskSize = 150;
const OffsetX = 291;
const OffsetY = 166;
const Rotate = 2.5;
const Diff = 5;

// Read background image
var backgroundImage = null;
var upperMask = null;
var lowerMask = null;
Jimp.read('background.png').then(image => {
    backgroundImage = image;
});
Jimp.read('uppermask.png').then(image => {
    upperMask = image;
});
Jimp.read('lowermask.png').then(image => {
    lowerMask = image;
});

var breakImage = function(inputImage, agent = null) {
    return new Promise(resolve => {
        Jimp.read({
            url: inputImage,
            agent: agent
        }).then(foreground => {
            var composed = backgroundImage.clone();
            foreground.scaleToFit(MaskSize, MaskSize);
            foreground.contain(MaskSize, MaskSize);
            var upper = foreground.clone();
            var lower = foreground.clone();
            upper.mask(upperMask);
            lower.mask(lowerMask);
            upper.rotate(Rotate);
            lower.rotate(-Rotate * 2);
            composed.composite(upper, OffsetX, OffsetY - Diff);
            composed.composite(lower, OffsetX, OffsetY + Diff);
            composed.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) {
                    throw err;
                }
                resolve(buffer);
            });
        }).catch(err => {
            console.error(err);
            resolve(null);
        })
    });
}

if (require.main === module) {
    setTimeout(() => {
        breakImage('google.png').then(buffer => {
            fs.writeFileSync('test.png', buffer);
        })
    }, 100);
}

exports.breakImage = breakImage;
