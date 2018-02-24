/**
 * Created by X93 on 2018/2/14.
 */
module.exports = {
    ROLES: {
        NONE: 0,
        ASSASSIN: 1,
        THIEF: 2,
        MAGICIAN: 3,
        KING: 4,
        BISHOP: 5,
        MERCHANT: 6,
        ARCHITECT: 7,
        WARLORD: 8,
        QUEEN: 9
    },

    /**
     * ---贵族---
     城堡4 元 4 张
     庄园 3 元 5 张
     宫殿 5 元 3 张

     ---商业---
     集市 2 元 4 张
     贸易栈 2 元 3 张
     酒馆 1 元 5 张
     码头 3 元 3 张
     港口 4 元 3 张
     市政厅 5 元 2 张

     ---宗教---
     大教堂 5 元2 张
     修道院 3 元 3 张
     教堂 2 元 3 张
     神庙 1 元 3 张

     ---军事---
     了望塔1 元 3 张
     监狱 2 元 3 张
     要塞 5 元 2 张
     战场 3 元 3 张
     */
    BUILDINGS: {
        NONE: 0,

        CASTLE: 1,
        MANOR: 2,
        PALACE: 3,

        MARKET: 4,
        TRADE_POST: 5,
        PUB: 6,
        WHARF: 7,
        HARBOUR: 8,
        TOWN_HALL: 9,

        CATHEDRAL: 10,
        ABBEY: 11,
        CHURCH: 12,
        TEMPLE: 13,

        WATCHTOWER: 14,
        PRISON: 15,
        FORTRESS: 16,
        BATTLEFIELD: 17,

        LIBRARY: 18,
        MAGIC_SCHOOL: 19,
        COLLEGE: 20,
        SMITHY: 21,
        OBSERVATORY: 22,
        CEMETERY: 23,
        GHOST_TOWN: 24,
        DRAGON_GATE: 25,
        LABORATORY: 26,
        KEEP: 27,
        GREAT_WALL: 28
    },

    COLOR: {
        GREEN: 3,
        RED: 4,
        BLUE: 2,
        GOLDEN: 1,
        PURPLE: 5,
        NONE: 0
    },

    ENTER_ROOM: {
        OK: 0,
        ERROR_ROOM_NOT_EXIST: 1,
        ERROR_WRONG_ROOM_PASSWD: 2,
        ERROR_ROOM_FULL: 3
    },

    GAME:{
        NEXT_PLAYER_PICK_ROLE: 1
    },

    ACTION: {
        COINS: 1,
        BUILDING_CARDS: 2
    },

    MOVE: {
        TAKE_BUILDING_CARDS: 1,
    },

    BANK_INIT_COINS: 30
};