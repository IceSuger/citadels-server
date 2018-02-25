/**
 * Created by X93 on 2018/2/13.
 */
var StateMachine = require('javascript-state-machine');
var consts = require('../consts/consts');
var RoleSet = require('./roleSet');

var Game = function(room) {
    this.curPlayer = 0;
    this.totalPlayer = room.totalPlayer;
    // channel 这俩对象用来向客户端发消息
    this.channelService = room.channelService;
    this.channel = room.channel;
    this.playerDict = {};
    this.roleSet = new RoleSet();
    this.pickableRoles = [];
    this.crownOwner = 0;
    this.gameOver = false;
    this.fsm = new StateMachine({
        init: 'initial',
        transitions: [
            { name:'startRolePick',     from:'initial',     to:'rolePick'   },
            { name:'endAllRolePick',    from:'rolePick',    to:'action'     },
            { name:'endAllAction',      from:'action',      to:'preEnd'     },
            { name:'continueGame',      from:'preEnd',      to:'rolePick'   },
            { name:'endGame',           from:'preEnd',      to:'end'}
        ],
        methods: {
            //onStartRolePick:    self.startRolePicking(),
            onRolePick:         self.startRolePicking(),

        }
    });
    this.pile = new Pile();
    this.bank = new Bank();

    this.init();
};

var game = Game.prototype;

game.init = function(){
    /**
     *  1. 初始化建筑牌堆，洗牌
     *  1. 初始化银行
     *  2. 随机给王冠
     *  3. 初始化各玩家全部属性，拥有的建筑、分数、金币等都清空
     *  4. 初始化各玩家金币=2
     *  5. 初始化各玩家手牌，摸4张牌
     */
    var self = this;
    this.fsm.init();    //不知道这样写行不行？

    this.pile.reset();

    this.bank.reset();

    var i = Math.random();  //0~1 random number
    this.crownOwner = Math.ceil(i * this.totalPlayer);    //1~8 random int


};


game.startRolePicking = function(){
    /**
     * 两步走：
     * 1. 扣1张牌：
     *      无论如何，都先扣1张，随机的。
     *      ----------
     *      如果 玩家数game.totalPlayer == 角色总数roleSet.size - 1
     *      则 扣0张牌
     *      如果 玩家数game.totalPlayer < 角色总数roleSet.size - 1
     *      则 扣1张牌
     * 2. 翻开若干张不可选的牌：
     *      如果 core.totalPlayer >= 4 且 <=6 :
     *      目的是，留下比玩家数多1的可选牌数。
     *      翻开的不可选的角色数：
         *      roleSet.size - (core.totalPlayer + 1) -1
     *      如果 core.totalPlayer == 7：
     *          翻开 0 张。
     *
     * 3. 指定 core.curPlayer = crownOwner
     *
     * 4. 想 channel 发出由 curPlayer 开始选角色的通知；
     * 5. 向 curPlayer 发出可选角色列表；
     */
    var roleSetSize = this.roleSet.roleList.length;
    if (this.totalPlayer === roleSetSize - 1) {
        this.roleSet.banAndHide();
    }

    if(this.totalPlayer >= 4 && this.totalPlayer <= 6)
    {
        this.roleSet.banAndShowMany( roleSetSize - (this.totalPlayer + 1) - 1 );
    }

    this.curPlayer = this.crownOwner;

    //todo
    this.channel.pushMessage();

    //todo
    this.channelService.pushMessageByUids();
};

game.takeCoins = function(count, player){
    this.bank.draw(count);
    player.coins += count;
}

function loopRolePick(){
    /**
     *  遍历（while true）//全部玩家：
     *      1. 发 channel 消息：当前 curPlayer 号玩家正在选角色；
     *      2. 向 curPlayer 号玩家发送可选角色列表（用bool数组 或者 用角色编号的数组）
     *      3. 收到玩家发回的选角色消息，将相应角色标记为pickable = false；
     *      4. curPlayer++；
     *      5. continue；
     */
}


function playerPickRole(){
    /**
     * 当服务器收到一个玩家完成挑选角色的信息后，调用此函数。
     *
     * 玩家选择一个角色
     *  服务器收到的信息 msg={
     *      pick : roleNum
     *  }
     *
     *  1. 将角色标记为不可选
     *  2. 记录角色对应的玩家
     *  3. 判断是否结束了选角色回合，即判断当前玩家是否为最后一个玩家：curPlayer == totalPlayer - 1
     *      是，则 fsm 状态转移
     *      否，则 curPlayer++, notifyNextPlayerToPick()
     *
     *
     *
     *
     */
    roleSet.pick();
    if (curPlayer === totalPlayer - 1)
    {
        fsm.trans;
    }
    else
    {
        curPlayer = curPlayer + 1;
        notifyNextPlayerToPick();
    }

}

