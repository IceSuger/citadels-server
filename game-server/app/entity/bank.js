/**
 * Created by X93 on 2018/2/17.
 */
var consts = require('../consts/consts');

var Bank = function(){
    this.coins = consts.BANK_INIT_COINS;
};

/**
 * todo �������ʣ1�飬��Ҫȡ3�飬զ�죿�Ǹ�1�飿���Ǹɴ಻��ȡ��
 * @param count
 */
Bank.prototype.draw = function(count){
    this.coins -= count;
};