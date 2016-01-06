var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Settings = require('settings');
var WindowStack = require('ui/windowstack');
var moment = require('moment');

var HIGHLIGHT_COLOR = "islamicGreen";
var NOT_PAIRED_BG_COLOR = "chromeYellow";
var LOADING_BG_COLOR = "white";

// Settings.data('token', undefined);
// Settings.option('hasToken', undefined);
// Settings.option('transactions', undefined);

console.log("hasToken: " + Settings.option('hasToken'));

// Set a configurable with just the close callback
Settings.config({
        url: 'https://matopeto.github.io/fio-pebble/config/config.html',
        autoSave: false,
    },
    function(e) {
        console.log('closed configurable');

        // Show the parsed response
        console.log(JSON.stringify(e.options));

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

var DATE_FORMAT = "D.M.YYYY";
var DATE_FORMAT_SHORT = "D.M.";
var DATE_INPUT_FORMAT = "YYYY-MM-DDZZ";
var DATE_URL_FORMAT = "YYYY-MM-DD";
var APP_NAME = "Můj účet"; //Fio v Pebble";

var loadingWindow = new UI.Window({
    body: 'Nahrávám...',
    scrollable: false,
    fullscreen: true,
    backgroundColor: LOADING_BG_COLOR,
});

loadingWindow.add(new UI.Text({
        text: "Nahrávám...",
        color: 'black',
        textAlign: 'center',
        position: new Vector2(0, 65),
        size: new Vector2(144, 50),
    }));


var notPairedWindow = new UI.Card({
    fullscreen: true,
    backgroundColor: NOT_PAIRED_BG_COLOR,
    body: 'Zadejte prosím aplikační API Token v nastaveních aplikace.',
});

function showLoading() {
    loadingWindow.show();
    clearWindowsStack();
}

function loadData() {
    if (!Settings.option('hasToken')) {
        notPairedWindow.show();
        clearWindowsStack();
        return;
    }

    var start = moment();
    var end = moment(start).subtract(1, 'months');
  
    showLoading();

    var url = "https://www.fio.cz/ib_api/rest/periods/" + encodeURIComponent(Settings.data('token')) + "/" + end.format(DATE_URL_FORMAT) + "/" + start.format(DATE_URL_FORMAT) + "/transactions.json";
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
            clearWindowsStack();
        },
        function(error, status, request) {
            console.log("Download failed: Error: " + error + ", Status: " + status);
            if (status == 409) {
                // retry in 10 secondes.
                setTimeout(loadData, 10000);
                return;
                // keep loading.
            }
            
            new UI.Card({
                fullscreen: true,
                backgroundColor: NOT_PAIRED_BG_COLOR,
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
        title: formatMoney(account.closingBalance, account.currency),
        subtitle: "Zůstatek (" + moment(data.info.dateEnd, DATE_INPUT_FORMAT).format(DATE_FORMAT) + ")",
    });
    
    if (Settings.option("transactions")) {
        items.push({
            title: "Pohyby",
            subtitle: getLastTransactionInfo(transactions),
            transactions: transactions,
        });
    }
    
    items.push({
        title: "QR Platba",
        qrAccount: account,   
    });

    var menu = new UI.Menu({
        highlightBackgroundColor: HIGHLIGHT_COLOR,
        fullscreen: true,
        sections: [{
            title: APP_NAME,
            items: items,
        }],
    });

    menu.on('select', function(e) {
        if (typeof(e.item.transactions) !== 'undefined') {
            showTransactions(e.item.transactions);
        } else if (typeof(e.item.qrAccount) !== 'undefined') {
            showQrCode(e.item.qrAccount);
        }
    });

    menu.show();
    menu.selection(1,1);
}

function showQrCode(account) {
    if (account === null) {
        return;
    }

    var wind = new UI.Window({
        fullscreen: true
    });

    var rect = new UI.Rect({
        position: new Vector2(0, 0),
        size: new Vector2(144, 168),
        backgroundColor: "white",
    });

    var loadingText = new UI.Text({
        text: "Generuji...",
        color: 'black',
        textAlign: 'center',
        position: new Vector2(0, 60),
        size: new Vector2(144, 50),
    });

    var infoText = new UI.Text({
        text: account.accountId + "/" + account.bankId,
        color: 'black',
        textAlign: 'center',
        position: new Vector2(0, 8),
        size: new Vector2(144, 50),
        font: "gothic-14",
    });

    wind.add(rect);
    wind.add(loadingText);
    wind.add(infoText);

    var size = 110;
    var url = 'https://chart.googleapis.com/chart?cht=qr&chl=' + encodeURIComponent('SPD*1.0*ACC:' + account.iban) + '&choe=UTF-8&chs=' + size + 'x' + size + '&chld=L%7C0#width:' + size;
    console.log(url);

    var image = new UI.Image({
        position: new Vector2((144 - size) / 2, (168 - size) / 2),
        size: new Vector2(size, size),
        image: url,
    });

    wind.add(image);
    wind.show();
}

function showTransactions(transactions) {
    var menu = new UI.Menu({
        fullscreen: true,
        highlightBackgroundColor: HIGHLIGHT_COLOR,
        sections: [{
            title: "Pohyby",
            items: getTransactionItems(transactions),
        }, ],
    });

    menu.on('select', function(e) {
        if (typeof(e.item.transaction) !== 'undefined') {
            showTransactionDetail(e.item.transaction);
        }
    });

    menu.show();
}

function getTransactionItems(transactions) {
    if (transactions.length === 0) {
        return [{
            title: "Žádné pohyby",
        }, ];
    }

    var items = [];
    for (var i = 0; i < transactions.length; i++) {
        var t = transactions[i];
        items.push(getTransactionItem(t));
    }

    return items;
}

function getTransactionItem(transaction) {
    var item = {};
    item.title = formatMoney(transaction.column1.value, transaction.column14.value);
    item.subtitle = moment(transaction.column0.value, DATE_INPUT_FORMAT).format(DATE_FORMAT_SHORT);
    item.subtitle += getTransactionDescription(transaction, " ");
    item.transaction = transaction;

    return item;
}

function getLastTransactionInfo(transactions) {
    if (transactions.length === 0) {
        return "Žádné pohyby";
    }

    var transaction = transactions[0];

    var result = formatMoney(transaction.column1.value, transaction.column14.value);
    result += getTransactionDescription(transaction, ", ");

    return result;
}

function showTransactionDetail(transaction) {
    var body = "";
    body += "Datum: " + moment(transaction.column0.value, DATE_INPUT_FORMAT).format(DATE_FORMAT) + "\n";
    body += "Objem: " + formatMoney(transaction.column1.value, transaction.column14.value) + "\n";

    body += getColumnString(transaction.column2);
    body += getColumnString(transaction.column10);
    body += getColumnString(transaction.column3);
    body += getColumnString(transaction.column12);
    body += getColumnString(transaction.column4);
    body += getColumnString(transaction.column5);
    body += getColumnString(transaction.column6);
    body += getColumnString(transaction.column7);
    body += getColumnString(transaction.column16);
    body += getColumnString(transaction.column8);
    body += getColumnString(transaction.column9);
    body += getColumnString(transaction.column18);
    body += getColumnString(transaction.column25);
    body += getColumnString(transaction.column26);
    body += getColumnString(transaction.column17);
    body += getColumnString(transaction.column22);

    var card = new UI.Card({
        fullscreen: true,
        body: body,
        style: 'small',
        scrollable: true,
    });

    card.show();
}

function getColumnString(column) {
    if (isValueEmpty(column)) {
        return "";
    }

    return column.name + ": " + column.value + "\n";
}

function getTransactionDescription(transaction, prefix) {
    var result = "";
    if (!isValueEmpty(transaction.column7)) {
        result += prefix + transaction.column7.value;
    } else if (!isValueEmpty(transaction.column25)) {
        result += prefix + transaction.column25.value;
    } else if (!isValueEmpty(transaction.column16)) {
        result += prefix + transaction.column16.value;
    }

    return result;
}

function isValueEmpty(column) {
    return column === null || column.value === null || (typeof(column.value) == 'string' && column.value.trim() === "");
}

function getSPAYD(account) {
    return "SPD*1.0*ACC:" + account.iban + "*CC:" + account.currency;
}

function clearWindowsStack() {
    var items = WindowStack._items;
    for (var i = 0, ii = items.length - 1; i < ii; ++i) {
        items[i].hide();
    }
}

function formatMoney(amount, currency) {
    return amount.formatMoney() + " " + (currency === "CZK" ? "Kč" : currency);
}

// From: http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
Number.prototype.formatMoney = function(c, d, t) {
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "," : d,
        t = t == undefined ? " " : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

loadData();