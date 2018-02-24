/**
 * Created by X93 on 2018/2/17.
 */
var consts = require('../consts/consts');
var staticBuilidngCards = require('../consts/buildings');

var Pile = function(){
    /**
     * 构造函数。
     * 其中，牌堆 pile 和 弃牌堆 deadwood 中，
     * 保存的都是 staticBuildingCards.id，即牌本身的id（不同内容的牌拥有不同的id，相同id的牌内容相同，见 consts.js）
     * 牌堆是用 Array 实现的。
     * 牌堆顶部为 Array 的头部，牌堆底部为 Array 的尾部。
     * @type {Array}
     */
    this.pile = [];
    this.deadwood = [];

};

var pile = Pile.prototype;

function shuffle(array){
    var i,x,j;
    for(i=array.length;i>0;i--){
        j = Math.floor(Math.random()*i);
        x = array[j];
        array[j] = array[i-1];
        array[i-1] = x;
    }
}

/**
 * 初始化牌堆，即将牌堆置空，然后根据游戏配置，向牌堆中填入一定数量的各种建筑牌。
 */
pile.initPile = function(){
    var self = this;
    this.pile = [];
    staticBuilidngCards.forEach(function(value, index, array){
        for(var i=0; i<value.count; i++){
            self.pile.push(value.id);
        }
    })
};

/**
 * 重置牌堆（包括初始化、洗牌）和弃牌堆。
 */
pile.reset = function(){
    this.initPile();
    shuffle(this.pile);
    this.deadwood = [];
};

/**
 * 从牌堆顶部摸一张牌。
 * @returns {T} 摸到的牌的id（如consts.BUILDINGS.PUB）。
 */
pile.draw = function(){
    return this.pile.shift();
};

pile.append = function(cardId){
    this.pile.push(cardId);
};

module.exports = Pile;
