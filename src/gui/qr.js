var Config = require('config');
var UI = require('ui');
var Vector2 = require('vector2');

function showQrCode(account) {
    if (account === null) {
        return;
    }

    var wind = new UI.Window({
        status: Config.STATUS_BAR
    });

    var rect = new UI.Rect({
        position: new Vector2(0, 0),
        size: Config.RESOLUTION,
        backgroundColor: "white",
    });

    var loadingText = new UI.Text({
        text: "Generuji...",
        color: 'black',
        textAlign: 'center',
        position: new Vector2(0, 60),
        size: new Vector2(Config.RESOLUTION.x, 50),
    });

    var infoText = new UI.Text({
        text: account.accountId + "/" + account.bankId,
        color: 'black',
        textAlign: 'center',
        position: new Vector2(0, 8),
        size: new Vector2(Config.RESOLUTION.x, 50),
        font: "gothic-14",
    });

    wind.add(rect);
    wind.add(loadingText);
    wind.add(infoText);

    var size = 100;
    var url = 'https://chart.googleapis.com/chart?cht=qr&chl=' + encodeURIComponent(getSPAYD(account)) + '&choe=UTF-8&chs=' + size + 'x' + size + '&chld=L%7C0#width:' + size;
    console.log(url);

    var image = new UI.Image({
        position: new Vector2((Config.RESOLUTION.x - size) / 2, (Config.RESOLUTION.y - size) / 2),
        size: new Vector2(size, size),
        image: url,
    });

    wind.add(image);
    wind.show();
}


function getSPAYD(account) {
    return "SPD*1.0*ACC:" + account.iban + "*CC:" + account.currency;
}

module.exports = {
    showQrCode: showQrCode,
}