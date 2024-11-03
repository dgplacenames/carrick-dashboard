var config = {
    geojson: "carrick2.geojson",
    title: "Carrick Place-Names",
    layerName: "Place-Names",
    hoverProperty: "pn",
    sortProperty: "",
    sortOrder: "",
};

var properties = [
    {
        value: "pn",
        label: "Name",
        table: {
            visible: true,
            sortable: true,
        },
        filter: {
            type: "string",
            operators: ["equal", "begins with", "contains"],
        },
        info: true,
    },
    {
        value: "details.elements", // Adjusted for nested structure
        label: "Elements",
        table: false,
        filter: false,
        info: true,
    },
    {
        value: "details.cat", // Adjusted for nested structure
        label: "Categories",
        table: false,
        filter: false,
        info: true,
    },
    {
        value: "details.notes", // Adjusted for nested structure
        label: "Notes",
        table: false,
        filter: false,
        info: true,
    },
    {
        value: "details.Hist_forms", // Adjusted for nested structure
        label: "Historical Forms",
        table: false,
        filter: {
            type: "string",
            operators: ["contains"],
        },
        info: false,
    },
    {
        value: "date",
        label: "Date",
        table: false,
        filter: {
            type: "string",
            operators: ["contains"],
        },
        info: false,
    },
    {
        value: "sources",
        label: "Source",
        table: false,
        filter: {
            type: "string",
            operators: ["contains"],
        },
        info: false,
    },
    {
        value: "parish",
        label: "Parish",
        table: {
            visible: true,
            sortable: true,
        },
        filter: {
            type: "string",
            input: "checkbox",
            vertical: true,
            multiple: true,
            operators: ["in", "not_in"],
            values: [],
        },
    },
    {
        value: "grid_ref",
        label: "Grid Ref",
        table: {
            visible: true,
            sortable: false,
        },
        filter: false,
    },
    {
        value: "photos_url",
        label: "Photos",
        table: {
            visible: true,
            sortable: true,
            formatter: urlFormatter,
        },
        filter: false,
        info: true,
    },
    {
        value: "image",
        label: "Image",
        table: {
            visible: true,
            sortable: true,
        },
        filter: false,
        info: true,
    },
];

// Basemap Layers
var OSM = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: ["a", "b", "c", "d"],
    attribution:
        'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
});

var satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        maxZoom: 19,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var mapboxSat = L.tileLayer(
    "https://mapseries-tilesets.s3.amazonaws.com/os/6inchfirst/{z}/{x}/{y}.png",
    {
        maxZoom: 16,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var OS2 = L.tileLayer(
    "https://api.maptiler.com/tiles/uk-osgb10k1888/{z}/{x}/{y}.jpg?key=lctZzs518h1OEqcsh2zL",
    {
        maxZoom: 16,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var OS25 = L.tileLayer(
    "https://api.maptiler.com/tiles/uk-osgb25k1937/{z}/{x}/{y}.jpg?key=lctZzs518h1OEqcsh2zL",
    {
        maxZoom: 16,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var geological = L.tileLayer(
    "https://mapseries-tilesets.s3.amazonaws.com/geological/oneinchscot/{z}/{x}/{y}.png",
    {
        maxZoom: 16,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var Roy = L.tileLayer(
    "https://mapseries-tilesets.s3.amazonaws.com/roy/lowlands/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var LiDAR_4 = L.tileLayer(
    "https://geo.nls.uk/mapdata3/lidar/rgb/phase4/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var LiDAR_3 = L.tileLayer(
    "https://geo.nls.uk/mapdata3/lidar/rgb/phase3/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var LiDAR_1 = L.tileLayer(
    "https://geo.nls.uk/mapdata3/lidar/rgb/phase1/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        subdomains: ["a", "b", "c", "d"],
        attribution:
            'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
);

var LiDAR = L.layerGroup([LiDAR_4, LiDAR_3, LiDAR_1]);

var highlightLayer = L.geoJson(null, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
            radius: 5,
            color: "#FFF",
            weight: 2,
            opacity: 1,
            fillColor: "#00FFFF",
            fillOpacity: 1,
            clickable: false,
        });
    },
    style: function (feature) {
        return {
            color: "#00FFFF",
            weight: 2,
            opacity: 1,
            fillColor: "#00FFFF",
            fillOpacity: 0.5,
            clickable: false,
        };
    },
});

var featureLayer = L.geoJson(null, {
    filter: function (feature, layer) {
        return (
            feature.geometry.coordinates[0] !== 0 &&
            feature.geometry.coordinates[1] !== 0
        );
    },
    pointToLayer: function (feature, latlng) {
        var markerColor = feature.properties["marker-color"] || "#1b5fde";
        return L.circleMarker(latlng, {
            radius: 4,
            weight: 0.2,
            fillColor: markerColor,
            color: "#000000",
            opacity: 1,
            fillOpacity: 1,
        });
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties) {
            layer.on({
                click: function (e) {
                    identifyFeature(L.stamp(layer));
                    highlightLayer.clearLayers();
                    highlightLayer.addData(
                        featureLayer.getLayer(L.stamp(layer)).toGeoJSON()
                    );
                },
                mouseover: function (e) {
                    if (config.hoverProperty) {
                        $(".info-control").html(feature.properties[config.hoverProperty]);
                        $(".info-control").show();
                    }
                },
                mouseout: function (e) {
                    $(".info-control").hide();
                },
            });
        }
    },
});

// Fetch the GeoJSON file
$.getJSON(config.geojson, function (data) {
    geojson = data;
    features = $.map(geojson.features, function (feature) {
        return {
            pn: feature.properties.pn,
            elements: feature.properties.details.elements,
            cat: feature.properties.details.cat,
            notes: feature.properties.details.notes,
            Hist_forms: feature.properties.details.Hist_forms,
            date: feature.properties.date,
            sources: feature.properties.sources,
            parish: feature.properties.parish,
            grid_ref: feature.properties.grid_ref,
            photos_url: feature.properties.photos_url,
            image: feature.properties.image
        };
    });
    featureLayer.addData(data);
    buildConfig();
    $("#loading-mask").hide();
});

var map = L.map("map", {
    layers: [OSM, featureLayer, highlightLayer],
}).fitWorld();

// Info control
var info = L.control({
    position: "bottomleft",
});

// Custom info hover control
info.onAdd = function (map) {
    this._div = L.DomUtil.create("div", "info-control");
    this.update();
    return this._div;
};
info.update = function (props) {
    this._div.innerHTML = "";
};
info.addTo(map);
$(".info-control").hide();

// Larger screens get expanded layer control
var isCollapsed = document.body.clientWidth <= 767;
var baseLayers = {
    OpenStreetMap: OSM,
    "Esri Satellite": satellite,
    "OS 1st ed.": mapboxSat,
    "OS 2nd ed.": OS2,
    "OS 1:25,000.": OS25,
    "OS 1-inch Geology": geological,
    "Roy (1752-55)": Roy,
};
var overlayLayers = {
    "<span id='layer-name'>GeoJSON Layer</span>": featureLayer,
    LiDAR: LiDAR,
};
var layerControl = L.control.layers(baseLayers, overlayLayers, {
    collapsed: isCollapsed,
}).addTo(map);

// Filter table to only show features in current map bounds
map.on("moveend", function (e) {
    syncTable();
});

map.on("click", function (e) {
    highlightLayer.clearLayers();
});

// Table formatter to make links clickable
function urlFormatter(value, row, index) {
    if (
        typeof value == "string" &&
        (value.indexOf("http") === 0 || value.indexOf("https") === 0)
    ) {
        return "<img src='" + value + "'>";
    }
}