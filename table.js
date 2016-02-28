var map;//Map()数组
var root = getRootPath();//根目录
var dropDown = {//设置下拉框对象
    /**判断是否获取字典数据
     *第一个参数为字典的头部信息，第二个参数为jquery获取的待进行隐藏显示操作的按钮元素：
     * $("#QueryConditions").find("input.dropMean")
     */
    "IsGetDict":function(DictHeader,buttons,select){
        var dropDownLocal = JSON.parse(localStorage.getItem("dropDown_Menu"));//本地保存的字典数据
        if(!dropDownLocal||!dropDownLocal["header"]||dropDownLocal["header"]!=DictHeader){
            buttons.hide();//隐藏需要下拉框数据的按钮
            this.getDict(DictHeader,select);//获取字典数据
            buttons.show();//有字典数据时，即可显示需要下拉框的按钮
            return this.data1;//字典项数据
        }else{//无需获取信息即添加信息到下拉框
            if(select){
                this.setDict(select,dropDownLocal.dictList)
            }
            return dropDownLocal.dictList;//字典项数据
        }
    },
    /**获取字典数据
    *第一个参数为字典的头部信息
    */
    "getDict":function(DictHeader,select){
        var DictType = [];//字典ID列表
        var that = this;
        $(".select").each(function(index,value){
            var header = $(value).hasClass("common")?"common":DictHeader;
            DictType.push("'"+header+"_"+value.getAttribute("name")+"'");
        });
        $.ajax({
            url: root+"/common/getDict",
            type:"post",
            dataType: "json",
            async:false,
            data: "DictType="+DictType.join(),
            success:function(data){
                var dataJson = eval(data);
                /*保存字典信息到本地*/
                var dropDown = {};
                dropDown.header = DictHeader;//设置字典信息的头部信息
                dropDown.dictList = dataJson.dataList;//设置字典信息的主信息
                localStorage.setItem("dropDown_Menu",JSON.stringify(dropDown));//更新字典信息
                // 安装字典信息到下拉框
                if(select){
                    that.setDict(select,dataJson.dataList);
                    that.data1 = "";
                }else{
                    that.data1 = dataJson.dataList;//返回数据
                }
            }
        });
    },
    /**安装字典信息到下拉框
     * 第一个参数为jquery获取的select元素数组
     */
    "setDict":function(select,dictList){
        if(!dictList){//如果没有传递字典的数据，则获取本地保存的字典信息
            dictList = JSON.parse(localStorage.getItem("dropDown_Menu")).dictList;//字典的主信息
        }
        select.each(function(){
            var optionList = "";
            for(var i = 0;i<dictList.length;i++){
                if(this.getAttribute("name")==dictList[i][1].split("_").pop()){//判断元素的name值是否等于字典主信息数组的[1]
                    /*class用于多级联动的查询对应子菜单*/
                    var className = dictList[i][0]!=null?dictList[i][0].split("_").pop():'-1';//class值为parentID的.split("_").pop()
                    optionList += "<option value='"+dictList[i][2]+"' class='"+className+"'>"+dictList[i][3]+"</option>";
                }
            }
            $(this).append($(optionList));
        })
    },
    /**下拉框多级联动
     * 第一个参数为js获取的父级select;第二个参数为js获取的父级与子集select所在的table(或form)元素
     */
    "dictLinkage":function(selectDOM,body){
        var childClass = selectDOM.value;//所需子集菜单的class
        if(childClass){
            var childID = selectDOM.id+"_D";//所需子菜单的ID
            $(body).find("#"+childID).val("")//初始化下级菜单下拉框的值
                .find("option:not(.public)").hide()//下拉框隐藏
                .end().find("."+childClass).show();//所需下拉框显示
        }
    }
};
$(function(){
    try{//判断是否支持Map
        map = new Map();/*数组中第一个参数为表头的文本信息；第二个为排序参数，值为0或1。默认为0，从大到小排序。1，表示从小到大排序*/
    }catch(e){
        if(e.name=="ReferenceError"&&e.message=="Map is not defined"){
            alert("您的浏览器不支持Map\n请您更换支持Map浏览器");//在谷歌浏览器中支持
        }
    }
    $("#Button_Query").click(function(){//查询
        QueryTable(6,parameter,"select");
    });
    $("#Button_refresh").click(function(){//刷新
        QueryTable(5,parameter,"AdvancedQuery");
    });
    $("#jsExcel").click(function(){//导出Excel
        var count = $("#count").text();//数据总量
        if(!count||count<0){
            alert("数据为空，无法导出Excel！");
            return false
        }
        var QueryConditions = $("#Button_Query");//查询按钮
        var tableName = "";//数据库表单名称
        var tableName_sqlStr = QueryConditions.attr("tableName_sqlStr");//数据表名
        if(tableName_sqlStr){
            tableName = " "+tableName_sqlStr+" "+QueryConditions.attr("sqlStr");//待导出数据的数据表名+查询条件
        }else{
            alert("错误!缺少导出表单的表名!");
            return false
        }
        var scope = []//待查询字段
                ,header = [];//表头
        var th = $("#table").find("th:not(.th)");
        for(var i = 0;i<th.length;i++){
            //如果为下拉选项,待查询字段对应视图中join的数据
            scope.push((($(th[i]).hasClass("select"))?"D_":"")+th[i].getAttribute("name"));
            header.push(th[i].innerText);
        }
        console.log(scope);
        /*设置待查询数据所在的input(scopeHeader)*/
        var form = $("#QueryForm");
        if(!form.find("#scopeHeader").length>0){//若不存在scopeHeader，则新增一个scopeHeader，并放于form之中
            form.append($("<input type='text' id='scopeHeader' hidden name='scopeHeader'>"));
        }
        $("#scopeHeader").val(tableName+"---"+scope.join()+"---"+header.join());//为scopeHeader赋值
        form.attr("method","post");//设置传递方法
        form.attr("action",root+"/toExcel");//设置URL
        form.submit();
    });
    $("#Button_AdvancedQuery").on("click",function(){//高级查询
        layer.open({
            type: 2,
            title: '高级查询',
            shadeClose: true,
            shade: 0.1,
            area: ['640px', '35%'],
            content: root+'/pages/layer/query/AdvancedQuery.html' //iframe的url
        });
    });
    $("body").on("click","a.paging",function(){//页面跳转
        var index = $("a.paging").index($(this));
        console.log("index="+index);
        if(index==0){
            QueryTable(7,parameter,"AdvancedQuery");
        }else{
            QueryTable(index,parameter,"AdvancedQuery");
        }
    }).on("click","a.tel",function(){
        callOutTel($(this).attr("name"),$(this).html());//点击外呼
    });
    $("#Button_Add").click(function(){//添加客户
        operation(1,-1);
    });
    $("#table td.dataSort").click(function(){//设置表头点击排序
        sorting(this,$(this).html());
    });
    $("#table_check").click(function(){//序号多选框的全选/不全选
        var tableCheck = document.getElementsByClassName("table_check");
        for(var a in tableCheck){
            tableCheck[a].checked = this.checked;
        }
    });
});
//js获取项目根路径
function getRootPath(){
    //获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
    var curWwwPath=window.document.location.href;
    //获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
    var pathName=window.document.location.pathname;
    var pos=curWwwPath.indexOf(pathName);
    //获取主机地址，如： http://localhost:8083
    var localhostPaht=curWwwPath.substring(0,pos);
    //获取带"/"的项目名，如：/uimcardprj
    var projectName=pathName.substring(0,pathName.substr(1).indexOf('/')+1);
    return(localhostPaht+projectName);
}
//查询数据库信息
/**
 * @return {boolean}
 */
