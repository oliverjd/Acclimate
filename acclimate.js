var startAgain;

const MPS_TO_MIPH = 2.237;

var hourlyWeather = {}
hourlyWeather.parseWeatherData = function(jsonObject) {
	this.tempC = [];
	this.feelsLikeC = [];
	this.windSpeedMi = [];
	this.rainMm3h = [];
	this.conditionCode = [];
	this.cloudPercent = [];
	console.log(jsonObject)
	for(i=0; i<24; i++) {
		wi = Math.floor(i/3) // API list gives data in 3-hour increments
		this.tempC[i] = jsonObject.list[wi].main.temp;
		this.feelsLikeC[i] = jsonObject.list[wi].main.temp;
		this.windSpeedMi[i] = jsonObject.list[wi].wind.speed * MPS_TO_MIPH;
		this.conditionCode[i] = jsonObject.list[wi].weather[0].id;
		this.cloudPercent[i] = jsonObject.list[wi].clouds.all;
		if (jsonObject.list[wi].rain) {
			this.rainMm3h[i] = jsonObject.list[wi].rain["3h"];
		} else {
			this.rainMm3h[wi] = 0;
		}
	}
};

var rideWeather = {}

var rideWeatherInitial = {
	rainMm3h: 0,
	hottest: -1000,
	coldest: 1000,
	feelsHottest: -1000,
	feelsColdest: 1000,
	averageCloud: 0,
	averageTemp: 0,
	variance: 0,
}

rideWeather.calculateRideWeather = function(hours, weather) {
	$.extend(this, rideWeatherInitial);
	for(var i=0; i<hours; i++) {
		if(weather.tempC[i] > this.hottest) this.hottest = parseInt(weather.tempC[i]);
		if(weather.tempC[i] < this.coldest) this.coldest = parseInt(weather.tempC[i]);
		if(weather.feelsLikeC[i] > this.feelsHottest) this.feelsHottest = parseInt(weather.feelsLikeC[i]);
		if(weather.feelsLikeC[i] < this.feelsColdest) this.feelsColdest = parseInt(weather.feelsLikeC[i]);
		if(weather.rainMm3h[i] > this.rainMm3h) this.rainMm3h = parseFloat(weather.rainMm3h[i]);
		this.averageCloud = this.averageCloud + parseInt(weather.cloudPercent[i]);
		this.averageTemp = this.averageTemp + parseInt(weather.tempC[i]);
	}
	this.averageCloud = this.averageCloud / hours;
	this.averageTemp = this.averageTemp / hours;
	this.variance = this.hottest - this.coldest;
}

var clothesUpper = {
	sleevelessBase: {state: false, minTemp: 15, maxTemp: 99, name: "Sleeveless base layer"},
	lsBase: {state: false, minTemp: 10, maxTemp: 12, name: "Long sleeve base layer"},
	winterBase: {state: false, minTemp: 5, maxTemp: 14, name: "Short sleeve winter base layer"},
	ssJersey: {state: false, minTemp: -99, maxTemp: 99, name: "Short sleeve summer jersey"},
	lsJersey: {state: false, minTemp: -99, maxTemp: -99, name: "Long sleeve mid-weight jersey"},
	armWarmers: {state: false, minTemp: 8, maxTemp: 19, name: "Arm warmers"},
	gilet: {state: false, minTemp: 5, maxTemp: 8, rainCutoff: 0.01, name: "Windproof gilet"},
	waterproof: {state: false, minTemp: -99, maxTemp: -99, rainCutoff: 0.1, name: "Waterproof jacket"}
};

var clothesLower = {
	bibs: {state: false, minTemp: 5, maxTemp: 99, name: "Bib shorts"},
	kneeWarmers: {state: false, minTemp: 5, maxTemp: 13, name: "Knee warmers"},
	tights: {state: false, minTemp: -99, maxTemp: 4, name: "Tights"}
}

var clothesHands = {
	mitts: {state: false, minTemp: 11, maxTemp: 99, name: "Mitts"},
	thinGloves: {state: false, minTemp: 8, maxTemp: 10, name: "Thin full-finger gloves"},
	linerGloves: {state: false, minTemp: -99, maxTemp: 4, name: "Merino liner gloves"},
	winterGloves: {state: false, minTemp: -99, maxTemp: 7, name: "Winter gloves"}
}

