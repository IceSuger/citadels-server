/**
 * Created by X93 on 2018/2/16.
 */
var consts = require('../consts/consts');
var Room = require('../entity/room');

var RoomService = function() {
    /**
     * 构造函数
     * @type {RoomService}
     */
    this.curMaxRoomId = 0;
    this.roomDict = {};

    //self.reset();
};

var roomService = RoomService.prototype;


roomService.createRoom = function(msg) {
    var roomId = this.curMaxRoomId + 1;
    msg.roomId = roomId;
    this.roomDict[roomId] = new Room(msg);
    this.curMaxRoomId = roomId;
};

/**
 * 玩家进入房间。
 * 判断房间是否存在，不存在则返回 ERROR_ROOM_NOT_EXIST；
 * 判断房间密码是否正确，不正确则返回 ERROR_WRONG_ROOM_PASSWD；
 * 判断房间是否人满，满了则返回 ERROR_ROOM_FULL;
 * room.playerEnter()；
 * @param msg
 */
roomService.enterRoom = function(msg) {
    var room = this.roomDict[msg.roomId];
    if(!room){
        return consts.ENTER_ROOM.ERROR_ROOM_NOT_EXIST;
    }
    if(msg.passwd != room.passwd)
    {
        return consts.ENTER_ROOM.ERROR_WRONG_ROOM_PASSWD;
    }
    if(room.totalPlayer == room.playerCnt)
    {
        return consts.ENTER_ROOM.ERROR_ROOM_FULL;
    }
    room.playerEnter(msg);
    return consts.ENTER_ROOM.OK;
};

/**
 * TODO
 * @param msg
 */
roomService.leaveRoom = function(msg) {

};

/**
 * 玩家准备
 * @param msg
 */
roomService.ready = function(msg){
    var room = this.roomDict[msg.roomId];
    room.ready(msg);
};

roomService.pickRole = function(msg){

};

roomService.collectTaxes = function(msg){

};

roomService.takeCoinsOrBuildingCards = function(msg){

};

roomService.pickBuildingCard = function(msg){

};

roomService.useAbility = function(msg){

};

roomService.build = function(msg){

};


module.exports = RoomService;
