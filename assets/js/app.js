var config = {
  geojson: "carrick2.geojson",
  title: "Carrick Place-Names",
  layerName: "Place-Names",
  hoverProperty: "pn",
  sortProperty: "",
  sortOrder: "",
};

// Function to load GeoJSON from user upload
function loadGeoJSONData(data) {
  geojson = data;

  // Set config title based on "name" property if available
  if (geojson.name) {
    config.title = geojson.name +  " Place-Names"; // Update config title
    $(".title").html(config.title); // Update any HTML elements showing the title
  }

  // Clear the existing feature layer and reload it with the new data
  featureLayer.clearLayers();
  features = geojson.features.map((feature) =>
    extractProperties(feature.properties || {})
  );

  featureLayer.addData(geojson);
  buildConfig(); // Rebuild filters and table based on new data
  map.fitBounds(featureLayer.getBounds());
  $("#loading-mask").hide();
}

function fileLoader(file){
	if (file) {
	//$("#loading-mask").show();
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);
        
        // Check if data is a valid GeoJSON
        if (data.type === "FeatureCollection" && data.features) {			
          loadGeoJSONData(data); // Process the uploaded GeoJSON data
		  $("#loading-mask").hide();
        } else {
			$("#loading-mask").hide();
          alert("Invalid GeoJSON file. Please upload a valid GeoJSON FeatureCollection.");
		  
        }
      } catch (error) {
		$("#loading-mask").hide();
        console.error("Error reading GeoJSON file:", error);
        alert("There was an error reading the GeoJSON file. Please check the file format.");
      }
    };
    reader.readAsText(file); // Read file as text
  }
}


// Event listener for file upload
document.getElementById("geojson-upload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  $("#loading-mask").show();
  fileLoader(file);
});



// Define a recursive function to extract properties, including from nested objects
function extractProperties(feature, properties = {}) {
  // Default to empty strings for combined fields
  properties["els_combined"] = "";
  properties["elements_combined"] = "";

  Object.keys(feature).forEach((key) => {
    if (key === "elements" && Array.isArray(feature[key])) {
      // Combine each object's "element" field in the "elements" array
      properties["elements_combined"] = feature[key]
        .map((element) => `${element.lang}: ${element.element}`)
        .join(", ");
    } else if (key === "els" && typeof feature[key] === "object") {
      // Combine key-value pairs in the "els" object
      properties["els_combined"] = Object.entries(feature[key])
        .map(([subKey, subValue]) => `${subKey}: ${subValue}`)
        .join(", ");
    } else if (typeof feature[key] === "object" && feature[key] !== null) {
      // Recursively process other nested objects
      extractProperties(feature[key], properties);
    } else {
      // For non-nested fields, copy directly
      properties[key] = feature[key];
    }
  });
  return properties;
}



