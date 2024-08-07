var ColorZeroBehaviour;
(function (ColorZeroBehaviour) {
    ColorZeroBehaviour[ColorZeroBehaviour["Unique"] = 0] = "Unique";
    ColorZeroBehaviour[ColorZeroBehaviour["Shared"] = 1] = "Shared";
    ColorZeroBehaviour[ColorZeroBehaviour["TransparentFromTransparent"] = 2] = "TransparentFromTransparent";
    ColorZeroBehaviour[ColorZeroBehaviour["TransparentFromColor"] = 3] = "TransparentFromColor";
})(ColorZeroBehaviour || (ColorZeroBehaviour = {}));
var Dither;
(function (Dither) {
    Dither[Dither["Off"] = 0] = "Off";
    Dither[Dither["Fast"] = 1] = "Fast";
    Dither[Dither["Slow"] = 2] = "Slow";
})(Dither || (Dither = {}));
var DitherPattern;
(function (DitherPattern) {
    DitherPattern[DitherPattern["Diagonal4"] = 0] = "Diagonal4";
    DitherPattern[DitherPattern["Horizontal4"] = 1] = "Horizontal4";
    DitherPattern[DitherPattern["Vertical4"] = 2] = "Vertical4";
    DitherPattern[DitherPattern["Diagonal2"] = 3] = "Diagonal2";
    DitherPattern[DitherPattern["Horizontal2"] = 4] = "Horizontal2";
    DitherPattern[DitherPattern["Vertical2"] = 5] = "Vertical2";
})(DitherPattern || (DitherPattern = {}));

module.exports = {ColorZeroBehaviour, Dither, DitherPattern};