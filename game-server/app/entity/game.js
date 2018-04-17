/**
 * Created by X93 on 2018/2/13.
 */
var StateMachine = require('javascript-state-machine');
var consts = require('../consts/consts');
var RoleSet = require('./roleSet');
var Pile = require('./pile');
var Bank = require('./bank');
var buildings = require('../consts/buildings');
var moment = require('moment');
var Player = require('./player');

var Game = function(room) {
    var self = this;
    this.curPlayer = 0;
    this.totalPlayer = room.totalPlayer;
    this.cntOfPlayerPickedRole = 0;
    // channel 这俩对象用来向客户端发消息
    this.channelService = room.channelService;
    this.channel = room.channel;
    this.playerInfoDict = room.playerInfoDict;
    this.playerVarArray = [];
    // this.playerDict = room.playerDict;

    //seatMap 保存 seat 到 uid 的映射
    this.seatMap = Object.keys(self.playerInfoDict);
    this.seatMap.forEach(function (uid, seatId, _) {
        self.playerInfoDict[uid].seatId = seatId;
        // self.playerVarDict[uid].seatId = seatId;
        self.playerVarArray[seatId] = new Player(seatId);
        // console.log(uid + ' : seatId is ' + seatId);
    });
    // console.log(Object.keys(self.playerDict));
    this.curState = null;
    this.roleSet = new RoleSet();
    this.curRole = null;
    this.pickableRoles = [];
    this.crownSeatId = null;
    this.gameOver = false;
    this.gameOverBuildingCnt = consts.END_GAME.FULL_BUILDING;//后续版本引入自定义结束建筑数后再修改这里，从room中获取。
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
            onEndAllAction: self.checkGameOver,
            // onPreEnd: self.checkGameOver
            onEnd: self.gameEnd
        }
    });
    this.pile = new Pile();
    this.bank = new Bank();
    this.historyMsg = null;


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
    this.historyMsg = [];

    var i = Math.random();  //0~1 random number
    this.crownSeatId = Math.ceil(i * this.totalPlayer) - 1;    //0~7 random int
    console.log('CROWN: ' + this.crownSeatId);
    this.addLog('皇冠随机初始化为' + this.crownSeatId + '号玩家。');

    console.log(this.pile.pile.length);
    // for (var uid in self.playerVarDict) {
    //     if (self.playerVarDict.hasOwnProperty(uid)) {
    //         self.takeCoins(2, uid);
    //         self.drawCards(4, uid);
    //     }
    // }
    self.playerVarArray.forEach(function (playerObj, seatId) {
        self.takeCoins(2, seatId);
        self.drawCards(4, seatId);
    });
    console.log(this.pile.pile.length);

    var seats2Update = [];
    self.playerVarArray.forEach(function (_, seatId) {
        if (seatId >= 0) {
            seats2Update.push(seatId);
        }
    });
    this.notifySituation(seats2Update);


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
    self.addLog('开始轮流选角色。');
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

    if (self.crownSeatId >= 0) {
        //如果指定了皇冠
        self.curPlayer = self.crownSeatId;
    }
    self.addLog('本轮从' + self.curPlayer + '号玩家（' + self.playerInfoDict[self.seatMap[self.curPlayer]].wxNickName + '）开始选角色。');
    self.cntOfPlayerPickedRole = 0;

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
    self.curState = consts.GAME_STATE.ACTION;
    self.notifyGameStateChange();
    console.log('开始行动回合');
    self.addLog('开始行动回合。');
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
        // self.curRole = 55;
        // setTimeout(function(){
        //     self.fsm.endAllAction(self);
        // }, 0);
        self.checkGameOver(null, self);
        return;
    }
    var curRoleObj = self.roleSet.roleList[self.curRole];
    // console.log(curRoleObj);

    if (curRoleObj.seatId !== null && !curRoleObj.killed) {
        self.curPlayer = curRoleObj.seatId;
        //如果当前角色为国王，则对crownSeatId赋值
        if (self.curRole === consts.ROLES.KING) {
            self.crownSeatId = curRoleObj.seatId;
        }
        self.abilityEffectBeforeAction();
        if (!self.playerVarArray[curRoleObj.seatId].disconnect) {
            // console.log('该角色可被操控。');

            self.notifyTakingAction();
            self.addLog(self.curRole + '号角色' + curRoleObj.name + '（' + self.playerInfoDict[self.seatMap[self.curPlayer]].wxNickName + '）开始行动回合！');
            // console.log('通知客户端们。');
        } else {
            //该角色已经被选，但玩家掉线了，则自动行动
            self.addLog("由于玩家" + self.playerInfoDict[self.seatMap[self.curPlayer]].wxNickName + "掉线，系统自动执行行动：拿2金币。");
            console.log('curRoleObj.seatId: ' + curRoleObj.seatId);
            console.log('curRole: ' + self.curRole);
            console.log('curPlayer: ' + self.curPlayer);
            self.defaultAction();
            console.log('curRoleObj.seatId: ' + curRoleObj.seatId);
            console.log('curRole: ' + self.curRole);
            console.log('curPlayer: ' + self.curPlayer);

            // self.nextRoleAction(null, self);
        }

    } else {
        // console.log('该角色不可操控，换下一个。');
        var _self = self;
        self.addLog(self.curRole + '号角色 ' + curRoleObj.name + ' 不可行动。');
        // self.fsm.continueAction(null);
        self.nextRoleAction(null, self);
    }
};

