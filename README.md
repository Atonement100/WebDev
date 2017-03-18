# Metreex Treebank Analysis Tool
The Metreex Analysis tool is a web-based utility designed to aid in the analysis of natural languages, using data from the treebank annotation framework provided by [Arethusa](https://github.com/alpheios-project/arethusa). Arethusa provides a system for syntatically annotating sentences and generating XML files which represent the syntax tree. 
![a](http://www.perseids.org/tools/arethusa/dist/examples/images/grid.png)

From there, these treebanks can be analyzed with an arbitrary set of [user-defined metrics](https://github.com/Atonement100/metreex-analysis-tool/blob/master/metricSource.js), as provided by the [Metreex API](http://www.metreex.org/doc/). These metrics can help provide insight on the writing styles of given bodies of work when applied to treebanks. 

The goal of this project is to conduce automation in the analysis of texts, by providing a useful, intuitive, and presentable set of visualizations to allow more time for treebank annotation and for actually carrying out relevant analysis. 

The utility has a combination of Graphical and Console-based user interfaces, which can mostly be used interchangeably. Visualizations include simple interactive bar charts and scatter plots up to more mathematically complex principal component analysis, to provide a more comprehensive view of the highly multivariate data that language syntax inherently provides. Currently the metrics loaded into the system are a sampling which can be applied to Greek, however it is trivial to exchange these node metrics with any others desired by forking and editing the metricSource.js file found in the repository. 
