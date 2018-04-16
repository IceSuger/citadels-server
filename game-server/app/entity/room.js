/**
 * Created by X93 on 2018/2/13.
 */
var Game = require('./game');
var PlayerInfo = require('./playerInfo');
var pomelo = require('pomelo');
var consts = require('../consts/consts');

var Room = function(msg){
    this.roomId = msg.roomId;
    this.passwd = msg.passwd;
    this.totalPlayer = msg.totalPlayer;
    this.playerCnt = 0;
    this.playerInfoDict = {};  //保存整个 player 对象
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
        playerInfoDict: this.playerInfoDict
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
 *
 * 判断：游戏是否进行中？
 *  若是，则由game实例将其disconnect = false， 并在这里加入channel。
 *  若否，则初始化玩家，加入channel，并通知房间内所有玩家，包括自己。
 *
 *
 * @param msg
 */
room.playerEnter = function (msg) {
    var status;
    if (!!this.game && !this.game.gameOver) {
        console.log("游戏还在进行中，玩家回来啦");
        //游戏正在进行中
        if (this.game.playerInfoDict.hasOwnProperty(msg.uid)) {
            //若该玩家属于本局游戏
            if (!!this.channel) {
                this.channel.add(msg.uid, msg.serverId);
            }
            console.log("玩家属于这盘游戏，进行重连逻辑。");
            this.game.playerReconnect(msg.uid, msg.serverId);
            status = consts.ENTER_ROOM.OK;
        } else {
            //该玩家不属于本局游戏
            console.log("玩家不属于这局游戏");
            status = consts.ENTER_ROOM.ERROR_ROOM_FULL;
        }
    } else {
        console.log("房间内游戏尚未开始或已结束。");
        this.playerInfoDict[msg.uid] = new PlayerInfo(msg);
        this.playerCnt = Object.keys(this.playerInfoDict).length;
        if (!!this.channel) {
            this.channel.add(msg.uid, msg.serverId);
        }
        this.notifyRoomMemberChange();
        this.notifyRoomReadyChange();
        status = consts.ENTER_ROOM.OK;
    }


    return status;
};

/**
 * 有玩家断开连接或者离开房间。
 *
 * 判断游戏是否进行中：
 *  若是，则
 *      标记该玩家为掉线： player.disconnect = true
 *  若否，则
 *      从房间中删除该玩家（即原有的玩家退出逻辑）
 *
 * 无论如何，都从channel中删除该玩家。
 *
 * @param uid
 * @param sid
 * @returns {number|*}  房间当前剩下的玩家数。
 */
room.playerLeave = function (uid, sid) {
    if (!!this.game && !this.game.gameOver) {
        //游戏正在进行中
        if (this.game.playerDisconnect(uid) <= 0) {
            return 0;
        } else {
            return 1;
        }

    } else {


        delete this.playerInfoDict[uid];

        this.readyPlayers.removeByValue(uid);


        this.notifyRoomMemberChange();
        this.notifyRoomReadyChange();
    }
    var channel = this.channel;
    // leave channel
    if (!!channel) {
        channel.leave(uid, sid);
    }
    this.playerCnt = Object.keys(this.playerInfoDict).length;
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

room.smithy = function (msg) {
    var game = this.game;
    game.smithy(msg);
};

room.laboratory = function (msg) {
    var game = this.game;
    game.laboratory(msg);
};

room.endRound = function (msg) {
    var game = this.game;
    game.endRound(msg);
};

module.exports = Room;