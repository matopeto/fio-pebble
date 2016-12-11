var Pois = function(list) {
    this._list = list;
    this._byDistance = null;
    this.locationSet = false;
};
    

Pois.prototype.setList = function(list) {
      this._list = list;  
};

Pois.prototype.setNewLocation = function(lat, long) {
    console.log("setNewLocation, lat: " + lat + ", long:" + long);
    this._byDistance = null;
    this.sortByDistance(lat, long);
    this.locationSet = true;
};

Pois.prototype.sortByDistance = function(lat, long) {
    console.log("sortByDistance, lat: " + lat + ", long:" + long);
    if (this._byDistance !== null) {
        console.log("return from cache");
        return this._byDistance;
    }

    var byDistance = [];

    var minDistance = 999999999;
    var nearest = null;
    for (var id in this._list) {
        var s = this._list[id];
        var distance = this.getDistance(lat, long, s.lat, s.long);
        s.distance = distance;

        byDistance.push(s);

        if (distance < minDistance || nearest === null) {
            minDistance = distance;
        }
    }

    byDistance.sort(function(a, b) {
        return a.distance - b.distance;
    });

    this._byDistance = byDistance;

    return this._byDistance;
};

Pois.prototype.getNearest = function(limit) {
    console.log("getNearest limit: " + limit);
    if (this._byDistance === null) {
        return null;
    }

    return this._byDistance.slice(0, limit);
};

Pois.prototype.getAll = function() {
    return this._list;
};

Pois.prototype.getDistance = function(lat1, long1, lat2, long2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLong = deg2rad(long2 - long1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
};


function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

module.exports = Pois;