function QueryTable(currentPageType,parameter,buttonType,otherQueryCondition){
    var page;//待查询页数
    var $prompt = $("#row_Nodata");
    //隐藏原先的数据
    $("#table tr:not(.th)").removeClass("table").remove();
    $prompt.text("查询中......").show();
    $("#Paging").hide();
    $("#information").hide();
    var currentPage = $("#currentPage").html();//当前页
    var countPage = $("#countPage").html();//总页数
    var jumpPage = $("#jumpPage").val();//跳转页
    //判断坐席的查询权限
    var IE_WorkerData = localStorage.getItem("UserData");//数据库数据
    var Data = JSON.parse(IE_WorkerData);
    var IsMgr = Data[0][6];//0为无；1为本人；2为本部门；3为公司
    var QueryForm = $("#QueryForm").serialize();//查询数据
    var url = parameter["url"];
    if(jumpPage*1>countPage*1){
        jumpPage = countPage;
    }else if(jumpPage<0){
        jumpPage = 0;
    }
    var QueryConditions = document.getElementById("Button_Query");//查询按钮name
    if(currentPageType==1){//首页
        page = 1;
    }else if(currentPageType==2){//上一页
        page = currentPage*1-1;
    }else if(currentPageType==3){//下一页
        page = currentPage*1+1;
    }else if(currentPageType==4){//尾页
        page = countPage;
    }else if(currentPageType==5){//刷新当前页
        page = currentPage*1;
    }else if(currentPageType==6){//查询按钮快速查询
        page = 1;
        QueryConditions.setAttribute("name",buttonType);
    }else if(currentPageType==7){//页面跳转查询
        page = jumpPage*1;
    }
    var advancedQuery = $("#advancedQuery").val();//本地保存的高级查询信息
    console.log("advancedQuery="+advancedQuery);
    if(advancedQuery&&advancedQuery!="undefined"&&advancedQuery!=""&&buttonType=="AdvancedQuery"){//添加高级查询信息
        QueryForm += "&otherQueryCondition="+encodeURIComponent(advancedQuery);
    }
    console.log(QueryConditions.getAttribute("name")+"==QueryForm="+QueryForm);
    $.ajax({
        url:url,
        type:"post",
        dataType: "json",
        async: parameter["async"]?parameter["async"]:false,
        data: "currentPage="+page+"&buttonType="+QueryConditions.getAttribute("name")+
        //groupIsMgr:工作组ID;workIsMgr:工号
        "&IsMgr="+IsMgr+"&groupNameIsMgr="+Data[0][11]+"&groupIsMgr="+Data[0][3]+"&workIsMgr="+Data[0][1]+"&workNameIsMgr="+Data[0][0]+
        "&"+QueryForm,
        success: function(data){
            //获取数据库数据(json)
            var dataJson = eval(data);
            var dataType = dataJson.dataType;
            //获取table根目录元素
            var table = document.getElementById("table");
            //保存查询条件到查询按钮的sqlStr属性
            if(dataJson.tableName){
                var tableList = dataJson.tableName.split(" ");
                var tableName_sqlStr = tableList.shift();//删除第一个数据，即数据表
                QueryConditions.setAttribute("tableName_sqlStr",tableName_sqlStr);//数据表名
                QueryConditions.setAttribute("sqlStr",tableList.join(" "));//查询条件
            }
            if(dataType=="Y"){
                var count = dataJson.count;//当前页面的数据总数量
                var countPage = dataJson.countPage;//总页数
                var currentPage = dataJson.currentPage;//当前页数
                //关闭“查询中”
                $prompt.hide();
                //显示当前页数，总页数，总数据量
                $("#information").show();
                $("#count").html(count);
                $("#currentPage").html(currentPage);
                $("#countPage").html(countPage);
                //显示分页按钮
                $("#Paging").show();
                if(currentPage-countPage==0&&countPage-1>0){//只显示首页
                    EndTableData(true,false);
                }else if(currentPage-1==0&&countPage-1>0){//只显示尾页
                    EndTableData(false,true);
                }else if(countPage-1==0){//什么都不显示
                    EndTableData(false,false);
                }else if(currentPage-1>0&&countPage-currentPage>0){
                    EndTableData(true,true);
                }
                setTable(table,dataJson.dataList);//渲染数据
                //查询数据本地缓存
                if(parameter["dataSave"]==1){//若为1，则不需要缓存页面数据
                    dataJson.dataList = [];
                }
                if(parameter["tableLocal"]){
                    localStorage.setItem(parameter["tableLocal"],JSON.stringify(data));
                }else{
                    localStorage.setItem("TableData",JSON.stringify(data));
                }
            }else{
                $("#row_Nodata").text("无数据");
            }
        },
        error: function(data){
            console.log(data.responseText);
        }
    })
}
/**
 * 表单排序函数。第一个参数为点击的表头的this值，第二个参数为表头的html值
 **/
