/**
 * Created by X93 on 2018/2/17.
 */
var consts = require('../consts/consts');
var buildings = require('../consts/buildings');

Array.prototype.removeByValue = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            break;
        }
    }
};


var Player = function(data){
    this.seatId = null;
    this.wxNickName = data.wxNickName;
    this.wxAvatar = data.wxAvatar;
    this.uid = data.uid;

    this.coins = 0;
    this.buildingDict = {}; //已建造的建筑
    this.handCards = [];    //手牌建筑，其中仅保存建筑牌的id们，允许有重复。
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
    this.role = data.roleId;
};

/**
 * 增加一张指定的手牌
 * @param cardId    建筑牌的id
 */
player.addHandCard = function (cardId) {
    this.handCards.push(cardId);

};

/**
 * 消耗一张指定的手牌
 * @param data
 */
player.spendHandCard = function (cardId) {
    this.handCards.removeByValue(cardId);
};

/**
 * 建造一张指定的手牌。
 * 1. 金币扣除card.cost
 * 2. buildingDict增加建筑
 * 3. 手牌去掉这张
 *
 * @param cardId
 */
player.build = function (cardId) {
    //1.
    this.coins -= buildings[cardId].cost;
    //2.
    this.buildingDict["" + cardId] = true;
    //3.
    this.handCards.removeByValue(cardId);
};

/**
 * 摧毁一个已有建筑
 * @param cardId
 */
player.demolishBuilding = function (cardId) {
    delete this.buildingDict["" + cardId];
};

module.exports = Player;