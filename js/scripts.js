/* {{.dist}}/js/scripts.js */

/**
 * Created At: 8 Jun 2021
 */

if (window.localStorage !== undefined) { // supported
	var at_night = window.localStorage.getItem("nightmode");

	if (at_night === "true") {
		document.body.classList.add("nightmode");
	} else {
		at_night = "false";
	}

	var el = document.getElementById("ElemToggleNightMode");
	el.innerText = "Toggle Night Mode";
	el.addEventListener("click", function(e) {
		e.preventDefault();
		at_night = { "true": "false", "false": "true" }[at_night];
		window.localStorage.setItem("nightmode", at_night);
		document.body.classList.toggle("nightmode");
	});
}