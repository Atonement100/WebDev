var loadedTreebanks = [];
var selectedTreebanks = [];
var loadedMetrics = retrieveMetrics();
var enabledMetrics = [];
var disabledMetrics = [];
var USING_SIDEBAR = false;
var lastMetricResults = [];
var tableData;

function openTab(event, tabName){
    var i;
    var metricTabContent = document.getElementsByClassName(event.currentTarget.className + "Content");
    for (i = 0; i < metricTabContent.length; i++){
        metricTabContent[i].style.display = "none";
    }

    var headerTabs = document.getElementsByClassName(event.currentTarget.className);
    for (i = 0; i < headerTabs.length; i++){
        headerTabs[i].className = headerTabs[i].className.replace(" active", "");
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

function loadTreebankFromSidebar(){
    var input = document.getElementById("treebankIdInput");
    loadTreebankFile(input.value);
    input.value = "";
}

function unloadTreebankFromSidebar(id){
    RemoveLoadedTreeById(id);
}

function loadTreebankFile(id){
    id = id.trim();
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
    output.println("No metric with the name '" + name + "' exists.")
    return false;
}

/**
 * Override
 */
VNConsoleWindow.prototype.init=function()
{
    var d=""+new Date();
    var i=d.indexOf("GMT");
    if(i>-1) d=d.substring(0,i-1);
    this.println(d);
    this.println("---- Console started. Type 'help' for a list of commands. ----");
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
                output.println("The unload command should be used as either 'unload -a' or load &lt;treebank id>'");
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
                            output.println("No treebanks have been loaded yet. Use the \"load\" command to load a new treebank.");
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
            applyMetrics();
            return true;
        case "clear":
            output.clear();
            return true;
        default:
            return false;
    }

    //return false;
};

function applyMetrics(){
    if (loadedTreebanks.length == 0){
        output.println("No treebanks have been loaded, please load treebank(s) before applying metrics.");
    }

    if (USING_SIDEBAR) {
        selectedTreebanks = getCheckedTreebanks();
    }

    if (selectedTreebanks.length == 0){
        output.println("No treebanks were selected, please select at least one treebank");
    }

    enabledMetrics = getCheckedMetrics();

    if (enabledMetrics.length == 0){
        output.println("No metrics were selected, please select at least one metrics");
    }

    lastMetricResults = [];

    selectedTreebanks.forEach(function(tree){
        output.println(tree.getTitle() + " - " + tree.id);
        lastMetricResults.push(tree.apply(enabledMetrics,{progress:output.getProgress()}));
    });
}

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
    var list = document.createElement("form");
    list.id = "metricList";
    list.action = "metric_form.asp";
    list.method = "get";

    for (var i = 0; i < array.length; i++){
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "metricCheckbox";
        checkbox.value = i;
        checkbox.checked = true;

        var label = document.createElement("label");
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(array[i].name));
        label.appendChild(document.createElement("br"));

        list.appendChild(label);

    }

    return list;
}

function AddTreeToSidebar(newTree){
    var treeList = document.getElementById("treebankList");

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "treebankCheckbox";
    checkbox.value = newTree.id;
    checkbox.checked = true;

    var unloadButton = document.createElement("button");
    unloadButton.type = "button";
    unloadButton.className = "unloadButton";
    unloadButton.onclick = function(){unloadTreebankFromSidebar(newTree.id);};
    unloadButton.appendChild(document.createTextNode(" - "));

    var label = document.createElement("label");
    label.id = newTree.id;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(newTree.getTitle()));
    label.appendChild(unloadButton);
    label.appendChild(document.createElement("br"));


    treeList.appendChild(label);
}

function RemoveTreeFromSidebar(id){
    var treeToRemove = document.getElementById(id);
    treeToRemove.parentNode.removeChild(treeToRemove);
}

function buildDefaultTreebankList(){
    var list = document.createElement("form");
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
    return elems[0]? elems[0].name : ""; //Should always be exactly one "active" metric tab.
}

