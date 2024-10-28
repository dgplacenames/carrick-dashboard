var config = {
  geojson: "carrick4.geojson",
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


function drawCharts() {
  // Status
  $(function () {
    var result = alasql(
      "SELECT status AS label, COUNT(*) AS total FROM ? GROUP BY status",
      [features]
    );
    var columns = $.map(result, function (status) {
      return [[status.label, status.total]];
    });
    var chart = c3.generate({
      bindto: "#status-chart",
      data: {
        type: "pie",
        columns: columns,
      },
    });
  });

  // Zones
  $(function () {
    var result = alasql(
      "SELECT congress_park_inventory_zone AS label, COUNT(*) AS total FROM ? GROUP BY congress_park_inventory_zone",
      [features]
    );
    var columns = $.map(result, function (zone) {
      return [[zone.label, zone.total]];
    });
    var chart = c3.generate({
      bindto: "#zone-chart",
      data: {
        type: "pie",
        columns: columns,
      },
    });
  });

  // Size
  $(function () {
    var sizes = [];
    var regeneration = alasql(
      "SELECT 'Regeneration (< 3\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) < 3",
      [features]
    );
    var sapling = alasql(
      "SELECT 'Sapling/poles (1-9\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 1 AND 9",
      [features]
    );
    var small = alasql(
      "SELECT 'Small trees (10-14\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 10 AND 14",
      [features]
    );
    var medium = alasql(
      "SELECT 'Medium trees (15-19\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 15 AND 19",
      [features]
    );
    var large = alasql(
      "SELECT 'Large trees (20-29\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 20 AND 29",
      [features]
    );
    var giant = alasql(
      "SELECT 'Giant trees (> 29\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) > 29",
      [features]
    );
    sizes.push(regeneration, sapling, small, medium, large, giant);
    var columns = $.map(sizes, function (size) {
      return [[size[0].category, size[0].total]];
    });
    var chart = c3.generate({
      bindto: "#size-chart",
      data: {
        type: "pie",
        columns: columns,
      },
    });
  });

  // Species
  $(function () {
    var result = alasql(
      "SELECT species_sim AS label, COUNT(*) AS total FROM ? GROUP BY species_sim ORDER BY label ASC",
      [features]
    );
    var chart = c3.generate({
      bindto: "#species-chart",
      size: {
        height: 2000,
      },
      data: {
        json: result,
        keys: {
          x: "label",
          value: ["total"],
        },
        type: "bar",
      },
      axis: {
        rotated: true,
        x: {
          type: "category",
        },
      },
      legend: {
        show: false,
      },
    });
  });
}

$(function () {
  $(".title").html(config.title);
  $("#layer-name").html(config.layerName);
});

function buildConfig() {
  filters = [];
  table = [
    {
      field: "action",
      title: "<i class='fa fa-gear'></i>&nbsp;Action",
      align: "center",
      valign: "middle",
      width: "75px",
      cardVisible: false,
      switchable: false,
      formatter: function (value, row, index) {
        return [
          '<a class="zoom" href="javascript:void(0)" title="Zoom" style="margin-right: 10px;">',
          '<i class="fa fa-search-plus"></i>',
          "</a>",
          '<a class="identify" href="javascript:void(0)" title="Identify">',
          '<i class="fa fa-info-circle"></i>',
          "</a>",
        ].join("");
      },
      events: {
        "click .zoom": function (e, value, row, index) {
          map.fitBounds(featureLayer.getLayer(row.leaflet_stamp).getBounds());
          highlightLayer.clearLayers();
          highlightLayer.addData(
            featureLayer.getLayer(row.leaflet_stamp).toGeoJSON()
          );
        },
        "click .identify": function (e, value, row, index) {
          identifyFeature(row.leaflet_stamp);
          highlightLayer.clearLayers();
          highlightLayer.addData(
            featureLayer.getLayer(row.leaflet_stamp).toGeoJSON()
          );
        },
      },
    },
  ];

  $.each(properties, function (index, value) {
    // Filter config
    if (value.filter) {
      var id;
      if (value.filter.type == "integer") {
        id = "cast(properties->" + value.value + " as int)";
      } else if (value.filter.type == "double") {
        id = "cast(properties->" + value.value + " as double)";
      } else {
        id = "properties->" + value.value;
      }
      filters.push({
        id: id,
        label: value.label,
      });
      $.each(value.filter, function (key, val) {
        if (filters[index]) {
          // If values array is empty, fetch all distinct values
          if (key == "values" && val.length === 0) {
            alasql(
              "SELECT DISTINCT(properties->" +
                value.value +
                ") AS field FROM ? ORDER BY field ASC",
              [geojson.features],
              function (results) {
                distinctValues = [];
                $.each(results, function (index, value) {
                  distinctValues.push(value.field);
                });
              }
            );
            filters[index].values = distinctValues;
          } else {
            filters[index][key] = val;
          }
        }
      });
    }
    // Table config
    if (value.table) {
      table.push({
        field: value.value,
        title: value.label,
      });
      $.each(value.table, function (key, val) {
        if (table[index + 1]) {
          table[index + 1][key] = val;
        }
      });
    }
  });

  buildFilters();
  buildTable();
}

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
  /*style: function (feature) {
    return {
      color: feature.properties.color
    };
  },*/
  pointToLayer: function (feature, latlng) {
    if (feature.properties && feature.properties["marker-color"]) {
      markerColor = feature.properties["marker-color"];
    } else {
      markerColor = "#1b5fde";
    }
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
            details.elements: feature.properties.details.elements,
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
if (document.body.clientWidth <= 767) {
  isCollapsed = true;
} else {
  isCollapsed = false;
}
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
var layerControl = L.control
  .layers(baseLayers, overlayLayers, {
    collapsed: isCollapsed,
  })
  .addTo(map);

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
    return "<img src='" + value + "''>";
  }
}

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
  if (featureCount == 1) {
    $("#feature-count").html(
      $("#table").bootstrapTable("getData").length + " visible feature"
    );
  } else {
    $("#feature-count").html(
      $("#table").bootstrapTable("getData").length + " visible features"
    );
  }
}

function identifyFeature(id) {
  var featureProperties = featureLayer.getLayer(id).feature.properties;

  var content =
    "<table class='table table-striped table-bordered table-condensed'>";

  var hfContent = ""; //another string to stick the historical form content into

  var notesContent ="";

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
            //if we have a historical form we handle this separately (could be a completely different layout if required - here we have a table that just displays the values)

            hfContent += "<tr><td>" + value + "</td></tr>";
          }
          if (property.label == "Name") {
            name += "<h4>"+ value + "</h4>";
          }
        }
      }
    });
  });


  content += "</table>"; // I think this should actually be </table>
  $("#feature-info").html(content);
  //now we can choose to add in the hf tab if we have any historical forms
  
  name 
  $("#name").html(name);

  if (hfContent) {
    // for now just adding as a table underneath the main table with a heading above it

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
    $("#table-container").show();
    $("#table-container").css("height", "45%");
    $("#map-container").show();
    $("#map-container").css("height", "55%");
    $(window).resize();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "map") {
    $("#view").html("Map View");
    location.hash = "#map";
    $("#map-container").show();
    $("#map-container").css("height", "100%");
    $("#table-container").hide();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "table") {
    $("#view").html("Table View");
    location.hash = "#table";
    $("#table-container").show();
    $("#table-container").css("height", "100%");
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