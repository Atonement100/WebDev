var loadedTreebanks = [];
var selectedTreebanks = [];
var loadedMetrics = retrieveMetrics();
var enabledMetrics = [];
var disabledMetrics = [];
var USING_SIDEBAR = false;
var lastMetricResults = [];
var lastMetricsUsed = [];
var lastTreebanksUsed = [];
var debugData = [];

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
        return;
    }

    if (USING_SIDEBAR) {
        selectedTreebanks = getCheckedTreebanks();
    }

    if (selectedTreebanks.length == 0){
        output.println("No treebanks were selected, please select at least one treebank");
        return;
    }

    enabledMetrics = getCheckedMetrics();

    if (enabledMetrics.length == 0){
        output.println("No metrics were selected, please select at least one metrics");
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

function checkArrayEquals(one, two){
    //Should catch most quick error cases
    if (!one || !two) return false;
    if (one.length != two.length) return false;
    if (!one instanceof Array || !two instanceof Array) return false;

    return (!one.some(function (elem, index) {  //Some checks if elements pass text given by the function
        return elem != two[index];              //Which simply checks if the elem is equal to the element in the corresponding array
    }));
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
    //Clears out existing table if one exists
    d3.select("#basicTable").html("");

    var table = d3.select("#basicTable").append("table")
        .attr("id", "basicTableBase");
    var tableData = assembleMetricData();

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

    buildInvertedTableBody(tableData, tbody);

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

function buildInvertedTableBody(tableData, tbody){
    tableData.forEach(function (elem, index) {
        /*  Note that rows are built in the reverse order - data, sentence number, then title.
         This is done so that d3 can use select all "td" elements, and not interfere with the row headers
         Building backwards in terms of sentence number then title allows us to ubiquitously use :first-child in a 'prepend' sense
         */
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

function buildBasicTable(){
    //Clear out existing table if there is one already
    d3.select("#basicTable").html("");

    var table = d3.select("#basicTable").append("table")
        .attr("id", "basicTableBase");
    var tableData = assembleMetricData();

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
    var runningIndex = 0;

    for (var index = 0; index < selectedTreebanks.length; index++){
        for (var sentenceIndex = 0; sentenceIndex < lastMetricResults[index].length; sentenceIndex++){
            data.push({
                title: selectedTreebanks[index].getTitle(),
                sentence: (+sentenceIndex + 1),
                numSentences: lastMetricResults[index].length,
                metrics: enabledMetrics,
                metricValues: lastMetricResults[index][sentenceIndex],
                originalIndex: runningIndex++,
                refString: selectedTreebanks[index].getTitle() + " " + (+sentenceIndex + 1),
                author: identifyAuthor(selectedTreebanks[index].getTitle())
            });
        }
    }

    debugData = data;
    return data;
}

function buildBarChart(tableData, metricIndex) {
    d3.select("#barChart").html(" ");

<<<<<<< HEAD
    var nodeData = [];
    tableData.forEach(function (elem) {
        nodeData.unshift(elem.metricValues[metricIndex]);
    });

    var margin = {top: 15, right: 15, bottom: 30, left: 150};
=======
    var margin = {top: 15, right: 15, bottom: 30, left: 200};
>>>>>>> ef8545e... background ticks for bar charts
    var barThickness = 16; //px
    var width = 1200, height = tableData.length * barThickness + margin.top + margin.bottom;

    var xaxis = d3.scaleLinear()
        .domain([ Math.min(d3.min(tableData, function(elem){return elem.metricValues[metricIndex];}), 0),
            d3.max(tableData, function (elem) {return elem.metricValues[metricIndex];}) ])
        .range([0,width]);
    var yaxis = d3.scaleBand()
        .range([height - (margin.bottom + margin.top), 0])
        .domain(tableData.map(function(elem){
            return elem.title + " " + elem.sentence;
        }));

    var metricSelector = d3.select("#barChart").append("select")
        .attr("id", "barChartMetricSelector")
        .on("change", selectedMetricChange);

    metricSelector.selectAll("option")
        .data(lastMetricsUsed)
        .enter()
        .append("option")
        .attr("value",function(elem){return elem.name;})
        .property("selected", function(elem,index) {return index == metricIndex;})
        .html(function(elem) {return elem.name;});

    d3.select("#barChart").append("input")
        .attr("type","checkbox")
        .html("Sort")
        .on("change",toggleSort);

    var chart = d3.select("#barChart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top);
    var parent = chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var barparent = parent.append("g");
    var bars = barparent.selectAll("g")
        .data(tableData, function (elem) { return elem.metricValues[metricIndex]; })
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(elem){return "translate(0," + yaxis(elem.title + " " + elem.sentence) + ")";});

    bars.append("rect")
        .attr("x", function(elem) {return xaxis(Math.min(0,elem.metricValues[metricIndex]))})
        .attr("height", yaxis.bandwidth())
        .attr("width", function(elem){return Math.abs(xaxis(elem.metricValues[metricIndex]) - xaxis(0))});

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

    function selectedMetricChange(){
        var activeIndex = metricSelector.property('selectedIndex');
        buildBarChart(tableData, activeIndex);
    }

    function toggleSort(){
        var y0 = yaxis.range([height - (margin.bottom + margin.top), 0])
            .domain(tableData.sort(this.checked ? function(a, b) { return b.metricValues[metricIndex] - a.metricValues[metricIndex]; } : function(a, b) { return d3.ascending(a.originalIndex,b.originalIndex); })
                .map(function(elem) { console.log(elem.refString); return elem.refString; }))
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


function buildScatterPlot(tableData, yMetricIndex, xMetricIndex) {
    d3.select("#scatterPlot").html(" ");

    var xMetricSelector = d3.select("#scatterPlot").append("select")
        .attr("id", "scatterxSelect")
        .on("change", selectedMetricChange);
    var yMetricSelector = d3.select("#scatterPlot").append("select")
        .attr("id", "scatterySelect")
        .on("change", selectedMetricChange);

    xMetricSelector.selectAll("option")
        .data(lastMetricsUsed)
        .enter()
        .append("option")
        .attr("value",function(elem){return elem.name;})
        .property("selected", function(elem,index) {return index == xMetricIndex;})
        .html(function(elem) {return elem.name;});

    yMetricSelector.selectAll("option")
        .data(lastMetricsUsed)
        .enter()
        .append("option")
        .attr("value",function(elem){return elem.name;})
        .property("selected", function(elem,index) {return index == yMetricIndex;})
        .html(function(elem) {return elem.name;})
        .append("br");

    var margin = {top: 15, right: 15, bottom: 30, left: 30};
    var bubbleThickness = 4; //px
    var width = 800, height = 800;

    var xaxis = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(tableData, function(elem){return elem.metricValues[xMetricIndex];}));
    var yaxis = d3.scaleLinear()
        .range([height, 0])
        .domain(d3.extent(tableData, function(elem){return elem.metricValues[yMetricIndex];}));
    //potential 'z axis' in terms of size of bubbles
    var coloraxis = d3.scaleOrdinal(d3.schemeAccent)
        .domain(tableData.map(function (elem) {
            return elem.author;
        }));

    var chart = d3.select("#scatterPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top);
    var parent = chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    parent.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xaxis));

    parent.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(yaxis));

    parent.selectAll(".scatterPoint")
        .data(tableData)
        .enter().append("circle")
        .attr("class","scatterPoint")
        .attr("r",  bubbleThickness)
        .style("fill", function(elem){return coloraxis(elem.author);})
        .attr("cx", function(elem){return xaxis(elem.metricValues[xMetricIndex]);})
        .attr("cy", function(elem){return yaxis(elem.metricValues[yMetricIndex]);});


    function selectedMetricChange(){
        buildScatterPlot(tableData, yMetricSelector.property('selectedIndex'), xMetricSelector.property('selectedIndex'));
    }
}

function q(){
    applyMetrics();
    buildBasicTable();
}

function zz(){
    applyMetrics();
    buildBasicTableInverted();
}

function genBarChartA(){
    applyMetrics();
    buildBarChart(assembleMetricData(), 0);
}

function genScatterPlot(){
    applyMetrics();
    buildScatterPlot(assembleMetricData(), 0, 1);
}

function genPCAPlot(){
    applyMetrics();
    eigenDriver(assembleMetricData());
}

/**
 *
 * @param data Should be passed as an m x n array (of arrays), with columns being variables and rows being the related observations.
 *              First index should be observations (sentences). Second index should be variables (metrics).
 */
function computeCovariance(data){
    var dataMatrix = math.matrix(data);
    var observations = data.length;
    var a = math.multiply(math.ones(observations, observations), 1/observations);
    console.log(a);
    console.log(dataMatrix);
    var b = math.multiply(a, dataMatrix);
    var deviationMatrix = math.subtract(dataMatrix, b);
    return math.multiply(1/observations,math.transpose(deviationMatrix),deviationMatrix)._data; //covariance matrix
}

//takes 2d array, not math.matrix. Can use math.matrix()._data to retrieve 2d array
function computeEigendecomposition(covarianceArray){
    var eigResult = numeric.eig(covarianceArray);
    return {
      eigVals: eigResult.lambda.x,
      eigVecs: eigResult.E.x
    };
}

/**
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

function computeEigenProjection(eigenIndexInfo, eigenVecs, data){
    var primaryEigenIndex = eigenIndexInfo[0].vecIndex,
        secondaryEigenIndex = eigenIndexInfo[1].vecIndex,
        projectionMatrix = [];

    eigenVecs.forEach(function (elem) {
       projectionMatrix.push([elem[primaryEigenIndex], elem[secondaryEigenIndex]]);
    });

    console.log(projectionMatrix);
    return math.multiply(math.matrix(data),math.matrix(projectionMatrix));
}

function eigenDriver(data){
    var metricValues = data.map(function (elem) {
       return elem.metricValues;
    });
    var covMatrix = computeCovariance(metricValues);
    var eigenPairs = computeEigendecomposition(covMatrix);
    var eigenIndexInfo = sortEigenvals(eigenPairs.eigVals);
    var projectionMatrix = computeEigenProjection(eigenIndexInfo, eigenPairs.eigVecs, metricValues);
    console.log(projectionMatrix);

    var projectionData = projectionMatrix._data;

    d3.select("#PCAPlot").html(" ");

    var margin = {top: 15, right: 15, bottom: 30, left: 30};
    var bubbleThickness = 4; //px
    var width = 800, height = 800;

    var xaxis = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(projectionData, function(elem){return elem[0];}));
    var yaxis = d3.scaleLinear()
        .range([height, 0])
        .domain(d3.extent(projectionData, function(elem){return elem[1];}));

    var chart = d3.select("#PCAPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top);
    var parent = chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    parent.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xaxis));

    parent.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(yaxis));

    parent.selectAll(".scatterPoint")
        .data(projectionData)
        .enter().append("circle")
        .attr("class","scatterPoint")
        .attr("r",  bubbleThickness)
        //.attr("fill", function(elem){return elem.title;})
        .attr("cx", function(elem){return xaxis(elem[0]);})
        .attr("cy", function(elem){return yaxis(elem[1]);});
}

function fakeEigen(){
    var metricValues = [
        [ 5.1 , 3.5 , 1.4 , 0.2 ],
        [ 4.9 , 3.0 , 1.4 , 0.2 ],
        [ 4.7 , 3.2 , 1.3 , 0.2 ],
        [ 4.6 , 3.1 , 1.5 , 0.2 ],
        [ 5.0 , 3.6 , 1.4 , 0.2 ],
        [ 5.4 , 3.9 , 1.7 , 0.4 ],
        [ 4.6 , 3.4 , 1.4 , 0.3 ],
        [ 5.0 , 3.4 , 1.5 , 0.2 ],
        [ 4.4 , 2.9 , 1.4 , 0.2 ],
        [ 4.9 , 3.1 , 1.5 , 0.1 ],
        [ 5.4 , 3.7 , 1.5 , 0.2 ],
        [ 4.8 , 3.4 , 1.6 , 0.2 ],
        [ 4.8 , 3.0 , 1.4 , 0.1 ],
        [ 4.3 , 3.0 , 1.1 , 0.1 ],
        [ 5.8 , 4.0 , 1.2 , 0.2 ],
        [ 5.7 , 4.4 , 1.5 , 0.4 ],
        [ 5.4 , 3.9 , 1.3 , 0.4 ],
        [ 5.1 , 3.5 , 1.4 , 0.3 ],
        [ 5.7 , 3.8 , 1.7 , 0.3 ],
        [ 5.1 , 3.8 , 1.5 , 0.3 ],
        [ 5.4 , 3.4 , 1.7 , 0.2 ],
        [ 5.1 , 3.7 , 1.5 , 0.4 ],
        [ 4.6 , 3.6 , 1.0 , 0.2 ],
        [ 5.1 , 3.3 , 1.7 , 0.5 ],
        [ 4.8 , 3.4 , 1.9 , 0.2 ],
        [ 5.0 , 3.0 , 1.6 , 0.2 ],
        [ 5.0 , 3.4 , 1.6 , 0.4 ],
        [ 5.2 , 3.5 , 1.5 , 0.2 ],
        [ 5.2 , 3.4 , 1.4 , 0.2 ],
        [ 4.7 , 3.2 , 1.6 , 0.2 ],
        [ 4.8 , 3.1 , 1.6 , 0.2 ],
        [ 5.4 , 3.4 , 1.5 , 0.4 ],
        [ 5.2 , 4.1 , 1.5 , 0.1 ],
        [ 5.5 , 4.2 , 1.4 , 0.2 ],
        [ 4.9 , 3.1 , 1.5 , 0.2 ],
        [ 5.0 , 3.2 , 1.2 , 0.2 ],
        [ 5.5 , 3.5 , 1.3 , 0.2 ],
        [ 4.9 , 3.6 , 1.4 , 0.1 ],
        [ 4.4 , 3.0 , 1.3 , 0.2 ],
        [ 5.1 , 3.4 , 1.5 , 0.2 ],
        [ 5.0 , 3.5 , 1.3 , 0.3 ],
        [ 4.5 , 2.3 , 1.3 , 0.3 ],
        [ 4.4 , 3.2 , 1.3 , 0.2 ],
        [ 5.0 , 3.5 , 1.6 , 0.6 ],
        [ 5.1 , 3.8 , 1.9 , 0.4 ],
        [ 4.8 , 3.0 , 1.4 , 0.3 ],
        [ 5.1 , 3.8 , 1.6 , 0.2 ],
        [ 4.6 , 3.2 , 1.4 , 0.2 ],
        [ 5.3 , 3.7 , 1.5 , 0.2 ],
        [ 5.0 , 3.3 , 1.4 , 0.2 ],
        [ 7.0 , 3.2 , 4.7 , 1.4 ],
        [ 6.4 , 3.2 , 4.5 , 1.5 ],
        [ 6.9 , 3.1 , 4.9 , 1.5 ],
        [ 5.5 , 2.3 , 4.0 , 1.3 ],
        [ 6.5 , 2.8 , 4.6 , 1.5 ],
        [ 5.7 , 2.8 , 4.5 , 1.3 ],
        [ 6.3 , 3.3 , 4.7 , 1.6 ],
        [ 4.9 , 2.4 , 3.3 , 1.0 ],
        [ 6.6 , 2.9 , 4.6 , 1.3 ],
        [ 5.2 , 2.7 , 3.9 , 1.4 ],
        [ 5.0 , 2.0 , 3.5 , 1.0 ],
        [ 5.9 , 3.0 , 4.2 , 1.5 ],
        [ 6.0 , 2.2 , 4.0 , 1.0 ],
        [ 6.1 , 2.9 , 4.7 , 1.4 ],
        [ 5.6 , 2.9 , 3.6 , 1.3 ],
        [ 6.7 , 3.1 , 4.4 , 1.4 ],
        [ 5.6 , 3.0 , 4.5 , 1.5 ],
        [ 5.8 , 2.7 , 4.1 , 1.0 ],
        [ 6.2 , 2.2 , 4.5 , 1.5 ],
        [ 5.6 , 2.5 , 3.9 , 1.1 ],
        [ 5.9 , 3.2 , 4.8 , 1.8 ],
        [ 6.1 , 2.8 , 4.0 , 1.3 ],
        [ 6.3 , 2.5 , 4.9 , 1.5 ],
        [ 6.1 , 2.8 , 4.7 , 1.2 ],
        [ 6.4 , 2.9 , 4.3 , 1.3 ],
        [ 6.6 , 3.0 , 4.4 , 1.4 ],
        [ 6.8 , 2.8 , 4.8 , 1.4 ],
        [ 6.7 , 3.0 , 5.0 , 1.7 ],
        [ 6.0 , 2.9 , 4.5 , 1.5 ],
        [ 5.7 , 2.6 , 3.5 , 1.0 ],
        [ 5.5 , 2.4 , 3.8 , 1.1 ],
        [ 5.5 , 2.4 , 3.7 , 1.0 ],
        [ 5.8 , 2.7 , 3.9 , 1.2 ],
        [ 6.0 , 2.7 , 5.1 , 1.6 ],
        [ 5.4 , 3.0 , 4.5 , 1.5 ],
        [ 6.0 , 3.4 , 4.5 , 1.6 ],
        [ 6.7 , 3.1 , 4.7 , 1.5 ],
        [ 6.3 , 2.3 , 4.4 , 1.3 ],
        [ 5.6 , 3.0 , 4.1 , 1.3 ],
        [ 5.5 , 2.5 , 4.0 , 1.3 ],
        [ 5.5 , 2.6 , 4.4 , 1.2 ],
        [ 6.1 , 3.0 , 4.6 , 1.4 ],
        [ 5.8 , 2.6 , 4.0 , 1.2 ],
        [ 5.0 , 2.3 , 3.3 , 1.0 ],
        [ 5.6 , 2.7 , 4.2 , 1.3 ],
        [ 5.7 , 3.0 , 4.2 , 1.2 ],
        [ 5.7 , 2.9 , 4.2 , 1.3 ],
        [ 6.2 , 2.9 , 4.3 , 1.3 ],
        [ 5.1 , 2.5 , 3.0 , 1.1 ],
        [ 5.7 , 2.8 , 4.1 , 1.3 ],
        [ 6.3 , 3.3 , 6.0 , 2.5 ],
        [ 5.8 , 2.7 , 5.1 , 1.9 ],
        [ 7.1 , 3.0 , 5.9 , 2.1 ],
        [ 6.3 , 2.9 , 5.6 , 1.8 ],
        [ 6.5 , 3.0 , 5.8 , 2.2 ],
        [ 7.6 , 3.0 , 6.6 , 2.1 ],
        [ 4.9 , 2.5 , 4.5 , 1.7 ],
        [ 7.3 , 2.9 , 6.3 , 1.8 ],
        [ 6.7 , 2.5 , 5.8 , 1.8 ],
        [ 7.2 , 3.6 , 6.1 , 2.5 ],
        [ 6.5 , 3.2 , 5.1 , 2.0 ],
        [ 6.4 , 2.7 , 5.3 , 1.9 ],
        [ 6.8 , 3.0 , 5.5 , 2.1 ],
        [ 5.7 , 2.5 , 5.0 , 2.0 ],
        [ 5.8 , 2.8 , 5.1 , 2.4 ],
        [ 6.4 , 3.2 , 5.3 , 2.3 ],
        [ 6.5 , 3.0 , 5.5 , 1.8 ],
        [ 7.7 , 3.8 , 6.7 , 2.2 ],
        [ 7.7 , 2.6 , 6.9 , 2.3 ],
        [ 6.0 , 2.2 , 5.0 , 1.5 ],
        [ 6.9 , 3.2 , 5.7 , 2.3 ],
        [ 5.6 , 2.8 , 4.9 , 2.0 ],
        [ 7.7 , 2.8 , 6.7 , 2.0 ],
        [ 6.3 , 2.7 , 4.9 , 1.8 ],
        [ 6.7 , 3.3 , 5.7 , 2.1 ],
        [ 7.2 , 3.2 , 6.0 , 1.8 ],
        [ 6.2 , 2.8 , 4.8 , 1.8 ],
        [ 6.1 , 3.0 , 4.9 , 1.8 ],
        [ 6.4 , 2.8 , 5.6 , 2.1 ],
        [ 7.2 , 3.0 , 5.8 , 1.6 ],
        [ 7.4 , 2.8 , 6.1 , 1.9 ],
        [ 7.9 , 3.8 , 6.4 , 2.0 ],
        [ 6.4 , 2.8 , 5.6 , 2.2 ],
        [ 6.3 , 2.8 , 5.1 , 1.5 ],
        [ 6.1 , 2.6 , 5.6 , 1.4 ],
        [ 7.7 , 3.0 , 6.1 , 2.3 ],
        [ 6.3 , 3.4 , 5.6 , 2.4 ],
        [ 6.4 , 3.1 , 5.5 , 1.8 ],
        [ 6.0 , 3.0 , 4.8 , 1.8 ],
        [ 6.9 , 3.1 , 5.4 , 2.1 ],
        [ 6.7 , 3.1 , 5.6 , 2.4 ],
        [ 6.9 , 3.1 , 5.1 , 2.3 ],
        [ 5.8 , 2.7 , 5.1 , 1.9 ],
        [ 6.8 , 3.2 , 5.9 , 2.3 ],
        [ 6.7 , 3.3 , 5.7 , 2.5 ],
        [ 6.7 , 3.0 , 5.2 , 2.3 ],
        [ 6.3 , 2.5 , 5.0 , 1.9 ],
        [ 6.5 , 3.0 , 5.2 , 2.0 ],
        [ 6.2 , 3.4 , 5.4 , 2.3 ],
        [ 5.9 , 3.0 , 5.1 , 1.8 ]
    ];

    var covMatrix = computeCovariance(metricValues);

    covMatrix = [[ 1.00671141, -0.11010327,  0.87760486,  0.82344326],
                [-0.11010327,  1.00671141, -0.42333835, -0.358937  ],
                [ 0.87760486, -0.42333835,  1.00671141,  0.96921855],
                [ 0.82344326, -0.358937,    0.96921855,  1.00671141]];

    var eigenPairs = computeEigendecomposition(covMatrix);
    var eigenIndexInfo = sortEigenvals(eigenPairs.eigVals);
    var projectionMatrix = computeEigenProjection(eigenIndexInfo, eigenPairs.eigVecs, metricValues);
    console.log(covMatrix);
    console.log(eigenPairs);
    console.log(eigenIndexInfo);
    console.log(projectionMatrix);

    var projectionData = projectionMatrix._data;

    d3.select("#PCAPlot").html(" ");

    var margin = {top: 15, right: 15, bottom: 30, left: 30};
    var bubbleThickness = 4; //px
    var width = 800, height = 800;

    var xaxis = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(projectionData, function(elem){return elem[0];}));
    var yaxis = d3.scaleLinear()
        .range([height, 0])
        .domain(d3.extent(projectionData, function(elem){return elem[1];}));

    var chart = d3.select("#PCAPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top);
    var parent = chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    parent.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xaxis));

    parent.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(yaxis));

    parent.selectAll(".scatterPoint")
        .data(projectionData)
        .enter().append("circle")
        .attr("class","scatterPoint")
        .attr("r",  bubbleThickness)
        //.attr("fill", function(elem){return elem.title;})
        .attr("cx", function(elem){return xaxis(elem[0]);})
        .attr("cy", function(elem){return yaxis(elem[1]);});
}

function identifyAuthor(title){
    title = title.toLowerCase();
    if (title.indexOf("dion") >= 0) return "Dionysus";
    else if (title.indexOf("dio") >= 0) return "Dio";
    else if (title.indexOf("demo") >= 0) return "Demosthenes";
    else if (title.indexOf("lys") >= 0) return "Lysias";
    else if (title.indexOf("ael") >= 0) return "Aelius";
    else if (title.indexOf("isoc") >= 0) return "Isocrates";
    else if (title.indexOf("luci") >= 0) return "Lucian";
    else if (title.indexOf("thuc") >= 0) return "Thucydides";
    else return "unattributed";
}