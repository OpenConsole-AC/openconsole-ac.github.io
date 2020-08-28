function CtrlShim() {
  this.consolePageLocation = "https://openconsole.github.io";
  this.gameSelectCtrlLocation = "https://openconsole.github.io/openconsole/controllers/choose_game/choose_game.html";
  this.ctrlLoc = "";
  this.iframe = null;
  this.playerId = 0;
  this.gameReady = true;
  this.messageQueue = [];
  this.playerName = "";
}
CtrlShim.prototype.initialize = function () {
  window.addEventListener("message", cShim.receiveMessage, false);
}
CtrlShim.prototype.sendMessageString = function (msg) {
  var messageToSend = JSON.parse(msg);
  cShim.iframe.contentWindow.postMessage(messageToSend, "*");
}
CtrlShim.prototype.sendMessage = function (msg) {
  cShim.iframe.contentWindow.postMessage(msg, "*");
}
CtrlShim.prototype.setCtrlIframe = function (loc, isGameSelect) {
  if (cShim.ctrlLoc == loc) return;
  cShim.ctrlLoc = loc;
  document.getElementById("ctrl").innerHTML = "<iframe id=\"webgl-content\" src=\"\" scrolling=\"no\" frameBorder=\"0\" style=\"position: absolute; left: 0; height: 100%; top: 0; width: 100%;\"></iframe>";
  cShim.iframe = document.getElementById("webgl-content");
  if (isGameSelect) cShim.iframe.addEventListener("load", cShim.setGameSelCtrlLayout);
  cShim.messageQueue = [];
  cShim.gameReady = isGameSelect;
  cShim.iframe.src = loc;
}
CtrlShim.prototype.setGameSelCtrlLayout = function() {
  if (cShim.ctrlLoc != cShim.gameSelectCtrlLocation) return;
  if (cShim.playerId == 0) {
    cShim.sendMessageString("{\"type\":\"SetLayout\",\"keymap\":{\"Up\":{\"isKeyboard\":true,\"data\":[38,\"ArrowUp\",\"ArrowUp\"]},\"Down\":{\"isKeyboard\":true,\"data\":[40,\"ArrowDown\",\"ArrowDown\"]},\"Left\":{\"isKeyboard\":true,\"data\":[37,\"ArrowLeft\",\"ArrowLeft\"]},\"Right\":{\"isKeyboard\":true,\"data\":[39,\"ArrowRight\",\"ArrowRight\"]},\"Enter\":{\"isKeyboard\":true,\"data\":[13,\"Enter\",\"Enter\"]}}}");
  } else {
    cShim.sendMessageString("{\"type\":\"SetLayout\",\"keymap\":{}}");
  }
}
CtrlShim.prototype.rotateGameCtrl = function () {
  if (cShim.iframe == null) return;
  cShim.iframe.style.height = "100vw";
  cShim.iframe.style.width = "100vh";
  cShim.iframe.style.transform = "rotate(-90deg) translateX(-100%)";
  cShim.iframe.style.transformOrigin = "top left";
}

CtrlShim.prototype.buildReadyMessage = function () {
  var liveLoc = cShim.ctrlLoc.substring(0, cShim.ctrlLoc.length - 15);
  var readyMsg = {
    "action":"ready","device_id":(cShim.playerId+1),"code":"0",
    "devices":[
      {"premium":true,"uid":"f728174fd5024ccc69503ebe03293d8e","language":"en","tags":[],"cc":"US","auth":false,
      "token":"ffe1c0b9188c255f9547655d0e27984a","experiments":{"yearly-pricing":"None","show-store-v2":"yes"},
      "pricing":"herosubscriptionmonthly3v2","games_lock":0,"player_limit":20,"rtc":2,
      "client":{"partner":"airconsole","app":"web","ua":{"platform":{"version":"10","name":"Windows"},"os":{"version":"10","name":"Windows"},
      "bot":false,"browser":{"version":"79.0","name":"Firefox"}}},"referrer":{"ts":1582131345703,"id":"screen.referrer.google.com@/"},
      "remote_screens":false,"version":1,"url":liveLoc
      ,"location":(liveLoc + "screen.html"),"players":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]},
    ],
    "server_time_offset":42};
  return readyMsg;
}

