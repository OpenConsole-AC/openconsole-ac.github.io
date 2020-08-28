function GameLoad() {
  this.corsProxy = "https://oc-cors-anywhere.fly.dev/";
  this.acLoc = "https://www.airconsole.com/";

  this.gamesList = [];
}

GameLoad.prototype.initialize = function () {
  if (gLoad.gamesList.length != 0) return;
  gLoad.loadPage(gLoad.corsProxy + gLoad.acLoc, function (pageData) {
    gLoad.parseGamesList(pageData);
  }, 
  function(xhr) { console.error(xhr); });
}
GameLoad.prototype.parseGamesList = function (pageData) {
	var data = pageData.match(/(?<=games_with_categories *= *){.*}(?=;)/);
	gLoad.mapACGamesListToOC(JSON.parse(data));
}
GameLoad.prototype.mapACGamesListToOC = function (acGamesList) {
  if (gLoad.gamesList.length != 0) return;
	console.log(acGamesList);
	var games = acGamesList.games;
	for (var gameKey of Object.keys(games)) {
		var game = games[gameKey];
		if (gameKey.startsWith("com.airconsole") && !gameKey.startsWith("com.airconsole.game") && !gameKey.startsWith("com.airconsole.apps")) continue;
		if (game.author === "AirConsole" || game.author === "N-Dream Ag") continue;

		var ocGame = {};
		ocGame.name = game.name;
		ocGame.author = game.author;
		ocGame.live = game.live.replace('http://','https://');;
		if (game.players_min !== null) ocGame.minPlayers = game.players_min;
		if (game.players_max === null) ocGame.maxPlayers = 0;
		else if (game.players_max != game.players_min) ocGame.maxPlayers = game.players_max;
		if (game.cover !== null && game.cover.startsWith("https://")) ocGame.gamePic = game.cover;
		if (game.video !== null && game.video.startsWith("https://")) ocGame.highlightPic = game.video;
		gLoad.gamesList.push(ocGame);
	}
  gLoad.gamesList.sort(function(g1, g2) {
    var textG1 = g1.name.toUpperCase();
    var textG2 = g2.name.toUpperCase();
    return (textG1 < textG2) ? -1 : (textG1 > textG2) ? 1 : 0;
  });
}

GameLoad.prototype.loadPage = function (path, success, error) {
  console.log("Attemting to read page at: " + path);
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== XMLHttpRequest.DONE) return;
    if (xhr.status === 200) {
      if (success) success(xhr.responseText);
    }
    else {
      if (error) error(xhr);
    }
  };
  xhr.open("GET", path, true);
  xhr.send();
}

var gLoad = new GameLoad();
gLoad.initialize();

