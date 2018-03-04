/**
 * Created by X93 on 2018/2/13.
 */
var StateMachine = require('javascript-state-machine');
var consts = require('../consts/consts');
var RoleSet = require('./roleSet');
var Pile = require('./pile');
var Bank = require('./bank');
var buildings = require('../consts/buildings');

var Game = function(room) {
    var self = this;
    this.curPlayer = 0;
    this.totalPlayer = room.totalPlayer;
    // channel 这俩对象用来向客户端发消息
    this.channelService = room.channelService;
    this.channel = room.channel;
    this.playerDict = room.playerDict;
    //seatMap 保存 seat 到 uid 的映射
    this.seatMap = Object.keys(self.playerDict);
    this.seatMap.forEach(function (uid, seatId, _) {
        self.playerDict[uid].seatId = seatId;
        // console.log(uid + ' : seatId is ' + seatId);
    });
    // console.log(Object.keys(self.playerDict));
    this.curState = null;
    this.roleSet = new RoleSet();
    this.curRole = null;
    this.pickableRoles = [];
    this.crownSeatId = 0;
    this.gameOver = false;
    this.fsm = new StateMachine({
        init: 'initial',
        transitions: [
            { name:'startRolePick',     from:'initial',     to:'rolePick'   },
            // { name:'continueRolePick',  from:'rolePick',    to:'rolePick'   },
            {name: 'endAllRolePick', from: 'rolePick', to: 'actionTaking'},
            //可能不能自己转换到自己，比如下面这个操作，就总是出错。
            //【补充】不是的。是因为在转换状态的过程中，不能进行新的状态转换操作！
            // { name:'continueAction',    from:'actionTaking',      to:'actionTaking'     },
            {name: 'endAllAction', from: 'actionTaking', to: 'preEnd'},
            { name:'continueGame',      from:'preEnd',      to:'rolePick'   },
            { name:'endGame',           from:'preEnd',      to:'end'}
        ],
        methods: {
            //onStartRolePick:    self.startRolePicking(),
            onRolePick: self.startRolePicking,
            // onAction:           self.action(),
            onLeaveRolePick: self.startAction,
            onEndAllRolePick: self.nextRoleAction,
            // onActionTaking: self.nextRoleAction,
            onEndAllAction: self.checkGameOver
            // onPreEnd: self.checkGameOver
        }
    });
    this.pile = new Pile();
    this.bank = new Bank();

    console.log("Before Game.init ");
    this.init();
    console.log("After Game.init ");
};

var game = Game.prototype;

game.init = function(){
    /**
     *  1. 初始化建筑牌堆，洗牌
     *  1. 初始化银行
     *  2. 随机给王冠
     *  3. 初始化各玩家全部属性，拥有的建筑、分数、金币等都清空   //还没写这条的实现。
     *  4. 初始化各玩家金币=2
     *  5. 初始化各玩家手牌，摸4张牌
     *  5.5 通知客户端，局势变化。
     *  6. fsm状态转换，startRolePick
     */
    var self = this;
    // console.log("BEFORE fsm.init");
    // console.log(this.fsm.state);
    // console.log("AFTER fsm.init");

    this.pile.reset();
    this.bank.reset();

    var i = Math.random();  //0~1 random number
    this.crownSeatId = Math.ceil(i * this.totalPlayer) - 1;    //0~7 random int
    console.log('CROWN: ' + this.crownSeatId);

    console.log(this.pile.pile.length);
    for (var uid in self.playerDict) {
        self.takeCoins(2, uid);
        self.drawCards(4, uid);
    }
    console.log(this.pile.pile.length);


    this.notifySituation();


    // console.log("皇冠交给："+this.crownSeatId);
    this.fsm.startRolePick(self);
    // console.log(this.fsm.state);
    // console.log("Game init 最后一行。");
};


