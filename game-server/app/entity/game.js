/**
 * Created by X93 on 2018/2/13.
 */
var StateMachine = require('javascript-state-machine');
var consts = require('../consts/consts');

var Game = function(room) {
    this.curPlayer = 0;
    this.totalPlayer = room.totalPlayer;
    // channel ��������������ͻ��˷���Ϣ
    this.channelService = room.channelService;
    this.channel = room.channel;
    this.playerDict = {};
    this.roleSet = null;
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
     *  1. ��ʼ�������ƶѣ�ϴ��
     *  1. ��ʼ������
     *  2. ���������
     *  3. ��ʼ�������ȫ�����ԣ�ӵ�еĽ�������������ҵȶ����
     *  4. ��ʼ������ҽ��=2
     *  5. ��ʼ����������ƣ���4����
     */
    var self = this;
    this.fsm.init();    //��֪������д�в��У�

    this.pile.reset();

    this.bank.reset();

    var i = Math.random();  //0~1 random number
    this.crownOwner = Math.ceil(i * this.totalPlayer);    //1~8 random int


};


game.startRolePicking = function(){
    /**
     * �����ߣ�
     * 1. ��1���ƣ�
     *      ������Σ����ȿ�1�ţ�����ġ�
     *      ----------
     *      ��� �����game.totalPlayer == ��ɫ����roleSet.size - 1
     *      �� ��0����
     *      ��� �����game.totalPlayer < ��ɫ����roleSet.size - 1
     *      �� ��1����
     * 2. ���������Ų���ѡ���ƣ�
     *      ��� core.totalPlayer >= 4 �� <=6 :
         *      Ŀ���ǣ����±��������1�Ŀ�ѡ������
         *      �����Ĳ���ѡ�Ľ�ɫ����
         *      roleSet.size - (core.totalPlayer + 1) -1
     *      ��� core.totalPlayer == 7��
     *          ���� 0 �š�
     *
     * 3. ָ�� core.curPlayer = crownOwner
     *
     * 4. �� channel ������ curPlayer ��ʼѡ��ɫ��֪ͨ��
     * 5. �� curPlayer ������ѡ��ɫ�б�
     */
    var roleSetSize = this.roleSet.roleList.length;
    if(this.totalPlayer == roleSetSize - 1){
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
     *  ������while true��//ȫ����ң�
     *      1. �� channel ��Ϣ����ǰ curPlayer ���������ѡ��ɫ��
     *      2. �� curPlayer ����ҷ��Ϳ�ѡ��ɫ�б���bool���� ���� �ý�ɫ��ŵ����飩
     *      3. �յ���ҷ��ص�ѡ��ɫ��Ϣ������Ӧ��ɫ���Ϊpickable = false��
     *      4. curPlayer++��
     *      5. continue��
     */
}


function playerPickRole(){
    /**
     * ���������յ�һ����������ѡ��ɫ����Ϣ�󣬵��ô˺�����
     *
     * ���ѡ��һ����ɫ
     *  �������յ�����Ϣ msg={
     *      pick : roleNum
     *  }
     *
     *  1. ����ɫ���Ϊ����ѡ
     *  2. ��¼��ɫ��Ӧ�����
     *  3. �ж��Ƿ������ѡ��ɫ�غϣ����жϵ�ǰ����Ƿ�Ϊ���һ����ң�curPlayer == totalPlayer - 1
     *      �ǣ��� fsm ״̬ת��
     *      ���� curPlayer++, notifyNextPlayerToPick()
     *
     *
     *
     *
     */
    roleSet.pick();
    if(curPlayer == totalPlayer - 1)
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
 * ѡ��ɫ��
 *  1. ����ɫ���Ϊ����ѡ����¼��ɫ��Ӧ����� role.player
 *  2. ��¼���ѡȡ�Ľ�ɫ    player.role
 *  3. �ж��Ƿ������ѡ��ɫ�غϣ����жϵ�ǰ����Ƿ�Ϊ���һ����ң�curPlayer == totalPlayer - 1
 *      �ǣ��� fsm ״̬ת�ƣ������ж��׶�
 *      ���� curPlayer++, ������Ϣ������� notifyNextPlayerToPick()
 *
 * @param msg
 */
game.pickRole = function(msg){
    this.roleSet.pick(msg.roleId, msg.uid);
    var player = this.playerDict[msg.uid];
    player.pickRole(msg);
    if (this.curPlayer != this.totalPlayer - 1) {
        this.curPlayer++;
        return consts.GAME.NEXT_PLAYER_PICK_ROLE;
    } else {
        this.fsm.endAllRolePick();
    }
};

/**
 * �����˰��
 * ���� uid����playerDict������ң������䳡�Ͻ������ж���ɫ����ҵ�ǰ��ɫ��ɫ�Ƿ���ȣ������ۼ�1.
 * player.coins += taxes
 *
 * ��ɺ�֪ͨ�ͻ��˸��³��Ͼ��� updateSituation
 * @param msg
 */
game.collectTaxes = function(msg){
    msg_content = {
        uid: 1,

    }
};

/**
 * ������ѡ���ý�ң��ʹ�����ȡ����ͬʱ����ң�
 * ������ѡ���ý����ƣ����ж���ݣ�
 *      ����ҳ�����ͼ��ݣ���ɱ���2�Ž����ƣ�
 *      ����ҳ���������̨�����ý�����ʱ���Կ���3ѡ1��
 *
 * �ж��������Ƿ�Ϊ���ˣ������ٶ���1��ң�
 *
 * ֪ͨ�ͻ��˸��³��Ͼ��� updateSituation
 *
 * @param msg
 */
game.takeCoinsOrBuildingCards = function(msg){
    var self = this;
    var player = this.playerDict[msg.uid];
    if(msg.take == consts.ACTION.COINS){
        this.bank.draw(2);
        player.coins += 2;
    } else {
        //todo ֪ͨ���ϣ���ǰ���ѡ���ý���
        var pushMsg = {
            uidTakingMove: msg.uid,
            move: consts.MOVE.TAKE_BUILDING_CARDS
        }
        this.notifyCurMove(pushMsg);    //this.channel.pushMessage('onMove', pushMsg);
        //�жϸ�Ѿ���ؼ��Ž�����
        var count = 2;
        if(player.hasObservatory){
            count = 3;
        }
        var buildingCards4Picking = [];
        for(var i=0; i<count; i++){
            buildingCards4Picking.push(self.pile.draw());
        }
        //todo ���غ�ѡ�������б�
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
 * �û����� 2ѡ1 / 3ѡ1 / 2ѡ2 �Ľ����pickedList��notPickedList
 * ��ѡ�ģ����ӵ���Ӧ�û������У�
 * δѡ�ģ��ع��ƶѵײ���
 *
 *  ֪ͨ�ͻ��˸��³��Ͼ��� updateSituation
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
 * ֪ͨ�ͻ��ˣ���ǰ��˭�ڸ�ɶ��
 * @param msg
 */
game.notifyCurMove = function(msg){
    this.channel.pushMessage('onMove', msg);
};


module.exports = Game;