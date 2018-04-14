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

    this.timer = null;

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
    // console.log(msg);
    // console.log('After entering===');
    // console.log(this.roomDict);
    var code;
    var retmsg = {
    };
    if(!room){
        code = consts.ENTER_ROOM.ERROR_ROOM_NOT_EXIST;
    } else if (msg.passwd !== room.passwd) {
        code = consts.ENTER_ROOM.ERROR_WRONG_ROOM_PASSWD;
        // } else if (room.totalPlayer === room.playerCnt) {
        //     code = consts.ENTER_ROOM.ERROR_ROOM_FULL;
    } else {
        code = room.playerEnter(msg);
        if (code === consts.ENTER_ROOM.OK) {
            clearTimeout(this.timer);
        }
        retmsg.roomMemberMax = room.totalPlayer;
    }
    retmsg.code = code;
    return retmsg;
};

/**
 * 有用户离开房间。
 * @param uid
 * @param sid
 * @param roomId
 */
roomService.leaveRoom = function (uid, sid, roomId) {
    // console.log(typeof roomId);
    var self = this;
    var room = this.roomDict[roomId];
    if (!room) {
        return;
    }
    var playerCnt = room.playerLeave(uid, sid);
    if (playerCnt === 0) {
        //如果全部玩家都退出了，就干掉这个room
        //先等待十分钟，再删除room
        this.timer = setTimeout(function () {
            //delete room
            delete self.roomDict[roomId];
            console.log('ROOM DELETED: ' + roomId);
        }, 10 * 60 * 1000);


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
    // console.log('到不了这？');
    return consts.GET_READY.OK;
};

roomService.cancelReady = function (msg) {
    var room = this.roomDict[msg.roomId];
    room.cancelReady(msg);
    return consts.GET_READY.OK;
};

roomService.pickRole = function(msg){
    var room = this.roomDict[msg.roomId];
    room.pickRole(msg);
};

roomService.collectTaxes = function(msg){
    var room = this.roomDict[msg.roomId];
    room.collectTaxes(msg);
};

roomService.takeCoinsOrBuildingCards = function(msg){
    var room = this.roomDict[msg.roomId];
    return room.takeCoinsOrBuildingCards(msg);
};

roomService.pickBuildingCard = function(msg){
    var room = this.roomDict[msg.roomId];
    room.pickBuildingCard(msg);
};

roomService.useAbility = function(msg){
    var room = this.roomDict[msg.roomId];
    room.useAbility(msg);
};

roomService.build = function(msg){
    var room = this.roomDict[msg.roomId];
    room.build(msg);
};

roomService.smithy = function (msg) {
    var room = this.roomDict[msg.roomId];
    room.smithy(msg);
};

roomService.laboratory = function (msg) {
    var room = this.roomDict[msg.roomId];
    room.laboratory(msg);
};

roomService.endRound = function (msg) {
    var room = this.roomDict[msg.roomId];
    room.endRound(msg);
};


module.exports = RoomService;
