
// To do
// Add play-pause button and loop, test with point in time data, add CSV as examples

var annual = true, trended = true, hideDrop = true, roundDec = false;
$(document).ready(function(){
	
	drawMap();
	
	createLegend();
	
	varChange();
	
	breaksChange();
	
	playPause();
	
	hideInternal(hideDrop);
	
	example(trended);
	
});

var countyD3;
function drawMap(){
	var w = 685, h = 410, offTop = h/2, offLeft = w/2, scaleFactor = 0.83;
	
	var path = d3.geo.path();
	
	var svg = d3.select("#map").append("svg")
		.attr("width", w)
		.attr("height", h);
	
	var mapG = svg.append("g")
	  .attr('class', 'mapG')
	  .attr("transform", "scale(" + scaleFactor + ") translate(-70,0)");
     
    countyD3 = mapG.append("g")
	  .attr("class", "counties")
	  .selectAll("path")
      .data(topojson.feature(counties, counties.objects.counties).features)
    .enter().append("path")
	  .attr("d", path)
	  .attr("id", function(d){ return d.id; })
	  .on("mouseover", function(d){
	  	var thisVar = $('#varChoices').val();
	  	$('#popupCounty').html(countyRef[d.id]);
	  	$('#popupVariable').html(thisVar);
	  	if (trend){ 
	  		var uiVal = $('#slider').slider('option','value');
			if (roundDec){
	  			var ins = addCommas(Math.round(dataP[thisVar][toFiveDigits(d.id)][uiVal]));
			}
			else{
				var ins = addCommas(Math.round(dataP[thisVar][toFiveDigits(d.id)][uiVal]*100)/100);	
			}
	  	}
	  	else{
			if (roundDec){
	  			var ins = addCommas(Math.round(data[thisVar][toFiveDigits(d.id)]));
			}
			else{
				var ins = addCommas(Math.round(data[thisVar][toFiveDigits(d.id)]*100)/100);	
			}
	  	}
	  	$('#popupValue').html(ins);
	  	$('#popup').show();
		
		$('popupVariable2').html('PercentWhite');
		$('#popupValue2').html(data['County share white'][toFiveDigits(d.id)]);	
		
		$('popupVariable3').html('PercentBlack');
		$('#popupValue3').html(data['County share black'][toFiveDigits(d.id)]);	
		
		$('popupVariable4').html('PercentLatino');
		$('#popupValue4').html(data['County share Latino'][toFiveDigits(d.id)]);	
		
		
	  	$('#' + d.id).attr('stroke', 'black').attr('stroke-width', '3');
	  	pos(event);
	  })
	  .on("mousemove", function(d){
	  	pos(event);
	  })
	  .on("mouseout", function(d){
	  	$('#popup').hide();
	  	$('#' + d.id).attr('stroke', 'none').removeAttr('stroke-width');
	  })

	mapG.append("path")
	  .datum(topojson.mesh(counties, counties.objects.states, function(a, b) { return a !== b; }))
	  .attr("class", "states")
	  .attr("d", path);
}

// Function to convert 4 digit counties to five digits
function toFiveDigits(id){
	if ((id + "").length == 4){ return "0" + id; }
	else{ return "" + id; }
}

// Positioning Function
function pos(e){
var x = e.pageX || e.clientX, y = e.pageY || e.clientY;
var dLeft = 0, offMouseLeft = -$('#popup').width()/2, offMouseTop = 30;
var posX = x + offMouseLeft - dLeft, posY = y + offMouseTop;
if (posY<0) { posY = 0; } if (posY>350) { posY = 50; }if (posX<30){ posX = 30; } if (posX>400){ posX = 400; }
$('#popup').css({top: posY + "px", left: posX + "px"}); 
}

// HTML Helper Functions

function showMore(){
	$('#instructions').toggle();
	if ($('#showMore').html() == 'Hide Instructions'){
		$('#showMore').html('File Format');
	}
	else{
		$('#showMore').html('Hide Instructions')
	}
}

