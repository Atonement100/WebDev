/* V1.0
 * Author(s): Eleni Bozia
 * 
 * Copyright (c) 2015, Eleni Bozia
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain this copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce this
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 
 //--------------------------------------------------------------------------------------
/**
 * This class creates a node-based metric for syntactically annotated sentences as presented by E. Bozia, "Measuring Tradition, Imitation, and Simplicity:
The case of Attic Oratory", In <a href="../documents/CRH4_proceedings.pdf">Proceedings of the Workshop on Corpus-Based Research in the Humanities (CRH)</a>, 2015, pp. 23-29.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var m=new NodeMetric('Number of nodes');<br>
 * m.weight=function(n)<br>
 * {<br>
 *		return 1;<br>
 *	};<br>
 *	m.metric=function(n)<br>
 *	{<br>
 *		return 1;<br>
 *	};<br></font>
 * @param name A string with a name that describes the metric.
 */
function NodeMetric(name)
{
	this.name=name;
}


/**
 * This is a callback method that you can set to define how the weight will be calculated for each node of a syntactically annotated sentence. It will be automatically called iteratively for each node of a given sentence when you apply this metric to the sentence using the method metric.apply(sentence). It is initially set to return always the value 1.
 * @param node An input node given as a TreebankSentence object.
 */
NodeMetric.prototype.weight=function(node){return 1;};
/**
 * This is a callback method that you can set to define how the metric will be calculated for each node of a syntactically annotated sentence. It will be automatically called iteratively for each node of a given sentence when you apply this metric to the sentence using the method metric.apply(sentence). It is initially set to return always the value 0.
 * @param node An input node given as a TreebankSentence object.
 */
NodeMetric.prototype.metric=function(node){return 0;};

NodeMetric.All_ONE=1;
NodeMetric.ROOT_ONE_OTHERS_ZERO=2;
NodeMetric.UNIFORM_SUM_TO_ONE=3;
NodeMetric.LEAVES_ONE_OTHERS_ZERO=4;

/**
 * This method sets a default weight function to this metric. There are four preset weight functions you can choose from: NodeMetric.ALL_ONE (returns 1 for all nodes), NodeMetric.ROOT_ONE_OTHERS_ZERO (returns 1 only for the root node), NodeMetric.UNIFORM_SUM_TO_ONE (returns 1/num_of_nodes for all nodes), and NodeMetric.LEAVES_ONE_OTHERS_ZERO (returns 1 only for the leaf nodes).
 * @param type A constant value that corresponds to the type of a preset weight function. It must be one of the following: NodeMetric.ALL_ONE, NodeMetric.ROOT_ONE_OTHERS_ZERO, NodeMetric.UNIFORM_SUM_TO_ONE, and NodeMetric.LEAVES_ONE_OTHERS_ZERO.
 */
NodeMetric.prototype.setDefaultWeights=function(type)
{
	if(type==NodeMetric.All_ONE)
	{
		this.weight=function(node){return 1;};
	}
	else if(type==NodeMetric.ROOT_ONE_OTHERS_ZERO)
	{
		this.weight=function(node){
			if(node.isRoot()) return 1;
			else return 0;
		};
	}
	else if(type==NodeMetric.UNIFORM_SUM_TO_ONE)
	{
		this.weight=function(node){return 1.0/node.getRoot().getNumOfNodes();};
	}
	else if(type==NodeMetric.LEAVES_ONE_OTHERS_ZERO)
	{
		this.weight=function(node){
			if(node.isLeaf()) return 1;
			else return 0;
		};
	}
};

/**
 * This method sets a normalized Haar wavelet weight function to this metric. 
 * @param n The order of the wavelet.
 * @param k The shift of the wavelet. k must be between 0 and 2^n-1.
 */