var properties = [
  {
    value: "Feature",
    label: "Feature",
    table: { visible: true, sortable: true },
    filter: { type: "string", operators: ["contains"] },
    info: false,
  },
  {
    value: "elements",
    label: "Elements",
    table: false,
    filter: false,
    info: false,
  },
{
    value: "els",
    label: "Els",
    table: { visible: false, sortable: false },
    filter: false,
    info: false,
  },
  {
    value: "fid",
    label: "FID",
    table: { visible: false, sortable: false },
    filter: { type: "integer", operators: ["equal", "greater", "less"] },
    info: false,
  },
{
    value: "elements_combined",
    label: "Elements Combined",
    table: { visible: false, sortable: false },
    filter: false,
    info: false,
  },
  {
    value: "els_combined",
    label: "Els Combined",
    table: { visible: false, sortable: false },
    filter: false,
    info: false,
  },
  {
    value: "forms",
    label: "Forms",
    table: false,
    filter: false,
    info: false,
  },
  {
    value: "grid_ref",
    label: "Grid Reference",
    table: { visible: true, sortable: true },
    filter: { type: "string", operators: ["contains"] },
    info: false,
  },
  {
    value: "image",
    label: "Image",
    table: { visible: false, sortable: false, formatter: urlFormatter },
    filter: false,
    info: false,
  },
  {
    value: "lang",
    label: "Language",
    table:  { visible: false, sortable: false },
    filter: { type: "string", operators: ["contains"] },
    info: false,
  },
  {
    value: "latitude",
    label: "Latitude",
    table: { visible: false, sortable: false },
    filter: { type: "double", operators: ["equal", "greater", "less"] },
    info: true,
  },
  {
    value: "longitude",
    label: "Longitude",
    table: { visible: false, sortable: false },
    filter: { type: "double", operators: ["equal", "greater", "less"] },
    info: true,
  },
  {
    value: "osgb_east",
    label: "OSGB East",
    table: { visible: false, sortable: false },
    filter: { type: "integer", operators: ["equal", "greater", "less"] },
    info: false,
  },
  {
    value: "osgb_north",
    label: "OSGB North",
    table: { visible: false, sortable: false },
    filter: { type: "integer", operators: ["equal", "greater", "less"] },
    info: false,
  },
  {
    value: "parish",
    label: "Parish",
    table: { visible: true, sortable: true },
    filter: { type: "string", input: "checkbox", multiple: true, operators: ["in", "not_in"] },
    info: true,
  },
  {
    value: "photos_url",
    label: "Photos URL",
    table: { visible: false, sortable: false, formatter: urlFormatter },
    filter: false,
    info: true,
  },
  {
    value: "pn",
    label: "Place Name",
    table: { visible: true, sortable: true },
    filter: { type: "string", operators: ["equal", "begins with", "contains"] },
    info: true,
  },
  {
    value: "pn_disambig",
    label: "Disambiguation",
    table: false,
    filter: false,
    info: false,
  },
  {
    value: "pn_id",
    label: "Place Name ID",
    table: { visible: true, sortable: true },
    filter: { type: "integer", operators: ["equal", "greater", "less"] },
    info: true,
  }
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
    if (value.filter && typeof value.filter === "object") {
      var id;
      if (value.filter.type === "integer") {
        id = "cast(properties->" + value.value + " as int)";
      } else if (value.filter.type === "double") {
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
          if (key === "values" && Array.isArray(val) && val.length === 0) {
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
    if (value.table && typeof value.table === "object" && value.table.visible) {
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

// Fetch the GeoJSON file and process nested properties
$.getJSON(config.geojson, function (data) {
  geojson = data;
  features = geojson.features.map((feature) =>
    extractProperties(feature.properties || {})
  );
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
    // Log current `properties` to verify their `visible` status
    console.log("Current properties configuration:", properties);

    // Prepare a fresh table configuration array with visible columns only
    const tableConfig = [];

    // Optional: Add an action column if required
    tableConfig.push({
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
    });

    // Populate tableConfig with properties marked as visible
    properties.forEach((prop) => {
        if (prop.table && prop.table.visible) {
            tableConfig.push({
                field: prop.value,
                title: prop.label,
                sortable: prop.table.sortable || false,
            });
        }
    });

    // Ensure the table is properly configured with visible columns
    console.log("Table configuration:", tableConfig);

    // Clear existing table data and columns, then reinitialize it with filtered columns
    $("#table").bootstrapTable("destroy").bootstrapTable({
        cache: false,                // Prevents caching of column settings
        columns: tableConfig,         // Use filtered columns array
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
        onClickRow: function (row) {
            // Handle row click
        },
    });

    // Reattach resize event to reset view on window resize
    $(window).resize(function () {
        $("#table").bootstrapTable("resetView", {
            height: $("#table-container").height(),
        });
    });
}


function syncTable(filterTerm = "") {
  let filteredFeatures = [];

  // Loop through each feature layer to collect features within the map's current bounds
  featureLayer.eachLayer(function (layer) {
    // Only add features within the map's current bounds
    if (map.getBounds().contains(layer.getBounds())) {
      // Combine "els" properties into a single string for filtering if not already set
      if (!layer.feature.properties.els_combined && layer.feature.properties.els) {
        layer.feature.properties.els_combined = Object.entries(layer.feature.properties.els)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      }

      // Apply filter to "els_combined" if a filter term is provided
      if (
        filterTerm === "" || // No filter term, include all features
        (layer.feature.properties.els_combined &&
          layer.feature.properties.els_combined.includes(filterTerm))
      ) {
        // Add a unique ID and push to filteredFeatures
        layer.feature.properties.leaflet_stamp = L.stamp(layer);
        filteredFeatures.push(layer.feature);
      }
    }
  });

  // Clear the map's feature layer and reload it with only the filtered features
  featureLayer.clearLayers();
  featureLayer.addData(filteredFeatures);

  // Load the filtered features' properties into the table
  const tableData = filteredFeatures.map(feature => feature.properties);
  $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableData)));

  // Update the feature count display
  const featureCount = tableData.length;
  $("#feature-count").html(
    `${featureCount} visible ${featureCount === 1 ? "feature" : "features"}`
  );
}



function identifyFeature(id) {
  // Retrieve the feature and extract all properties (including nested ones)
  var feature = featureLayer.getLayer(id).feature;
  var featureProperties = extractProperties(feature.properties || {});

  // HTML content for the main table
  var content =
    "<table class='table table-striped table-bordered table-condensed'>";
  var hfContent = ""; // HTML for historical forms if needed
  var name = ""; // Name to display as a title

  // Loop through each property and display in the modal, handling specific cases
  $.each(featureProperties, function (key, value) {
    if (!value) {
      value = "";
    }

    // Convert URLs to clickable links if needed
    if (
      typeof value === "string" &&
      (value.startsWith("http") || value.startsWith("https"))
    ) {
      value = `<a href="${value}" target="_blank">${value}</a>`;
    }

    // Match property label with the defined properties for display
    $.each(properties, function (index, property) {
      if (key === property.value) {
        if (property.info !== false) {
          // Separate handling for regular properties and "Historical Forms"
          if (property.label !== "Historical Forms") {
            content += `<tr><th>${property.label}</th><td>${value}</td></tr>`;
          } else {
            hfContent += `<tr><td>${value}</td></tr>`;
          }
          // Title display for "Name" field
          if (property.label === "Name") {
            name = `<h4>${value}</h4>`;
          }
        }
      }
    });
  });

  content += "</table>";
  $("#feature-info").html(content);
  $("#name").html(name);

  // Add Historical Forms table if there is content
  if (hfContent) {
    hfContent =
      "<table class='table table-striped table-bordered table-condensed'>" +
      hfContent +
      "</table>";
    $("#hffeature-info").html(hfContent);
  }

  // Show the modal dialog with the feature information
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

function filterByLanguage() {
  // Get the selected language from the dropdown
  const selectedLanguage = document.getElementById("language-filter").value;
  
  if (selectedLanguage) {
    // Filter features by the selected language
    syncTable(selectedLanguage);
  } else {
    // If no language selected, reload all features
    featureLayer.clearLayers();
    featureLayer.addData(geojson.features);
    syncTable();
  }
}

// Updated filterLanguage function to filter based on `elements->lang` with AlaSQL
function filterLanguage(lang) {
  const query = `
    SELECT features.*
    FROM ? AS features
    OUTER APPLY features->elements AS el
    WHERE el->lang LIKE '%' + ? + '%'
  `;
  
  alasql(query, [geojson.features, lang], function (filteredFeatures) {
    featureLayer.clearLayers();        // Clear existing layers
    featureLayer.addData(filteredFeatures); // Add filtered data to the map
    syncTable();                       // Synchronize with the table
  });
}

$(document).ready(function () {
    const availableGeoJSONFiles = [
		{ name: "Carrick Place-Names", path: "carrick2.geojson" },
		{ name: "Sample GeoJSON 1", path: "blank.geojson" },
		{ name: "carrick4", path: "carrick4.geojson" },
		// Add more files as needed
	];


    const dropdown = $("#geojson-dropdown");
    if (dropdown.length === 0) {
        console.error("Dropdown element with ID #geojson-dropdown not found.");
        return;
    }

    // Populate dropdown and log each addition
    availableGeoJSONFiles.forEach(file => {
        console.log("Adding file to dropdown:", file);
        dropdown.append(new Option(file.name, file.path));
    });
});

$("#geojson-dropdown").on("change", function () {
    const selectedFilePath = $(this).val();

    if (selectedFilePath) {
        $("#loading-mask").show(); // Show loading spinner
		$.getJSON(selectedFilePath, function (data){
        // Fetch the selected GeoJSON file
        fileLoader(selectedFilePath);
		}
    }
});