var legendD3, legendColors = ["#b0d5f1","#82c4e9","#0096d2","#00578b","#000000"];
function createLegend(){
	var boxWidth = 25, boxHeight = 10, numBoxes = 5;
	var w = boxWidth * numBoxes + (numBoxes * 4 + 2 * 2), h = boxHeight + (2 * 2);
	
	var svg = d3.select('#legendColors').append('svg')
		.attr("width", w)
		.attr("height", h);
	
	legendD3 = svg.selectAll("path")
		.data(legendColors)
		.enter().append("path")
		.attr("d", function(d,i){
			var paths = [(( i * (boxWidth + 5) ) -2), (( i * (boxWidth + 5) ) + 2 + (boxWidth)), 2, 2 + boxHeight]
			return "M" + paths[0] + "," + paths[2] + "L" + paths[1] + "," + paths[2] + "L" + paths[1] + "," + paths[3] + "L" + paths[0] + "," + paths[3] + "Z";
		})
		.attr("fill", function(d){ return d; });
}

// Read example file

function example(trended){
	
	var fileName = 'mydata_latino.csv'; /*File dirates.csv has only 2011; mydata.csv has all years */
	$.get(fileName, function(data){
		var rows = data.replace("\r","").split("\n");
		fullfile = [];
		for (i = 0;i < rows.length; i++){
			var temp = rows[i].split(",");
			// Clean empty rows
			var write = true;
			for (j = 0; j < temp.length; j++){
				if (temp[j] == ""){ write = false; break; }
			}
			if (write){ 
				temp[0] = toFiveDigits(temp[0]);
				fullfile.push(temp); 
			}
		}
		if (fullfile[0][1].toLowerCase() == "period"){ trend = true; parse(); }
		else{ trend = false; parse(); }
	});
}

var data = {}, varnames = [], dataP = {}, numPeriods, startPeriod, startYear, endPeriod, endYear, maxPeriod, minPeriod;
var pRef;
function parse(){
	data = {}
	varnames = []
	if (trend){
		// Get variable names
		for (i = 3; i < fullfile[0].length; i++){
			varnames.push(fullfile[0][i]);
			data[fullfile[0][i]] = {}
		}
		// Store data in a object
		for (i = 0; i < varnames.length; i++){
			for (j = 1; j < fullfile.length; j++){
				if (!data[varnames[i]][fullfile[j][0]]){
					data[varnames[i]][fullfile[j][0]] = {}
				}
				var dateConcat = fullfile[j][1] + "-" + fullfile[j][2];
				data[varnames[i]][fullfile[j][0]][dateConcat] = fullfile[j][i + 3] * 1
				if (fullfile[j][i + 3] == "."){ data[varnames[i]][fullfile[j][0]][dateConcat] = null; }
			}
		}
		// Get time periods
		startPeriod = Infinity;
		startYear = Infinity;
		endPeriod = -Infinity;
		endYear = -Infinity;
		maxPeriod = -Infinity;
		minPeriod = Infinity;
		for (i = 1; i < fullfile.length; i++){
			startYear = Math.min(startYear, fullfile[i][2] * 1);
			endYear = Math.max(endYear, fullfile[i][2] * 1);
			maxPeriod = Math.max(maxPeriod, fullfile[i][1] * 1);
			minPeriod = Math.min(minPeriod, fullfile[i][1] * 1);
		}
		for (i = 1; i < fullfile.length; i++){
			if (fullfile[i][2] * 1 == startYear){
				startPeriod = Math.min(startPeriod, fullfile[i][1] * 1);
			}
			if (fullfile[i][2] * 1 == endYear){
				endPeriod = Math.max(endPeriod, fullfile[i][1] * 1);
			}
		}
		// Convert to array
		dataP = {}
		pRef = [];
		var tRef = {};
		for (v in data){
			dataP[v] = {}
			for (county in data[v]){
				dataP[v][county] = [];
				for (i = startYear; i <= endYear; i++){
					if (i == startYear){
						for (j = startPeriod; j <= maxPeriod; j++){
							dataP[v][county].push(data[v][county][j + "-" + i]);
							tRef[j + "-" + i] = 0;
						}
					}
					else if (i != endYear){
						for (j = minPeriod; j <= maxPeriod; j++){
							dataP[v][county].push(data[v][county][j + "-" + i]);
							tRef[j + "-" + i] = 0;
						}
					}
					else{
						for (j = minPeriod; j <= endPeriod; j++){
							dataP[v][county].push(data[v][county][j + "-" + i]);
							tRef[j + "-" + i] = 0;
						}						
					}
				}
			}
		}
		for (ref in tRef){
			pRef.push(ref);
		}
		numPeriods = pRef.length;
		$('#slider').show(); $('#sliderCallout').show(); $('#playPause').show();
	}
	else{
		// Get variable names
		for (i = 1; i < fullfile[0].length; i++){
			varnames.push(fullfile[0][i]);
			data[fullfile[0][i]] = {}
		}
		// Store data in a object
		for (i = 0; i < varnames.length; i++){
			for (j = 1; j < fullfile.length; j++){
				data[varnames[i]][fullfile[j][0]] = fullfile[j][i + 1] * 1
				if (fullfile[j][i + 1] == "."){ data[varnames[i]][fullfile[j][0]] = null; }
			}
		}		
		$('#slider').hide(); $('#sliderCallout').hide(); $('#playPause').hide();
	}
	// Hide Loading Data...
	$('#loadingData').hide();
	// Add variable choices
	$('#varChoices').empty();
	for (i = 0; i < varnames.length; i++){
		$('#varChoices').append('<option value="' + varnames[i] + '">' + varnames[i] + '</option>');
	}
	$('#varChoices').change(function(){
		colorMap();
	});
	// Show only years if annual data
	if (trend){
		if (annual){
			for (i=0;i<pRef.length;i++){
				pRef[i] = pRef[i].split('-')[1];	
			}
		}
		// Initiate Slider if the data is trended
		 slider(); 
	}
	// Calculate Breaks
	calculateBreaks();
	// Color Map
	countyD3.attr('stroke', 'none');
	colorMap();
}