NodeMetric.prototype.setWaveletWeights=function(n,k)
{
	var p=1;
	for(var i=0;i<n;i++)p*=2;
	if(n<0){p=0.5;k=0;}
	
	this.weight=function(node)
	{
		var num=node.getRoot().getNumOfNodes();
		//if(node.getId()/num>1)console.log(node.getId()+' '+num+' '+node.getForm());
		var t=p*node.getId()/num-k;
		//console.log(t+' '+node.getId());
		if(t>0 && t<=0.5) return 1/num;
		else if(t>0.5 && t<=1) return -1/num;
		else return 0;
	};
};

/**
 * This method applies this metric to a given syntactically annotated sentence. It iteratively calculates the weighted metric for each node and returns the sum.
 * @param sentence An input sentence given as a TreebankSentence object.
 * @return number A number with the value calculated by applying this metric to a given sentence.
 */
NodeMetric.prototype.apply=function(sentence)
{
	var value=this.weight(sentence);
	if(value!=0) value*=this.metric(sentence);
	var ch=sentence.getChildren();
	for(var i=0;i<ch.length;i++)
	{
		value+=this.apply(ch[i]);
	}
	return value;
};

/**
 * This class defines and controls the structure of a syntactically annotated sentence. Object of this class are generated by the TreebankFile class when you load a particular treebank file formatted as an xml tree. It should be noted that in a syntactically annotated sentence each node is also a TreebankSentence element.
 * @param parent An optional input argument with the parent of the node to be constructed given as a TreebankSentence object.
 */
function TreebankSentence(parent)
{
	this.parent=null;
	this.sentence_id='';
	this.file=null;
	if(typeof parent!=='undefined') this.parent=parent;
	if(this.parent==null)
		this.root=this;
	else this.root=this.parent.getRoot();
	this.sentence_id=this.root.sentence_id;
	this.file=this.root.file;
	
	this.num='';
	this.xml=null;
	
	this.num_of_nodes=null;
}

/**
 * This method returns the relation of this node with its parent node (for example "ATR").
 * @return string The relation of this node.
 */
TreebankSentence.prototype.getRelation=function()
{
	return this.xml.getAttribute('relation');
};

/**
 * This method returns the lemma of this node.
 * @return string The lemma of this node.
 */
TreebankSentence.prototype.getLemma=function()
{
	return this.xml.getAttribute('lemma');
};

/**
 * This method returns the pos. tag of this node.
 * @return string The pos. tag of this node.
 */
TreebankSentence.prototype.getPosTag=function()
{
	return this.xml.getAttribute('postag');
};

/**
 * This method returns the id of this node, which is the order of the word in the sentence starting from 1.
 * @return number The id of this node.
 */
TreebankSentence.prototype.getId=function()
{
	var id=parseInt(this.xml.getAttribute('id'));
	if(isNaN(id))return -1;
	if(typeof this.getRoot()._id_map[id]==='undefined')return -1;
	return this.getRoot()._id_map[id];
};

/**
 * This method returns the root node of the syntactical tree to which this node belongs.
 * @return TreebankSentence The root node object.
 */
TreebankSentence.prototype.getRoot=function()
{
	return this.root;
};

/**
 * This method returns the treebank file object to which this node belongs.
 * @return TreebankFile The treebank file object.
 */
TreebankSentence.prototype.getFile=function()
{
	return this.file;
};

/**
 * This method returns true if this node is a leaf otherwise returns false.
 * @return boolean The returned value.
 */
TreebankSentence.prototype.isLeaf=function()
{
	if(this.getNumOfChildren()==0) return true;
	else return false;
}

/**
 * This method returns true if this node is the root node otherwise returns false.
 * @return boolean The returned value.
 */
TreebankSentence.prototype.isRoot=function()
{
	if(this==this.root) return true; 
	else return false;
};

/**
 * This method returns the number of children of this node.
 * @return integer The number of children.
 */
TreebankSentence.prototype.getNumOfChildren=function(height)
{
	var h=0;
	if(typeof height !=='undefined') h=height;
	return compute_num_of_children(this.xml,h);
};