game.checkGameOver = function (_, self) {
    if (self.gameOver) {
        self.gameEnd(null, self);
        // setTimeout(function () {
        //     self.fsm.endGame(self);
        // }, 0);
    } else {
        //游戏继续，即将进入下一回合。
        /*
        1. 清空 playerDict 中的角色信息，player.role = consts.ROLES.NONE;

        另外，在startPickingRole 中完成了 roleSet.reset()


         */
        // for (seatId in self.playerVarArray) {
        //     if (self.playerVarArray.hasOwnProperty(uid)) {
        //         self.playerVarArray[uid].role = consts.ROLES.NONE;
        //     }
        // }
        self.playerVarArray.forEach(function (playerVar, seatId) {
            playerVar.role = consts.ROLES.NONE;
        });
        // setTimeout(function () {
        //     self.fsm.continueGame(self);
        // }, 0);
        self.startRolePicking(null, self);
    }
};

/**
 * 游戏结束。
 * 依次计算每个玩家得分，写入player.score。
 *
 * 遍历玩家：
 *  先算建筑总价值。按cost算。
 *  是否有龙门，有就+2
 *  是否有大学，有就+2
 *
 *  是否凑齐5色，有就+分
 *  是否造满及是否第一个造满，通过造满时赋值 player.firstFullBuilding 和 player.secondFullBuilding 来实现
 *
 *
 * updateSituation()
 *
 * @param _     第一个参数忘了是啥了。。。fsm的文档里有。反正咱这里用不到，就匿名了。
 * @param self  就是本game实例
 */
game.gameEnd = function (_, self) {
    self.seatMap.forEach(function (uid, seatId) {
        var playerObj = self.playerVarArray[seatId];
        var score = 0;
        var colorDict = {};
        for (cardId in playerObj.buildingDict) {
            if (playerObj.buildingDict.hasOwnProperty(cardId)) {
                //1. 加本建筑的cost到得分中
                var card = buildings[cardId];
                score += card.cost;
                //2. 加本建筑的颜色到dict中
                colorDict[card.color] = true;
                //3. 如果本建筑是龙门或大学，则加2分
                if (card.id === consts.BUILDINGS.COLLEGE || card.id === consts.BUILDINGS.DRAGON_GATE) {
                    score += 2;
                }
            }
        }

        if (playerObj.firstFullBuilding) {
            score += consts.SCORE.FIRST_FULL_PLAYER;
        } else if (playerObj.secondFullBuilding) {
            score += consts.SCORE.OTHER_FULL_PLAYER;
        }
        //准备判断鬼城（可被指定为任一颜色）
        var colorCnt = Object.keys(colorDict).length;
        if (playerObj.buildingDict.hasOwnProperty(consts.BUILDINGS.GHOST_TOWN)) {
            colorCnt++;
        }
        if (colorCnt >= consts.END_GAME.ALL_COLOR_CNT) {
            score += consts.SCORE.ALL_COLOR;
        }


        playerObj.score = score;
    });

    var seats2Update = [];
    self.playerVarArray.forEach(function (_, seatId) {
        if (seatId >= 0) {
            seats2Update.push(seatId);
        }
    });
    self.notifySituation(seats2Update);
    self.notifyGameOver();
    self.addLog('游戏结束。');
};