// Variable Change function

function varChange(){
	$('#varChoices').change(function(){
		calculateBreaks();
		colorMap();
	});
}

// Breaks Change function

function breaksChange(){
	$('.legendVal').on('blur', function(e){
		for (i = 0; i < 6; i++){
			breaks[i] = $('#v' + (i + 1)).val();
		}
		colorMap();
	});
}

// Play Pause Function

function playPause(){
	$("#playPause").button({
        icons: {
            primary: "ui-icon-play"
        }
    }).click(function(e){
		var icons = $('#playPause').button('option')["icons"]["primary"];
		if (icons == 'ui-icon-pause'){
			$('#playPause').button('option', "icons", { primary: "ui-icon-play" });
			pauseMe(); 
		}
		else{ 
			$('#playPause').button('option', "icons", { primary: "ui-icon-pause" });
			playMe(); 
		}
	});
}

// Play Loop

function playMe(){
	var sliderVal = $('#slider').slider('option','value');	
	if (sliderVal*1 == (numPeriods - 1)){ $('#slider').slider('option','value', -1);	}
	loopMe();
	loop = setInterval(function(){ loopMe(); },500);
}

// Pause Loop

function pauseMe(){
	clearInterval(loop);
}

// Loop

var loop;
function loopMe(){
	var sliderVal = $('#slider').slider('option','value');	
	if (sliderVal*1 != (numPeriods - 1)){
		var newVal = sliderVal*1 + 1;
		$('#sliderCallout').html(pRef[newVal]);
		$('#slider').slider('option','value',newVal);
		colorMap();
	}
	else{
		$('#playPause span:eq(0)').toggleClass("ui-icon-pause ui-icon-play");	
		clearInterval(loop);
	}
}

// Calculate Breaks as 20th, 40th, 60th, and 80th percentiles

var breaks;
function calculateBreaks(){
	var thisVar = $('#varChoices').val(), temp = [];
	// Create array of all data for this variable
	for (county in data[thisVar]){
		if (trend){
			for (tp in data[thisVar][county]){
				temp.push(data[thisVar][county][tp]);
			}
		}
		else{
			temp.push(data[thisVar][county]);
		}
	}
	temp.sort(function(a,b){ return a-b; });
	breaks = [d3.quantile(temp,0.05),d3.quantile(temp,0.2), d3.quantile(temp,0.4), d3.quantile(temp,0.6), d3.quantile(temp,0.8),d3.quantile(temp,0.95)];
	for (i = 1; i < 7; i++){
		if (roundDec){
			$('#v' + i).val(Math.round(breaks[i - 1]));
		}
		else{
			$('#v' + i).val(Math.round(breaks[i - 1]*100)/100);	
		}
	}
}

