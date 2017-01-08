var loadedTreebanks = [];

function AddLoadedTree(newTree){
    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === newTree.id){
            output.println("Treebank " + newTree.id + " has been loaded previously");
            return;
        }
    }

    loadedTreebanks.push(newTree);
}

function RemoveLoadedTreeById(id){
    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === id){
            loadedTreebanks.splice(index, 1);
            output.println("Treebank " + id + " has been unloaded");
            return; //Should not have to worry about duplicates.
        }
    }
    output.println("Treebank " + id + " was not previously loaded");
}

/**
 * Override
 */
VNConsoleWindow.prototype.init=function()
{
    var d=''+new Date();
    var i=d.indexOf('GMT');
    if(i>-1) d=d.substring(0,i-1);
    this.println(d);
    this.println('---- Console started. Type \'help\' for a list of commands. ----');
};

VNConsoleWindow.prototype.processCommand=function(command){
    console.log("Command received in window controller: " + command);

    var args = command.split(" ");
    switch (args[0].toLowerCase()){
        case "help":
            output.println("Welcome to the metreex analysis tool, type 'load &lt;metreex id>' to load a Treebank file.");
            output.println("Type list to see all loaded treebanks.");
            return true;
        case "load":
            if (args.length > 1 && args[1]) {
                if (args[1] === "-c"){
                    //load collection
                    output.println("Attempting to load treebank collection");
                    var t=new TreebankCollection();
                    t.onload=function(){
                        t.treebank.forEach(function(tree){
                            AddLoadedTree(tree);
                        });
                    };
                    t.load();
                }
                else {
                    output.println("Attempting to load tree with id " + args[1]);
                    var newTree = new TreebankFile();
                    newTree.onload = function () {
                        if (newTree.getNumOfSentences() > 0) {
                            AddLoadedTree(newTree);
                        }
                    };
                    newTree.load(args[1]);
                }
            }
            else{
                output.println("Not enough parameters. Usage: load &lt;metreex database id>");
            }
            return true;
        case "unload":
            if (args.length > 1 && args[1]){
                if (args[1] === "-a"){
                    loadedTreebanks = [];
                    output.println("All treebanks have been unloaded.");
                }
                else{
                    RemoveLoadedTreeById(args[1]);
                }
            }
            return true;
        case "list":
            if (loadedTreebanks.length > 0) {
                output.println("The following " + loadedTreebanks.length + " treebank(s) have been loaded:");
                loadedTreebanks.forEach(function (tree) {
                    output.println(tree.id + ": " + tree.getTitle());
                });
                return true;
            }
            else{
                output.println("No treebanks have been loaded yet. Use the \'load\' command to load a new treebank.");
                return true;
            }
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
    console.log(output.handlekeydown("a"));

/*
    var tree = new TreebankFile();
    tree.onload = function(){
        console.log(tree.getTitle());
        output.println(tree.getTitle());
    };

    tree.load('wuxmwtm934d917x2');
*/
};