function sorting(that,DOMText){
    var index1 = $(that).index();//表头的index位置
    var index2 = parameter.tableNum[index1-1];//表头对应的数据在localStorage中的index值
    /*更新localStorage*/
    var local = JSON.parse(localStorage.getItem("TableData"));
    var tableData = local.dataList;
    if(!tableData){
        return false;
    }
    if(map.has(DOMText)&&map.get(DOMText)==-1){//存在Map对应值并参数为0时，设置参数为1；其他情况设置参数为默认值0
        map.set(DOMText,1);
    }else{
        map.set(DOMText,-1);
    }
    tableData.sort(function(l1,l2){
        var x1 = parseInt(l1[index2]);
        var x2 = parseInt(l2[index2]);
        if(isNaN(x1)){x1=0}//当运行parseInt(null)时，x1或x2值为NaN
        if(isNaN(x2)){x2=0}
        if (x1 < x2) {
            return -1*(map.get(DOMText));
        }
        if (x1 > x2) {
            return 1*(map.get(DOMText));
        }
        return 0;
    });
    localStorage.setItem("TableData",JSON.stringify(local));
    //删除已显示数据
    $("#table tr:not(.th)").remove();
    //创建数据，默认页面显示有数据
    setTable($(that).parent().parent()[0],tableData);
}
/**
 * 渲染表单数据的函数。第一个参数为待渲染的表单元素的DOM(js原生获取)，第二个参数为所需的表单数据(数组类型)
 **/
