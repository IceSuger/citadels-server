/**
 * Created by X93 on 2018/2/17.
 */
var consts = require('../consts/consts');

var Player = function(data){
    this.coins = 0;
    this.seatId = 0;
    this.buildingDict = {}; //�ѽ���Ľ���
    this.handCards = [];    //���ƽ���
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
 * ����һ��ָ��������
 * @param data
 */
player.addHandCard = function(data){

};

/**
 * ����һ��ָ��������
 * @param data
 */
player.spendHandCard = function(data){

};

/**
 * ����һ��ָ��������
 * @param data
 */
player.build = function(data){

};

module.exports = Player;