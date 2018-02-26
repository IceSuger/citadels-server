/**
 * Created by X93 on 2018/2/14.
 */
var staticRoles = require('./role');
var consts = require('../consts/consts');

var Role = function(staticRole){
    this.id = staticRole.id;
    this.color = staticRole.color;
    this.killed = false;
    this.stolenBy = -1;
    this.bannedAndShown = false;
    this.bannedAndHidden = false;
    this.playerNum = -1;
    this.pickable = true;
};

var RoleSet = function() {
    /**
     * 构造函数
     * @type {RoleSet}
     */
    var self = this;
    self.roleList = [];
    self.bannedAndShownList = [];
    self.reset();
};

RoleSet.prototype.reset = function(){
    var self = this;
    this.roleList = [];
    staticRoles.forEach(function(staticRole) {
        var r = new Role(staticRole);
        self.roleList[staticRole.id] = r;
    });
    this.bannedAndShownList = [];
};

RoleSet.prototype.banAndHide = function(){
    var i = Math.random();  //0~1 random number
    var choosen = Math.ceil(i * staticRoles.length);    //1~8 random int
    this.roleList[choosen].bannedAndHidden = true;
    this.roleList[choosen].pickable = false;
};

RoleSet.prototype.banAndShow = function(){
    var i = Math.random();  //0~1 random number
    var choosen = Math.ceil(i * staticRoles.length);    //1~8 random int
    while (choosen === consts.ROLES.KING || this.roleList[choosen].bannedAndHidden === true || this.roleList[choosen].bannedAndShown === true)
    {
        i = Math.random();
        choosen = Math.ceil(i * staticRoles.length);
    }
    this.roleList[choosen].bannedAndShown = true;
    this.roleList[choosen].pickable = false;
    this.bannedAndShownList.push(choosen);
};

RoleSet.prototype.banAndShowMany = function(count){
    for(var i=0; i<count; i++){
        this.banAndShow();
    }
};

RoleSet.prototype.kill = function(roleNum){
    this.roleList[roleNum].killed = true;
};

RoleSet.prototype.steal = function(roleNum, thiefPlayerNum){
    this.roleList[roleNum].stolenBy = thiefPlayerNum;
};

RoleSet.prototype.pick = function(roleNum, playerNum){
    this.roleList[roleNum].playerNum = playerNum;
    this.roleList[roleNum].pickable = false;
};

/**
 * Expose 'RoleSet' constructor.
 */
module.exports = RoleSet;