game.startRolePicking = function (_, self) {
    /**
     * 先将roleSet.reset()；
     *
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
     *      翻开的不可选的角色数：（下面代码真正实现时，翻开的不可选的牌要再-1张，因为roleList[0]是空的，只占个位置，则roleList实际上多了一个元素）
     *      roleSet.size - (core.totalPlayer + 1) -1
     *      如果 core.totalPlayer == 7：
     *          翻开 0 张。
     *
     * 3. 指定 core.curPlayer = crownSeatId
     *
     * 4. 想 channel 发出由 curPlayer 开始选角色的通知；
     * 5. 向 curPlayer 发出可选角色列表；
     *==================================================
     * 针对2人的，测试逻辑：
     *  扣一张牌；
     *  翻开roleSetSize - totalPlayer - 1 张牌;
     *  curPlayer = crown;
     *  notifyAll;
     *  notifyPlayer;
     */
    // console.log(self);
    self.curState = consts.GAME_STATE.ROLE_PICKING;
    self.notifyGameStateChange();
    self.roleSet.reset();
    var roleSetSize = self.roleSet.roleList.length;
    self.roleSet.banAndHide();  //无论几个人玩，都是先扣一张牌。

    // if(self.totalPlayer >= 4 && this.totalPlayer <= 6)
    // {
    //     self.roleSet.banAndShowMany( roleSetSize - 1 - (this.totalPlayer + 1) - 1 );
    // }
    //用2人测试一下。
    self.roleSet.banAndShowMany(roleSetSize - 1 - (self.totalPlayer + 1) - 1);

    self.curPlayer = self.crownSeatId;

    self.notifyPickingRole();

    // //todo Alpha版暂时向客户端发送完整角色列表和完整局势，正式版再考虑只发给每个客户端其可知部分。
    // // self.channelService.pushMessageByUids();
};


/**
 * 开始行动回合。
 *
 * curRole = 0;
 */
game.startAction = function (_, self) {
    self.curRole = 0;
    self.curState = consts.GAME_STATE.COIN_OR_CARD;
    self.notifyGameStateChange();
    console.log('开始行动回合');
};

/**
 * curRole++;
 * 检查是否已遍历全部角色 curRole == roleSet.roleList.length - 1
 *  是，则fsm状态转移，函数返回；
 *  否，则进入下面的逻辑：
 * 检查当前角色是否有玩家可操作：
 *  当前角色 curRoleObj = roleSet.roleList[curRole];
 *  curRoleObj.uid 是否不为空，且 curRoleObj.killed == false
 *      若满足，则有玩家，则通知客户端 notifyTakingAction();
 *      若不满足，则直接结束当前角色的回合 fsm.nextRoleAction();
 */
game.nextRoleAction = function (_, self) {
    // var self = this;
    self.curRole++;
    console.log(self.curRole + '号角色开始行动回合！');
    if (self.curRole === self.roleSet.roleList.length) {
        // fsm.转移
        console.log('所有角色本回合结束。');
        self.fsm.endAllAction(self);
        return;
    }
    var curRoleObj = self.roleSet.roleList[self.curRole];
    console.log(curRoleObj);
    if (curRoleObj.seatId !== null && !curRoleObj.killed) {
        // console.log('该角色可被操控。');
        self.curPlayer = curRoleObj.seatId;
        self.abilityEffectBeforeAction();
        self.notifyTakingAction();
        // console.log('通知客户端们。');
    } else {
        // console.log('该角色不可操控，换下一个。');
        var _self = self;
        // self.fsm.continueAction(null);
        self.nextRoleAction(null, self);
    }
};

game.checkGameOver = function (_, self) {
    if (self.gameOver) {
        // self.fsm.
    } else {
        setTimeout(function () {
            self.fsm.continueGame(self);
        });
    }
};

/**
 * 玩家 uid 从银行拿走 count 个金币。
 * @param count
 * @param uid
 */
game.takeCoins = function (count, uid) {
    this.bank.draw(count);
    this.playerDict[uid].coins += Number(count);
};

/**
 * 玩家 uid 从牌堆顶部摸取 count 张建筑牌。
 * @param count
 * @param uid
 */
game.drawCards = function (count, uid) {
    for (var i = 0; i < count; i++) {
        var cardId = this.pile.draw();
        this.playerDict[uid].addHandCard(cardId);
    }
};

/**
 * 选角色。
 *  1. 将角色标记为不可选，记录角色对应的玩家 role.player
 *  2. 记录玩家选取的角色    player.role
 *  3. 判断是否结束了选角色回合，即判断当前玩家是否为最后一个玩家：curPlayer == totalPlayer - 1
 *      是，则 fsm 状态转移，进入行动阶段
 *      否，则 curPlayer++, notifyPickingRole();
 *
 * @param msg
 */
