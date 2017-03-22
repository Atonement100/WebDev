var loadedTreebanks = [],
    selectedTreebanks = [],
    loadedMetrics = retrieveMetrics(),
    enabledMetrics = [],
    disabledMetrics = [],
    USING_SIDEBAR = false,
    lastMetricResults = [],
    lastMetricsUsed = [],
    lastTreebanksUsed = [];


window.onload = function () {
    d3.select("#visualDiv")
        .style("width", screen.width - document.getElementById("metricDiv").getBoundingClientRect().width + "px");

    vn = new VisiNeatAPI();
    vn.setScreen("ConsoleTarget");
    vn.cloud = new VNCloud();

    // Initialization of treebank and metric lists
    USING_SIDEBAR = true;
    document.getElementById("Treebanks").appendChild(buildDefaultTreebankList());
    document.getElementById("Metrics").appendChild(buildDefaultMetricList(loadedMetrics));
    document.getElementById("startingMetricTab").click(); //Simulates opening a tab to start with
    document.getElementById("startingVisualTab").click();


    // Console creation
    var windowManager = vn.getWindowManager();
    output = windowManager.createConsole({left:10,top:10,width:1000,height:800,title:"metreex analysis"});
    output.whenCommandEntered().then(function (command) {
        processCommand(command);
    });

    loadTreebankFile("m3pmakk93y1nkhxl");
    loadTreebankFile("9g50guweglwy5kqb");
    loadTreebankFile("5krwvewpr25f6jf4");
    loadTreebankFile("ct1ggzdspofmmdch");
    loadTreebankFile("muq9q52l8gm30von");

};

VNConsoleWindow.prototype.init=function()
{
    var d=""+new Date(),
        i=d.indexOf("GMT");
    if(i>-1) d=d.substring(0,i-1);
    this.println(d);
    this.println("---- Console started. Type 'help' for a list of commands. ----");
};

function processCommand(command){
    console.log("Command received in window controller: " + command);

    var args = command.split(" ");
    switch (args[0].toLowerCase()){
        case "help":
            if (args[1]) {
                switch (args[1].toLowerCase()){
                    case "load": output.println("load:<br>Usage: load (&lt;treebank id>|-c)<br>Load will either load a specific treebank, if an Id is given, or all treebanks in a collection, if the -c argument is provided."); break;
                    case "unload": output.println("unload:<br>Usage: unload (&lt;treebank id>|-a)<br>Unload will unload either a specific treebank, if an Id is given, or all loaded treebanks, if the -a argument is provided."); break;
                    case "list": output.println("list:<br>Usage: list (trees|metrics)<br>List shows all of loaded treebanks or metrics and displays them. It takes the one argument of (trees, metrics), which determines which set is shown."); break;
                    case "apply": output.println("apply:<br>Usage: apply<br>Apply will take all of the selected metrics and apply them to all of the selected treebanks. It takes no additional arguments."); break;
                    case "clear": output.println("clear:<br>Usage: clear<br>Clear will clear all text from the console. It takes no additional arguments. This may help in the event that slowdown is experienced."); break;
                    case "export": output.println("export:<br>Usage: export<br>Export will generate and download a tab separated values file based on all currently selected treebanks and metrics. It takes no additional arguments. Warning: pop-up blockers may prevent the download from initiating."); break;
                    case "generate": output.println("generate:<br>Usage: generate (table, bar, scatter, pca)<br>Generate will create the type of plot indicated by the argument in the appropriate tab."); break;
                    default: output.println("The command given does not have a help entry."); break;
                }
            }
            else {
                output.println("Welcome to the metreex analysis tool, type 'help &lt;command>' for more information on a command.");
                output.println("Commands: load, unload, list, apply, clear, export, generate");
            }
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
                    unloadAllTreebanks();
                }
                else{
                    removeLoadedTreeById(args[1]);
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
                        output.println("Invalid list argument provided.");
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
        case "export":
            exportDataAsTSV();
            return true;
        case "generate":
            if (args.length > 1) {
                switch (args[1].toLowerCase()) {
                    case "table":
                        //genMetricOnTopTable();
                        output.println("The table must be generated from the table tab in order for it to be properly rendered.");
                        if (enabledMetrics.length > 10 && enabledMetrics.length > 10){
                            output.println("Warning: the table visualization may perform poorly when large numbers of sentences are paired with many metrics. Consider using the 'export' command. (See 'help export')");
                        }
                        break;
                    case "bar":
                        genBarChart();
                        break;
                    case "scatter":
                        genScatterPlot();
                        break;
                    case "pca":
                        genPCAPlot();
                        break;
                    default:
                        output.println("Invalid generate argument provided.");
                        break;
                }
            }
            else{
                output.println("See 'help generate' for instructions on how to use this command.");
            }
            return true;
        default:
            output.error("Unknown command: " + args[0]);
            return false;
    }
}

/**
 * Handles the opening of tabs in the page's header. Requires being called from an HTML event such as 'onclick',
 * in order to properly hide all tabs of the same class.
 * @param {Event} event Event object passed by browser
 * @param {String} tabName HTML Id of tab to be displayed.
 */
