/**
 * Created by X93 on 2018/2/17.
 */
var consts = require('../consts/consts');

var Bank = function(){
    this.coins = consts.BANK_INIT_COINS;
};

/**
 * todo 如果银行剩1块，但要取3块，咋办？是给1块？还是干脆不让取？
 * @param count
 */
Bank.prototype.draw = function(count){
    this.coins -= count;
};

Bank.prototype.reset = function () {
    this.coins = consts.BANK_INIT_COINS;
};

module.exports = Bank;