function compute_num_of_children(xml_element, height)
{
	if(height==0)
		return xml_element.childNodes.length;
	else
	{
		var sum=0;
		for(var i=0;i<xml_element.childNodes.length;i++)
		{
			sum+=compute_num_of_children(xml_element.childNodes[i],height-1);
		}
		return sum;
	}
}

/**
 * This method returns the node object of this node's parent or null of this node is the root.
 * @return TreebankSentence The object of the parent node.
 */
TreebankSentence.prototype.getParent=function()
{
	if(this.parent==this.root) return null; else return this.parent;
};

TreebankSentence.prototype.calculateIdMap=function()
{
	if(this._id_map)return;
	this._id_map=[];
	var w=this.xml.getElementsByTagName('word');
	var c=0;
	for(var i=0;i<w.length;i++)
	{
		c=parseInt(w[i].getAttribute('id'));
		if(!isNaN(c))this._id_map[c]=1;
	}
	c=0;
	for(var i=0;i<this._id_map.length;i++)
	{
		if(this._id_map[i])
		{
			c+=1;
			this._id_map[i]=c;
		}
	}
};

/**
 * This method returns an array with the children of this node.
 * @return Array An array with the children of this node given as TreebankSentence objects.
 */
TreebankSentence.prototype.getChildren=function()
{
	var children=new Array(this.xml.childNodes.length);
	for(var i=0;i<children.length;i++)
	{
		children[i]=new TreebankSentence(this);
		children[i].xml=this.xml.childNodes[i];
	}
	return children;
};

/**
 * This method returns the width of the tree starting from this node as the root. It is calculated as the maximum number of nodes that belong to the same generation.
 * @return number The width of the tree.
 */
TreebankSentence.prototype.getWidth=function()
{
	var h=this.getHeight();
	var max_width=0;
	var current_width=0;
	for(var i=0;i<h;i++)
	{
		current_width=this.getNumOfChildren(i);
		if(current_width>max_width)max_width=current_width;
	}
	return max_width;
};

/**
 * This method returns the size of the largest family of the tree that starts from this node as the root. It is calculated as the maximum number of children that one node can have in this tree.
 * @return number The width of the largest family.
 */
TreebankSentence.prototype.getMaxFamilyWidth=function()
{
	return compute_max_children(this.xml);
};

function compute_max_children(xml_element)
{
	if(xml_element.childNodes.length==0)
		return 0;
	else
	{
		var max_val=xml_element.childNodes.length;
		var current_val=0;
		for(var i=0;i<xml_element.childNodes.length;i++)
		{
			current_val=compute_max_children(xml_element.childNodes[i]);
			if(current_val>max_val)max_val=current_val;
		}
		return max_val;
	}
}

/**
 * This method returns the height of the tree starting from this node as the root. It is calculated as the maximum number of generations in this tree.
 * @return number The height of the tree.
 */
TreebankSentence.prototype.getHeight=function()
{
	return compute_height(this.xml);
};

function compute_height(xml_element)
{
	if(xml_element.childNodes.length==0)
		return 0;
	else
	{
		var max_height=0;
		var current_height=0;
		for(var i=0;i<xml_element.childNodes.length;i++)
		{
			current_height=compute_height(xml_element.childNodes[i]);
			if(current_height>max_height)max_height=current_height;
		}
		return max_height+1;
	}
}

/**
 * This method returns the words in the tree that starts form this node as a root. The nodes that do not contain words (such as punctuation nodes) are not counted.
 * @return number The number of words.
 */
TreebankSentence.prototype.getNumOfWords=function()
{
	var w=this.xml.getElementsByTagName('word');
	var counter=0;
		if(this.xml.hasAttribute('insertion_id')){}
		else counter+=1;//self
	for(var i=0;i<w.length;i++)
		if(w[i].hasAttribute('insertion_id')){}
		else counter+=1;
	return counter;
};

/**
 * This method returns the nodes in the tree that starts form this node as a root.
 * @return number The number of nodes.
 */