CtrlShim.prototype.registerPlayers = function (readyMsg, count) {
  for (var i = 0; i < count; i++) {
    var name = "Player " + (i + 1);
    if (i == cShim.playerId) name = cShim.playerName;
    var updtMsg = cShim.buildUpdateMessage(i, name);
    readyMsg.devices.push(updtMsg.device_data);
  }
  return readyMsg;
}
CtrlShim.prototype.buildUpdateMessage = function (playerId, playerName) {
  var liveLoc = cShim.ctrlLoc.substring(0, cShim.ctrlLoc.length - 15);
  var updtMsg = {
    "action":"update","device_id":(playerId+1),"device_data":{
      "uid":"f728174fd5024ccc69503ebe03293d8e","nickname":playerName,"auth":true,
      "picture":-2903061661843138600,"token":"ffe1c0b9188c255f9547655d0e27984a","premium":true,
      "referrer":{"ts":1582131345703,"id":"screen.referrer.google.com@/"},"language":"en","client":{"app":"web","partner":"airconsole"},
      "rtc":2,"version":1,"slow_connection":false,"location":(liveLoc + "controller.html")
    }
  };
  return updtMsg;
}

CtrlShim.prototype.receiveMessage = function (event) {
  var message = event.data;
  console.log(message);
  console.log(JSON.stringify(message));
  if (event.origin === cShim.consolePageLocation) {
    switch (message.type) {
      case "SetLayout":
        cShim.playerId = message.keymap.playerId;
        cShim.playerName = message.name;
        cShim.setGameSelCtrlLayout();
        break;
      case "Key":
        parent.postMessage(message, "*");
        break;
      case "Custom":
        switch (message.action) {
          case "setCtrl":
            if (message.gameSelect) {
              cShim.setCtrlIframe(cShim.gameSelectCtrlLocation, true);
            } else {
              cShim.setCtrlIframe(message.loc, false);
            }
            break;
          case "set":
          case "message":
            if(cShim.gameReady) {
              cShim.handleMessageToCtrl(message);
            } else {
              cShim.messageQueue.push(message);
            }
            break;
        }
        break;
    }
  }
  else if (event.origin !== window.location.origin) {
    switch (message.action) {
      case "set":
        if (message.key == "custom") {
          message.type = "Custom";
          parent.postMessage(message, "*");
        } else if (message.key == "orientation") {
          if (message.value == null || message.value == "portrait") {
            cShim.rotateGameCtrl();
          }
        }
        break;
      case "ready":
        var readyMsg = cShim.buildReadyMessage();
        readyMsg = cShim.registerPlayers(readyMsg, 20);
        cShim.sendMessage(readyMsg);
        cShim.gameReady = true;
        cShim.handleMessageQueue();
        break;
      case "message":
        message.type = "Custom";
        parent.postMessage(message, "*");
        break;
    }
  }
}
CtrlShim.prototype.handleMessageQueue = function () {
  while (cShim.messageQueue.length > 0) {
    cShim.handleMessageToCtrl(cShim.messageQueue.shift());
  }
}
CtrlShim.prototype.handleMessageToCtrl = function (message) {
  switch (message.action) {
    case "set":
      // Only custom key messages are sent from gameShim
      var messageToSend = { action : "update", device_id : 0 };
      if (message.key == "custom") {
        messageToSend.device_data = { _is_custom_update : true, location : cShim.ctrlLoc, custom : message.value };
        //messageToSend.device_data.location = 
        cShim.sendMessage (messageToSend);
      }
      break;
    case "message":
      message.from = 0;
      if (message.to != null) message.to = message.to + 1;
      cShim.sendMessage(message, "*");
      break;
  }
}

var cShim = new CtrlShim();
cShim.initialize();