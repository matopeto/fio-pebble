var Config = require('../config');
var Utils = require('../tools/utils');
var UI = require('pebblejs/ui');

function showAtms(nearest) {
    var items = [];
    for (var i = 0; i < nearest.length; i++) {
        var item = nearest[i];
        items.push({
            title: item.address,
            subtitle: Utils.formatDistance(item.distance) + ", " + item.desc,
            item: item,
        });
    }
    
    var menu = new UI.Menu({
        highlightBackgroundColor: Config.HIGHLIGHT_COLOR,
        status: Config.STATUS_BAR,
        sections: [
            {
                title: "Bankomaty",
                items: items,  
            },
        ],
    });
    
        menu.on('select', function(e) {
        if (typeof(e.item.item) !== 'undefined') {
            showAtmDetail(e.item.item);
        }
    });
    
    menu.show();
}

function showAtmDetail(item) {
  var card = new UI.Card({
        status: Config.STATUS_BAR,
        body: item.address + "\n" + item.city + "\n\n" + item.desc + "\n\n" + item.open,
        style: 'small',
        scrollable: true,
    });

    card.show();   
}

module.exports = {
    showAtms: showAtms,    
};