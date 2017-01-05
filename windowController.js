VNConsoleWindow.prototype.processCommand=function(command){
    console.log("Command received in window controller: " + command);
    output.println(command);

    var args = command.split(" ");
    switch (args[0].toLowerCase()){
        case "help":
            output.println("Welcome to the metreex analysis tool");
            return true;
        case "load":
            if (args.length > 1) {
                output.println("loading " + args[1]);
            }
            else{
                output.println("Needs more parameters");
            }
            return true;
        default:
            return false;
    }

    //return false;
};

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