TreebankSentence.prototype.getNumOfNodes=function()
{
	if(this.num_of_nodes==null)
	{
		var w=this.xml.getElementsByTagName('word');
		this.num_of_nodes=w.length+1;
	}
	return this.num_of_nodes;
};

TreebankSentence.NO_PUNCTUATION=2;
TreebankSentence.WITH_ARTIFICIAL=4;
TreebankSentence.GREEK_TO_LATIN=8;

/**
 * This method returns the form of this node.
 * @return string The form of this node.
 */
TreebankSentence.prototype.getForm=function()
{
	return this.xml.getAttribute('form');
};

/**
 * This method exports this sentence as a string.
 * @param input_flags The exported string can be generated by a comination of the following flags using binary addition: TreebankSentence.NO_PUNCTUATION (does not include punctuation in the result), TreebankSentence.WITH_ARTIFICIAL (includes punctuation in the result), TreebankSentence.GREEK_TO_LATIN (transliterates the result to the latin alphabet using 1-1 character mapping). Example: sentence.toString(TreebankSentence.WITH_ARTIFICIAL|TreebankSentence.GREEK_TO_LATIN);
 * @return string The exported sentence.
 */
TreebankSentence.prototype.toString=function(input_flags)
{
	var flags=0;
	if(typeof flags!=='undefined') flags=input_flags;
	
	var with_artif=((flags & TreebankSentence.WITH_ARTIFICIAL)>0);
	var no_punct=((flags & TreebankSentence.NO_PUNCTUATION)>0);
	
	var w=this.xml.getElementsByTagName('word');
	var w2=new Array(w.length);
	for(var i=0;i<w.length;i++)
		w2[parseInt(w[i].getAttribute('id'))-1]=w[i];
	
	var out='';
	var no_space=false;
	var no_space_after=false;
	var form='';
	for(var i=0;i<w2.length;i++)
	{
		form=w2[i].getAttribute('form');
		if(form.length>0)
		{
			if(form.charAt(0)=='-')
			{
				form=form.substring(1,form.length);
				no_space=true;
			}
			else if(form.charAt(form.length-1)=='-') 
			{
				form=form.substring(0,form.length-1);
				no_space_after=true;
			}
		}
		if(no_punct && !isPunctuation(form) && isPunctuation(form.charAt(form.length-1)))
		{
			form=form.substring(0,form.length-1);
		}
		
		if(with_artif || !isArtificial(w2[i]))
		{
			if(isPunctuation(form))
			{
				if(!no_punct)
				{
					if(form=='(')
					{
						out+=' '+form;
						no_space=true;
					}
					else out+=form;
				}
			}
			else
			{	
				if(no_space)
				{
					out+=form;
					no_space=false;
				}
				else out+=' '+form;
				
				if(no_space_after)
				{
					no_space_after=false;
					no_space=true;
				}
			}
		}
	}
	out=out+' ';
	
	if((flags & TreebankSentence.GREEK_TO_LATIN)>0) out=greekToLatin(out);
	
	return out;
};

/**
 * This method applies one or more given metrics to this sentence. Optionally it can print out the results.
 * @param metrics A given metric or an array of metrics as NodeMetric object(s).
 * @param print An optional boolean flag for printing out the results. The default value is false.
 * @return Array An array of numbers with the values calculated by applying the given metrics to this sentence.
 */
TreebankSentence.prototype.apply=function(metrics,print)
{
	var print_flag=true;
	if(typeof print!=='undefined') print_flag=print;
	
	var m=null;
	if(metrics instanceof NodeMetric)
	{
		m=new Array();
		m[0]=metrics;
	}
	else m=metrics;
	
	var result=new Array(m.length);
	
	for(var i=0;i<m.length;i++)
	{
		result[i]=m[i].apply(this);
		if(print_flag) output.println(m[i].name+': '+result[i]);
	}
	return result;
}

function isArtificial(word_element)
{
	return word_element.hasAttribute('insertion_id');
}