function openTab(event, tabName){
    var i,
        metricTabContent = document.getElementsByClassName(event.currentTarget.className + "Content"),
        headerTabs = document.getElementsByClassName(event.currentTarget.className);

    for (i = 0; i < metricTabContent.length; i++){
        metricTabContent[i].style.display = "none";
    }

    for (i = 0; i < headerTabs.length; i++){
        headerTabs[i].className = headerTabs[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

/**
 * Sets all checkboxes within a tab to a value specified by newSetting.
 * Assumes checkboxes are given an HTML attribute 'name' built as "tabName + 'Checkbox'"
 * @param {String} tabName Name of tab prefix given to checkboxes. First part of "tabName + 'Checkbox'"
 * @param {Boolean} newSetting Boolean
 */
function setAllCheckboxesInTab(tabName, newSetting){
    var cboxes = document.getElementsByName(tabName + "Checkbox");
    Array.prototype.slice.call(cboxes).forEach(function (cbox) {
        cbox.checked = newSetting;
    });
}

/**
 * Inverts the checked value of all checkboxes within a tab.
 * Assumes checkboxes are given an HTML attribute 'name' built as "tabName + 'Checkbox'"
 * @param {String} tabName Name of tab prefix given to checkboxes. First part of "tabName + 'Checkbox'"
 */
function invertAllCheckboxesInTab(tabName){
    var cboxes = document.getElementsByName(tabName + "Checkbox");
    Array.prototype.slice.call(cboxes).forEach(function (cbox) {
        cbox.checked = !cbox.checked;
    });
}

/**
 * Handles the post-load functions of Treebank objects. This includes adding the Treebank to the array of loaded treebanks,
 * and adding the relevant controls to the sidebar. It also asks for the VNCloud author and title information to be retrieved.
 * @param {Object} newTree Treebank to be added to the array of loaded treebanks
 * @returns {Boolean} Returns true if a tree was successfully added or false otherwise.
 */
function addLoadedTree(newTree){
    if (newTree.numSentences < 1){
        handleGlobalErrorMessage("Treebank with no sentences was not loaded. Id: " + newTree.id);
    }
    else if (newTree.getTitle() === undefined){
        handleGlobalErrorMessage("Treebank with no title was not loaded. Id: " + newTree.id);
    }

    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === newTree.id){
            output.println("Treebank " + newTree.id + " has been loaded previously");
            return false;
        }
    }

    getCloudAuthorAndTitle(newTree);
    loadedTreebanks.push(newTree);

    if (USING_SIDEBAR){
        addTreeToSidebar(newTree);
    }

    return true;
}

/**
 * Checks the loaded treebanks for a treebank with the given Id, and unloads it if found.
 * @param {String} id Id of tree which should be removed from the loaded array
 * @returns {Boolean} Returns true if a tree was successfully removed or false otherwise.
 */
function removeLoadedTreeById(id){
    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === id){
            loadedTreebanks.splice(index, 1);
            output.println("Treebank " + id + " has been unloaded");

            if (USING_SIDEBAR){
                removeTreeFromSidebar(id);
            }

            return true; //Should not have to worry about duplicates.
        }
    }
    output.println("Treebank " + id + " was not previously loaded");
    return false;
}

/**
 * Retrieves a treebank from the array of loaded treebanks, by its Id. Returns null if the treebank was not found.
 * @param {string} id Id of tree to search for in the loaded array
 * @returns {Object} Returns the treebank with the Id given if found, or null otherwise.
 */
function getTreeById(id){
    for (var index = 0; index < loadedTreebanks.length; index++){
        if (loadedTreebanks[index].id === id){
            return loadedTreebanks[index];
        }
    }
    output.println("Treebank " + id + " was not previously loaded");
}

function unloadAllTreebanks(){
    loadedTreebanks = [];
    output.println("All treebanks have been unloaded.");

    if(USING_SIDEBAR){
        removeAllTreesFromSidebar();
    }
}
function loadTreebankFromSidebar(){
    var input = document.getElementById("treebankIdInput");
    loadTreebankFile(input.value);
    input.value = "";
}

function unloadTreebankFromSidebar(id){
    removeLoadedTreeById(id);
}

/**
 * Loads a treebank via the metreex API, then adds it to the set of loaded trees.
 * @param {String} id Id of tree which should be loaded
 */
function loadTreebankFile(id){
    id = id.trim();
    output.println("Attempting to load tree with id " + id);
    var newTree = new TreebankFile();
    newTree.onload = function () {
        addLoadedTree(newTree);
    };
    newTree.load(id);
}

/**
 * Loads a treebank collection via the metreex API, then adds each tree to the set of loaded trees
 */
function loadTreebankCollection(){
    output.println("Attempting to load treebank collection");
    var t=new TreebankCollection();
    t.onload=function(){
        t.treebank.forEach(function(tree){
            addLoadedTree(tree);
        });
    };
    t.load();
}

/**
 * Takes all selected treebanks and applies all of the selected metrics to them, recording the used metrics, treebanks, and results.
 */
function applyMetrics(){
    if (loadedTreebanks.length == 0){
        output.println("No treebanks have been loaded, please load treebank(s) before applying metrics.");
        return;
    }

    if (USING_SIDEBAR) {
        selectedTreebanks = getCheckedTreebanks();
    }

    if (selectedTreebanks.length == 0){
        output.println("No treebanks were selected, please select at least one treebank");
        return;
    }

    var metricPartitions = getMetricPartitions();
    enabledMetrics = metricPartitions.checkedList;
    disabledMetrics = metricPartitions.uncheckedList;

    if (enabledMetrics.length == 0){
        output.println("No metrics were selected, please select at least one metric");
        return;
    }

    if (checkArrayEquals(selectedTreebanks, lastTreebanksUsed) && checkArrayEquals(enabledMetrics, lastMetricsUsed)){
        output.println("Selection of treebanks and metrics has not changed since the last metric application.");
        return;
    }

    lastMetricResults = [];

    selectedTreebanks.forEach(function(tree){
        output.println(tree.getTitle() + " - " + tree.id);
        lastMetricResults.push(tree.apply(enabledMetrics,{progress:output.getProgress()}));
    });

    lastMetricsUsed = enabledMetrics;
    lastTreebanksUsed = selectedTreebanks;
}

/**
 * Checks if arrays one and two are equal, having all of the same elements.
 * @param one
 * @param two
 * @returns {boolean} Returns true if the arrays are equal, and false if they are not equal. Also returns false if either array does not exist.
 */
function checkArrayEquals(one, two){
    //Should catch most quick error cases
    if (!one || !two) return false;
    if (one.length != two.length) return false;
    if (!one instanceof Array || !two instanceof Array) return false;

    return (!one.some(function (elem, index) {  //Some checks if elements pass text given by the function
        return elem != two[index];              //Which simply checks if the elem is equal to the element in the corresponding array
    }));
}

/**
 * Returns an array of all treebanks that are selected in the sidebar to have metrics applied to them
 * @returns {Array} All selected treebanks
 */
function getCheckedTreebanks(){
    var trees = [],
        form = document.getElementById("treebankList");

    //Workaround for .forEach not being a member function of what .getElementsByTagName returns
    //Converts to array so that .forEach can be used.
    Array.prototype.slice.call(form.getElementsByTagName("label")).forEach(function (child) {
        Array.prototype.slice.call(child.getElementsByTagName("input")).forEach(function (checkbox) {
            if (checkbox.checked){
                trees.push(getTreeById(checkbox.value));
            }
        });
    });

    return trees;
}

/**
 * Divides metrics into two arrays, one for selected and another for unselected metrics.
 * @returns {{checkedList: Array, uncheckedList: Array}}
 */
