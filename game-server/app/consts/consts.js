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
     * ---����---
     �Ǳ�4 Ԫ 4 ��
     ׯ԰ 3 Ԫ 5 ��
     ���� 5 Ԫ 3 ��

     ---��ҵ---
     ���� 2 Ԫ 4 ��
     ó��ջ 2 Ԫ 3 ��
     �ƹ� 1 Ԫ 5 ��
     ��ͷ 3 Ԫ 3 ��
     �ۿ� 4 Ԫ 3 ��
     ������ 5 Ԫ 2 ��

     ---�ڽ�---
     ����� 5 Ԫ2 ��
     �޵�Ժ 3 Ԫ 3 ��
     ���� 2 Ԫ 3 ��
     ���� 1 Ԫ 3 ��

     ---����---
     ������1 Ԫ 3 ��
     ���� 2 Ԫ 3 ��
     Ҫ�� 5 Ԫ 2 ��
     ս�� 3 Ԫ 3 ��
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