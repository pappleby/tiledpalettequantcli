const { createCanvas, Image } = require('canvas')
const { program, Option, InvalidArgumentError } = require('commander');
const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { ColorZeroBehaviour, Dither, DitherPattern } = require("./enums.js");
const { runQuantization } = require("./worker.js");

const currDirName = path.basename(path.resolve(process.cwd()));

function myParseInt(value) {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError(`${value} is not a number.`);
    }
    return parsedValue;
  };
function myParseFloatLessThan1(value) {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError(`${value} is not a number.`);
    }
    if(parsedValue<0 || parsedValue>1){
        throw new InvalidArgumentError(`${value} must be between 0 and 1 (inclusive).`);
    }
    return parsedValue;
};
function myValidateColor(value) {
    if(!(/^#[0-9a-fA-F]{6}$/g.test(value))){
        throw new InvalidArgumentError(`${value} is not in correct hex color format: #RRGGBB.`);
    }
    return value;
};

program
    .option(
        '-v, --vsplit',
        'Split resulting file into vertical 256px chunks',
        false
    )
    .option(
        '-o, --output [prefix]',
        'Output name prefix',
        currDirName,
    )
    .option(
        '-tw, --tileWidth [width]',
        'Tile width px',
        myParseInt,
        8,
    )
    .option(
        '-th, --tileHeight [height]',
        'Tile height px',
        myParseInt,
        8,
    )
    .option(
        '-p, --palettes [p]',
        'Number of palettes',
        myParseInt,
        1,
    )
    .option(
        '-cpp, --colorsPerPalette [cpp]',
        'Colors per palette',
        myParseInt, 
        16,
    )
    .option(
        '-bpc, --bitsPerChannel [bpc]',
        'Bits per channel',
        myParseInt,
        5,
    )
    .option(
        '-fp, --fractionOfPixels [fp]',
        'Fraction of Pixels',
        myParseFloatLessThan1,
        0.10,
    )
    .addOption(
        new Option(
            '-czb, --colorZeroBehaviour [czb]',
            'Color index zero behaviour'
        ).default('TransparentFromColor')
        .choices(['Unique', 'Shared', 'TransparentFromTransparent', 'TransparentFromColor']))
    .option(
        '-cz, --colorZero [cz]',
        'Color index Zero (hex formated: #RRGGBB)',
        myValidateColor,
        '#000000',
    )
    .addOption(
        new Option(
            '-d, --ditherMethod [d]',
            'Dithering Method',
        )
        .default('Off')
        .choices(['Off', 'Fast', 'Slow']))
    .option(
        '-dw, --ditherWeight [dw]',
        'Dither weight',
        myParseFloatLessThan1,
        0.30,
    )
    .addOption(
        new Option(
            '-dp, --ditherPattern [dp]',
            'Dithering Pattern',
        )
        .default('Diagonal4')
        .choices(['Diagonal4', 'Diagonal2', 'Horizontal2', 'Horizontal4', 'Vertical2', 'Vertical4']))
    ;
const opts = program.parse().opts();

const colorsPerPalette = opts.colorsPerPalette;
const numPalettes = opts.palettes;
const tileWidth = opts.tileWidth;
const tileHeight = opts.tileHeight;
const bitsPerChannel = opts.bitsPerChannel;
const fractionOfPixels = opts.fractionOfPixels;

const outputName = opts.output;
const vsplit = opts.vsplit;
const readable = process.stdin;

const colorZeroBehaviour = ColorZeroBehaviour[opts.colorZeroBehaviour];
const colorZeroValue = hexToColor(opts.colorZero);

const ditherMethod = Dither[opts.ditherMethod];
const ditherPattern = DitherPattern[opts.ditherPattern];
const ditherWeight = opts.ditherWeight;

function hexToColor(colorStr) {
    return [
        parseInt(colorStr.slice(1, 3), 16),
        parseInt(colorStr.slice(3, 5), 16),
        parseInt(colorStr.slice(5, 7), 16),
    ];
}

function imageDataFrom(img) {
    const canvas = createCanvas(img.width, img.height)
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    return context.getImageData(0, 0, img.width, img.height);
}
function bmpToDataURL(width, height, paletteData, colorIndexes) {
    const bmpFileSize = 54 + paletteData.length + colorIndexes.length;
    const bmpData = new Uint8ClampedArray(bmpFileSize);
    bmpData[0] = 66;
    bmpData[1] = 77;
    write32Le(bmpData, 2, bmpFileSize);
    write32Le(bmpData, 6, 0);
    write32Le(bmpData, 0xa, 54 + paletteData.length);
    write32Le(bmpData, 0xe, 40);
    write32Le(bmpData, 0x12, width);
    write32Le(bmpData, 0x16, height);
    write16Le(bmpData, 0x1a, 1);
    write16Le(bmpData, 0x1c, 8);
    write32Le(bmpData, 0x1e, 0);
    write32Le(bmpData, 0x22, colorIndexes.length);
    write32Le(bmpData, 0x26, 2835);
    write32Le(bmpData, 0x2a, 2835);
    write32Le(bmpData, 0x2e, 256);
    write32Le(bmpData, 0x32, 0);
    for (let i = 0; i < paletteData.length; i++) {
        bmpData[i + 54] = paletteData[i];
    }
    const imageDataAddress = 54 + paletteData.length;
    for (let i = 0; i < colorIndexes.length; i++) {
        bmpData[i + imageDataAddress] = colorIndexes[i];
    }

    return uint8ToBase64(bmpData);
}
function uint8ToBase64(arr) {
    return btoa(Array(arr.length)
        .fill("")
        .map((_, i) => String.fromCharCode(arr[i]))
        .join(""));
}
function write32Le(bmpData, index, value) {
    bmpData[index] = value % 256;
    value = Math.floor(value / 256);
    bmpData[index + 1] = value % 256;
    value = Math.floor(value / 256);
    bmpData[index + 2] = value % 256;
    value = Math.floor(value / 256);
    bmpData[index + 3] = value % 256;
}
function write16Le(bmpData, index, value) {
    bmpData[index] = value % 256;
    value = Math.floor(value / 256);
    bmpData[index + 1] = value % 256;
}
function saveImage(dataURL, i) {
    fs.writeFileSync(`${outputName}${i ?? ''}.bmp`, dataURL, { encoding: 'base64' });
}

function exportImages(imageData) {

    const verticalSliceCount = Math.floor(imageData.height / 256);
    const pixelsPerSlice = imageData.width * 256;
    if (vsplit && verticalSliceCount > 1) {
        for (let i = 0; i < verticalSliceCount; i++) {
            let slicedData = imageData.colorIndexes.slice(i * pixelsPerSlice, (i + 1) * pixelsPerSlice)
            let bmpResult = bmpToDataURL(imageData.width, 256, imageData.paletteData, slicedData);
            saveImage(bmpResult, i);
        }

    } else {
        const bmpResult = bmpToDataURL(imageData.width, imageData.height, imageData.paletteData, imageData.colorIndexes);
        saveImage(bmpResult);
    }
}

const chunks = [];

readable.on('readable', () => {
    let chunk;
    while (null !== (chunk = readable.read())) {
        chunks.push(chunk);
    }
});

readable.on('end', () => {
    const buf = Buffer.concat(chunks);
    const sourceImage = new Image();
    sourceImage.onerror = err => { throw err }
    sourceImage.onload = () => {
        const srcImageData = imageDataFrom(sourceImage);
        const quantizationOptions = {
            tileWidth,
            tileHeight,
            numPalettes,
            colorsPerPalette,
            bitsPerChannel,
            fractionOfPixels,
            colorZeroBehaviour,
            colorZeroValue,
            dither: ditherMethod,
            ditherWeight,
            ditherPattern,
        };
        const imageData = runQuantization(srcImageData, quantizationOptions);
        exportImages(imageData);
    };
    sourceImage.src = buf;
});