/**
 * 座次为 seatId 的玩家从银行拿走 count 个金币。
 * @param count
 * @param seatId
 */
game.takeCoins = function (count, seatId) {
    this.bank.draw(count);
    this.playerVarArray[seatId].coins += Number(count);
};

/**
 * 玩家 uid 从牌堆顶部摸取 count 张建筑牌。
 * @param count
 * @param seatId
 */
game.drawCards = function (count, seatId) {
    for (var i = 0; i < count; i++) {
        var cardId = this.pile.draw();
        this.playerVarArray[seatId].addHandCard(cardId);
    }
};

/**
 * 选角色。
 *  1. 将角色标记为不可选，记录角色对应的玩家 role.player
 *  2. 记录玩家选取的角色    player.role
 *  3. 判断是否结束了选角色回合，即判断当前玩家是否为最后一个玩家：
 *  【注意】之前判断是否全部选完角色的逻辑是错的。应该是设置一个累加变量，每轮选角色开始时置0，最终判断这个量是否==totalPlayer.
 *      是，则 fsm 状态转移，进入行动阶段
 *      否，则 curPlayer++, notifyPickingRole();
 *
 * @param msg
 */
game.pickRole = function(msg){
    this.roleSet.pick(msg.roleId, msg.seatId);
    var uid = this.seatMap[msg.seatId];
    var playerInfoObj = this.playerInfoDict[uid];
    var playerVarObj = this.playerVarArray[msg.seatId];
    playerVarObj.pickRole(msg);
    this.addLog(msg.seatId + '号玩家 ' + playerInfoObj.wxNickName + '已经选完角色。');
    //该玩家选角色，则将其已拿金币/建筑牌的行动标记置false
    playerVarObj.coinOrCardsTaken = false;
    this.cntOfPlayerPickedRole++;
    // if (this.curPlayer !== this.totalPlayer - 1) {
    if (this.cntOfPlayerPickedRole !== this.totalPlayer) {
        this.curPlayer = (this.curPlayer + 1) % this.totalPlayer;
        // return consts.GAME.NEXT_PLAYER_PICK_ROLE;
        this.notifyPickingRole();
        // this.fsm.continueRolePick();
    } else {
        var self = this;
        console.log('全部玩家已选好角色。');
        // this.fsm.endAllRolePick(self);
        this.startAction(null, this);
        this.nextRoleAction(null, this);
    }
};



/**
 * 如果玩家选择拿金币，就从银行取俩，同时给玩家；
 * 如果玩家选择拿建筑牌，就判断身份：
 *      若玩家场上有图书馆，则可保留2张建筑牌；
 *      若玩家场上有天文台，则拿建筑牌时可以可以3选1；
 *
 * 判断玩家身份是否为商人，是则再多拿1金币；
 * 判断玩家身份是否为建筑师，是则多拿2张牌；
 *
 * 通知客户端更新场上局势 updateSituation
 *
 * @param msg
 */
