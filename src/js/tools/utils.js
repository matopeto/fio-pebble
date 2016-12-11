function formatMoney(amount, currency) {
    return formatMoneyInternal(amount) + " " + (currency === "CZK" ? "Kč" : currency);
}

// From: http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
// TODO.
function formatMoneyInternal(n, c, d, t) {
    var
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "," : d,
        t = t == undefined ? " " : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}

function formatDistance(distance) {
    if (typeof distance === 'undefined' || distance === null) {
        return "";
    }

    if (distance < 1) {
        return Math.round(distance * 1000) + " m";
    }

    return Math.round(distance, 2) + " km";
}

module.exports = {
    formatMoney: formatMoney,
    formatDistance: formatDistance,
};