function getMetricPartitions(){
    var checkedList = [],
        uncheckedList = [],
        form = document.getElementById("metricList");

    Array.prototype.slice.call(form.getElementsByTagName("label")).forEach(function (child){
        Array.prototype.slice.call(child.getElementsByTagName("input")).forEach(function (checkbox) {
            if (checkbox.checked){
                checkedList.push(loadedMetrics[parseInt(checkbox.value)]);
            }
            else{
                uncheckedList.push(loadedMetrics[parseInt(checkbox.value)]);
            }
        });
    });

    return {checkedList: checkedList, uncheckedList: uncheckedList};
}

/**
 * Builds the sidebar for the list of metrics with their selection boxes.
 * @param array Array of selected metrics
 * @returns {Element} DOM form containing the sidebar of metrics
 */
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

/**
 * Adds the treebank given by newTree to the sidebar
 * @param newTree
 */
function addTreeToSidebar(newTree){
    var treeList = document.getElementById("treebankList"),
        checkbox = document.createElement("input");
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

/**
 * Removes the treebank identified by id from the sidebar
 * @param id
 */
function removeTreeFromSidebar(id){
    var treeToRemove = document.getElementById(id);
    treeToRemove.parentNode.removeChild(treeToRemove);
}

/**
 * Builds the empty base for the treebank list in the sidebar to be built on
 * @returns {Element}
 */
function buildDefaultTreebankList(){
    var list = document.createElement("form");
    list.id = "treebankList";
    list.action = "treebank_form.asp";
    list.method = "get";

    return list;
}

/**
 * Empties the treebank tab of the sidebar, removing all treebanks.
 */
function removeAllTreesFromSidebar(){
    var list = document.getElementById("treebankList");
    while (list.firstChild){
        list.removeChild(list.firstChild);
    }
}

function getActiveMetricTab() {
    var elems = document.getElementsByClassName("metricTab active");
    return elems[0]? elems[0].name : ""; //Should always be exactly one "active" metric tab.
}

function debugMetricResults(){
    var index,
        sentenceIndex,
        metrIndex;

    for (index = 0; index < selectedTreebanks.length; index++){
        console.log("treebank: " + selectedTreebanks[index].getTitle());
        for (sentenceIndex = 0; sentenceIndex < lastMetricResults[index].length; sentenceIndex++){
            console.log("sentence: " + sentenceIndex);
            for (metrIndex = 0; metrIndex < lastMetricResults[index][sentenceIndex].length; metrIndex++){
                console.log("metric no. " + metrIndex + ": " + enabledMetrics[metrIndex] + " : " + lastMetricResults[index][sentenceIndex][metrIndex]);
            }
        }
    }
    return true;
}

function buildBasicTableInverted(tableData, targetDivId){
    //Clears out existing table if one exists
    var tableDiv = d3.select(targetDivId);
    tableDiv.html(" ");
    tableDiv.append("input")
        .attr("type","button")
        .attr("value", function(){return "Generate New Table";})
        .on("click",function(){genMetricOnTopTable(targetDivId);});
    tableDiv.append("br");

    var table = d3.select(targetDivId).append("table")
        .attr("id", "basicTableBase"),
        thead = table.append("thead")
        .attr("id", "basicTableThead");
    thead.append("tr")
        .attr("id", "basicTableHeader");

    buildInvertedTableHeader("basicTableHeader");

    var tableDOM = table.node(),//document.getElementById("basicTableBase");
        theadDOM = thead.node(),//document.getElementById("basicTableThead");
        tbody = table.append("tbody")
        .attr("id", "basicTableBody")
        .style("height", tableDOM.getBoundingClientRect().height - theadDOM.getBoundingClientRect().height + "px"),
        tbodyDOM = tbody.node();

    buildInvertedTableBody(tableData, tbody);

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

function buildInvertedTableHeader(headId) {
    var thead = document.getElementById(headId),
        tlhead = thead.appendChild(document.createElement("th"));

    tlhead.appendChild(document.createTextNode("Metrics"));

    lastMetricsUsed.forEach(function(elem){
        tlhead = thead.appendChild(document.createElement("th"));
        tlhead.appendChild(document.createTextNode(elem.name));
    });
}

function buildInvertedTableBody(tableData, tbody){
    /*  Note that rows are built in the reverse order - data, sentence number, then title.
     This is done so that d3 can use select all "td" elements, and not interfere with the row headers
     Building backwards in terms of sentence number then title allows us to ubiquitously use :first-child in a 'prepend' sense
     */
    tableData.forEach(function (elem, index) {
        var trow = tbody.append("tr")
            .attr("id", "basicTableDataRow" + index);

        trow.selectAll("td")
            .data(elem.metricValues)
            .enter()
            .append("td")
            .text(function (data) {
                return data.toFixed(2);
            });

        trow.insert("td",":first-child")
            .html(elem.sentence)
            .attr("class","rowSubHeader");

        if (elem.sentence % 10 == 1) {
            var rowhead = trow.insert("td",":first-child")
                .attr("rowspan", Math.min(elem.numSentences - elem.sentence + 1, 10))
                .attr("class", "rowHeader")
                .html(elem.title.replace(/_/g, " "));

            if (elem.numSentences > 10){
                if (elem.numSentences - elem.sentence > 10) {
                    rowhead.style("border-bottom","0");
                }

                if (elem.sentence > 10){
                    rowhead.style("border-top","0");
                }
            }
        }
    });
}

function buildBasicTable(tableData, targetDivId){
    //Clear out existing table if there is one already
    var tableDiv = d3.select(targetDivId);
    tableDiv.html(" ");
    tableDiv.append("input")
        .attr("type","button")
        .attr("value", function(){return "Generate New Table";})
        .on("click",function(){genMetricOnLeftTable(targetDivId);});
    tableDiv.append("br");

    var table = d3.select(targetDivId).append("table")
        .attr("id", "basicTableBase"),
        thead = table.append("thead")
        .attr("id", "basicTableThead");
    thead.append("tr")
        .attr("id", "basicTableHeader");

    buildTableHeader(tableData, "basicTableHeader");

    thead.append("tr")
        .attr("id", "basicTableSubHeader");
    buildTableSubHeader(tableData, "basicTableSubHeader");

    var tableDOM = document.getElementById("basicTableBase"),
        theadDOM = document.getElementById("basicTableThead"),
        tbody = table.append("tbody")
        .attr("id", "basicTableBody")
        .style("height", tableDOM.getBoundingClientRect().height - theadDOM.getBoundingClientRect().height + "px"),
        tbodyDOM = tbody.node(),
        rowId;

    for (var metricIndex = 0; metricIndex < lastMetricsUsed.length; metricIndex++){
        rowId = "basicTableDataRow" + metricIndex;
        tbody.append("tr")
            .attr("id",rowId);
        buildTableDataRow(tableData,rowId, metricIndex);
    }

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
    var tr = document.getElementById(rowId),
        rowHeader = tr.appendChild(document.createElement("td"));
    rowHeader.appendChild(document.createTextNode(lastMetricsUsed[rowNum].name));

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
    var thead = document.getElementById(headId),
        tlhead = thead.appendChild(document.createElement("th"));
    tlhead.appendChild(document.createTextNode("Metrics"));

    for (var index = 0; index < tableData.length; ){
        var header = thead.appendChild(document.createElement("th"));
        header.colSpan = tableData[index].numSentences;
        header.appendChild(document.createTextNode(tableData[index].title.replace(/_/g," ")));

        index += tableData[index].numSentences;
    }
}

/**
 * Converts the most recent metric results into the array of objects used for processing throughout the application
 * @returns {Array}
 */
function assembleMetricData(){
    var data = [],
        runningIndex = 0,
        index,
        sentenceIndex;

    for (index = 0; index < selectedTreebanks.length; index++){
        for (sentenceIndex = 0; sentenceIndex < lastMetricResults[index].length; sentenceIndex++){
            data.push({
                title: selectedTreebanks[index].title,
                section: selectedTreebanks[index].section,
                sentence: (+sentenceIndex + 1),
                numSentences: lastMetricResults[index].length,
                //metrics: enabledMetrics, // Functionally equivalent to "lastMetricsUsed" global, and *highly* redundant (one copy per sentence)
                metricValues: lastMetricResults[index][sentenceIndex],
                originalIndex: runningIndex++,
                refString: selectedTreebanks[index].title + " " + selectedTreebanks[index].section + " " + (+sentenceIndex + 1),
                author: selectedTreebanks[index].author//identifyAuthor(selectedTreebanks[index].getTitle())
            });
        }
    }

    return data;
}

/**
 * Builds the SVG bar chart visualization for a given metric
 * @param tableData Set of data to be processed
 * @param metricIndex Index of the metric to be visualized
 */
function buildBarChart(tableData, metricIndex, targetDivId) {
    var barDiv = d3.select(targetDivId),
        margin = {top: 15, right: 15, bottom: 30, left: 200},
        barThickness = 16, //px
        width = 1200, height = tableData.length * barThickness + margin.top + margin.bottom;

    barDiv.html(" ");
    barDiv.append("input")
        .attr("type","button")
        .attr("value", function(){return "Generate New Bar Chart";})
        .on("click",function(){genBarChart(targetDivId);});
    barDiv.append("br");

    var xaxis = d3.scaleLinear()
        .domain([ Math.min(d3.min(tableData, function(elem){return elem.metricValues[metricIndex];}), 0),
            d3.max(tableData, function (elem) {return elem.metricValues[metricIndex];}) ])
        .range([0,width]),
        yaxis = d3.scaleBand()
        .range([height - (margin.bottom + margin.top), 0])
        .domain(tableData.map(function(elem){
            return elem.refString;
        })),
        coloraxis = d3.scaleOrdinal(d3.schemeSet2)
        .domain(tableData.map(function (elem) {
            return elem.author;
        })),
        metricSelector = barDiv.append("select")
        .attr("id", "barChartMetricSelector")
        .on("change", selectedMetricChange);

    metricSelector.selectAll("option")
        .data(lastMetricsUsed)
        .enter()
        .append("option")
        .attr("value",function(elem){return elem.name;})
        .property("selected", function(elem,index) {return index == metricIndex;})
        .html(function(elem) {return elem.name;});

    barDiv.append("input")
        .attr("type","checkbox")
        .attr("id", "barChartCbox")
        .on("change",toggleSort);
    barDiv.append("label")
        .attr("for", "barChartCbox")
        .html("Sort");

    var chart = barDiv.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top),

        parent = chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

        barparent = parent.append("g"),

        bars = barparent.selectAll("g")
        .data(tableData, function (elem) { return elem.metricValues[metricIndex]; })
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(elem){return "translate(0," + yaxis(elem.refString) + ")";});

    bars.append("rect")
        .attr("x", function(elem) {return xaxis(Math.min(0,elem.metricValues[metricIndex]))})
        .attr("height", yaxis.bandwidth())
        .attr("width", function(elem){return Math.abs(xaxis(elem.metricValues[metricIndex]) - xaxis(0))})
        .style("fill", function(elem){return coloraxis(elem.author);});

    bars.append("text")
        .attr("x", function(elem){return xaxis(elem.metricValues[metricIndex]) - 4;})
        .attr("y", yaxis.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(function(elem){
            if (d3.format(".2f")(elem.metricValues[metricIndex]) == "0.00"){
                return ""
            }
            else {
                if (Number.isInteger(elem.metricValues[metricIndex])){
                    return elem.metricValues[metricIndex];
                }
                else{
                    return d3.format(".2f")(elem.metricValues[metricIndex]);
                }
            }
        });

    parent.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + (height - (margin.bottom + margin.top)) + ")")
        .call(d3.axisBottom(xaxis));

    var yx = parent.append("g")
        .attr("class", "axis y-axis")
        .attr("transform","translate(" + xaxis(0) + ",0)")
        .call(d3.axisLeft(yaxis));

    parent.insert("g", ":first-child")
        .attr("class", "tick grid")
        .call(d3.axisBottom().scale(xaxis)
            .tickSize(height - (margin.bottom + margin.top))
            .tickFormat(""));

    var negTicks = yx.selectAll(".tick")
        .filter(function(elem,index) { return (tableData[index].metricValues[metricIndex] < 0);});

    negTicks.select("line")
        .attr("x2", 6);
    negTicks.select("text")
        .attr("x", 9)
        .style("text-anchor","start");

    parent.append("text")
        .attr("text-anchor","middle")
        .attr("transform","translate(" + (width/2) + "," + (height) + ")")
        .style("font-size","14px")
        .text(lastMetricsUsed[metricIndex].name);

    function selectedMetricChange(){
        var activeIndex = metricSelector.property('selectedIndex');
        buildBarChart(tableData, activeIndex, targetDivId);
    }

    function toggleSort(){
        var y0 = yaxis.range([height - (margin.bottom + margin.top), 0])
            .domain(tableData.sort(this.checked ? function(a, b) { return b.metricValues[metricIndex] - a.metricValues[metricIndex]; } : function(a, b) { return d3.ascending(a.originalIndex,b.originalIndex); })
                .map(function(elem) { return elem.refString; }))
            .copy();

        parent.selectAll(".bar")
            .sort(function(a, b) { return y0(a.refString) - y0(b.refString); });

        var transition = parent.transition().duration(750),
            delay = function(elem, index) { return index/tableData.length * 20; };


        transition.select(".axis.y-axis")
            .call(yaxis)
            .selectAll("g")
            .delay(delay)
            .attr("transform", function(elem) {return "translate(0," + (y0(elem) + yaxis.bandwidth()/2) + ")"; });


        transition.selectAll(".bar")
            .delay(delay)
            .attr("transform",function(elem){ return "translate(0," + y0(elem.refString) + ")";});

    }
}