window.onload = function () {
    d3.select("#visualDiv")
        .style("width", screen.width - document.getElementById("metricDiv").getBoundingClientRect().width + "px");

    vn = new VisiNeatAPI();
    vn.setScreen("ConsoleTarget");

    // Initialization of treebank and metric lists
    USING_SIDEBAR = true;
    document.getElementById("Treebanks").appendChild(buildDefaultTreebankList());
    document.getElementById("Metrics").appendChild(buildDefaultMetricList(loadedMetrics));
    document.getElementById("startingMetricTab").click(); //Simulates opening a tab to start with
    document.getElementById("startingVisualTab").click();


    // Console creation
    var windowManager = vn.getWindowManager();
    output = windowManager.createConsole({left:10,top:10,width:1000,height:800,title:"metreex analysis"});




    loadTreebankFile("66w1loh5gaclr0ck");
    loadTreebankFile("ni5cxsbbkypbh0dl");
    loadTreebankFile("e1i9b02c68c9i2nl");
    loadTreebankFile("1grifbqibuk0zhxp");
    loadTreebankFile("ueiw9dcw21hgltlh");

};

function debugMetricResults(){
    for (var index = 0; index < selectedTreebanks.length; index++){
        console.log("treebank: " + selectedTreebanks[index].getTitle());
        for (var sentenceIndex = 0; sentenceIndex < lastMetricResults[index].length; sentenceIndex++){
            console.log("sentence: " + sentenceIndex);
            for (var metrIndex = 0; metrIndex < lastMetricResults[index][sentenceIndex].length; metrIndex++){
                console.log("metric no. " + metrIndex + ": " + enabledMetrics[metrIndex] + " : " + lastMetricResults[index][sentenceIndex][metrIndex]);
            }
        }
    }
    return true;
}

function buildBasicTableInverted(){
    d3.select("#basicTable").html("");

    var table = d3.select("#basicTable").append("table")
        .attr("id", "basicTableBase");
    tableData = assembleMetricData();

    var thead = table.append("thead")
        .attr("id", "basicTableThead");
    thead.append("tr")
        .attr("id", "basicTableHeader");

    buildInvertedTableHeader(tableData, "basicTableHeader");

    var tableDOM = document.getElementById("basicTableBase");
    var theadDOM = document.getElementById("basicTableThead");

    var tbody = table.append("tbody")
        .attr("id", "basicTableBody")
        .style("height", tableDOM.getBoundingClientRect().height - theadDOM.getBoundingClientRect().height + "px");

    tableData.forEach(function (elem, index) {
        var trow = tbody.append("tr")
            .attr("id", "basicTableDataRow" + index);

        if (elem.sentence == 1) {
            trow.append("td")
                .attr("rowspan", elem.numSentences)
                .attr("class", "rowHeader")
                .html(elem.title.replace(/_/g, " "));
        }

        trow.append("td")
            .html(elem.sentence)
            .attr("class","rowSubHeader");

        trow.selectAll("td")
            .data(elem.metricValues)
            .enter()
            .append("td")
            .text(function (data) {
                return data.toFixed(2);
            });

    });

    var tbodyDOM = document.getElementById("basicTableBody");
    tbodyDOM.onscroll = function(e) {
        theadDOM.style.left = "-" + tbodyDOM.scrollLeft + "px";
        Array.prototype.slice.call(theadDOM.getElementsByTagName("tr"))
            .forEach(function(elem){
                elem.childNodes[0].style.left = tbodyDOM.scrollLeft + "px";
            });
        Array.prototype.slice.call(tbodyDOM.getElementsByClassName("rowHeader"))
            .forEach(function(elem){
                elem.style.left = tbodyDOM.scrollLeft + "px";
            });
        Array.prototype.slice.call(tbodyDOM.getElementsByClassName("rowSubHeader"))
            .forEach(function(elem){
                elem.style.left = tbodyDOM.scrollLeft + "px";
            });
    };
}