function isPunctuation(word)
{
	if(word.length==1)
	{
		var ch=word.charAt(0);
		var code=word.charCodeAt(0);
		//console.log(ch+' '+code);
		if(ch=='.' || ch==',' || ch=="'" || ch=='"' || ch==';' || ch=='-' || ch=='(' || ch==')' || code==183 || code==8211 || code==8220 || code==8221 || code==8217 || code==8125)
			return true;
	}
	else if(word=='...') return true;
	else return false;
}

function greekToLatin(word)
{
  
  var lat="";
  for(var i=0;i<word.length;i++)
  {
    var ch=word.charCodeAt(i);
    if(ch==902|| ch==913 || ch==940 || ch==945 || (ch>=7936 && ch<=7951)||ch==8048 || ch==8049 || (ch>=8064 && ch<=8079) || (ch>=8112 && ch<=8124) ) //alphas
    {
      lat+='A';
    } else if(ch==904||ch==917||ch==941||ch==949||(ch>=7952 && ch<=7967)||ch==8050 || ch==8051||ch==8136 || ch==8137) //epsilons
    {
      lat+='E';
    } else if(ch==905||ch==919||ch==942||ch==951||(ch>=7968 && ch<=7983)||ch==8052 || ch==8053|| (ch>=8080 && ch<=8095)|| (ch>=8130 && ch<=8135) || (ch>=8138 && ch<=8140)) //etas
    {
      lat+='H';
    } else if(ch==906||ch==912||ch==921||ch==938||ch==943||ch==953||ch==970||(ch>=7984 && ch<=7999)||ch==8054 || ch==8055 || (ch>=8144 && ch<=8155))//iotas
    {
      lat+='I';
    } else if(ch==908||ch==927||ch==959||ch==972||(ch>=8000 && ch<=8015)||ch==8056 || ch==8057||ch==8084 || ch==8085)//omicrons
    {
      lat+='O';
    } else if(ch==910||ch==933||ch==939||ch==965||ch==971||ch==973||(ch>=8016 && ch<=8031)||ch==8058 || ch==8059 || (ch>=8160 && ch<=8163)|| (ch>=8166 && ch<=8171)) //upsilons
    {
      lat+='Y';
    } else if(ch==911||ch==937||ch==969||ch==974||(ch>=8032 && ch<=8047)||ch==8060 || ch==8061|| (ch>=8096 && ch<=8111)|| (ch>=8178 && ch<=8183)|| (ch>=8186 && ch<=8188)) //omegas
    {
      lat+='W';
    } else if(ch==929||ch==961||ch==8164 || ch==8165 || ch==8172) //rhos
    {
      lat+='R';
    } else if(ch==914||ch==946) //betas
    {
      lat+='B';
    } else if(ch==915||ch==947) //gammas
    {
      lat+='G';
    }else if(ch==916||ch==948) //deltas
    {
      lat+='D';
    }else if(ch==918||ch==950) //zetas
    {
      lat+='Z';
    }else if(ch==920||ch==952) //thetas
    {
      lat+='U';
    }else if(ch==922||ch==954) //kappas
    {
      lat+='K';
    }else if(ch==923||ch==955) //lambdas
    {
      lat+='L';
    }else if(ch==924||ch==956) //mis
    {
      lat+='M';
    }else if(ch==925||ch==957) //nis
    {
      lat+='N';
    }else if(ch==926||ch==958) //ksis
    {
      lat+='J';
    }else if(ch==928||ch==960) //pis
    {
      lat+='P';
    }else if(ch==931||ch==962||ch==963) //sigmas
    {
      lat+='S';
    }else if(ch==932||ch==964) //taus
    {
      lat+='T';
    }else if(ch==934||ch==966) //phis
    {
      lat+='F';
    }else if(ch==935||ch==967) //chis
    {
      lat+='X';
    }else if(ch==936||ch==968) //psis
    {
      lat+='C';
    }else 
    {
       lat+=word.charAt(i);
	  //if(word.charCodeAt(i)!=32) console.log(word.charAt(i)+' '+word.charCodeAt(i)+' '+word);
    }
  }
  
  return lat;
}

