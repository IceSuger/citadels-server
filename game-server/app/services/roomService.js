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

/**
 * msg = {
 *  playerTotal,
 * }
 *
 * @param msg
 */
roomService.createRoom = function(msg) {
    var roomId = this.curMaxRoomId + 1;
    msg.roomId = '' + roomId; //从新建房间开始，roomId全部都用String类型。而Number只用在curMaxRoomId中，每次生成新的房间号都将房间号转成String。
    this.roomDict[msg.roomId] = new Room(msg);
    //test
    console.log('After creating=== ');
    console.log(this.roomDict);
    this.curMaxRoomId = roomId;
    return msg.roomId;
};

/**
 * 玩家进入房间。
 * 判断房间是否存在，不存在则返回 ERROR_ROOM_NOT_EXIST；
 * 判断房间密码是否正确，不正确则返回 ERROR_WRONG_ROOM_PASSWD；
 * 判断房间是否人满，满了则返回 ERROR_ROOM_FULL;
 * room.playerEnter()；
 * --------------------------------
 * msg={
 *  uid,
 *  roomId,
 *  passwd
 * }
 *
 * @param msg
 */
roomService.enterRoom = function(msg) {
    var room = this.roomDict[msg.roomId];
    //test
    console.log(msg);
    console.log('After entering===');
    console.log(this.roomDict);
    if(!room){
        return consts.ENTER_ROOM.ERROR_ROOM_NOT_EXIST;
    }
    if (msg.passwd !== room.passwd)
    {
        return consts.ENTER_ROOM.ERROR_WRONG_ROOM_PASSWD;
    }
    if (room.totalPlayer === room.playerCnt)
    {
        return consts.ENTER_ROOM.ERROR_ROOM_FULL;
    }
    room.playerEnter(msg);
    return consts.ENTER_ROOM.OK;
};

/**
 * 有用户离开房间。
 * @param uid
 * @param sid
 * @param roomId
 */
roomService.leaveRoom = function (uid, sid, roomId) {
    // console.log(typeof roomId);
    var room = this.roomDict[roomId];
    if (!room) {
        return;
    }
    var playerCnt = room.playerLeave(uid, sid);
    if (playerCnt === 0) {
        //如果全部玩家都退出了，就干掉这个room
        delete this.roomDict[roomId];
        console.log('ROOM DELETED: ' + roomId);
    }
};

/**
 * 玩家准备
 * @param msg
 */
roomService.ready = function(msg){
    // console.log('In roomService.ready, msg is:');
    // console.log(msg);
    var room = this.roomDict[msg.roomId];
    room.ready(msg);
    console.log('到不了这？');
    return consts.GET_READY.OK;
};

roomService.cancelReady = function (msg) {
    var room = this.roomDict[msg.roomId];
    room.cancelReady(msg);
    return consts.GET_READY.OK;
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