/**
 * Builds the SVG scatterplot visualization for two given metrics
 * @param tableData Set of data to be processed
 * @param yMetricIndex Index of the metric for the y axis
 * @param xMetricIndex Index of the metric for the x axis
 */
function buildScatterPlot(tableData, yMetricIndex, xMetricIndex, targetDivId) {
    var scatterDiv = d3.select(targetDivId),
        xDiv,
        yDiv,
        xMetricSelector,
        yMetricSelector;

    scatterDiv.html(" ");
    scatterDiv.append("input")
        .attr("type","button")
        .attr("value", function(){return "Generate New Scatterplot"})
        .on("click",function(){genScatterPlot(targetDivId);});
    scatterDiv.append("br");

    yDiv = scatterDiv.append("div")
        .text("Y Axis: ")
            .style("display","inline");
    yMetricSelector = yDiv.append("select")
        .attr("id", "scatterySelect")
        .on("change", selectedMetricChange);

    scatterDiv.append("br");

    xDiv = scatterDiv.append("div")
        .text("X Axis: ");
    xMetricSelector = xDiv.append("select")
        .attr("id", "scatterxSelect")
        .on("change", selectedMetricChange);

    scatterDiv.append("br");

    yMetricSelector.selectAll("option")
        .data(lastMetricsUsed)
        .enter()
        .append("option")
        .attr("value",function(elem){return elem.name;})
        .property("selected", function(elem,index) {return index == yMetricIndex;})
        .html(function(elem) {return elem.name;})
        .append("br");

    xMetricSelector.selectAll("option")
        .data(lastMetricsUsed)
        .enter()
        .append("option")
        .attr("value",function(elem){return elem.name;})
        .property("selected", function(elem,index) {return index == xMetricIndex;})
        .html(function(elem) {return elem.name;});

    var margin = {top: 15, right: 15, bottom:45, left: 60},
        bubbleThickness = 4, //px
        width = 800, height = 800,

        xaxis = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(tableData, function(elem){return elem.metricValues[xMetricIndex];})),

        yaxis = d3.scaleLinear()
        .range([height, 0])
        .domain(d3.extent(tableData, function(elem){return elem.metricValues[yMetricIndex];})),
    //potential 'z axis' in terms of size of bubbles
        coloraxis = d3.scaleOrdinal(d3.schemeSet2)
        .domain(tableData.map(function (elem) {
            return elem.author;
        })),

        chart = scatterDiv.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top),

        parent = chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    /*end vars*/

    parent.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xaxis));

    parent.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(yaxis));

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("display", "none")
        .style("z-index", 12);

    parent.selectAll(".scatterPoint")
        .data(tableData)
        .enter().append("circle")
        .attr("class", function(elem){return "scatterPoint " + elem.author;})
        .attr("r",  bubbleThickness)
        .style("fill", function(elem){return coloraxis(elem.author);})
        .attr("cx", function(elem){return xaxis(elem.metricValues[xMetricIndex]);})
        .attr("cy", function(elem){return yaxis(elem.metricValues[yMetricIndex]);})
        .on("mouseover", function(elem){
            tooltip.html("Author: " + elem.author + "<br>Title: " + elem.title + "<br> Section: " + elem.section +
                        "<br>Sentence no.: " + elem.sentence +
                        "<br>" + lastMetricsUsed[xMetricIndex].name + ": " + d3.format(".4f")(elem.metricValues[xMetricIndex]) +
                        "<br>" + lastMetricsUsed[yMetricIndex].name + ": " + d3.format(".4f")(elem.metricValues[yMetricIndex]))
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY + 10) + "px")
                .style("display","inline");
        })
        .on("mouseout", function(){
            tooltip.style("display","none");
        });

    parent.append("text")
        .attr("text-anchor","middle")
        .attr("transform","translate(" + (width/2) + "," + (height + margin.bottom*.75) + ")")
        .attr("class","axisText")
        .text(lastMetricsUsed[xMetricIndex].name);

    parent.append("text")
        .attr("text-anchor","middle")
        .attr("transform","translate(" + (-margin.left*.75) + "," + (height/2) + ")rotate(-90)")
        .attr("class","axisText")
        .text(lastMetricsUsed[yMetricIndex].name);

    var authors = Array.from(new Set(tableData.map(function(elem){return elem.author;})));

    createAuthorToColorLegend(targetDivId, authors, coloraxis);
    createAuthorPlotPointToggles(targetDivId, authors, ".scatterPoint");

    function selectedMetricChange(){
        buildScatterPlot(tableData, yMetricSelector.property('selectedIndex'), xMetricSelector.property('selectedIndex'), targetDivId);
    }
}