/**
 * 选角色。
 *  1. 将角色标记为不可选，记录角色对应的玩家 role.player
 *  2. 记录玩家选取的角色    player.role
 *  3. 判断是否结束了选角色回合，即判断当前玩家是否为最后一个玩家：curPlayer == totalPlayer - 1
 *      是，则 fsm 状态转移，进入行动阶段
 *      否，则 curPlayer++, 返回信息，供外界 notifyNextPlayerToPick()
 *
 * @param msg
 */
game.pickRole = function(msg){
    this.roleSet.pick(msg.roleId, msg.uid);
    var player = this.playerDict[msg.uid];
    player.pickRole(msg);
    if (this.curPlayer !== this.totalPlayer - 1) {
        this.curPlayer++;
        return consts.GAME.NEXT_PLAYER_PICK_ROLE;
    } else {
        this.fsm.endAllRolePick();
    }
};

/**
 * 玩家收税。
 * 根据 uid，从playerDict中找玩家，遍历其场上建筑，判断颜色与玩家当前角色颜色是否相等，是则累加1.
 * player.coins += taxes
 *
 * 完成后，通知客户端更新场上局势 updateSituation
 * @param msg
 */
game.collectTaxes = function(msg){
    msg_content = {
        uid: 1,

    }
};

/**
 * 如果玩家选择拿金币，就从银行取俩，同时给玩家；
 * 如果玩家选择拿建筑牌，就判断身份：
 *      若玩家场上有图书馆，则可保留2张建筑牌；
 *      若玩家场上有天文台，则拿建筑牌时可以可以3选1；
 *
 * 判断玩家身份是否为商人，是则再多拿1金币；
 *
 * 通知客户端更新场上局势 updateSituation
 *
 * @param msg
 */
game.takeCoinsOrBuildingCards = function(msg){
    var self = this;
    var player = this.playerDict[msg.uid];
    if (msg.take === consts.ACTION.COINS) {
        this.bank.draw(2);
        player.coins += 2;
    } else {
        //todo 通知场上，当前玩家选择拿建筑
        var pushMsg = {
            uidTakingMove: msg.uid,
            move: consts.MOVE.TAKE_BUILDING_CARDS
        }
        this.notifyCurMove(pushMsg);    //this.channel.pushMessage('onMove', pushMsg);
        //判断给丫返回几张建筑牌
        var count = 2;
        if(player.hasObservatory){
            count = 3;
        }
        var buildingCards4Picking = [];
        for(var i=0; i<count; i++){
            buildingCards4Picking.push(self.pile.draw());
        }
        //todo 发回候选建筑牌列表
        //pushMessageByUids(route,?msg,?uids,?opts,?cb)
        var tuid = msg.uid;
        var tsid = self.channel.getMember(tuid)['sid'];
        var msg2Send = {
            candidates: buildingCards4Picking
        };
        this.channelService.pushMessageByUids('buildingCandidates', msg2Send, [{
            uid: tuid,
            sid: tsid
        }]);
    }
};

/**
 * 用户返回 2选1 / 3选1 / 2选2 的结果：pickedList、notPickedList
 * 已选的，增加到相应用户手牌中；
 * 未选的，回归牌堆底部。
 *
 *  通知客户端更新场上局势 updateSituation
 * @param msg
 */
game.pickBuildingCard = function(msg){
    var self = this;
    var player = this.playerDict[msg.uid];
    msg.pickedList.forEach(function(value, index, array){
        player.addHandCard(value);
    });
    msg.notPickedList.forEach(function(value, index, array){
        self.pile.append(value)
    });
};

game.useAbility = function(msg){

};

game.build = function(msg){

};

game.updateSituation = function(msg){
    //this.channel.pushMessage(route,?msg,?opts,?cb);
    this.channel.pushMessage('updateSituation', msg);
};

/**
 * 通知客户端，当前是谁在干啥。
 * @param msg
 */
game.notifyCurMove = function(msg){
    this.channel.pushMessage('onMove', msg);
};


module.exports = Game;