/**
 * This class defines and controls the contents of a treebank file given as an xml tree in the metreex.org database.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var t=new TreebankFile();<br>
 * t.onload=function()<br>
 * {<br>
 *		t.apply(metrics,true);<br>
 *	};<br>
 *	t.load('an_xml_file_id');<br></font>
 */
function TreebankFile()
{
	this.id='';
	this.xml=null;
} 

/**
 * This method returns the title property of this file.
 * @return string The title of this file.
 */
TreebankFile.prototype.getTitle=function()
{
	var e=this.xml.getElementsByTagName('field');
	for(var i=0;i<e.length;i++)
	{
		if(e[i].getAttribute('name')=='title')
			return e[i].getAttribute('value');
	}
	return '';
};

/**
 * This method returns the number of sentences in this file.
 * @return number The number of sentences in this file.
 */
TreebankFile.prototype.getNumOfSentences=function()
{
	var e=this.xml.getElementsByTagName('sentence');
	return e.length;
};

/**
 * This method returns a particular sentence from this file.
 * @param i The sequential number of the sentence in need, starting from 0.
 * @return TreebankSentence The sentence returned as a TreebankSentence object. 
 */
TreebankFile.prototype.getSentence=function(i)
{
	var e=this.xml.getElementsByTagName('sentence');
	if(i>=e.length) return null;
	
	var s=new TreebankSentence();
	s.sentence_id=e[i].getAttribute('id');
	s.file=this;
	s.num=i;
	var el=e[i];
	if(el.childNodes.length==1)	s.xml=e[i].childNodes[0];
	else if(el.childNodes.length>1)
	{
		var max_n=el.childNodes[0].childNodes.length;
		var max_e=el.childNodes[0];
		for(var j=1;j<el.childNodes.length;j++)
		{
			if(el.childNodes[j].childNodes.length>max_n)
			{
				max_n=el.childNodes[j].childNodes.length;
				max_e=el.childNodes[j];
			}
		}
		s.xml=max_e;
	}
	s.calculateIdMap();
	return s;
}

/**
 * This method returns the total number of nodes in this file calculated as the sum of the number of nodes of each sentence in this file.
 * @return number The total number of nodes in this file.
 */
TreebankFile.prototype.getNumOfNodes=function()
{
	var n=this.getNumOfSentences();
	var sum=0;
	for(var i=0;i<n;i++)
		sum+=this.getSentence(i).getNumOfNodes();
		
	return sum;
};

/**
 * This method applies one or more given metrics to all sentences in this file. Optionally it can print out the results.
 * @param metrics A given metric or an array of metrics as NodeMetric object(s).
 * @param print An optional boolean flag for printing out the results. The default value is false.
 * @return Array An array of array of numbers with the values calculated by applying the given metrics to all sentences in this file.
 */
TreebankFile.prototype.apply=function(metrics,print)
{
	var print_flag=true;
	if(typeof print!=='undefined') print_flag=print;
	
	var n=this.getNumOfSentences();
	var results=new Array(n);
	for(var i=0;i<n;i++)
	{
		var s=this.getSentence(i);
		results[i]=s.apply(metrics,false);
		if(print_flag)
		{
			var txt=''+s.sentence_id;
			for(var j=0;j<results[i].length;j++)
				txt+=' '+results[i][j].toFixed(2);
			output.println(txt);
		}
	}	
	return results;
}

/**
 * This is a callback method that will be called when this treebank file is loaded. It is initially empty.
 */
TreebankFile.prototype.onload=function(){};

TreebankFile.prototype._onload=function(){if(typeof output !=='undefined') output.println('File id='+this.id+' loaded.');this.onload();};