// Color Map
function colorMap(){
	var thisVar = $('#varChoices').val();
	if (trend){ var uiVal = $('#slider').slider('option', 'value'); }
	for (county in data[thisVar]){
		if (trend){
			var val = dataP[thisVar][county][uiVal * 1];
		}
		else{ 
			var val = data[thisVar][county];
		}
		if (val < 20){ $('#' + (county * 1)).attr('fill', legendColors[0]); }
		//else if (val < 2){ $('#' + (county * 1)).attr('fill', legendColors[1]); }
		else if (val < 40){ $('#' + (county * 1)).attr('fill', legendColors[1]); }
		else if (val < 60){ $('#' + (county * 1)).attr('fill', legendColors[2]); }
		else if (val < 80){ $('#' + (county * 1)).attr('fill', legendColors[3]); }
		else if (val <= 100){ $('#' + (county * 1)).attr('fill', legendColors[4]); }
		//else if (val >= 10){ $('#' + (county * 1)).attr('fill', legendColors[6]); }
		else{ $('#' + (county * 1)).attr('fill', '#CCC'); }
		
		if (val == 0){ $('#' + (county * 1)).attr('fill', legendColors[0]); }
	}
	
}

function colorMapSlider(uiVal){
	var thisVar = $('#varChoices').val();
	for (county in data[thisVar]){
		var val = dataP[thisVar][county][uiVal * 1];
		if (val < 20){ $('#' + (county * 1)).attr('fill', legendColors[0]); }
		//else if (val < 2){ $('#' + (county * 1)).attr('fill', legendColors[1]); }
		else if (val < 40){ $('#' + (county * 1)).attr('fill', legendColors[1]); }
		else if (val < 60){ $('#' + (county * 1)).attr('fill', legendColors[2]); }
		else if (val < 80){ $('#' + (county * 1)).attr('fill', legendColors[3]); }
		else if (val <= 100){ $('#' + (county * 1)).attr('fill', legendColors[4]); }
		//else if (val >= 10){ $('#' + (county * 1)).attr('fill', legendColors[6]); }
		else{ $('#' + (county * 1)).attr('fill', '#CCC'); }
		
		if (val == 0){ $('#' + (county * 1)).attr('fill', legendColors[0]); }
	}
	
}

// Slider

var sliderWidth = 200;
function slider(){
	$('#slider').slider({
		min: 0,
		max: numPeriods - 1,
		step: 1,
		orientation: 'horizontal',
		value: 0,
		start: function(event, ui) { sliderAction(event,ui); },
		slide: function(event, ui) { sliderActionAlt(event,ui); },
		stop: function(event, ui) { sliderAction(event,ui); },
		change: function(event, ui) { sliderAction(event,ui); }
	});
	inte = setInterval(function(){ checkSlider(); },300);	
}

var inte, oT = 0, oL = 0, loop;
if (annual){ correct = 0; }
else{ correct = -4; }
function checkSlider(){
	var offset = $('.ui-slider-handle').offset();
	if (oT == offset.top && oL == offset.left) { clearInterval(inte); }
	oT = offset.top;
	oL = offset.left;
	var uiVal = $('#slider').slider('option','value');
	$('#sliderCallout').html(pRef[uiVal]).css({ top: offset.top + 20 + 'px', left: offset.left + correct + 'px' });		
}

function sliderAction(event,ui){
	// Nothing here
	// Add the year value next to the slider handle
	var offset = $(ui.handle).offset();
	$('#sliderCallout').html(pRef[ui.value]).css({ top: offset.top + 20 + 'px', left: offset.left + correct + 'px' });
	oldUIVal = ui.value;
}

function sliderActionAlt(event,ui){
	// Some function to change graph, only here so we don't repeat in the slideraction function
	colorMapSlider(ui.value);
	// Add the year value next to the slider handle
	var correction = sliderWidth/(numPeriods - 1);
	if (ui.value<oldUIVal) { correction = correction * -1; }
	var offset = $(ui.handle).offset();
	$('#sliderCallout').html(pRef[ui.value]).css({ top: offset.top + 20 + 'px', left: offset.left + correct + correction + 'px' });
	oldUIVal = ui.value;
}

// Add Commas function from http://stackoverflow.com/questions/6392102/add-commas-to-javascript-output

function addCommas(nStr){
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function hideInternal(hide){
	if (hide){
		$('#dropDown').hide();	
		$('#ppButton').css({ 'margin-top': '-40px' });
	}
}