/**
 * Builds the SVG Principal Component Analysis for all loaded metrics
 * @param data Set of data to be processed
 * @param {Boolean} drawEllipsePerTitle True if an ellipse should be drawn for each individual title, false if ellipses should only be drawn for each author.
 * @param targetDivId String with the target id for d3 to append this chart to
 */
function buildPCAPlot(data, drawEllipsePerTitle, targetDivId){
    if (lastMetricsUsed.length < 2) {
        handleGlobalErrorMessage("At least two metrics need to be enabled for Principal Component Analysis.");
        return;
    }
    if (data.length < 4){
        handleGlobalErrorMessage("Not enough data is present for PCA, need at least 3 sentences.");
        return;
    }

    if (drawEllipsePerTitle === undefined) drawEllipsePerTitle = true;

    var pcaPlot = d3.select(targetDivId);
    pcaPlot.html(" ");
    pcaPlot.append("input")
        .attr("type","button")
        .attr("value", function(){return "Generate New PCA Plot";})
        .on("click",function(){genPCAPlot(targetDivId);});
    pcaPlot.append("br");

    pcaPlot.append("input")
        .attr("type","checkbox")
        .attr("id", "pcaPlotCbox")
        .property("checked", drawEllipsePerTitle)
        .on("change",rebuildPCAPlot);
    pcaPlot.append("label")
        .attr("for", "pcaPlotCbox")
        .html("Draw Ellipse for each Title");
    pcaPlot.append("br");


    var metricValues = data.map(function (elem) { return elem.metricValues; }),
        projectionData = principalComponentAnalysis(metricValues),
        margin = {top: 15, right: 15, bottom: 30, left: 30},
        bubbleThickness = 4, //px
        width = 800, height = 800,

        xaxis = d3.scaleLinear()
            .range([0, width])
            .domain(d3.extent(projectionData, function(elem){return elem[0];})),

        yaxis = d3.scaleLinear()
            .range([height, 0])
            .domain(d3.extent(projectionData, function(elem){return elem[1];})),

        coloraxis = d3.scaleOrdinal(d3.schemeSet2)
            .domain(data.map(function (elem) {
                return elem.author;
            })),

        chart = pcaPlot.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top),

        parent = chart.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    parent.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xaxis));

    parent.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(yaxis));

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("display", "none")
        .style("z-index", 12);

    parent.selectAll(".scatterPoint")
        .data(projectionData)
        .enter().append("circle")
        .attr("class", function(elem, index){return "PCA-point " + data[index].title.toString().toLowerCase().replace(/ /g,"") + " " + data[index].author + " active";})
        .attr("r",  bubbleThickness)
        .style("fill", function(elem, index){return coloraxis(data[index].author);})
        .attr("cx", function(elem){return xaxis(elem[0]);})
        .attr("cy", function(elem){return yaxis(elem[1]);})
        .on("mouseover", function(elem,index){
            tooltip.html("Author: " + data[index].author + "<br>Title: " + data[index].title + "<br> Section: " + data[index].section + "<br>Sentence no.: " + data[index].sentence)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY + 10) + "px")
                .style("display","inline");
            var siblings = d3.selectAll("."+data[index].title.toString().toLowerCase().replace(/ /g,""))
                .style("fill", "#666");
            siblings.each(function () {
                this.parentNode.appendChild(this);
            })
        })
        .on("mouseout", function(elem,index){
            tooltip.style("display","none");
            var siblings = d3.selectAll("."+data[index].title.toString().toLowerCase().replace(/ /g,""))
                .style("fill", coloraxis(data[index].author)),
                firstEllipse = d3.select(".PCA-ellipse").node();
            siblings.each(function () {
                this.parentNode.insertBefore(this, firstEllipse);
            })
        });

    var authors = Array.from(new Set(data.map(function(elem){return elem.author;})));

    if (drawEllipsePerTitle){
        var titlesToAuthors = Array.from(new Set(data.map(function(elem){return {title:((elem.title).toString().toLowerCase()), author:elem.author};}))),
            titles = Array.from(new Set(titlesToAuthors.map(function(elem){return elem.title;}))),
            titledata = binProjectionDataByTitle(data, titles, projectionData);

        titledata.forEach(function (elem, index) {
            addErrorEllipse(elem, parent, xaxis, yaxis, coloraxis(titlesToAuthors[index].author));
        });
    }
    else{ //Draw ellipse for each author
        var authdata = binProjectionDataByAuthor(data, authors, projectionData);

        authdata.forEach(function (elem, index) {
            addErrorEllipse(elem, parent, xaxis, yaxis, coloraxis(authors[index]));
        });
    }

   // createAuthorToColorLegend(targetDivId, authors, coloraxis);
   // createAuthorPlotPointToggles(targetDivId, authors, ".PCA-point");

    createAuthorToColorLegendWithVisibilityToggles(targetDivId, authors, coloraxis, ".PCA-point");

    function rebuildPCAPlot(){
        buildPCAPlot(data, d3.select("#pcaPlotCbox").node().checked, targetDivId);
    }
}