function buildInvertedTableHeader(tableData, headId) {
    var thead = document.getElementById(headId);
    var tlhead = thead.appendChild(document.createElement("th"));

    tlhead.appendChild(document.createTextNode("Metrics"));

    tableData[0].metrics.forEach(function(elem){
        tlhead = thead.appendChild(document.createElement("th"));
        tlhead.appendChild(document.createTextNode(elem.name));
    });
}

function buildBasicTable(){
    //Clear out existing table if there is one already
    d3.select("#basicTable").html("");

    var table = d3.select("#basicTable").append("table")
        .attr("id", "basicTableBase");
    tableData = assembleMetricData();

    var thead = table.append("thead")
        .attr("id", "basicTableThead");
    thead.append("tr")
        .attr("id", "basicTableHeader");

    buildTableHeader(tableData, "basicTableHeader");

    thead.append("tr")
        .attr("id", "basicTableSubHeader");
    buildTableSubHeader(tableData, "basicTableSubHeader");

    var tableDOM = document.getElementById("basicTableBase");
    var theadDOM = document.getElementById("basicTableThead");

    var tbody = table.append("tbody")
        .attr("id", "basicTableBody")
        .style("height", tableDOM.getBoundingClientRect().height - theadDOM.getBoundingClientRect().height + "px");

    for (var metricIndex = 0; metricIndex < tableData[0].metrics.length; metricIndex++){
        var rowId = "basicTableDataRow" + metricIndex;
        tbody.append("tr")
            .attr("id",rowId);
        buildTableDataRow(tableData,rowId, metricIndex);
    }


    var tbodyDOM = document.getElementById("basicTableBody");


    tbodyDOM.onscroll = function(e) {
        theadDOM.style.left = "-" + tbodyDOM.scrollLeft + "px";
        Array.prototype.slice.call(theadDOM.getElementsByTagName("tr"))
            .forEach(function(elem){
                elem.childNodes[0].style.left = tbodyDOM.scrollLeft + "px";
            });
        Array.prototype.slice.call(tbodyDOM.getElementsByTagName("tr"))
            .forEach(function(elem){
                elem.childNodes[0].style.left = tbodyDOM.scrollLeft + "px";
            });
    };
}

function buildTableDataRow(tableData, rowId, rowNum){
    var tr = document.getElementById(rowId);
    var rowHeader = tr.appendChild(document.createElement("td"));
    rowHeader.appendChild(document.createTextNode(tableData[0].metrics[rowNum].name));

    for (var dataIndex = 0; dataIndex < tableData.length; dataIndex++){
        var rowData = tr.appendChild(document.createElement("td"));
        rowData.appendChild(document.createTextNode(tableData[dataIndex].metricValues[rowNum].toFixed(2)));
    }
}

function buildTableSubHeader(tableData, subheadId){
    var thead = document.getElementById(subheadId);
    thead.appendChild(document.createElement("th"));

    for (var index = 0; index < tableData.length; index++){
        var header = thead.appendChild(document.createElement("th"));
        header.appendChild(document.createTextNode(tableData[index].sentence));
    }

}

function buildTableHeader(tableData, headId){
    var thead = document.getElementById(headId);
    var tlhead = thead.appendChild(document.createElement("th"));
    tlhead.appendChild(document.createTextNode("Metrics"));

    for (var index = 0; index < tableData.length; ){
        var header = thead.appendChild(document.createElement("th"));
        header.colSpan = tableData[index].numSentences;
        header.appendChild(document.createTextNode(tableData[index].title.replace(/_/g," ")));

        index += tableData[index].numSentences;
    }
}

function assembleMetricData(){
    var data = [];

    for (var index = 0; index < selectedTreebanks.length; index++){
        for (var sentenceIndex = 0; sentenceIndex < lastMetricResults[index].length; sentenceIndex++){
            data.push({
                title: selectedTreebanks[index].getTitle(),
                sentence: (+sentenceIndex + 1),
                numSentences: lastMetricResults[index].length,
                metrics: enabledMetrics,
                metricValues: lastMetricResults[index][sentenceIndex]
            });
        }
    }

    return data;
}

function q(){
    applyMetrics();
    buildBasicTable();
}

function zz(){
    applyMetrics();
    buildBasicTableInverted();
}