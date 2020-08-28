function GameShim() {
  this.consolePageLocation = "https://openconsole.github.io";
  this.ocGamesPageLocation = "https://openconsole-games.github.io";
  this.gameSelectLocation = "/games/_ChooseGame/index.html";
  this.iframe = null;
  this.currGameName = "";
  this.currGameLoc = "";
  this.currGameLive = "";
  this.prevGame = null;
  this.waitingOnGLoad = 0;
  this.players = null;
}

GameShim.prototype.initialize = function () {
  window.addEventListener("message", gShim.receiveMessage, false);
  gShim.currGameName = "_ChooseGame";
  gShim.setGameIframe(gShim.ocGamesPageLocation + gShim.gameSelectLocation, gShim.setupGameSelect);
  gShim.setGameCtrl(null, true);
}
GameShim.prototype.sendMessageString = function (msg) {
  var messageToSend = JSON.parse(msg);
  gShim.iframe.contentWindow.postMessage(messageToSend, "*");
}
GameShim.prototype.sendMessage = function (msg) {
  gShim.iframe.contentWindow.postMessage(msg, "*");
}

GameShim.prototype.setGameIframe = function (loc, loadFun) {
  document.getElementById("game").innerHTML = "<iframe id=\"webgl-content\" src=\"\" allowfullscreen=\"\" scrolling=\"no\" noresize=\"noresize\" allow=\"autoplay; microphone; camera; vr\" gesture=\"media\" delegatestickyuseractivation=\"media\" frameborder=\"0\" style=\"position: absolute; left: 0; height: 100%; top: 0; width: 100%;\"></iframe>";
  gShim.iframe = document.getElementById("webgl-content");
  gShim.iframe.addEventListener("load", loadFun);
  gShim.iframe.src = loc;
}
GameShim.prototype.setGameCtrl = function (loc, gameSelect) {
  var message = {"type":"Custom","action":"setCtrl","gameSelect":gameSelect,"loc":loc};
  parent.postMessage(message, "*");
}
GameShim.prototype.setupGameSelect = function () {
  if(gLoad.gamesList == null || gLoad.gamesList.length == 0) {
    setTimeout(gShim.setupGameSelect, 100);
    gShim.waitingOnGLoad += 1;
    if (gShim.waitingOnGLoad > 10) {
      gShim.waitingOnGLoad = 0;
      gLoad.initialize();
    }
    return;
  }
  var messageToSend = {"type":"SetGames", "gamesList":gLoad.gamesList, "prevGame":gShim.prevGame };
  gShim.sendMessage(messageToSend);
  if (gShim.players != null) {
    gShim.sendMessage({"type":"SetPlayers", "players":gShim.players });
  }
}

GameShim.prototype.buildReadyMessage = function () {
  var readyMsg = {
    "action":"ready","device_id":0,"code":"0",
    "devices":[
      {"premium":true,"uid":"f728174fd5024ccc69503ebe03293d8e","language":"en","tags":[],"cc":"US","auth":false,
      "token":"ffe1c0b9188c255f9547655d0e27984a","experiments":{"yearly-pricing":"None","show-store-v2":"yes"},
      "pricing":"herosubscriptionmonthly3v2","games_lock":0,"player_limit":20,"rtc":2,
      "client":{"partner":"airconsole","app":"web","ua":{"platform":{"version":"10","name":"Windows"},"os":{"version":"10","name":"Windows"},
      "bot":false,"browser":{"version":"79.0","name":"Firefox"}}},"referrer":{"ts":1582131345703,"id":"screen.referrer.google.com@/"},
      "remote_screens":false,"version":1,"url":gShim.currGameLive
      ,"location":(gShim.currGameLive + "screen.html"),"players":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]},
    ],
    "server_time_offset":42};
  return readyMsg;
}

