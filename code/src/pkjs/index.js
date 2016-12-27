require('pebblejs');
var UI = require('pebblejs/ui');
var ajax = require('pebblejs/lib/ajax');
var Vector2 = require('pebblejs/lib/vector2');
var Settings = require('pebblejs/settings');
var WindowStack = require('pebblejs/ui/windowstack');
var moment = require('moment');
var Pois = require('./tools/pois');
var AtmsList = require('./data/atms');

var Transactions = require('./gui/transactions');
var Atms = require('./gui/atms');
var Qr = require('./gui/qr');

var Utils = require('./tools/utils');
var Config = require('./config');

var _isEmulator = Pebble.getActiveWatchInfo && Pebble.getActiveWatchInfo().model.match(/^qemu_/);

// Settings.data('token', undefined);
// Settings.option('hasToken', undefined);
// Settings.option('transactions', undefined);

var _atms = null;

console.log("hasToken: " + Settings.option('hasToken'));

// Set a configurable with just the close callback
Settings.config({
    url: 'https://matopeto.github.io/fio-pebble/config/config.html',
    autoSave: false,
},
                function(e) {
                    console.log('closed configurable');

                    // Show the parsed response
                    // console.log(JSON.stringify(e.options));

                    // Show the raw response if parsing failed
                    if (e.failed) {
                        console.log("Failed: " + e.response);
                        return;
                    }
                    // Options:
                    // token - new token, null if not changed, empty if removed.
                    // transactions - if transactions are showed.

                    var token = e.options.token;
                    if (token !== null && typeof(token) !== 'undefined') {
                        Settings.data('token', token);
                        if (token !== "") {
                            Settings.option("hasToken", token.substr(0, 4) + "***");
                        } else {
                            Settings.option("hasToken", "");
                        }
                    }

                    Settings.option("transactions", e.options.transactions);
                    loadData();
                }
               );

var loadingWindow = new UI.Window({
    body: 'Nahrávám...',
    scrollable: false,
    status: Config.STATUS_BAR,
    backgroundColor: Config.LOADING_BG_COLOR,
});

loadingWindow.add(new UI.Text({
    text: "Nahrávám...",
    color: 'black',
    textAlign: 'center',
    position: new Vector2(0, Config.RESOLUTION.y / 2.0 - 20),
    size: Config.RESOLUTION,
}));


var notPairedWindow = new UI.Card({
    status: Config.STATUS_BAR,
    backgroundColor: Config.NOT_PAIRED_BG_COLOR,
    body: 'Zadejte prosím aplikační API Token v nastaveních aplikace.',
});

var locationLoading = new UI.Window({
    scrollable: false,
    status: Config.STATUS_BAR,
    backgroundColor: Config.LOADING_BG_COLOR,
});

locationLoading.add(new UI.Text({
    text: "Čekám na polohu...",
    color: 'black',
    textAlign: 'center',
    position: new Vector2(0, 65),
    size: new Vector2(Config.RESOLUTION.x, 50),
}));

function showLoading() {
    loadingWindow.show();
    clearWindowsStack();
}

function loadData() {
    if (!Settings.option('hasToken')) {
        Utils.clearApplicatioSubtitle();
        notPairedWindow.show();
        clearWindowsStack();
        return;
    }

    var start = moment();
    var end = moment(start).subtract(1, 'months');

    showLoading();

    var url = "https://www.fio.cz/ib_api/rest/periods/" + encodeURIComponent(Settings.data('token')) + "/" + end.format(Config.DATE_URL_FORMAT) + "/" + start.format(Config.DATE_URL_FORMAT) + "/transactions.json";
    //console.log(url);
    ajax({
        url: url,
        type: 'json',
        method: 'get',
    },
         function(data) {
             console.log("Data OK");
             //console.log('The item is: ' + JSON.stringify(data));
             showData(data.accountStatement);
         },
         function(error, status, request) {
             Utils.clearApplicatioSubtitle();

             console.log("Download failed: Error: " + error + ", Status: " + status);
             if (status == 409) {
                 // retry in 10 secondes.
                 setTimeout(loadData, 10000);
                 return;
                 // keep loading.
             }

             new UI.Card({
                 status: Config.STATUS_BAR,
                 backgroundColor: Config.NOT_PAIRED_BG_COLOR,
                 body: 'Nastala chyba. Zkontrolujte prosím připojení k internetu a zkuste to znovu.',
             }).show();

             clearWindowsStack();
         }
        );
}

