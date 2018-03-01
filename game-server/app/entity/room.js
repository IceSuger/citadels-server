/**
 * Created by X93 on 2018/2/13.
 */
var Game = require('./game');
var Player = require('./player');
var pomelo = require('pomelo');

var Room = function(msg){
    this.roomId = msg.roomId;
    this.passwd = msg.passwd;
    this.totalPlayer = msg.totalPlayer;
    this.playerCnt = 0;
    this.playerDict = {};  //保存整个 player 对象
    this.readyPlayers = []; //仅保存 uid

    this.channelService = pomelo.app.get('channelService');
    this.channel = this.channelService.getChannel('room_' + this.roomId, true); //第二个参数为真表示若channel不存在就新建之
    this.game = null;
};

var room = Room.prototype;

Array.prototype.removeByValue = function(val) {
    for(var i=0; i<this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            break;
        }
    }
};

room.notifyRoomMemberChange = function () {
    var msg = {
        playerDict: this.playerDict
    };
    this.channel.pushMessage('roomMemberChange', msg);
};

room.notifyRoomReadyChange = function () {
    var msg = {
        readyPlayers: this.readyPlayers
    };
    this.channel.pushMessage('roomReadyChange', msg);
};

/**
 * 有玩家加入房间。
 * 初始化玩家，并通知房间内所有玩家，包括自己。
 * @param msg
 */
room.playerEnter = function (msg) {
    // this.playerCnt++;
    this.playerDict[msg.uid] = new Player(msg);
    this.playerCnt = Object.keys(this.playerDict).length;
    if (!!this.channel) {
        this.channel.add(msg.uid, msg.serverId);
    }
    this.notifyRoomMemberChange();
    this.notifyRoomReadyChange();
};

/**
 * 有玩家断开连接或者离开房间。
 * @param uid
 * @param sid
 * @returns {number|*}  房间当前剩下的玩家数。
 */
room.playerLeave = function (uid, sid) {
    delete this.playerDict[uid];
    this.playerCnt = Object.keys(this.playerDict).length;

    this.readyPlayers.removeByValue(uid);

    var channel = this.channel;
    // leave channel
    if (!!channel) {
        channel.leave(uid, sid);
    }

    this.notifyRoomMemberChange();
    this.notifyRoomReadyChange();

    return this.playerCnt;
};

/**
 * 玩家准备。
 * 当前准备后判断是不是全部都准备了，如果是，则开游戏。this.game = new Game();
 * @param msg
 */
room.ready = function(msg){
    var self = this;
    var readyCnt = this.readyPlayers.push(msg.uid);
    if (readyCnt === this.totalPlayer)
    {
        this.game = new Game(self);
    }
    console.log("到了room.ready，已经new了Game。");
    this.notifyRoomReadyChange();
};

room.cancelReady = function (msg) {
    this.readyPlayers.removeByValue(msg.uid);
    this.notifyRoomReadyChange();
};


room.pickRole = function(msg){
    var game = this.game;
    game.pickRole(msg);
};

room.collectTaxes = function(msg){
    var game = this.game;
    game.collectTaxes(msg);
};

room.takeCoinsOrBuildingCards = function(msg){
    var game = this.game;
    return game.takeCoinsOrBuildingCards(msg);
};

room.pickBuildingCard = function(msg){
    var game = this.game;
    game.pickBuildingCard(msg);
};

room.useAbility = function(msg){
    var game = this.game;
    game.useAbility(msg);
};

room.build = function(msg){
    var game = this.game;
    game.build(msg);
};

module.exports = Room;