/**
 * This method loads a treebank file given as an xml treebank file in the metreex.org database. When the loading is complete the onload() method will be called if it was previously defined.
 * @param string The id of the treebank file to be loaded.
 */
TreebankFile.prototype.load=function(id)
{
	this.id=id;
	
	var xmlhttp;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
  		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	var self=this;
	xmlhttp.onreadystatechange=function()
  	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			self.xml=xmlhttp.responseXML;
			self._onload();
		}
	}
	xmlhttp.open("GET","http://www.metreex.org/db/"+id+"/meta/",true);
	xmlhttp.send();
};

/**
 * This class defines and controls the contents of a treebank collection in the metreex.org database.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var t=new TreebankCollection();<br>
 * t.onload=function()<br>
 * {<br>
 *		t.apply(metrics,true);<br>
 *	};<br>
 *	t.load('a_collection_id');<br></font>
 */
function TreebankCollection()
{
	this.collection='';
	this.treebank=new Array();
	this.loading_counter=0;
}

/**
 * This is a callback method that will be called when this treebank collection is loaded. It is initially empty.
 */
TreebankCollection.prototype.onload=function(){};

TreebankCollection.prototype._onload=function(){if(typeof output !=='undefined') output.println(this.loading_counter+' treebanks loaded from collection '+this.collection);this.onload();};

/**
 * This method loads a treebank collection from the metreex.org database. When the loading is complete the onload() method will be called if it was previously defined.
 * @param string The id of the collection to be loaded.
 */
TreebankCollection.prototype.load=function(collection)
{
	if(typeof collection !=='undefined')
		this.collection=collection;
	else this.collection='';
	
	this.loading_counter=0;
	
	var self=this;
	if(this.collection=='')
		vn.http("http://www.metreex.org/task/compileindex.php",{mime:"text/xml"}).then(function(request){
			var data=request.responseXML;
			var objs=data.getElementsByTagName("object");
			for(var i=0;i<objs.length;i++)
			{
				var t=new TreebankFile();
				t._onload=function()
				{
					self.loading_counter+=1;
					if(self.loading_counter==self.treebank.length)
						self._onload();
				};
				self.treebank.push(t);
				t.load(objs[i].getAttribute('id'));
			}
		});
};

/**
 * This method applies one or more given metrics to all treebank files in this collection. Optionally it can print out the results.
 * @param metrics A given metric or an array of metrics as NodeMetric object(s).
 * @param print An optional boolean flag for printing out the results. The default value is false.
 * @return Array An array of array of numbers with the values calculated by applying the given metrics to all treebank files in this collection.
 */
TreebankCollection.prototype.apply=function(metrics,options)
{
	var opt=options||{};
	var print_flag=true;
	if(typeof opt.print!=='undefined') print_flag=opt.print;
	
	for(var i=0;i<this.treebank.length;i++)
	{
		output.println(" {'"+this.treebank[i].getTitle()+"'}");
	}
	
	var results=new Array(this.treebank.length);
	
	if(opt.progress)opt.progress.oneMoreToDo(this.treebank.length);
	
	var i=0;
	var self=this;
	function one_step()
	{
		if(i>=self.treebank.length)return;
		output.println('% '+self.treebank[i].getTitle()+' ('+self.treebank[i].id+')\n');
		//results[i]=this.treebank[i].apply(metrics,print_flag);
		
		var n=self.treebank[i].getNumOfSentences();
		var results2=new Array(n);
		for(var j=0;j<n;j++)
		{
			var s=self.treebank[i].getSentence(j);
			results2[j]=s.apply(metrics,false);
			if(print_flag)
			{
				var txt=''+(i+1)+' '+s.sentence_id;
				for(var k=0;k<results2[j].length;k++)
					txt+=' '+results2[j][k].toFixed(2);
				output.println(txt);
			}
		}	
		results[i]=results2;
		
		i++;
		if(opt.progress)opt.progress.oneMoreDone();
		vn.wait().then(one_step);
	}	
	one_step();
	
	
	return results;
}