function showData(data) {
    var account = data.info;
    var transactions = data.transactionList === null ? [] : data.transactionList.transaction;
    transactions.reverse();

    var items = [];
    items.push({
        title: Utils.formatMoney(account.closingBalance, account.currency),
        subtitle: "Zůstatek k " + moment(data.info.dateEnd, Config.DATE_INPUT_FORMAT).format(Config.DATE_FORMAT),
    });

    // Update Glance.
    // Kč is not valid for glance, so show only Kc.
    Utils.setApplicationSubtitle(
        Utils.formatMoney(account.closingBalance, account.currency === "CZK" ? "Kc" : account.currency) +
        " (" +
        moment(data.info.dateEnd, Config.DATE_INPUT_FORMAT).format(Config.DATE_FORMAT) +
        ")"
    );

    if (Settings.option("transactions")) {
        items.push({
            title: "Pohyby",
            subtitle: Transactions.getLastTransactionInfo(transactions),
            transactions: transactions,
        });
    }

    items.push({
        title: "Bankomaty",
        atms: true,   
    });

    items.push({
        title: "QR Platba",
        qrAccount: account,   
    });

    var menu = new UI.Menu({
        highlightBackgroundColor: Config.HIGHLIGHT_COLOR,
        status: Config.STATUS_BAR,
        sections: [{
            title: Config.APP_NAME,
            items: items,
        }],
    });

    menu.on('select', function(e) {
        if (typeof(e.item.transactions) !== 'undefined') {
            Transactions.showTransactions(e.item.transactions);
        } else if (typeof(e.item.qrAccount) !== 'undefined') {
            Qr.showQrCode(e.item.qrAccount);
        } else if (typeof(e.item.atms) !== 'undefined') {
            if (_atms === null || _atms.locationSet === false) {
                return;
            }

            var nearest = _atms.getNearest(10);
            Atms.showAtms(nearest);
        }
    });

    menu.show();
    clearWindowsStack();
    menu.selection(1,1);

    // Loading location:
    var locationOptions = {
        enableHighAccuracy: false,
        maximumAge: 10000,
        timeout: 10000
    };

    setAtmsMenuSubtitle(menu, "Hledám nejbliží...");

    navigator.geolocation.getCurrentPosition(
        function(pos) {
            var lat = pos.coords.latitude;
            var long = pos.coords.longitude;
            
            if (_isEmulator) {
                lat = 50.1010942;
                long = 14.4320856;
            }
            
            console.log('locationSuccess lat= ' + lat + ' lon= ' + long);
            if (_atms === null) {
                _atms = new Pois(AtmsList);
            }
            _atms.setNewLocation(lat, long); 

            // Setting menu subtitle:
            var nearest = _atms.getNearest(1);
            var item = nearest[0];

            setAtmsMenuSubtitle(menu, Utils.formatDistance(item.distance) + ", " + item.address);
        },
        function(err) {
            console.log('location error (' + err.code + '): ' + err.message);
            setAtmsMenuSubtitle(menu, "Nepodařilo se určit polohu");

        },
        locationOptions);
}

function setAtmsMenuSubtitle(menu, subtitle) {
    menu.item(
        0, 
        Settings.option("transactions") ? 2 : 1,
        {
            title: "Bankomaty",
            subtitle: subtitle,
        }
    );
}

function clearWindowsStack() {
    var items = WindowStack._items;
    for (var i = 0, ii = items.length - 1; i < ii; ++i) {
        items[i].hide();
    }
}

loadData();