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

function buildFilters() {
    $("#query-builder").queryBuilder({
        allow_empty: true,
        filters: filters,
    });
}

function applyFilter() {
    var query = "SELECT * FROM ?";
    var sql = $("#query-builder").queryBuilder("getSQL", false, false).sql;
    if (sql.length > 0) {
        query += " WHERE " + sql;
    }
    alasql(query, [geojson.features], function (features) {
        featureLayer.clearLayers();
        featureLayer.addData(features);
        syncTable();
    });
}

function buildTable() {
    $("#table").bootstrapTable({
        cache: false,
        height: $("#table-container").height(),
        undefinedText: "",
        striped: false,
        pagination: false,
        minimumCountColumns: 1,
        sortName: config.sortProperty,
        sortOrder: config.sortOrder,
        toolbar: "#toolbar",
        search: true,
        trimOnSearch: false,
        showColumns: true,
        showToggle: true,
        columns: table,
        onClickRow: function (row) {
            // do something!
        },
        onDblClickRow: function (row) {
            // do something!
        },
    });

    map.fitBounds(featureLayer.getBounds());

    $(window).resize(function () {
        $("#table").bootstrapTable("resetView", {
            height: $("#table-container").height(),
        });
    });
}

function syncTable() {
    tableFeatures = [];
    featureLayer.eachLayer(function (layer) {
        layer.feature.properties.leaflet_stamp = L.stamp(layer);
        if (map.hasLayer(featureLayer)) {
            if (map.getBounds().contains(layer.getBounds())) {
                tableFeatures.push(layer.feature.properties);
            }
        }
    });
    $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
    var featureCount = $("#table").bootstrapTable("getData").length;
    $("#feature-count").html(
        featureCount == 1 ? featureCount + " visible feature" : featureCount + " visible features"
    );
}

function identifyFeature(id) {
    var featureProperties = featureLayer.getLayer(id).feature.properties;

    var content =
        "<table class='table table-striped table-bordered table-condensed'>";

    var hfContent = ""; //another string to stick the historical form content into

    var notesContent = "";

    var name = "";

    $.each(featureProperties, function (key, value) {
        if (!value) {
            value = "";
        }

        if (
            typeof value == "string" &&
            (value.indexOf("http") === 0 || value.indexOf("https") === 0)
        ) {
            value = "<a href='" + value + "' target='_blank'>" + value + "</a>";
        }

        $.each(properties, function (index, property) {
            if (key == property.value) {
                if (property.info !== false) {
                    if (property.label != "Historical Forms") {
                        //regular properties here
                        content +=
                            "<tr><th>" + property.label + "</th><td>" + value + "</td></tr>";
                    } else {
                        //if we have a historical form we handle this separately
                        hfContent += "<tr><td>" + value + "</td></tr>";
                    }
                    if (property.label == "Name") {
                        name += "<h4>" + value + "</h4>";
                    }
                }
            }
        });
    });

    content += "</table>";
    $("#feature-info").html(content);
    $("#name").html(name);

    if (hfContent) {
        content =
            "<table class='table table-striped table-bordered table-condensed'>" +
            hfContent +
            "</table>";
        $("#hffeature-info").html(content);
    }

    $("#featureModal").modal("show");
}

function switchView(view) {
    if (view == "split") {
        $("#view").html("Split View");
        location.hash = "#split";
        $("#table-container").show().css("height", "45%");
        $("#map-container").show().css("height", "55%");
        $(window).resize();
        if (map) {
            map.invalidateSize();
        }
    } else if (view == "map") {
        $("#view").html("Map View");
        location.hash = "#map";
        $("#map-container").show().css("height", "100%");
        $("#table-container").hide();
        if (map) {
            map.invalidateSize();
        }
    } else if (view == "table") {
        $("#view").html("Table View");
        location.hash = "#table";
        $("#table-container").show().css("height", "100%");
        $("#map-container").hide();
        $(window).resize();
    }
}

$("[name='view']").click(function () {
    $(".in,.open").removeClass("in open");
    if (this.id === "map-graph") {
        switchView("split");
        return false;
    } else if (this.id === "map-only") {
        switchView("map");
        return false;
    } else if (this.id === "graph-only") {
        switchView("table");
        return false;
    }
});

$("#about-btn").click(function () {
    $("#aboutModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#filter-btn").click(function () {
    $("#filterModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#chart-btn").click(function () {
    $("#chartModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#view-sql-btn").click(function () {
    alert($("#query-builder").queryBuilder("getSQL", false, false).sql);
});

$("#apply-filter-btn").click(function () {
    applyFilter();
});

$("#reset-filter-btn").click(function () {
    $("#query-builder").queryBuilder("reset");
    applyFilter();
});

$("#extent-btn").click(function () {
    map.fitBounds(featureLayer.getBounds());
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#download-csv-btn").click(function () {
    $("#table").tableExport({
        type: "csv",
        ignoreColumn: [0],
        fileName: "data",
    });
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#download-excel-btn").click(function () {
    $("#table").tableExport({
        type: "excel",
        ignoreColumn: [0],
        fileName: "data",
    });
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#download-pdf-btn").click(function () {
    $("#table").tableExport({
        type: "pdf",
        ignoreColumn: [0],
        fileName: "data",
        jspdf: {
            format: "bestfit",
            margins: {
                left: 20,
                right: 10,
                top: 20,
                bottom: 20,
            },
            autotable: {
                extendWidth: false,
                overflow: "linebreak",
            },
        },
    });
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#chartModal").on("shown.bs.modal", function (e) {
    drawCharts();
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