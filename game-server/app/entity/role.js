/**
 * Created by X93 on 2018/2/14.
 */
role//��̬�Ľ�ɫ��Ӣ�ۣ���Ϣ
{
    name_zh //������
    color //0~5
    ability //����ָ��
    description //����
    wholePic    //ԭ��
    avatar  //ͷ��

}

var consts = require('../consts/consts');

var roles = [
    {
        "id": 1,
        "color": consts.COLOR.NONE
    },
    {
        "id": 2,
        "color": consts.COLOR.NONE
    },
    {
        "id": 3,
        "color": consts.COLOR.NONE
    },
    {
        "id": 4,
        "color": consts.COLOR.GOLDEN
    },
    {
        "id": 5,
        "color": consts.COLOR.BLUE
    },
    {
        "id": 6,
        "color": consts.COLOR.GREEN
    },
    {
        "id": 7,
        "color": consts.COLOR.NONE
    },
    {
        "id": 8,
        "color": consts.COLOR.RED
    }
];

module.exports = roles;