/**
 *
 * @param data Should be passed as an m x n array (of arrays), with columns being variables and rows being the related observations.
 *              First index should be observations (sentences). Second index should be variables (metrics).
 */
function computeCovariance(data){
    var dataMatrix = math.matrix(data),
        observations = data.length,
        a = math.multiply(math.ones(observations, observations), 1/observations),
        b = math.multiply(a, dataMatrix),
        deviationMatrix = math.subtract(dataMatrix, b);
    return math.multiply(1/observations,math.transpose(deviationMatrix),deviationMatrix)._data; //covariance matrix
}

/**
 * Computes eigenvalues and eigenvectors
 * @param covarianceArray
 * @returns {{eigVals, eigVecs}}
 */
//takes 2d array, not math.matrix. Can use math.matrix()._data to retrieve 2d array
function computeEigendecomposition(covarianceArray){
    var eigResult = numeric.eig(covarianceArray);
    return {
        eigVals: eigResult.lambda.x,
        eigVecs: eigResult.E.x
    };
}

/**
 * * Component of Principal Component Analysis *
 * Sorts eigenvalues and record original vector index so that the top two can be used for projection
 * @param eigenVals
 * @returns {Array}
 */
function sortEigenvals(eigenVals) {
    var eigPairs = [];
    eigenVals.forEach(function(elem, index){
        eigPairs.push({
            val: elem,
            vecIndex: index
        });
    });

    eigPairs.sort(function(a,b){
        return b.val - a.val;
    });

    return eigPairs;
}

/**
 * * Component of Principal Component Analysis *
 * Computes the projection matrix Y of the primary and secondary eigen-indices onto the new plane.
 * Mathematically, Z = X x Y, where X is the matrix of all metric data, Y is the projection matrix built from the Eigenvectors
 * @param eigenIndexInfo Array with information about what indices the two most influential eigenvectors are located at
 * @param eigenVecs All eigenvectors, to extract the needed ones from
 * @param data All metric values, declares as X previously
 * @returns {Array} Projection matrix Z, as described above
 */
function computeEigenProjection(eigenIndexInfo, eigenVecs, data){
    var primaryEigenIndex = eigenIndexInfo[0].vecIndex,
        secondaryEigenIndex = eigenIndexInfo[1].vecIndex,
        projectionMatrix = [];

    eigenVecs.forEach(function (elem) {
        projectionMatrix.push([elem[primaryEigenIndex], elem[secondaryEigenIndex]]);
    });

    return math.multiply(math.matrix(data),math.matrix(projectionMatrix));
}

