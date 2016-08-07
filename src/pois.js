var Pois = function(list) {
    this._list = list;
    this._byDistance = null;
};
    
    
Pois.prototype.setList = function(list) {
      this._list = list;  
    };

    Pois.prototype.setNewLocation = function(lat, lon) {
        console.log("setNewLocation, lat: " + lat + ", lon:" + lon);
        this._byDistance = null;
        this.sortByDistance(lat, lon);
    };

    Pois.prototype.sortByDistance = function(lat, lon) {
        console.log("sortByDistance, lat: " + lat + ", lon:" + lon);
        if (this._byDistance !== null) {
            console.log("return from cache");
            return this._byDistance;
        }

        var byDistance = [];

        var minDistance = 999999999;
        var nearest = null;
        for (var id in this._list) {
            var s = this._list[id];
            var distance = getDistanceFromLatLonInKm(lat, lon, s.lat, s.long);
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

    Pois.getDistanceStr = function(distance) {
         if (typeof distance === 'undefined' || distance === null) {
             return "";
         }
        
        if (distance < 1) {
            return Math.round(distance * 1000) + " m";
        }
                
        return Math.round(distance, 2) + " km";
    };

   function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1); // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    };


function deg2rad(deg) {
    return deg * (Math.PI / 180);
}



module.exports = Pois;