var Feature = require('platform/feature');

var Config = {
    APP_NAME: "Můj účet",
    
    STATUS_BAR: false,
    HIGHLIGHT_COLOR: "islamicGreen",
    NOT_PAIRED_BG_COLOR: "chromeYellow",
    LOCATION_FAILED_BG_COLOR: "chromeYellow",
    LOADING_BG_COLOR: "white",
    
    DATE_FORMAT: "D.M.YYYY",
    DATE_FORMAT_SHORT: "D.M.",
    DATE_INPUT_FORMAT: "YYYY-MM-DDZZ",
    DATE_URL_FORMAT: "YYYY-MM-DD",
    
    RESOLUTION: Feature.resolution(),
};

module.exports = Config;