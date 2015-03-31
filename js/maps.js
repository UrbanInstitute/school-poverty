function drawMap(breaks, dataID, indicator, tooltip_text){
    var formatter = d3.format("%")
    var colors = ["#b0d5f1","#82c4e9","#0096d2","#00578b", "#000"]

    // d3.select("#legend")
    // .selectAll("legend-item")
    // .data(breaks)
    // .enter()
    // .append("div")
    // .attr("class","legend-item")
    // .text(function(d){return formatter(d)})
  var ls_w = 40, ls_h = 18;

  var svg = d3.select("#" + dataID + "_legend")
  .append("svg")
  .attr("height",ls_h*3)

  svg.append("text")
  .text(formatter(0))
  .attr("x",0)
  .attr("y",15)

  var legend = svg.selectAll("g.legend-item")
  .data(breaks)
  .enter().append("g")
  .attr("class", "legend-item");


  legend.append("rect")
  .attr("x", function(d,i ){return 10+i*ls_w})
  .attr("y", 20)
  .attr("width", ls_w)
  .attr("height", ls_h)
  .attr("z-index",10)
  .style("fill", function(d, i) { return colors[i]; })
  .on("mouseover", function(d, i){
    d3.selectAll("path.urban-map-counties")
    .classed("greyed_out",true)
    d3.selectAll('path[fill=\"'+colors[i]+'\"]')
    .classed("greyed_out",false)
  })
  .on("mouseout", function(d){
    d3.selectAll(".greyed_out")
    .classed("greyed_out", false)
  })

  legend.append("text")
  .attr("x", function(d,i){return 10+ ls_w + (i*ls_w) - ls_w/3})
  .attr("y", 15)
  .text(function(d, i){ return formatter(d); });


      /*
        Create a new "Urban Map" object
      */
      var map = new Urban.Map({
        "title": "",
        // Container div to render map onto
        "renderTo" : "#" + dataID + "_map",
        // CSV file containing data to show on map
        "csv" : "../data/data.csv",
        // geojson file of us counties (not necessary if using urban.map.bundle.js)
        "geoJson" : "../data/counties.geo.json",
        // (optional) Color for missing data
        "missingColor" : "#aaa",
        // Variable that identifies the county in the csv
        "countyID" : "CONUM",
        // variable to color map by
        "displayVariable" : {
          // name of variable in csv
          "name" : indicator,
          // number of different breaks (exclude minimum value (0), include maximum)
          "breaks" : breaks,
          "colors" : colors,
          // (optional) Settings for map legend
          "legend" : {
            // (optional) Show legend in map
            "enabled" : false,
            // (optional) Set the relative pixel width of the bins in the legend
            "binWidth" : 40,
            // (optional) Format for the legend
            formatter : function() {
              // access to value of bin
              return this.value + "%";
            }
          }
        },
        // (optional) HTML for tooltip using variables in csv
        "tooltip" : {
          // (optional) Function which has access to all data (from csv)
          // for the county being mousedover
          formatter : function () {
            return '<div> ' + this._county_name + '</div>' +
            '<div>' + tooltip_text+ ': ' + formatter(this[indicator]) + '</div>'
          },
          // (optional) Opacity of tooltip
          opacity : 0.9
        }

      });
}