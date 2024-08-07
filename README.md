# TiledPaletteQuantCLI

A nodejs cli version of https://github.com/rilden/tiledpalettequant (https://rilden.github.io/tiledpalettequant/) allowing for conversion of images to quantized bitmap files, with optional dithering. 

An additional feature is the ability to vertically split the quantized image. This can be used to quantize multiple images using a shared set of palettes.

Note that this has only been tested in WSL so your milage may vary running on other platforms (anything with a terminal that can run NodeJS should work though). 

# Installation
With a recent version of NodeJS installed, run one of the following:
- `npm -i tiledpalettequantcli`
- `npx tiledpalettequantcli`
- `npm -i tiledpalettequantcli -g` (to install globally)

# Usage
In the terminal, run `npx tiledpalettequantcli [Options]` or `tiledpalettequantcli [Options]` (depending if you installed locally or globally)

Options:
|   |   |   |
|---|---|---|
| -f | --file [f] | Input file to quantize (can also accept images from stdin if this option not included) |
|  -v | --vsplit [v]                 |  Split resulting file into vertical chunks of [v] pixels each |
|  -o | --output [prefix]            |  Output name prefix (default is the current directory name) |
|  -tw | --tileWidth [width]         |  Tile width px (default: 8) |
|  -th | --tileHeight [height]       |  Tile height px (default: 8) |
|  -p | --palettes [p]               |  Number of palettes (default: 1) |
|  -cpp | --colorsPerPalette [cpp]   |  Colors per palette (default: 16) |
|  -bpc | --bitsPerChannel [bpc]     |  Bits per channel (default: 5) |
|  -fp | --fractionOfPixels [fp]     |  Fraction of Pixels (default: 0.1) |
|  -czb | --colorZeroBehaviour [czb] |  Color index zero behaviour (choices: "Unique", "Shared", "TransparentFromTransparent", "TransparentFromColor", default: "TransparentFromColor") |
|  -cz | --colorZero [cz]            |  Color index Zero (hex formated: #RRGGBB) (default: "#000000") |
|  -d | --ditherMethod [d]           |  Dithering Method (choices: "Off", "Fast", "Slow", default: "Off") |
|  -dw | --ditherWeight [dw]         |  Dither weight (default: 0.3) |
|  -dp | --ditherPattern [dp]        |  Dithering Pattern (choices: "Diagonal4", "Diagonal2", "Horizontal2", "Horizontal4", "Vertical2", "Vertical4", default: "Diagonal4") |
|  -h | --help                       |  display help for command |



# Examples


`npx tiledpalettequantcli -f test.png`

`cat test.png | npx tiledpalettequantcli`

`npx tiledpalettequantcli -f example.png --ditherMethod Fast --ditherPattern Horizontal2`

`magick *.jpg -background 'rgba(0,0,0,0)' -resize '240' -extent 256x256 -append png:- | npx tiledpalettequantcli -output sharedPaletteExample -vsplit 256 -d Slow -p 5`

