/**
 * Created by X93 on 2018/2/17.
 */
var consts = require('../consts/consts');
var staticBuilidngCards = require('../consts/buildings');

var Pile = function(){
    /**
     * ���캯����
     * ���У��ƶ� pile �� ���ƶ� deadwood �У�
     * ����Ķ��� staticBuildingCards.id�����Ʊ����id����ͬ���ݵ���ӵ�в�ͬ��id����ͬid����������ͬ���� consts.js��
     * �ƶ����� Array ʵ�ֵġ�
     * �ƶѶ���Ϊ Array ��ͷ�����ƶѵײ�Ϊ Array ��β����
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
 * ��ʼ���ƶѣ������ƶ��ÿգ�Ȼ�������Ϸ���ã����ƶ�������һ�������ĸ��ֽ����ơ�
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
 * �����ƶѣ�������ʼ����ϴ�ƣ������ƶѡ�
 */
pile.reset = function(){
    this.initPile();
    shuffle(this.pile);
    this.deadwood = [];
};

/**
 * ���ƶѶ�����һ���ơ�
 * @returns {T} �������Ƶ�id����consts.BUILDINGS.PUB����
 */
pile.draw = function(){
    return this.pile.shift();
};

pile.append = function(cardId){
    this.pile.push(cardId);
};

module.exports = Pile;