function setTable(tableDOM,tableData){
    for(var j=0;j<tableData.length;j++ ){
        var tr = document.createElement("tr");
        tr.className = "table";
        //添加数据到table
        tableDOM.appendChild(tr);
        //同时满足呼入、呼叫时长为0、为阅读的标红
        if(tableData[j][4]=="in"&&tableData[j][5]=="0"&&tableData[j][15]=="0"){
            tr.className = "Red";
        }
        creatRowTd("td",tr,"<input type='checkbox' class='table_check' value='"+tableData[j][0]+"'>"+(j+1));//创建序号,value为ID
        for(var p=0;p<parameter["tableNum"].length;p++){
            var num = parameter["tableNum"][p];
            var specialData = parameter["specialData"];
            var result=-1;
            for(var m=0;m<specialData.length;m++){
                if(p==specialData[m][0]-1){
                    result=m;
                    break;
                }else{
                    result=-1;
                }
            }
            if(result==-1){
                creatRowTd("td",tr,tableData[j][num]);
            }else{
                //1.新建的节点;2.父节点;3.新建节点显示文字;4.td数据变换类型;5.每行tr中的td的index值
                creatRowTd("td",tr,tableData[j][num],specialData[m][1],p);
            }
        }
        //创建操作
        var $div = $("<td style='text-align: center' class='buttonEditFound'></td>");
        var buttonList = parameter["button"];
        for(var b=0;b<buttonList.length;b++){
            var $button = $("<input type='button' class='editFound btn btn-primary' value='"+buttonList[b][1]+"' onclick='operation("+buttonList[b][0]+","+j+")'></input>");
            $div.append($button);
        }
        //按钮集合添加到子元素
        tr.appendChild($div[0]);

    }
    //设置显示数据的样式
    $("#table tr:even:not(.th)").css("background","#ECF0F1");
}

