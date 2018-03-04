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

    GET_READY: {
        OK: 0,
        ERROR: 1
    },
    //
    // GAME:{
    //     NEXT_PLAYER_PICK_ROLE: 1
    // },

    ACTION: {
        COINS: 1,
        BUILDING_CARDS: 2
    },

    MOVE: {
        DO_SOMETHING: 0,
        TAKE_BUILDING_CARDS: 1,
        TAKE_COINS: 2,
        PICKING_ROLE: 3
    },

    CAN_TAKE_COIN_COUNT: {
        NORMAL: 2
    },

    CAN_TAKE_CARD_COUNT: {
        NORMAL: 2,
        OBSERVATORY: 3
    },

    CAN_HAVE_CARD_COUNT: {
        NORMAL: 1,
        LIBRARY: 2
    },

    BANK_INIT_COINS: 300,

    DEFAULT_GAME_OVER_BUILDING_COUNT: 8,

    GAME_STATE: {
        ROLE_PICKING: 11,
        COIN_OR_CARD: 12,
        ABILITY: 13,
    },

    CLIENT_ONLY: {
        EVENT: {
            PICK_ROLE: 11,

        },

        ERROR: {
            INVALID_TARGET: 11,
        }
    }
};