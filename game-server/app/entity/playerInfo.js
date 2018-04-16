/**
 * Created by X93 on 2018/4/16.
 */

var PlayerInfo = function (data) {
    this.seatId = null;
    this.wxNickName = data.wxNickName;
    this.wxAvatar = data.wxAvatar;
    this.uid = data.uid;
};


module.exports = PlayerInfo;