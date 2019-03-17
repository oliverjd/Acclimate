<?php

require_once 'api_keys.php';

$type = $_REQUEST["type"];

if ($type == "geocode") {
	$location_string = $_REQUEST["string"];

	$url = "https://eu1.locationiq.com/v1/search.php?key=".$locationiq_api_key."&q=".$location_string."&format=json";

	$curl = curl_init();

	curl_setopt_array($curl, array(
		CURLOPT_RETURNTRANSFER => 1,
		CURLOPT_URL => $url
	));

	$resp = curl_exec($curl);
	curl_close($curl);

	echo $resp;
}

if ($type == "reverse_geocode") {
	$lat = $_REQUEST["lat"];
	$lon = $_REQUEST["lon"];

	$url = "https://eu1.locationiq.com/v1/reverse.php?key=".$locationiq_api_key."&lat=".$lat."&lon=".$lon."&format=json";

	$curl = curl_init();

	curl_setopt_array($curl, array(
		CURLOPT_RETURNTRANSFER => 1,
		CURLOPT_URL => $url
	));

	$resp = curl_exec($curl);
	curl_close($curl);

	echo $resp;
}


if ($type == "weather") {
	$lat = $_REQUEST["lat"];
	$lon = $_REQUEST["lon"];

	$url = "https://api.openweathermap.org/data/2.5/forecast?lat=".$lat."&lon=".$lon."&units=metric&appid=".$openweathermap_api_key;

	$curl = curl_init();

	curl_setopt_array($curl, array(
		CURLOPT_RETURNTRANSFER => 1,
		CURLOPT_URL => $url
	));

	$resp = curl_exec($curl);
	curl_close($curl);

	echo $resp;
}

?>
