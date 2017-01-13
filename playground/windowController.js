var loadedTreebanks = [];
var selectedTreebanks = [];
var loadedMetrics = retrieveMetrics();
var disabledMetrics = [];
var USING_SIDEBAR = false;

function openTab(event, tabName){
    var i;
    var metricTabContent = document.getElementsByClassName("metricTabContent");
    for (i = 0; i < metricTabContent.length; i++){
        metricTabContent[i].style.display = "none";
    }

    var metricTabs = document.getElementsByClassName("metricTab");
    for (i = 0; i < metricTabs.length; i++){
        metricTabs[i].className = metricTabs[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}


function setAllCheckboxesInTab(tabName, newSetting){
    var cboxes = document.getElementsByName(tabName + "Checkbox");
    Array.prototype.slice.call(cboxes).forEach(function (cbox) {
        cbox.checked = newSetting;
    })
}

function invertAllCheckboxesInTab(tabName){
    var cboxes = document.getElementsByName(tabName + "Checkbox");
    Array.prototype.slice.call(cboxes).forEach(function (cbox) {
        cbox.checked = !cbox.checked;
    })
}

/**
 *
 * @param newTree Reference to tree to be added to the array of loaded treebanks
 * @returns {boolean} Returns true if a tree was successfully added or false otherwise.
 * @constructor
 */
function AddLoadedTree(newTree){
    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === newTree.id){
            output.println("Treebank " + newTree.id + " has been loaded previously");
            return false;
        }
    }

    loadedTreebanks.push(newTree);

    if (USING_SIDEBAR){
        AddTreeToSidebar(newTree);
    }

    return true;
}

/**
 *
 * @param id Id of tree which should be removed from the loaded array
 * @returns {boolean} Returns true if a tree was successfully removed or false otherwise.
 * @constructor
 */
function RemoveLoadedTreeById(id){
    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === id){
            loadedTreebanks.splice(index, 1);
            output.println("Treebank " + id + " has been unloaded");

            if (USING_SIDEBAR){
                RemoveTreeFromSidebar(id)
            }

            return true; //Should not have to worry about duplicates.
        }
    }
    output.println("Treebank " + id + " was not previously loaded");
    return false;
}

function GetTreeById(id){
    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === id){
            return loadedTreebanks[index];
        }
    }
    output.println("Treebank " + id + " was not previously loaded");
    return;
}

function UnloadAllTreebanks(){
    loadedTreebanks = [];
    output.println("All treebanks have been unloaded.");

    if(USING_SIDEBAR){
        RemoveAllTreesFromSidebar();
    }
}

function loadTreebankFile(id){
    output.println("Attempting to load tree with id " + id);
    var newTree = new TreebankFile();
    newTree.onload = function () {
        if (newTree.getNumOfSentences() > 0) {
            AddLoadedTree(newTree);
        }
    };
    newTree.load(id);
}

function loadTreebankCollection(){
    output.println("Attempting to load treebank collection");
    var t=new TreebankCollection();
    t.onload=function(){
        t.treebank.forEach(function(tree){
            AddLoadedTree(tree);
        });
    };
    t.load();
}

/**
 *
 * @param name
 * @returns {boolean}
 * @constructor
 */
function EnableMetric(name){
    for (var index = 0; index < disabledMetrics.length; index++){
        if (disabledMetrics[index].title === name){
            loadedMetrics.push(disabledMetrics[index]);
            disabledMetrics.splice(index, 1);
            output.println("The " + name + " metric has been enabled.");

        }
    }
    output.println("No metric with the name \"" + name + "\" exists.")
    return false;
}

/**
 *
 * @param name
 * @returns {boolean}
 * @constructor
 */