//添加数据到table的td
function creatRowTd(child,parent,childText,type,p){
    var td = document.createElement(child);
    parent.appendChild(td);
    if(type=="aCust"){
        if(childText!=""&&childText!=null){
            var index = $(parent).index();
            td.innerHTML = "<a class='tel' href='javascript:void(0)' name='"+index+"'>"+childText+"</a>";
            $(td).addClass("buttonEditFound");
        }else{
            td.innerHTML = childText;
        }
    }else if(type=="星期"){
        td.innerHTML = "星期"+childText;
    }else if(type=="Direction"){//判断呼入呼出
        if(childText=="in"){
            td.innerHTML = "呼入";
        }else if(childText=="out"){
            td.innerHTML = "呼出";
        }
    }else if(type=="Is"){//判断是否
        td.innerHTML = (childText=="1")?"是":"否";
    }else if(type=="other"){
        td.innerHTML = tabelDataOther(p,childText,parent);
    }else{
        td.innerHTML = childText;
    }
}
//按钮操作函数
function operation(action,ID){//action表示操作类型,1为添加；2为更新;3为删除;4为其他
    if(action==1||action==2){
        editInformation(ID,action);
    }else if(action==3){
        delectInformation(ID);
    }else if(action==4){
        buttonOther(ID);
    }
}
//表格尾部信息栏
function EndTableData(First,End){
    if(First==true){
        $("#pagingFirst").show();
    }else if(First==false){
        $("#pagingFirst").hide();
    }
    if(End==true){
        $("#pagingEnd").show();
    }else if(End==false){
        $("#pagingEnd").hide();
    }
}
//添加点击数据行加深功能
function ClickOnData(){
    $(this).children().addClass("selected").end().siblings().children().removeClass("selected");
}
//获取批号
function setGroup(localData,parentID){
    var GroupList = JSON.parse(localStorage.getItem(localData)).groupDataList;
    var selectGroup = document.getElementById(parentID);
    for(var i in GroupList){//i为下标
        var optionGroup = document.createElement("option");
        optionGroup.value = optionGroup.innerHTML = GroupList[i];
        selectGroup.appendChild(optionGroup);
    }
}
//获取工作组
function getGroup(dataTable,url,List,noDOM){//url:getReportSelectOption;noDOM:0为不操作DOM,1为操作DOM
    $.ajax({
        url: url,
        type: "post",
        data: "dataTable="+dataTable,
        dataType: "json",
        success: function (data) {
            var dataJson = eval(data);
            var optionData = dataJson.dataList;
            //工作组本地保存
            localStorage.setItem(List,JSON.stringify(optionData));
            if(noDOM=="1"){
                var selectGroup = document.getElementById("group");
                for(var i=0;i<optionData.length;i++){
                    var optionGroup = document.createElement("option");
                    var length = optionData[i].length;
                    optionGroup.value = optionData[i][length-1];
                    optionGroup.innerHTML = optionData[i][0];
                    selectGroup.appendChild(optionGroup);
                }
            }
        }
    })
}
//外呼操作
function callOutTel(index,childText){
    $("#table").find("tr:eq("+index+")").css("color","red");//当行数据标红，表示已拨打
    layer.closeAll('iframe');
    var UserData = JSON.parse(localStorage.getItem("UserData"));
    var TableData = JSON.parse(localStorage.getItem("TableData"));
    var CustHrefURL = UserData[0][10]+'&sipnum='+UserData[0][2]+'&destnum='+childText+'&outshowtel='+UserData[0][9]+'&calloid='+TableData.dataList[index-1][1];
    console.log(CustHrefURL);
    $.ajax({
        url: CustHrefURL,
        type:"get",
        dataType: "jsonp",
        jsonp: 'callback',
        success:function(data){
            console.log(data);
        },error:function(data){
            console.log(data);
        }
    });
}
