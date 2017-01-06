var loadedTreebanks = new Array();

VNConsoleWindow.prototype.processCommand=function(command){
    console.log("Command received in window controller: " + command);
    output.println(command);

    var args = command.split(" ");
    switch (args[0].toLowerCase()){
        case "help":
            output.println("Welcome to the metreex analysis tool, type 'load \<<metreex id\>>' to load a Treebank file.");
            output.println("Type list to see all loaded treebanks.");
            return true;
        case "load":
            if (args.length > 1) {
                output.println("loading " + args[1]);
                var newTree = new TreebankFile();
                newTree.load(args[1]);
                output.println(loadedTreebanks.push(newTree));
            }
            else{
                output.println("Needs more parameters");
            }
            return true;
        case "list":
            output.println("The following treebanks have been loaded:");
            loadedTreebanks.forEach(function (tree) {
                output.println(tree.id + ": " + tree.getTitle());
            });
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
