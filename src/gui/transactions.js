var UI = require("ui");
var config = require("config");
var moment = require("moment");
var Utils = require("tools/utils");

function showTransactions(transactions) {
    var menu = new UI.Menu({
        status: config.STATUS_BAR,
        highlightBackgroundColor: config.HIGHLIGHT_COLOR,
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
    item.title = Utils.formatMoney(transaction.column1.value, transaction.column14.value);
    item.subtitle = moment(transaction.column0.value, config.DATE_INPUT_FORMAT).format(config.DATE_FORMAT_SHORT);
    item.subtitle += getTransactionDescription(transaction, " ");
    item.transaction = transaction;

    return item;
}

function getLastTransactionInfo(transactions) {
    if (transactions.length === 0) {
        return "Žádné pohyby";
    }

    var transaction = transactions[0];

    var result = Utils.formatMoney(transaction.column1.value, transaction.column14.value);
    result += getTransactionDescription(transaction, ", ");

    return result;
}

function showTransactionDetail(transaction) {
    var body = "";
    body += "Datum: " + moment(transaction.column0.value, config.DATE_INPUT_FORMAT).format(config.DATE_FORMAT) + "\n";
    body += "Objem: " + Utils.formatMoney(transaction.column1.value, transaction.column14.value) + "\n";

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
        status: config.STATUS_BAR,
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


module.exports = {
    showTransactions: showTransactions,
    getLastTransactionInfo: getLastTransactionInfo,
};