/**
 * Driver function for principal component analysis
 * @param {Array} metricValues Full 2-dimensional array of metric values from applying metrics to loaded treebanks
 * @returns {Array} Data generated by PCA, to be plotted.
 */
function principalComponentAnalysis(metricValues){
    var covMatrix = computeCovariance(metricValues),
        eigenPairs = computeEigendecomposition(covMatrix),
        eigenIndexInfo = sortEigenvals(eigenPairs.eigVals),
        projectionMatrix = computeEigenProjection(eigenIndexInfo, eigenPairs.eigVecs, metricValues);

    return projectionMatrix._data;
}

/**
 * Creates a 2-dimensional array, with each row containing the projection data associated with a particular author
 * @param {Array} data Full set of metric data
 * @param {Array} authors Set of authors
 * @param {Array} projectionData Array containing the full set of projection data generated by PCA
 * @returns {Array} PCA projection data sorted into bins by author
 */
function binProjectionDataByAuthor(data, authors, projectionData){
    var authdata = build2DArray(authors.length);

    for (var index = 0; index < data.length; index++){
        for (var authIndex = 0; authIndex < authors.length; authIndex++){
            if (data[index].author == authors[authIndex]) break;
        }
        authdata[authIndex].push(projectionData[index]);
    }

    return authdata;
}

/**
 * Creates a 2-dimensional array, with each row containing the projection data associated with a particular title
 * @param {Array} data Full set of metric data
 * @param {Array} titles Set of titles
 * @param {Array} projectionData Array containing the full set of projection data generated by PCA
 * @returns {Array} titledata PCA projection data sorted into bins by title
 */
function binProjectionDataByTitle(data, titles, projectionData){
    var titledata = build2DArray(titles.length),
        index,
        titleIndex,
        titleToCompare;

    for (index = 0; index < data.length; index++){
        titleToCompare = (data[index].title).toString().toLowerCase();
        for (titleIndex = 0; titleIndex < titles.length; titleIndex++){
            if (titleToCompare === (titles[titleIndex]).toLowerCase()) break;
        }
        titledata[titleIndex].push(projectionData[index]);
    }

    return titledata;
}

/**
 * Creates a set of buttons, in the target div, each associated with a specific author. Each button toggles the visibility of all elements associated with that author and the class name given.
 * @param {String} target Name of HTML div that the buttons should be appended to
 * @param {Array} authors Array of authors to create toggles for
 * @param {String} pointClassName Class name associated with the elements targeted by the created toggles
 */
function createAuthorPlotPointToggles(target, authors, pointClassName){
    d3.select(target).selectAll("#input")
        .data(authors)
        .enter()
        .append("input")
        .attr("type", "button")
        .attr("value", function(elem){return "Toggle " + elem + " point visibility"})
        .on("click",function(elem){
            var selection = d3.selectAll(pointClassName + "." + (elem.replace(/ /g,".")));

            if (selection.style("display") != "none")  selection.style("display","none");
            else selection.style("display","block");
        });
}

/**
 * Creates a legend based on the given authors and color axis and appends it to the given div
 * @param {String} legendTarget HTML div that the legend should be appended to
 * @param {Array} authors Array of authors to be added to the legend
 * @param {Object} coloraxis d3 ScaleOrdinal object associating the authors to their colors
 */
function createAuthorToColorLegend(legendTarget, authors, coloraxis){
    var legend = d3.select(legendTarget).append("svg")
        .attr("width", 140)
        .attr("height", authors.length*22);
    legend.selectAll("rect")
        .data(authors)
        .enter()
        .append("rect")
        .attr("x", 10)
        .attr("y", function(elem, index){return index * 22 + 5;})
        .attr("width", 15)
        .attr("height", 10)
        .style("fill", function(elem){return coloraxis(elem);})
        .on("mouseover", function (elem) {
            d3.selectAll("." + elem.toString().replace(/ /g,"."))
                .style("fill", "#666")
                .each(function () {
                    this.parentNode.appendChild(this);
                })
        })
        .on("mouseout", function (elem) {
            d3.selectAll("." + elem.toString().replace(/ /g,"."))
                .style("fill", coloraxis(elem))
                .each(function () {
                    this.parentNode.insertBefore(this, this.parentNode.firstChild);
                })
        });
    legend.selectAll("text")
        .data(authors)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", function(elem, index){return index * 22 + 15;})
        .attr("class", "legend")
        .text(function(elem){return elem;});
}

function createAuthorToColorLegendWithVisibilityToggles(legendTarget, authors, coloraxis, pointClassName){
    var rows = d3.select(legendTarget).append("table")
        .selectAll("tr")
        .data(authors)
        .enter()
        .append("tr");
    rows.append("td")
        .append("svg")
        .attr("width", 15)
        .attr("height", 10)
        .append("rect")
        .attr("width",15)
        .attr("height", 10)
        .style("fill", function(elem){return coloraxis(elem);})
        .on("mouseover", function (elem) {
            d3.selectAll("." + elem.toString().replace(/ /g,"."))
                .style("fill", "#666")
                .each(function () {
                    this.parentNode.appendChild(this);
                })
        })
        .on("mouseout", function (elem) {
            d3.selectAll("." + elem.toString().replace(/ /g,"."))
                .style("fill", coloraxis(elem))
                .each(function () {
                    this.parentNode.insertBefore(this, this.parentNode.firstChild);
                })
        })
        .on("click",function(elem){
            var selection = d3.selectAll(pointClassName + "." + (elem.replace(/ /g,".")));

            if (selection.style("display") != "none") {
                selection.style("display", "none");
                this.style.fill = "#222";
            }
            else {
                selection.style("display","block");
                this.style.fill = coloraxis(elem);
            }


        });
    rows.append("td")
        .html(function (elem) {
            return elem;
        });
}

/**
 * Adds a Guassian Error Ellipse representing 90% confidence intervals for both axes of a bivariate scatterplot.
 * @param {Array} projectionData 2-D array with 2 columns representing the X and Y axes and N rows representing the data along each axis
 * @param {Object} parent A d3 selection containing only the SVG element which the ellipse should be added to
 * @param {Object} xaxis d3 ScaleLinear element representing the x axis
 * @param {Object} yaxis d3 ScaleLinear element representing the y axis
 * @param strokeColor Color [returned by a d3 scaleOrdinal] to apply to the ellipse's stroke
 */