game.takeCoinsOrBuildingCards = function(msg){
    var self = this;
    var seatId = self.playerInfoDict[msg.uid].seatId;
    // var player = this.playerDict[msg.uid];
    var playerInfoObj = this.playerInfoDict[msg.uid];
    var player = this.playerVarArray[seatId];
    var seats2Update = [];

    //若是商人，先多给1金币
    if (player.role === consts.ROLES.MERCHANT) {
        self.takeCoins(consts.CAN_TAKE_COIN_COUNT.MERCHANT, seatId);
        self.addLog('商人被动多获得1金币。');
    }
    //若是建筑师，先多给2张牌
    if (player.role === consts.ROLES.ARCHITECT) {
        for (var j = 0; j < consts.CAN_TAKE_CARD_COUNT.ARCHITECT; j++) {
            player.addHandCard(self.pile.draw());
        }
        self.addLog('建筑师被动多获得2手牌。');
    }
    //标记一下，该玩家已经拿过金币或建筑牌。
    player.coinOrCardsTaken = true;
    if (msg.move === consts.MOVE.TAKE_COINS) {
        self.takeCoins(consts.CAN_TAKE_COIN_COUNT.NORMAL, seatId);
        seats2Update.push(seatId);
        self.notifySituation(seats2Update);
        self.addLog(self.roleSet.roleList[player.role].name + '（' + playerInfoObj.wxNickName + '）拿取2金币。');
    } else {
        //通知场上，当前玩家选择拿建筑
        var pushMsg = {
            // uidTakingMove: msg.uid,
            move: consts.MOVE.TAKE_BUILDING_CARDS
        };
        this.notifyCurMove(pushMsg);    //this.channel.pushMessage('onMove', pushMsg);
        //判断给丫返回几张建筑牌
        var count = consts.CAN_TAKE_CARD_COUNT.NORMAL;
        // if(player.hasObservatory){
        if (player.buildingDict.hasOwnProperty(consts.BUILDINGS.OBSERVATORY)) {
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
        self.addLog(self.roleSet.roleList[player.role].name + '（' + playerInfoObj.wxNickName + '）摸了' + count + '张建筑牌。');
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
    var seatId = this.playerInfoDict[msg.uid].seatId;
    var player = this.playerVarArray[seatId];
    // var playerInfoObj = this.playerInfoDict[uid];
    // var playerVarObj = this.playerVarDict[uid];
    msg.pickedList.forEach(function(value, index, array){
        player.addHandCard(value);
    });
    msg.notPickedList.forEach(function(value, index, array){
        self.pile.append(value)
    });
    var seats2Update = [];
    seats2Update.push(seatId);
    self.notifySituation(seats2Update);
    self.addLog('选择了' + msg.pickedList.length + '张加入手牌。');
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
    // msg.discardCards;
    // msg.uid;
    var self = this;
    var seatId = this.playerInfoDict[msg.uid].seatId;
    var sourcePlayer = self.playerVarArray[seatId];
    // var playerInfoObj = this.playerInfoDict[uid];
    // var playerVarObj = this.playerVarDict[uid];
    var seats2Update = [];
    seats2Update.push(seatId);

    var targetPlayer = null;
    var targetRole = null;
    if (msg.targetRoleId) {
        // targetPlayer = self.playerDict[self.seatMap[self.roleSet.roleList[msg.targetRoleId].seatId]];
        targetRole = self.roleSet.roleList[msg.targetRoleId];
    } else if (msg.targetSeatId) {
        targetPlayer = self.playerVarArray[msg.targetSeatId];
        targetPlayerInfo = self.playerInfoDict[self.seatMap[msg.targetSeatId]];
        seats2Update.push(msg.targetSeatId);
    }

    if (sourcePlayer.role === consts.ROLES.ASSASSIN) {
        //刺客：目标角色被标记为killed
        targetRole.killed = true;
        self.addLog('刺客刺杀了 ' + targetRole.name + '。');
        self.notifyRoleKilled(msg.targetRoleId);
        // self.kill()
    } else if (sourcePlayer.role === consts.ROLES.THIEF) {
        //盗贼：目标角色 stolenBy 被赋值
        targetRole.stolenBy = msg.uid;
        self.addLog('盗贼偷了 ' + targetRole.name + ' 的金币。');
    } else if (sourcePlayer.role === consts.ROLES.MAGICIAN) {
        //魔术师：
        if (msg.targetSeatId >= 0) {
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
            self.addLog('魔术师与玩家 ' + targetPlayerInfo.wxNickName + ' 交换了全部手牌。');
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
            self.addLog('魔术师与系统交换了' + msg.discardCards.length + '张手牌。');
        }
    } else if (sourcePlayer.role === consts.ROLES.WARLORD) {
        //军阀：
        self.demolish(msg);
    }

    this.notifySituation(seats2Update);
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
 *  1.将要拆的建筑塞进pile  //不一定啊！得看墓地怎么行动。墓地如果不回收，才能进入牌堆底部！
 *  2.从targetPlayer手中删除建筑
 *  3.从sourcePlayer手中删除金币
 *  4.银行增加金币
 *
 *
 * 5. 检查场上是否有墓地，若有，则广播等待墓地行动事件。
 * 然后客户端的军阀将行动挂起。
 *
 * 拆除过程：
 *  0.游戏开始先监听 cemetery 和 cemeteryDone 事件。
 *
 *  1.军阀通知服务器，拆哪个建筑
 *  2.军阀操作挂起，即在拆除请求发出后，立即设置标志变量 myRoundNow = false ，不允许继续行动
 *  3.服务端判断有无墓地，
 *      若有则等待墓地行动，墓地行动后，推送 cemeteryDone
 *      若无，则直接推送 cemeteryDone
 *  4.客户端监听cemeteryDone，到来后军阀将 myRoundNow = true。
 *
 * @param msg
 */
game.demolish = function (msg) {
    var self = this;
    var targetPlayer = self.playerVarArray[msg.targetSeatId];
    var targetPlayerInfo = self.playerInfoDict[self.seatMap[msg.targetSeatId]];
    var seatId = self.playerInfoDict[msg.uid].seatId;
    var sourcePlayer = self.playerVarArray[seatId];


    //2.
    targetPlayer.demolishBuilding(msg.targetBuilding);
    //3.
    sourcePlayer.coins -= msg.demolishCost;
    //4.
    self.bank.coins += msg.demolishCost;

    self.addLog('军阀用' + msg.demolishCost + '金币摧毁了玩家 ' + targetPlayerInfo.wxNickName + ' 的建筑：' + buildings[msg.targetBuilding].name + '。');

    //5. 注意这里由于找到了就要break，所以不能用foreach！
    // self.playerVarArray.forEach(function(playerObj, seatId){
    //     if (playerObj.buildingDict.hasOwnProperty(consts.BUILDINGS.CEMETERY)) {
    //         //找到了墓地。则广播事件。
    //         self.notifyCemetery();
    //     } else {
    //         //1.
    //         self.pile.append(msg.targetBuilding);
    //         self.notifyCemeteryDone();
    //     }
    // })
    for (var i in self.playerVarArray) {
        if (self.playerVarArray[i].buildingDict.hasOwnProperty(consts.BUILDINGS.CEMETERY)) {
            //找到了墓地。则广播事件。
            self.notifyCemetery();
            break;
        }
        if (i === self.playerVarArray.length - 1) {
            //如果已经遍历完了整个数组，也没找到
            self.pile.append(msg.targetBuilding);
            self.notifyCemeteryDone();
        }
    }
};

/**
 * 检查当前行动玩家是否被偷。是则转走金币。
 */
game.abilityEffectBeforeAction = function () {
    var self = this;
    var curPlayerObj = self.playerVarArray[self.curPlayer];
    var curRoleObj = self.roleSet.roleList[self.curRole];
    var seats2Update = [];
    if (curRoleObj.stolenBy !== null) {
        self.playerVarArray[self.playerInfoDict[curRoleObj.stolenBy].seatId].coins += curPlayerObj.coins;
        curPlayerObj.coins = 0;

        seats2Update.push(self.curPlayer);
        seats2Update.push(self.playerInfoDict[curRoleObj.stolenBy].seatId);
    }

    self.notifySituation(seats2Update);
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
    var seatId = this.playerInfoDict[msg.uid].seatId;
    var playerInfoObj = this.playerInfoDict[msg.uid];
    //1. 2.
    var playerObj = this.playerVarArray[seatId];
    playerObj.build(msg.cardId);
    var cost = buildings[msg.cardId].cost;
    this.bank.coins += cost;

    self.addLog('玩家 ' + playerInfoObj.wxNickName + ' 建造了 ' + buildings[msg.cardId].name + '。');
    //3.
    if (Object.keys(playerObj.buildingDict).length >= self.gameOverBuildingCnt) {
        //如果gameOver==false，说明当前玩家是第一个造满建筑的，赋值firstFullBuilding，否则说明不是第一个，赋值secondFullBuilding
        if (!self.gameOver) {
            playerObj.firstFullBuilding = true;
            self.addLog('玩家 ' + playerInfoObj.wxNickName + ' 第一个造满了建筑。');
        } else {
            playerObj.secondFullBuilding = true;
            self.addLog('玩家 ' + playerInfoObj.wxNickName + ' 也造满了建筑。');
        }

        self.gameOver = true;
    }
    //4.
    var seats2Update = [];
    seats2Update.push(seatId);
    this.notifySituation(seats2Update);
};

/**
 * 玩家收税。
 * 根据 uid，从playerDict中找玩家，遍历其场上建筑，判断颜色与玩家当前角色颜色是否相等，是则累加1.
 * player.coins += taxes
 *
 * 完成后，通知客户端更新场上局势 updateSituation
 * @param msg
 */
game.collectTaxes = function (msg) {
    var self = this;
    var seatId = this.playerInfoDict[msg.uid].seatId;
    var playerObj = this.playerVarArray[seatId];
    var playerInfoObj = this.playerInfoDict[msg.uid];
    var myColor = this.roleSet.roleList[playerObj.role].color;
    var tax = playerObj.collectTaxes(myColor);
    self.addLog('玩家 ' + playerInfoObj.wxNickName + ' 收取了建筑带来的税收共' + tax + '金币。');
    var seats2Update = [];
    seats2Update.push(seatId);
    this.notifySituation(seats2Update);
};

/**
 * 铁匠铺技能。
 * 支付2金币，摸取3张建筑牌。
 *
 * notifySituation();
 * @param msg
 */
game.smithy = function (msg) {
    var self = this;
    var seatId = this.playerInfoDict[msg.uid].seatId;
    var playerObj = this.playerVarArray[seatId];
    var playerInfoObj = this.playerInfoDict[msg.uid];
    playerObj.coins -= 2;
    for (var i = 0; i < 3; i++) {
        playerObj.handCards.push(self.pile.draw());
    }
    var seats2Update = [];
    seats2Update.push(seatId);
    this.notifySituation(seats2Update);
    this.addLog('玩家 ' + playerInfoObj.wxNickName + ' 使用铁匠铺的特技，支付2金币摸取了3张手牌。');
};

/**
 * 实验师技能。
 * 丢弃1张手牌，获得1金币。
 *
 * notifySituation();
 * @param msg
 */
game.laboratory = function (msg) {
    var self = this;
    self.pile.append(msg.cardId);
    var seatId = this.playerInfoDict[msg.uid].seatId;
    var playerObj = this.playerVarArray[seatId];
    var playerInfoObj = this.playerInfoDict[msg.uid];

    console.log('丢弃的牌id' + msg.cardId);
    console.log('我的金币' + playerObj.coins);

    playerObj.spendHandCard(msg.cardId);

    playerObj.coins++;

    var seats2Update = [];
    seats2Update.push(seatId);
    this.notifySituation(seats2Update);
    this.addLog('玩家 ' + playerInfoObj.wxNickName + ' 使用实验室的特技，丢弃1张手牌，获得了1金币。');
};


game.recycle = function (msg) {
    var seatId = this.playerInfoDict[msg.uid].seatId;
    var playerObj = this.playerVarArray[seatId];
    var playerInfoObj = this.playerInfoDict[msg.uid];
    if (msg.recycle) {
        //墓地主人选择回收

        playerObj.coins--;
        playerObj.addHandCard(msg.cardId);
        this.addLog('墓地主人 ' + playerInfoObj.wxNickName + ' 花费1金币，回收了建筑牌 ' + buildings[msg.cardId].name + '。');
    } else {
        //不回收，则牌放回牌堆底部
        this.pile.append(msg.cardId);
        this.addLog('墓地主人 ' + playerInfoObj.wxNickName + ' 拒绝回收建筑牌 ' + buildings[msg.cardId].name + '。');
    }

    this.notifyCemeteryDone();
    var seats2Update = [];
    seats2Update.push(seatId);
    this.notifySituation(seats2Update);
};

/**
 * 玩家结束回合。
 * @param msg
 */
game.endRound = function (msg) {
    var self = this;
    console.log('[endRound] curRole is ' + self.curRole);
    self.addLog(self.roleSet.roleList[self.curRole].name + '结束了行动回合。');
    self.nextRoleAction(null, self);
};

/**
 * 主要用于掉线玩家的自动操作。
 * 默认拿当前可选角色的第一个。
 *
 */
game.defaultRolePick = function () {
    var self = this;
    var pickedRoleId;

    for (var id = 1; id <= self.roleSet.roleList.length; id++) {
        if (self.roleSet.roleList[id].pickable) {
            pickedRoleId = id;
            break;
        }
    }
    console.log("当前系统要自动选的角色：" + pickedRoleId);
    self.pickRole({
        roleId: pickedRoleId,
        seatId: self.curPlayer
    })
};

/**
 * 主要用于掉线玩家的自动操作。
 * 判断是否已经拿了金币/建筑牌，若否，则默认拿金币。
 * 结束回合。
 */
game.defaultAction = function () {
    var self = this;
    // var playerObj = self.playerDict[self.seatMap[self.curPlayer]];
    var playerObj = self.playerVarArray[self.curPlayer];
    if (!playerObj.coinOrCardsTaken) {
        self.takeCoinsOrBuildingCards({
            uid: self.seatMap[playerObj.seatId],
            move: consts.MOVE.TAKE_COINS
        })
    }
    self.endRound();
};

game.countActivePlayers = function () {
    var cnt = 0;
    var self = this;
    // this.seatMap.forEach(function (uid) {
    //     if (!self.playerDict[uid].disconnect) {
    //         cnt++;
    //     }
    // });
    this.playerVarArray.forEach(function (playerObj, seatId) {
        if (!playerObj.disconnect) {
            cnt++;
        }
    });
    return cnt;
};

/**
 * 游戏进行中，有玩家掉线
 * 如果此时正是该玩家的行动回合或选人回合，则：
 *  选人就默认第一个；
 *  行动就判断是否已经进行了拿金币拿牌二选一的操作，如果否，则拿2金币，然后结束回合。
 * @param uid
 */
game.playerDisconnect = function (uid) {
    var seatId = this.playerInfoDict[uid].seatId;
    this.playerVarArray[seatId].disconnect = true;
    /**
     * 统计本局游戏当前还有几个玩家在线。并返回剩余人数。外部判断如果值小于等于0，则删除房间。
     */
    var activePlayerCnt = this.countActivePlayers();
    if (activePlayerCnt <= 0) {
        return 0;
    }

    this.addLog(this.playerInfoDict[uid].wxNickName + ' 掉线了。');
    //若当前玩家是当前行动玩家/当前选人玩家
    if (this.playerInfoDict[uid].seatId === this.curPlayer) {


        /**
         * 如果在行动回合
         *
         * 如果在选人回合
         *
         */
        if (this.curState === consts.GAME_STATE.ROLE_PICKING) {
            console.log("当前自动选角色中");
            this.defaultRolePick();
        } else if (this.curState === consts.GAME_STATE.ACTION) {
            console.log("当前自动行动中..");
            this.defaultAction();
        }
    }
    var seats2Update = [];
    seats2Update.push(seatId);
    this.notifySituation(seats2Update);
    return activePlayerCnt;
};

/**
 * 游戏进行中，有玩家重连。
 * disconnect = false
 * 推送局势到整个房间。
 * 单点推送本局游戏历史和游戏局势。
 */
game.playerReconnect = function (uid, sid) {
    var self = this;
    var seatId = this.playerInfoDict[uid].seatId;
    this.playerVarArray[seatId].disconnect = false;

    var seats2Update = [];
    seats2Update.push(seatId);
    this.notifySituation(seats2Update);

    this.addLog(this.playerInfoDict[uid].wxNickName + ' 重连了。');
    this.channelService.pushMessageByUids('onReconnect', {
        // 单点推送 playerInfoDict 和 playerVarArray
        // playerDict: this.playerDict
        playerInfoDict: self.playerInfoDict,
        playerVarArray: self.playerVarArray
    }, [{uid: uid, sid: sid}]);
};


/**
 * 通知客户端，当前是谁在干啥。
 * @param msg
 */
game.notifyCurMove = function(msg){
    msg.curPlayer = this.curPlayer;
    this.channel.pushMessage('onMove', msg);
};

/**
 * 在这里加一个逻辑：判断当前玩家是否已掉线，若是，则直接替他选择第一个可选角色。
 *
 */
game.notifyPickingRole = function () {
    var self = this;
    var msg = {
        curPlayer: self.curPlayer,
        roleList: self.roleSet.roleList
    };
    //当前玩家是否掉线
    if (self.playerVarArray[self.curPlayer].disconnect) {
        self.defaultRolePick();
    } else {
        self.channel.pushMessage('onPickingRole', msg);
    }
};

/**
 * 角色开始行动回合，即选择拿金币/建筑牌。
 * 根据有没有天文台、图书馆判断可拿几张建筑牌、可保留几张建筑牌。
 */
game.notifyTakingAction = function () {
    var self = this;
    // var curPlayerObj = self.roleSet.roleList[self.curRole];
    var curPlayerObj = self.playerVarArray[self.curPlayer];
    var canTakeCoinCnt = consts.CAN_TAKE_COIN_COUNT.NORMAL;
    var canTakeCardCnt = consts.CAN_TAKE_CARD_COUNT.NORMAL;
    var canHaveCardCnt = consts.CAN_HAVE_CARD_COUNT.NORMAL;
    // if (curPlayerObj.hasLibrary) {
    if (curPlayerObj.buildingDict.hasOwnProperty(consts.BUILDINGS.LIBRARY)) {
        canHaveCardCnt = consts.CAN_HAVE_CARD_COUNT.LIBRARY;
    }
    if (curPlayerObj.buildingDict.hasOwnProperty(consts.BUILDINGS.OBSERVATORY)) {
        // if (curPlayerObj.hasObservatory) {
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

/**
 * param： 一个list，保存所有需要被更新的玩家对应的 seatId，据此从 playerVarArray 中选出要更新的玩家数据，发给客户端
 */
game.notifySituation = function (seatIdListToUpdate) {
    if (seatIdListToUpdate.length === 0) {
        return;
    }
    var self = this;
    var playerVars2Update = [];
    seatIdListToUpdate.forEach(function (seatId) {
        playerVars2Update.push(self.playerVarArray[seatId]);
    });
    var msg = {
        playerVarArray: playerVars2Update
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

game.notifyCemetery = function () {
    var msg = {
        cardId: cardId
    };
    this.channel.pushMessage('onCemetery', msg);
};

game.notifyCemeteryDone = function () {

    this.channel.pushMessage('onCemeteryDone', {});
};

game.notifyGameOver = function () {
    var self = this;
    self.channel.pushMessage('onGameOver', {});
};

game.notifyRoleKilled = function (roleIdKilled) {
    // var roleIdKilled;
    // this.roleSet.roleList.forEach(function(roleObj){
    //     if(roleObj.killed){
    //         roleIdKilled = roleObj.id;
    //     }
    // });
    var msg = {
        roleIdKilled: roleIdKilled
    };
    this.channel.pushMessage('onRoleKilled', msg);
};

game.addLog = function (text) {
    var time = moment().format('HH:mm:ss');
    var log = '[' + time + '] ' + text;
    this.historyMsg.push(log);
    this.channel.pushMessage('onLog', {log: log});
};

module.exports = Game;