GameShim.prototype.sendGamePlayers = function (previous, players) {
  if (players == null) return;
  var arrayLength = Math.max(previous.length, players.length);
  for (var i = 0; i < arrayLength; i++) {
    if (i >= previous.length) {
      var message = gShim.buildUpdateMessage(i, players[i].name);
      gShim.sendMessage(message);
    } else if (i >= players.length) {
      var message = gShim.buildDisconnectMessage(i);
    } else {
      if (previous[i].name != players[i].name) {
        var message = gShim.buildUpdateMessage(i, players[i].name);
        gShim.sendMessage(message);
      }
    }
  }
}
GameShim.prototype.buildUpdateMessage = function (playerId, playerName) {
  var updtMsg = {
    "action":"update","device_id":(playerId+1),"device_data":{
      "uid":"f728174fd5024ccc69503ebe03293d8e","nickname":playerName,"auth":true,
      "picture":-2903061661843138600,"token":"ffe1c0b9188c255f9547655d0e27984a","premium":true,
      "referrer":{"ts":1582131345703,"id":"screen.referrer.google.com@/"},"language":"en","client":{"app":"web","partner":"airconsole"},
      "rtc":2,"version":1,"slow_connection":false,"location":(gShim.currGameLive + "controller.html")
    }
  };
  return updtMsg;
}
GameShim.prototype.buildDisconnectMessage = function (playerId) {
  var updtMsg = {
    "action":"update","device_id":(playerId+1)
  };
  return updtMsg;
}

GameShim.prototype.receiveMessage = function (event) {
  var message = event.data;
  console.log(message);
  console.log(JSON.stringify(message));
  if (event.origin === gShim.consolePageLocation) {
    switch (message.type) {
      case "SetGame":
        //gShim.currGameLoc = message.settings.game.absLoc;
        //gShim.iframe.src = gShim.currGameLoc;
        break;
      case "Custom":
        switch (message.action) {
          case "set":
            var messageToSend = { action : "update", device_id : (message.from + 1) };
            if (message.key == "custom") {
              messageToSend.device_data = { _is_custom_update : true, location : gShim.currGameLive + "screen.html", custom : message.value };
              gShim.sendMessage (messageToSend);
            }
            break;
          case "message":
            if (message.from != null) message.from = message.from + 1;
            gShim.sendMessage(message, "*");
            break;
        }
        break;
      case "SimulateBtn":
        gShim.sendMessage(message);
        break;
      case "SetPlayers":
        if (gShim.currGameName == "_ChooseGame") {
          // Relay message
          gShim.sendMessage(message);
          gShim.setGameCtrl(null, true);
        } else {
          gShim.sendGamePlayers(gShim.players, message.players);
          gShim.setGameCtrl(gShim.currGameLive + "controller.html", false);
        }
        gShim.players = message.players;
        break;
      case "LeaveGame":
        if (gShim.currGameName == "_ChooseGame") {
          gShim.currGameName = "";
          message.type = "ConfirmLeaveGame";
          parent.postMessage(message, "*");
        } else {
          message.type = "DenyLeaveGame";
          parent.postMessage(message, "*");
          gShim.prevGame = gShim.currGameName;
          gShim.currGameName = "_ChooseGame";
          gShim.setGameIframe(gShim.ocGamesPageLocation + gShim.gameSelectLocation, gShim.setupGameSelect);
          gShim.setGameCtrl(null, true);
        }
        break;
    }
  }
  else if (event.origin === gShim.ocGamesPageLocation) {
    if (message.type == "SetGame") {
      gShim.currGameName = message.game.name;
      gShim.currGameLive = message.game.live;
      gShim.setGameIframe(message.game.live + "screen.html", function () {});
      gShim.setGameCtrl(message.game.live + "controller.html", false);
    }
  }
  else if (event.origin !== window.location.origin) {
    switch (message.action) {
      case "set":
        if (message.key == "ad" && message.value) {
          var message = { "action":"ad", "complete":"true" };
          gShim.sendMessage(message);
          break;
        }
        if (message.key != "custom") break; // TODO: maybe this breaks things?
        message.type = "Custom";
        parent.postMessage(message, "*");
        break;
      case "ready":
        var readyMessage = gShim.buildReadyMessage();
        gShim.sendMessage(readyMessage);
        gShim.sendGamePlayers([], gShim.players);
        break;
      case "message":
        message.type = "Custom";
        if (message.to != null) message.to = message.to - 1;
        parent.postMessage(message, "*");
        break;
    }
  }
}

var gShim = new GameShim();
gShim.initialize();
