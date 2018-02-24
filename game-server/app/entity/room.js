/**
 * Created by X93 on 2018/2/13.
 */
var Game = require('./game')

var Room = function(msg){
    this.roomId = msg.roomId;
    this.passwd = msg.passwd;
    this.totalPlayer = msg.totalPlayer;
    this.playerCnt = 0;
    this.readyPlayers = [];

    this.channelService = pomelo.app.get('channelService');
    this.channel = this.channelService.getChannel('room_' + this.roomId, true); //第二个参数为真表示若channel不存在就新建之
    this.game = null;

};

var room = Room.prototype;

Array.prototype.removeByValue = function(val) {
    for(var i=0; i<this.length; i++) {
        if(this[i] == val) {
            this.splice(i, 1);
            break;
        }
    }
};;

/**
 * 有玩家断开连接或者离开房间。
 * @param msg
 * @returns {number}    房间当前剩下的玩家数。
 */
room.playerLeave = function(msg){
    this.playerCnt--;
    this.readyPlayers.removeByValue(msg.uid);
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
    if(readyCnt == this.totalPlayer)
    {
        this.game = new Game(self);
    }
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
    game.takeCoinsOrBuildingCards(msg);
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