function addErrorEllipse(projectionData, parent, xaxis, yaxis, strokeColor){
    var projXdata = [], projYdata = [];

    if (projectionData.length == 1){
        projectionData.push(projectionData[0]); //Could return here instead to save on calculations.
    }

    projectionData.forEach(function (elem) {
        projXdata.push(elem[0]);
        projYdata.push(elem[1]);
    });

    var projXstdev = d3.deviation(projectionData, function(elem){return elem[0]}),
        projYstdev = d3.deviation(projectionData, function(elem){return elem[1]}),
        projectionCovMat = computeCovariance(projectionData),
        projectionEigenVal = computeEigendecomposition(projectionCovMat),
        ellipseScale = Math.sqrt(2.705543454096032), //http://onlinelibrary.wiley.com/doi/10.1002/0471998303.app4/pdf 1 degree of freedom, p=0.9
        maxEigen = getIndexOfMax(projectionEigenVal.eigVals),
        minEigen = getIndexOfMin(projectionEigenVal.eigVals),
        ellRX = projXstdev > projYstdev ? Math.sqrt(projectionEigenVal.eigVals[maxEigen]) * ellipseScale : Math.sqrt(projectionEigenVal.eigVals[minEigen]) * ellipseScale,
        ellRY = projXstdev < projYstdev ? Math.sqrt(projectionEigenVal.eigVals[maxEigen]) * ellipseScale : Math.sqrt(projectionEigenVal.eigVals[minEigen]) * ellipseScale,
        dominantEigenVec = projectionEigenVal.eigVecs[maxEigen],
        rot = Math.atan2(dominantEigenVec[1], dominantEigenVec[0]);

    rot = (rot < 0) ? (rot + 2 * math.PI) : rot;

    var projXextent = d3.extent(projectionData, function(elem){return elem[0];}),
        projYextent = d3.extent(projectionData, function(elem){return elem[1];});

    parent.append("ellipse")
        .attr("class", "PCA-ellipse")
        .attr("rx",Math.abs(xaxis(projXextent[0] + ellRX) - xaxis(projXextent[0])))
        .attr("ry",Math.abs(yaxis(projYextent[0] + ellRY) - yaxis(projYextent[0])))
        .style("stroke",strokeColor)
        .attr("transform", "translate(" + xaxis(d3.mean(projectionData, function(elem){return elem[0];})) + "," + yaxis(d3.mean(projectionData, function(elem){return elem[1];})) +
            ") rotate(" + (rot * 180 / math.PI) + ")");
}

/**
 * Gets index of the maximum value in an array, returning the first if there are several equal maxima.
 * @param {Array} array
 * @returns {Number} Index of maximum value
 */
function getIndexOfMax(array){
    var max = array[0], maxIndex = 0;
    for (var index = 1; index < array.length; index++){
        if (array[index] < max){
            max = array[index];
            maxIndex = index;
        }
    }
    return maxIndex;
}

/**
 * Gets index of the minimum value in an array, returning the first if there are several equal minima.
 * @param {Array} array
 * @returns {Number} Index of minimum value
 */
function getIndexOfMin(array) {
    var min = array[0], minIndex = 0;
    for (var index = 1; index < array.length; index++){
        if (array[index] < min){
            min = array[index];
            minIndex = index;
        }
    }
    return minIndex;
}

/**
 * Logs the given message in the browser console as well as the metreex console, if it is running
 * @param message
 */
function handleGlobalErrorMessage(message){
    console.log(message);
    if (output) output.println(message);
}

/**
 * Builds the rows of a 2 dimensional array. Columns can be pushed in at will.
 * @param {Number} rows Number of rows to be pushed into the array
 * @returns {Array} Empty 2-D array
 */
function build2DArray(rows){
    var array = [];
    for (var index = 0; index < rows; index++){
        array.push([]);
    }
    return array;
}

/**
 * Requests the proper author and title of a given treebank from the VNCloud.
 * @param {Object} treebank
 */
function getCloudAuthorAndTitle(treebank){
    var file = vn.cloud.getObject(treebank.id);

    file.whenReady().then(
        function (file){
            var fields = file.getFields();

            treebank.author = fields.Author;
            treebank.title = fields.Title;
            treebank.section = fields.Section || fields["Section "]; //Some treebanks have an extra space at the end of the Section field

            if (!treebank.author || !treebank.title || !treebank.section){
                handleGlobalErrorMessage("Treebank with id " + treebank.id + " and name " + treebank.getTitle() + " has missing information in the vn cloud database.");
                treebank.author |= "AUTHOR_UNDEFINED";
                treebank.title |= "TITLE_UNDEFINED";
                treebank.section |= "SECTION_UNDEFINED";
            }
        }
    )
}

/*
    The next few functions set a default for targetDivId. This is to provide local defaults, so they don't need to be explicitly written in certain areas, namely console handling.
    If using this code detached from the original website, it would probably be to your benefit to change the default targetDivIds.
 */
function genMetricOnLeftTable(targetDivId){
    if (targetDivId === undefined) targetDivId = "#basicTable";
    applyMetrics();
    buildBasicTable(assembleMetricData(), targetDivId);
}

function genMetricOnTopTable(targetDivId){
    if (targetDivId === undefined) targetDivId = "#basicTable";
    applyMetrics();
    buildBasicTableInverted(assembleMetricData(), targetDivId);
}

function genBarChart(targetDivId){
    if (targetDivId === undefined) targetDivId = "#barChart";
    applyMetrics();
    buildBarChart(assembleMetricData(), 0, targetDivId);
}

function genScatterPlot(targetDivId){
    if (targetDivId === undefined) targetDivId = "#scatterPlot";
    applyMetrics();
    buildScatterPlot(assembleMetricData(), 0, 1, targetDivId);
}

function genPCAPlot(targetDivId){
    if (targetDivId === undefined) targetDivId = "#PCAPlot";
    applyMetrics();
    buildPCAPlot(assembleMetricData(), false, targetDivId);
}

function exportDataAsTSV(){
    applyMetrics();
    var data = assembleMetricData(),
        csvData = "data:text/csv;charset=utf-8,";

    csvData += "author\ttitle\tsection\tsentence\tnumSentences";
    lastMetricsUsed.forEach(function (elem) {
        csvData += "\t" + elem.name;
    });
    csvData += "\n";

    data.forEach(function (elem) {
        csvData += elem.author + "\t" + elem.title + "\t" + elem.section + "\t" + elem.sentence + "\t" + elem.numSentences;
        elem.metricValues.forEach(function(metricVal){
            csvData += "\t" + metricVal;
        });
        csvData += "\n";
    });

    window.open(encodeURI(csvData));
}