/**
 * Created by X93 on 2018/2/17.
 */
var consts = require('../consts/consts');

var Player = function(data){
    this.seatId = 0;
    this.wxNickName = data.wxNickName;
    this.wxAvatar = data.wxAvatar;
    this.uid = data.uid;

    this.coins = 0;
    this.buildingDict = {}; //已建造的建筑
    this.handCards = [];    //手牌建筑
    this.role = consts.ROLES.NONE;
    this.hasLibrary = false;
    this.hasMagicSchool = false;
    this.hasCollege = false;
    this.hasSmithy = false;
    this.hasObservatory = false;
    this.hasCemetery = false;
    this.hasGhostTown = false;
    this.hasDragonGate = false;
    this.hasLaboratory = false;
    this.hasKeep = false;
    this.hasGreatWall = false;
};

player = Player.prototype;

player.pickRole = function(data){
    this.role = data.pickedRole;
};

/**
 * 增加一张指定的手牌
 * @param data
 */
player.addHandCard = function(data){

};

/**
 * 消耗一张指定的手牌
 * @param data
 */
player.spendHandCard = function(data){

};

/**
 * 建造一张指定的手牌
 * @param data
 */
player.build = function(data){

};

module.exports = Player;