var clothesHead = {
	beanie: {state: false, minTemp: -99, maxTemp: 9, name: "Skull cap"},
	cap: {state: false, minTemp: -99, maxTemp: -99, name: "Cotton cycling cap"},
	buff: {state: false, minTemp: -99, maxTemp: 5, name: "Buff neck warmer"}
};

var clothesFeet = {
	toeCovers: {state: false, minTemp: 6, maxTemp: 14, name: "Toe covers"},
	shoeCovers: {state: false, minTemp: -99, maxTemp: 5, name: "Neoprene shoe covers"}
};

var clothesEyes = {
	darkLenses: {state: false, maxCloud: 10, name: "Sunglasses with dark lenses"},
	medLenses: {state: false, minCloud: 11, maxCloud: 94, name: "Sunglasses with medium lenses" },
	clearLenses: {state: false, minCloud: 95, maxCloud: 100, name: "Sunglasses with clear lenses" }
};

var clothes = {};
$.extend(clothes, clothesUpper, clothesLower, clothesHands, clothesHead, clothesFeet, clothesEyes);

var resultsHTML = "";

clothes.applyRules = function(rideWeather) {
	for(var key in this) {
		if((this[key].minTemp <= rideWeather.averageTemp) && (this[key].maxTemp >= rideWeather.averageTemp)) {
			this[key].state = true;
		}

		if((this[key].maxCloud >= rideWeather.averageCloud) && (this[key].minCloud <= rideWeather.averageCloud)) {
			this[key].state = true;
		}

		if(this[key].rainCutoff <= rideWeather.rainMm3h) {
			this[key].state = true;
		}

		if(this[key].state === true) {
			resultsHTML += "<li>" + this[key].name + "</li>";
		}
	}
}

function resetResults() {
	var css = document.createElement("style");
	css.type = "text/css";
	resultsHTML = "";
	css.innerHTML = "#resultsWrapper { height: 0; }";
	document.body.appendChild(css);
	document.getElementById('resultsContent').innerHTML = "";
}

function runProgram(weatherJsonParsed, fullLocationName, city) {
	hourlyWeather.parseWeatherData(weatherJsonParsed);

	var hourSelected = document.getElementById("hourSelect");
	var rideLength = hourSelected.options[hourSelected.selectedIndex].value;

	rideWeather.calculateRideWeather(rideLength, hourlyWeather);

	resultsHTML += "<p id=\"resultsMain\">";

	if(rideWeather.coldest === rideWeather.hottest) {
		resultsHTML += "It will be <span id=\"bold\">" + rideWeather.averageTemp + " degrees</span> Celcius ";
	} else {
		resultsHTML += "It will be between <span id=\"bold\">" + rideWeather.coldest + " and " + rideWeather.hottest + " degrees</span> Celcius ";
	}
	resultsHTML += "in <span id=\"bold\"><span class=\"tooltip\">" + city + "<span class=\"tooltiptext\">" + fullLocationName + "</span></span></span>, ";
	if(rideWeather.averageCloud === 0) {
		resultsHTML += "with a <span id=\"bold\">clear sky</span> ";
	} else {
		resultsHTML += "with <span id=\"bold\">" + Math.round(rideWeather.averageCloud) + "% cloud cover</span> ";
	}
	if(rideWeather.rainMm3h === 0) {
		resultsHTML += "and <span id=\"bold\">no chance of rain</span>. ";
	} else {
		resultsHTML += "and <span id=\"bold\">" + rideWeather.rainMm3h + " mm of rain</span>. ";
	}
	resultsHTML += "You should wear:</p><ul>";

	clothes.applyRules(rideWeather);

	resultsHTML += "</ul><p id=\"reset\"><a href=\"\" id=\"startAgain\">Start again</a></p>";

	document.getElementById('resultsContent').innerHTML = resultsHTML;

	var css = document.createElement("style");
	css.type = "text/css";
	css.innerHTML = "#resultsWrapper { height: 100vh } #resultsContent { position: relative; top: 50%; transform: translateY(-50%); }";
	document.body.appendChild(css);

	$('html, body').animate({
    scrollTop: $("#endAnchor").offset().top
	}, 1500);

	$("#startSwitch").removeAttr("disabled");
	$("#loading").hide();

	startAgain = document.getElementById('startAgain');
	startAgain.onclick = function() {
		$('html, body').animate({
			scrollTop: $("#startAnchor").offset().top
		}, 500, "linear", function() {
			resetResults();
		});
		return false;
	}
}

