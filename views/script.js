mapboxgl.accessToken = 'pk.eyJ1IjoiYjAwMDczODY1IiwiYSI6ImNraTU5Y2UwajA3NmUycG4ybTlldnptdTEifQ.U_59BtZtoATs2G2xquBWNg';
var current = new Array();

$(document).ready(function () {

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      current[0] = position.coords.longitude;
      current[1] = position.coords.latitude;
      var map = new mapboxgl.Map({
        // container id specified in the HTML
        container: 'map',

        // style URL
        style: 'mapbox://styles/mapbox/light-v10',

        // initial position in [lon, lat] format
        center: [position.coords.longitude, position.coords.latitude],

        // initial zoom

        zoom: 14
      });
      var canvas = map.getCanvasContainer();

      var start = [current[0], current[1]];
      // create a function to make a directions request
      function getRoute(end) {
        // make a directions request using cycling profile
        // an arbitrary start will always be the same
        // only the end or destination will change
        var url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' + start[0] + ',' + start[1] + ';' + end[0] +
          ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;

        // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onload = function () {
          var json = JSON.parse(req.response);
          console.log(json);
          var location1 = json.waypoints[0].location;
          var location2 = json.waypoints[1].location;
          console.log(location2[0]);
          var angle = angleFromCoordinate(location1[1],location1[0],location2[1],location2[0]);
          var data = json.routes[0];
          var route = data.geometry.coordinates;
          var geojson = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route
            }
           
          };
          console.log(geojson.geometry.coordinates[0]);
          // if the route already exists on the map, reset it using setData
          if (map.getSource('route')) {
            map.getSource('route').setData(geojson);
          } else { // otherwise, make a new request
            map.addLayer({
              id: 'route',
              type: 'line',
              source: {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: geojson
                  }
                }
              },
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3887be',
                'line-width': 5,
                'line-opacity': 0.75
              }
            });
          }
          // add turn instructions here at the end
        };
        
        req.send();
      }

      map.on('load', function () {
        // make an initial directions request that
        // starts and ends at the same location
          getRoute(start);

        // Add starting point to the map
        map.addLayer({
          id: 'point',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: start
                }
              }]
            }
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#3887be'
          }
        });
        // this is where the code from the next step will go
      });
      map.on('click', function(e) {
        var coordsObj = e.lngLat;
        canvas.style.cursor = '';
        var coords = Object.keys(coordsObj).map(function(key) {
          return coordsObj[key];
        });
        var end = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: coords
            }
          }
          ]
        };
        if (map.getLayer('end')) {
          map.getSource('end').setData(end);
        } else {
          map.addLayer({
            id: 'end',
            type: 'circle',
            source: {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: coords
                  }
                }]
              }
            },
            paint: {
              'circle-radius': 10,
              'circle-color': '#f30'
            }
          });
        }
        getRoute(coords);
      });

      var coordinatesGeocoder = function (query) {
        // match anything which looks like a decimal degrees coordinate pair
        var matches = query.match(
          /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
        );
        if (!matches) {
          return null;
        }

        function coordinateFeature(lng, lat) {
          return {
            center: [lng, lat],
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            place_name: 'Lat: ' + lat + ' Lng: ' + lng,
            place_type: ['coordinate'],
            properties: {},
            type: 'Feature'
          };
        }

        var coord1 = Number(matches[1]);
        var coord2 = Number(matches[2]);
        var geocodes = [];

        if (coord1 < -90 || coord1 > 90) {
          // must be lng, lat
          geocodes.push(coordinateFeature(coord1, coord2));
        }

        if (coord2 < -90 || coord2 > 90) {
          // must be lat, lng
          geocodes.push(coordinateFeature(coord2, coord1));
        }

        if (geocodes.length === 0) {
          // else could be either lng, lat or lat, lng
          geocodes.push(coordinateFeature(coord1, coord2));
          geocodes.push(coordinateFeature(coord2, coord1));
        }

        return geocodes;
      };

      map.addControl(
        new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          localGeocoder: coordinatesGeocoder,
          zoom: 15,
          placeholder: 'Search AUS or lng, lat',
          mapboxgl: mapboxgl
        })
      );

    });
  } else {

  }
});

var data;
function angleFromCoordinate(lat1,lon1,lat2,lon2) {
  var p1 = {
      x: lat1,
      y: lon1
  };

  var p2 = {
      x: lat2,
      y: lon2
  };
  var requestloc = new XMLHttpRequest();
  
  // angle in degrees
  var angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

  var dlon = lon2*Math.PI/180-lon1*Math.PI/180;
  var dlat = lat2*Math.PI/180-lat1*Math.PI/180;
  let a = Math.pow(Math.sin(dlat / 2),2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2),2);
  let c = 2 * Math.asin(Math.sqrt(a));
  let r = 6371;
  var distance = r*c;
  requestloc.open("GET", 'http://localhost:4000/mapadd?lat1='+lat1+'&lng1='+lon1+'&lat2='+lat2+'&lng2='+lon2+'&degree='+angleDeg+'&distance='+distance, true);
  requestloc.send();
  return angleDeg;
}

