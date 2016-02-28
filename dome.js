var parameter = {
    "url" :　"Cust/QueryCust",
    "tableNum" : [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,31,30],//显示table数据的条数，按照servlet中的数据生成顺序显示
    "specialData" : [[6,"aCust"],[7,"aCust"]],
    "button" : [[3,"回收"]],
    "async":true
};
var giveID = [];//选中的客户ID的数组
var DictType = "px_CRM_Cust";//字典的头部信息
$(document).ready(function(){
    QueryTable(1,parameter);//打开时显示当前数据
    //判断是否获取字典数据
    dropDown.IsGetDict(DictType,$("#QueryConditions").find("input.dropMean"),$("#CustType"));
    //dropDown.IsGetDict("px_CRM_Cust",$("#QueryConditions").find("input.dropMean"));
    judgeAuthority();//判断分配按钮是否显示
    //dropDown.setDict($("#CustType"));//设置客户类型的查询条件
    $("#QueryForm").on("change","select",function(){//选择客户类型时，自动查询
        QueryTable(1,parameter);
    });
    $("#Button_give").on("click",function(){//分配客户给其他坐席
        var checked = $(".table_check:checked");//所有选择的客户信息
        checked.each(function(index){//获取待分配数据的编号
            giveID.push(checked[index].value);
        });
        layer.open({
            type: 2,
            title: "分配客户",
            shadeClose: true,
            shade: 0.1,
            maxmin: true,//最大化按钮
            area: ['300px', '200px'],
            content: 'components/Model/Cust/layer/Cust_layer_give.html',
            end:function(){
                $("#Button_refresh").trigger("click");//刷新
            }
        });
    });
    var index;
    $("#table").on("dblclick","tr:not(.th) td:not(.buttonEditFound)",function(){
        layer.close(index);
        //本地保存待编辑数据ID
        //localStorage.setItem("TableID",$(this).parent().index());
        var indexList = $(this).parent().index();
        var TableData = localStorage.getItem("TableData");//数据库数据
        var UserData = localStorage.getItem("UserData");//坐席信息
        var Data = JSON.parse(TableData).dataList[indexList-1];
        index = layer.open({
            type: 2,
            title: "客户信息",
            shadeClose: true,
            shade: 0.1,
            maxmin: true,//最大化按钮
            area: ['80%', '99%'],
            content: 'ToPlayScreen.html?&dh='+Data[7]+'&gh='+JSON.parse(UserData)[0][1],
            end:function(){
                //$("#Button_refresh").trigger("click");//刷新
            }
        });
    });
});
function judgeAuthority(){//权限判定
    var IsMgr = JSON.parse(localStorage.getItem("UserData"))[0][6];
    if(IsMgr!='3'){//全部：3,非3则隐藏分配按钮
        $("#Button_give").hide();
    }
}
function editInformation(){//添加
    layer.open({
        type: 2,
        title: '新建联系人',
        shadeClose: true,
        shade: 0.1,
        maxmin: true,//最大化按钮
        area: ['920px', '60%'],
        content: 'pages/layer/layerIframe/MainOfData_add.html' //iframe的url
    });
}
//表格数据删除操作
function delectInformation(ID){
    if(!confirm("是否将客户要放入公共池？")){
        return false
    }
    var tableData = localStorage.getItem("TableData");//数据库数据
    var Data = JSON.parse(tableData);
    var idNum = Data.dataList[ID][0];
    $.ajax({
        url: "Cust/updataCust",
        type:"post",
        dataType: "html",
        data: "ID="+idNum+"&action=3",
        success: function (data) {
            if(data){
                layer.msg('回收成功', {
                    icon: 1,
                    time: 2000 //
                });
                QueryTable(5,parameter);
            }else if(!data){
                layer.msg('回收成功', {
                    icon: 2,
                    time: 2000 //
                });
            }
        }
    });
}