function getCoordinatesFromLocation() {
	var locationInput = document.getElementById("locationInput").value;
	$.ajax({
    type: "GET",
		url: 'request.php',
		data: {type: "geocode", string: encodeURI(locationInput)},
    success: function(data){
			coordinatesJsonParsed = JSON.parse(data);
			console.log(coordinatesJsonParsed)
			fullName = coordinatesJsonParsed[0].display_name;
			lon = coordinatesJsonParsed[0].lon;
			lat = coordinatesJsonParsed[0].lat;
			getWeatherFromCoordinates(fullName, coordinatesJsonParsed[0].display_name.split(',')[0], lat, lon);
    }
	});

	return false;
}

function getWeatherFromCoordinates(fullName, city, lat, lon) {
	$.ajax({
    type: "GET",
		url: 'request.php',
		data: {type: "weather", lat: lat, lon: lon},
    success: function(data){
			weatherJsonParsed = JSON.parse(data);
			runProgram(weatherJsonParsed, fullName, city);
    }
	});
}

function reverseGeocode(lat, lon) {
	$.ajax({
    type: "GET",
		url: 'request.php',
		data: {type: "reverse_geocode", lat: lat, lon: lon},
    success: function(data){
			geocodeJsonParsed = JSON.parse(data);
			console.log(geocodeJsonParsed);
			console.log(geocodeJsonParsed.display_name);
			globalCoords = {lat: lat, lon: lon, name: geocodeJsonParsed.display_name, city: geocodeJsonParsed.address.city};
			$("#loc").hide(200);
			$("#tick").show(200);
			$("#useGeolocation").css('background-color', 'rgb(51, 140, 39)');
			$("#locationInput").val(geocodeJsonParsed.address.city);
			$("#startSwitch").removeAttr("disabled");
			$("#useGeolocation").attr("disabled", "disabled");
			console.log("removing disabled");
    }
	});
}

var startSwitch = document.getElementById('startSwitch');

function startEverything() {
	resetResults();
	if (globalCoords != null) {
		console.log("got global coords:", globalCoords)
		$("#loading").show();
		$("#startSwitch").attr("disabled", "disabled");
		getWeatherFromCoordinates(globalCoords.name, globalCoords.city, globalCoords.lat, globalCoords.lon)
 	} else if(document.getElementById('locationInput').value.length != 0){
		$("#loading").show();
		$("#startSwitch").attr("disabled", "disabled");
		return getCoordinatesFromLocation();
	} else {
		return false;
	}
}

startSwitch.onclick = function() {
	startEverything();
}

globalCoords = null;

function geoSuccess(position) {
	console.log(position.coords.latitude, position.coords.longitude);
	reverseGeocode(position.coords.latitude, position.coords.longitude);
	//globalCoords = {lat: position.coords.latitude, lon: position.coords.longitude};
	// TODO: enable start button here
};

function geoError(error) {
	console.log('location denied');
	$("#loc").hide(200);
	$("#fail").show(200);
	$("#useGeolocation").css('background-color', 'rgb(191, 47, 47)');
};

var geoOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

document.getElementById("useGeolocation").onclick = function() {
	console.log('locate');
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions)
	} else {
		geoError(null)
	}
}

function resizable (el, factor) {
  var int = Number(factor) || 7.7;
  function resize() {
		el.style.width = ((el.value.length+1) * int) + 'px';
		if (el.value.length == 0) {
			$("#startSwitch").attr("disabled", "disabled");
		} else {
			$("#startSwitch").removeAttr("disabled");
		}
	}
  var e = 'keyup,keypress,focus,blur,change'.split(',');
  for (var i in e) el.addEventListener(e[i],resize,false);
  resize();
}
resizable(document.getElementById('locationInput'),30);

$("#locationInput").keypress(function(e) {
	// TODO: if text in box, set globalCoords to null and remove tick mark
	console.log($("#locationInput").val().length)
	if ($("#locationInput").val().length != 0) {
		globalCoords = null
		$("#loc").show()
		$("#tick").hide()
		$("#fail").hide()
		$("#useGeolocation").css('background-color', '#828282');
		$("#useGeolocation").removeAttr("disabled");
	}
	var enterKey = 13;
	if(e.which == enterKey) {
		startEverything();
	}
});