function DisableMetric(name){
    for (var index = 0; index < loadedMetrics.length; index++){
        if (disabledMetrics[index].title === name){
            disabledMetrics.splice(index, 1);
            output.println("The " + name + " metric has been disabled.");
        }
    }
    output.println("No metric with the name \"" + name + "\" exists.")
    return false;
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
                    loadTreebankCollection();
                }
                else {
                    loadTreebankFile(args[1]);
                }
            }
            else{
                output.println("Not enough parameters. Usage: load &lt;metreex database id> or load -c (for collection)");
            }
            return true;
        case "unload":
            if (args.length > 1 && args[1]){
                if (args[1] === "-a"){
                    UnloadAllTreebanks();
                }
                else{
                    RemoveLoadedTreeById(args[1]);
                }
            }
            else{
                output.println("The unload command should be used as either 'unload -a' or 'unload &lt;treebank id>'");
            }
            return true;
        case "list":
            if (args.length > 1) {
                switch (args[1]) {
                    case "trees":
                        if (loadedTreebanks.length > 0) {
                            output.println("The following " + loadedTreebanks.length + " treebank(s) have been loaded:");
                            loadedTreebanks.forEach(function (tree) {
                                output.println(tree.id + ": " + tree.getTitle());
                            });
                        }
                        else {
                            output.println("No treebanks have been loaded yet. Use the \'load\' command to load a new treebank.");
                        }
                        break;
                    case "metrics":
                        if (disabledMetrics.length + loadedMetrics.length == 0) {
                            output.println("No metrics have been loaded. Check for the metric source file.");
                            break;
                        }

                        if (loadedMetrics.length > 0) {
                            output.println("The following " + loadedMetrics.length + " metric(s) are enabled:");
                            loadedMetrics.forEach(function (metric) {
                                output.println(metric.name);
                            })
                        }

                        if (disabledMetrics.length > 0){
                            output.println("The following " + loadedMetrics.length + " metric(s) are disabled:");
                            disabledMetrics.forEach(function (metric) {
                                output.println(metric.name);
                            })
                        }
                        break;
                    default:
                        break;
                }
            }
            else{
                output.println("The list command should be used as 'list trees' or 'list metrics'");
            }
            return true;
        case "apply":
            if (loadedTreebanks.length == 0){
                output.println("No treebanks have been loaded, please use the load &lt;treebank id> command before this one.")
                return true;
            }

            if (USING_SIDEBAR) {
                selectedTreebanks = getCheckedTreebanks();
            }

            if (selectedTreebanks.length == 0){
                output.println("No treebanks were selected, please select at least one treebank");
                return true;
            }

            var enabledMetrics = getCheckedMetrics();

            if (enabledMetrics.length == 0){
                output.println("No metrics were selected, please select at least one metrics");
                return true;
            }

            selectedTreebanks.forEach(function(tree){
                output.println(tree.getTitle() + " - " + tree.id);
                tree.apply(enabledMetrics,{progress:output.getProgress()});
            });
            return true;
            /*
        case "enable":
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
        case "disable":
            return true;
            */
        case "clear":
            output.clear();
            return true;
        default:
            return false;
    }

    //return false;
};

//These are very similar functions... find a way to consolidate. id could be used for trees vs metrics
function getCheckedTreebanks(){
    var trees = [];
    var form = document.getElementById("treebankList");

    //Workaround for .forEach not being a member function of what .getElementsByTagName returns
    //Converts to array so that .forEach can be used.
    Array.prototype.slice.call(form.getElementsByTagName("label")).forEach(function (child) {
        Array.prototype.slice.call(child.getElementsByTagName("input")).forEach(function (checkbox) {
            if (checkbox.checked){
                trees.push(GetTreeById(checkbox.value));
            }
        });
    });

    return trees;
}

function getCheckedMetrics(){
    var list = [];
    var form = document.getElementById("metricList");

    Array.prototype.slice.call(form.getElementsByTagName("label")).forEach(function (child){
        Array.prototype.slice.call(child.getElementsByTagName("input")).forEach(function (checkbox) {
            if (checkbox.checked){
                list.push(loadedMetrics[parseInt(checkbox.value)]);
            }
        });
    });

    return list;
}

function buildDefaultMetricList(array){
    var list = document.createElement('form');
    list.id = "metricList";
    list.action = "metric_form.asp";
    list.method = "get";

    for (var i = 0; i < array.length; i++){
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = "metricCheckbox";
        checkbox.value = i;
        checkbox.checked = true;

        var label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(array[i].name));

        list.appendChild(label);
        list.appendChild(document.createElement('br'));
    }

    return list;
}

function AddTreeToSidebar(newTree){
    var treeList = document.getElementById("treebankList");

    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "treebankCheckbox";
    checkbox.value = newTree.id;
    checkbox.checked = true;

    var label = document.createElement('label');
    label.id = newTree.id;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(newTree.getTitle()));

    treeList.appendChild(label);
    treeList.appendChild(document.createElement('br'));
}

function RemoveTreeFromSidebar(id){
    var treeToRemove = document.getElementById(id);
    treeToRemove.parentNode.removeChild(treeToRemove.nextSibling); //Takes care of the extra <br>
    treeToRemove.parentNode.removeChild(treeToRemove);
}

function buildDefaultTreebankList(){
    var list = document.createElement('form');
    list.id = "treebankList";
    list.action = "treebank_form.asp";
    list.method = "get";

    return list;
}

function RemoveAllTreesFromSidebar(){
    var list = document.getElementById("treebankList");
    while (list.firstChild){
        list.removeChild(list.firstChild);
    }
}

function getActiveMetricTab() {
    var elems = document.getElementsByClassName("metricTab active");
    return elems[0]? elems[0].name : ""; //Should always be exactly one 'active' metric tab.
}

window.onload = function () {
    vn = new VisiNeatAPI();
    vn.setScreen("visualDiv");

    // Console creation
    var windowManager = vn.getWindowManager();
    output = windowManager.createConsole({left:0,top:50,width:1000,height:800,title:"metreex analysis"});

    // Initialization of treebank and metric lists
    USING_SIDEBAR = true;
    document.getElementById("Treebanks").appendChild(buildDefaultTreebankList());
    document.getElementById("Metrics").appendChild(buildDefaultMetricList(loadedMetrics));
    openTab(event, 'Metrics');
};
