/**
 * Created by X93 on 2018/2/14.
 */
// role//静态的角色（英雄）信息
// {
//     name_zh //中文名
//     color //0~5
//     ability //函数指针
//     description //介绍
//     wholePic    //原画
//     avatar  //头像
//
// }

var consts = require('../consts/consts');

var roles = [
    {
        "id": 1,
        "color": consts.COLOR.NONE,
        "name": "刺客"
    },
    {
        "id": 2,
        "color": consts.COLOR.NONE,
        "name": "盗贼"
    },
    {
        "id": 3,
        "color": consts.COLOR.NONE,
        "name": "魔术师"
    },
    {
        "id": 4,
        "color": consts.COLOR.GOLDEN,
        "name": "国王"
    },
    {
        "id": 5,
        "color": consts.COLOR.BLUE,
        "name": "主教"
    },
    {
        "id": 6,
        "color": consts.COLOR.GREEN,
        "name": "商人"
    },
    {
        "id": 7,
        "color": consts.COLOR.NONE,
        "name": "建筑师"
    },
    {
        "id": 8,
        "color": consts.COLOR.RED,
        "name": "军阀"
    }
];

module.exports = roles;