game.pickRole = function(msg){
    this.roleSet.pick(msg.roleId, msg.seatId);
    var uid = this.seatMap[msg.seatId];
    var player = this.playerDict[uid];
    player.pickRole(msg);
    if (this.curPlayer !== this.totalPlayer - 1) {
        this.curPlayer++;
        // return consts.GAME.NEXT_PLAYER_PICK_ROLE;
        this.notifyPickingRole();
        // this.fsm.continueRolePick();
    } else {
        var self = this;
        console.log('全部玩家已选好角色。');
        this.fsm.endAllRolePick(self);
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
    if (msg.move === consts.MOVE.TAKE_COINS) {
        self.takeCoins(consts.CAN_TAKE_COIN_COUNT.NORMAL, msg.uid);
        self.notifySituation();
    } else {
        //通知场上，当前玩家选择拿建筑
        var pushMsg = {
            // uidTakingMove: msg.uid,
            move: consts.MOVE.TAKE_BUILDING_CARDS
        };
        this.notifyCurMove(pushMsg);    //this.channel.pushMessage('onMove', pushMsg);
        //判断给丫返回几张建筑牌
        var count = consts.CAN_TAKE_CARD_COUNT.NORMAL;
        if(player.hasObservatory){
            count = consts.CAN_TAKE_CARD_COUNT.OBSERVATORY;
        }
        var buildingCards4Picking = [];
        for(var i=0; i<count; i++){
            buildingCards4Picking.push(self.pile.draw());
        }
        //发回候选建筑牌列表
        // //pushMessageByUids(route,?msg,?uids,?opts,?cb)
        // var tuid = msg.uid;
        // var tsid = self.channel.getMember(tuid)['sid'];
        // var msg2Send = {
        //     candidates: buildingCards4Picking
        // };
        // this.channelService.pushMessageByUids('buildingCandidates', msg2Send, [{
        //     uid: tuid,
        //     sid: tsid
        // }]);
        return buildingCards4Picking;
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
    self.notifySituation();
};

/**
 * 玩家使用了角色主动技能：
 * 1. 刺客
 *  目标角色
 * 2. 盗贼
 *  目标角色
 * 3. 魔术师
 *  目标玩家/目标为系统
 * 4. 军阀
 *  目标玩家
 * @param msg
 */
game.useAbility = function(msg){
    // msg.targetRoleId;
    // msg.targetSeatId;
    // msg.targetIsSystem;
    // msg.uid;
    var self = this;
    var sourcePlayer = self.playerDict[msg.uid];
    var targetPlayer = null;
    var targetRole = null;
    if (msg.targetRoleId) {
        // targetPlayer = self.playerDict[self.seatMap[self.roleSet.roleList[msg.targetRoleId].seatId]];
        targetRole = self.roleSet.roleList[msg.targetRoleId];
    } else if (msg.targetSeatId) {
        targetPlayer = self.playerDict[self.seatMap[msg.targetSeatId]];
    }

    if (sourcePlayer.role === consts.ROLES.ASSASSIN) {
        //刺客：目标角色被标记为killed
        targetRole.killed = true;
        // self.kill()
    } else if (sourcePlayer.role === consts.ROLES.THIEF) {
        //盗贼：目标角色 stolenBy 被赋值
        targetRole.stolenBy = msg.uid;
    } else if (sourcePlayer.role === consts.ROLES.MAGICIAN) {
        //魔术师：
        if (msg.targetRoleId) {
            //  目标为玩家，则交换 sourcePlayer 和 targetPlayer 的手牌
            var tmp = [];
            sourcePlayer.handCards.forEach(function (value) {
                tmp.push(value);
            });
            sourcePlayer.handCards = [];
            targetPlayer.handCards.forEach(function (value) {
                sourcePlayer.handCards.push(value);
            });
            targetPlayer.handCards = [];
            tmp.forEach(function (value) {
                targetPlayer.handCards.push(value);
            });
        } else {
            //  目标为系统，则将 discardCards[] 塞到pile底部，从手牌里删掉 discardCards，再给他起等数量张牌
            self.pile.appendMany(msg.discardCards);
            // sourcePlayer.handCards = [];
            msg.discardCards.forEach(function (value) {
                sourcePlayer.spendHandCard(value);
            });
            for (var i = 0; i < msg.discardCards.length; i++) {
                sourcePlayer.handCards.push(self.pile.draw());
            }
        }
    } else if (sourcePlayer.role === consts.ROLES.WARLORD) {
        //军阀：
        self.demolish(msg);
    }

    this.notifySituation();
};

/**
 * 军阀摧毁建筑：
 *  在客户端判断：目标是否为主教、目标建筑是否为堡垒、目标玩家是否有长城（判断军阀金币够不够用）
 *  到了服务端，就直接执行拆除建筑了，不再判断合法性。
 *
 *  msg.targetSeatId
 *  msg.uid
 *  msg.targetBuilding
 *  msg.demolishCost    军阀要交出的金币数
 *
 *  1.将要拆的建筑塞进pile
 *  2.从targetPlayer手中删除建筑
 *  3.从sourcePlayer手中删除金币
 *  4.银行增加金币
 *
 * @param msg
 */
game.demolish = function (msg) {
    var self = this;
    var targetPlayer = self.playerDict[self.seatMap[msg.targetSeatId]];
    var sourcePlayer = self.playerDict[msg.uid];

    //1.
    self.pile.append(msg.targetBuilding);
    //2.
    targetPlayer.demolishBuilding(msg.targetBuilding);
    //3.
    sourcePlayer.coins -= msg.demolishCost;
    //4.
    self.bank.coins += msg.demolishCost;
};

/**
 * 检查当前行动玩家是否被偷。是则转走金币。
 */
game.abilityEffectBeforeAction = function () {
    var self = this;
    var curPlayerObj = self.playerDict[self.seatMap[self.curPlayer]];
    var curRoleObj = self.roleSet.roleList[self.curRole];
    if (curRoleObj.stolenBy !== null) {
        self.playerDict[curRoleObj.stolenBy].coins += curPlayerObj.coins;
        curPlayerObj.coins = 0;
    }
};

/**
 * 客户端完成判断：是否已有相同建筑、金币是否足够
 * 到服务器了就直接执行建筑逻辑，不再判断合法性。
 *
 * msg.cardId
 *
 * 1. player.build
 * 2. bank.coins+
 *
 * 3. 判断是否已经建满，游戏是否在本轮结束
 *
 * 4. notifySituation
 *
 * @param msg
 */
game.build = function(msg){
    var self = this;
    //1. 2.
    var playerObj = this.playerDict[msg.uid];
    playerObj.build(msg.cardId);
    var cost = buildings[msg.cardId].cost;
    this.bank.coins += cost;
    //3.
    if (Object.keys(playerObj.buildingDict).length >= self.gameOverBuildingCnt) {
        self.gameOver = true;
    }
    //4.
    this.notifySituation();
};

game.endRound = function (msg) {
    var self = this;
    self.nextRoleAction(null, self);
};

/**
 * 通知客户端，当前是谁在干啥。
 * @param msg
 */
game.notifyCurMove = function(msg){
    msg.curPlayer = this.curPlayer;
    this.channel.pushMessage('onMove', msg);
};

game.notifyPickingRole = function () {
    var self = this;
    var msg = {
        curPlayer: self.curPlayer,
        roleList: self.roleSet.roleList
    };
    self.channel.pushMessage('onPickingRole', msg);
};

/**
 * 角色开始行动回合，即选择拿金币/建筑牌。
 * 根据有没有天文台、图书馆判断可拿几张建筑牌、可保留几张建筑牌。
 */
game.notifyTakingAction = function () {
    var self = this;
    var curPlayerObj = self.roleSet.roleList[self.curRole];
    var canTakeCoinCnt = consts.CAN_TAKE_COIN_COUNT.NORMAL;
    var canTakeCardCnt = consts.CAN_TAKE_CARD_COUNT.NORMAL;
    var canHaveCardCnt = consts.CAN_HAVE_CARD_COUNT.NORMAL;
    if (curPlayerObj.hasLibrary) {
        canHaveCardCnt = consts.CAN_HAVE_CARD_COUNT.LIBRARY;
    }
    if (curPlayerObj.hasObservatory) {
        canTakeCardCnt = consts.CAN_TAKE_CARD_COUNT.OBSERVATORY;
    }
    var msg = {
        curPlayer: curPlayerObj.seatId,
        roleId: self.curRole,
        canTakeCoinCnt: canTakeCoinCnt,
        canTakeCardCnt: canTakeCardCnt,
        canHaveCardCnt: canHaveCardCnt
    };
    self.channel.pushMessage('onTakingAction', msg);
};

game.notifySituation = function () {
    var self = this;
    var msg = {
        playerDict: self.playerDict
    };
    self.channel.pushMessage('onSituationUpdate', msg);
};

game.notifyGameStateChange = function () {
    var self = this;
    var msg = {
        curState: self.curState
    };
    self.channel.pushMessage('onGameStateChange', msg);
};
module.exports = Game;