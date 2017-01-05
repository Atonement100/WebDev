window.onload = function () {
    vn = new VisiNeatAPI();
    vn.setScreen("windowDiv");

    var windowManager = vn.getWindowManager();
    output = windowManager.createConsole({left:0,top:50,width:1000,height:800,title:"metreex analysis"});

    output.println("test");
    console.log(output.handlekeydown("a"));

    var nm = new NodeMetric('number of nodes');


    var tree = new TreebankFile();
    tree.onload = function(){
        console.log(tree.getTitle());
        output.println(tree.getTitle());
    };

    tree.load('wuxmwtm934d917x2');

};
