function retrieveMetrics(){
    var metrics=new Array();
    var m=null;

    m=new NodeMetric('Number of nodes');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getNumOfNodes();
    };
    metrics.push(m);

    m=new NodeMetric('Number of words');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getNumOfWords();
    };
    metrics.push(m);

    m=new NodeMetric('Number of root children');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getNumOfChildren();
    };
    metrics.push(m);

    m=new NodeMetric('Number of root grand-children');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getNumOfChildren(1);
    };
    metrics.push(m);

    m=new NodeMetric('Number of root great-grand-children');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getNumOfChildren(2);
    };
    metrics.push(m);

    m=new NodeMetric('Height');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getHeight();
    };
    metrics.push(m);

    m=new NodeMetric('Width');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getWidth();
    };
    metrics.push(m);

    m=new NodeMetric('Max Family Width');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getMaxFamilyWidth();
    };
    metrics.push(m);

    //----------------------------------------
    metrics=new Array();

    m=new NodeMetric('Number of nodes');
    //m.setDefaultWeights(NodeMetric.ALL_ONE);
    m.weight=function(n)
    {
        return 1;
    };
    m.metric=function(n)
    {
        return 1;
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of Leaves');
    m.setDefaultWeights(NodeMetric.UNIFORM_SUM_TO_ONE);
    m.metric=function(n)
    {
        return n.isLeaf();
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of Height');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getHeight()/n.getNumOfNodes();
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of Width');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getWidth()/n.getNumOfNodes();
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of Max Family Width');
    m.setDefaultWeights(NodeMetric.ROOT_ONE_OTHERS_ZERO);
    m.metric=function(n)
    {
        return n.getMaxFamilyWidth()/n.getNumOfNodes();
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of ATR');
    m.setDefaultWeights(NodeMetric.UNIFORM_SUM_TO_ONE);
    m.metric=function(n)
    {
        return n.getRelation()=='ATR';
    };
    metrics.push(m);


    m=new NodeMetric('Percentage of Verb Attributives');
    m.weight=function(n)
    {
        return 1/n.getRoot().getNumOfWords();
    };
    m.metric=function(n)
    {
        if(n.getRelation()=='ATR'&& n.getPosTag()[0]=='v') return 1;
        else return 0;
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of Adjectival Attributives');
    m.weight=function(n)
    {
        return 1/n.getRoot().getNumOfWords();
    };
    m.metric=function(n)
    {
        if(n.getRelation()=='ATR'&& n.getPosTag()[0]=='a') return 1;
        else return 0;
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of de Coordinates');
    m.weight=function(n)
    {
        return 1/n.getRoot().getNumOfWords();
    };
    m.metric=function(n)
    {
        if(n.getRelation()=='COORD'&& n.getLemma()=='δέ') return 1;
        else return 0;
    };
    metrics.push(m);

    m=new NodeMetric('Percentage of Nodes under ATR');
    m.weight=function(n)
    {
        if(n.getRelation()=='ATR')
            return 1;
        else return 0;
    };
    m.metric=function(n)
    {
        return n.getNumOfNodes()/n.getRoot().getNumOfWords();
    };
    metrics.push(m);

//--------------------------------------------

    for(var wn=-1;wn<3;wn++)
    {
        var p=1;
        for(var i=0;i<wn;i++)p*=2;
        for(var k=0;k<p;k++)
        {
            m=new NodeMetric('Percentage of Leaves W'+wn+','+k);
            m.setWaveletWeights(wn,k);
            m.metric=function(n)
            {
                return n.isLeaf();
            };
            metrics.push(m);


            m=new NodeMetric('Percentage of ATR W'+wn+','+k);
            m.setWaveletWeights(wn,k);
            m.metric=function(n)
            {
                return n.getRelation()=='ATR';
            };
            metrics.push(m);


            m=new NodeMetric('Percentage of Verb Attributives W'+wn+','+k);
            m.setWaveletWeights(wn,k);
            m.metric=function(n)
            {
                if(n.getRelation()=='ATR'&& n.getPosTag()[0]=='v') return 1;
                else return 0;
            };
            metrics.push(m);

            m=new NodeMetric('Percentage of Adjectival Attributives W'+wn+','+k);
            m.setWaveletWeights(wn,k);
            m.metric=function(n)
            {
                if(n.getRelation()=='ATR'&& n.getPosTag()[0]=='a') return 1;
                else return 0;
            };
            metrics.push(m);

            m=new NodeMetric('Percentage of de Coordinates W'+wn+','+k);
            m.setWaveletWeights(wn,k);
            m.metric=function(n)
            {
                if(n.getRelation()=='COORD'&& n.getLemma()=='δέ') return 1;
                else return 0;
            };
            metrics.push(m);

        }
    }

    //for(var i=0;i<metrics.length;i++)
        //output.println("{'"+metrics[i].name+"'}");

    //t.apply(metrics,{progress:output.getProgress()});
    return metrics;
}