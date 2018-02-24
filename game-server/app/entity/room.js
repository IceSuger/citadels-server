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
    this.channel = this.channelService.getChannel('room_' + this.roomId, true); //�ڶ�������Ϊ���ʾ��channel�����ھ��½�֮
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
 * ����ҶϿ����ӻ����뿪���䡣
 * @param msg
 * @returns {number}    ���䵱ǰʣ�µ��������
 */
room.playerLeave = function(msg){
    this.playerCnt--;
    this.readyPlayers.removeByValue(msg.uid);
    return this.playerCnt;
};

/**
 * ���׼����
 * ��ǰ׼�����ж��ǲ���ȫ����׼���ˣ�����ǣ�����Ϸ��this.game = new Game();
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