'use strict';
var forumData = function () {

var threadIdList =[];
var opinionMeta = ['For','Against','Not Sure'];
var clusterData = [];
var clusterMeta = [];

function processCluster(clusterRaw){
	for(var i=0;i<clusterRaw.length;i++){
		var clRaw = clusterRaw[i];
		var clData = {};
		clData.id=i;
		clData.size = Number(clRaw['-size']);
		clData.title = clRaw.title.phrase;
		clData.post = clRaw.document.map(function(d){
			var id = d['-refid'];
			var idStr = id.split('_');
			var treadId = idStr[0]+'_'+idStr[1];
			var postId = Number(idStr[2]);

			var tIndex = threadIdList.indexOf(treadId);
			if(tIndex!==-1){
				var tData = threadContentData[tIndex];
				var pData = tData.post[(postId-1)];
				pData.clusterId = i;
				var opinion_index= opinionMeta.indexOf(pData.opinion);
				if(opinion_index!==-1){
					var clList = tData.clusterCount[opinion_index];
					var clIndexList = tData.clusterIndex[opinion_index];
					var clIndex = clIndexList.indexOf(pData.clusterId);
					if(clIndex===-1){
						tData.clusterIndex[opinion_index].push(pData.clusterId);
						tData.clusterCount[opinion_index].push([postId]);
					}else{
						if(tData.clusterCount[opinion_index][clIndex].indexOf(postId)===-1){
							tData.clusterCount[opinion_index][clIndex].push(postId);
						}
						
					}
				}
			}
			return id;
		});
		clusterData.push(clData);
	}
}

 
function processAnnotationData(rawData){
	threadIdList = threadContentData.map(function(d){
		return d.id;
	});
	for(var i=0;i<threadContentData.length;i+=1){
		var clusterCount = [];
		var clusterIndex = [];
		for(var j=0;j<opinionMeta.length;j+=1){
			clusterCount.push([]);
			clusterIndex.push([]);
		}
		threadContentData[i].clusterCount =clusterCount; 
		threadContentData[i].clusterIndex =clusterIndex; 
	}

	for(var i=0;i<rawData.length;i++){
		var data = rawData[i];
		var threadId = data.thread_id;
		var postId = Number(data.post_id);
		var threadIndex = threadIdList.indexOf(threadId);
		if(threadIndex === -1){
			continue;
		}
		var tData = threadContentData[threadIndex];
		if(!tData.opinionPostCount){
			tData.opinionPostCount = [];
			tData.opinionPeople=[];
			for(var j=0;j<opinionMeta.length;j++){
				tData.opinionPostCount.push(0);
				tData.opinionPeople.push([]);
			}
		}
		var pData = tData.post[(postId-1)];
		if(pData.post_id !==postId){
			continue;
		}
		pData.unitId = data._unit_id;
		pData.opinion = data.opinion_toward_the_above_topic;
		var confName = 'opinion_toward_the_above_topic:confidence';
		pData.opinionConf = Number(data[confName]);
		var oindex = opinionMeta.indexOf(pData.opinion);
		if(oindex!==-1){
			tData.opinionPostCount[oindex]+=1;
			if(tData.opinionPeople[oindex].indexOf(pData.user_id)===-1){
				tData.opinionPeople[oindex].push(pData.user_id);
			}
		}
	}
}



function generateClusterMatrix(){
	threadContentData.forEach(function(d){
		var matrix = [];
		var clusters = [];

		for(var i=0;i<d.clusterCount.length;i+=1){
			for(var j=0;j<d.clusterCount[i].length;j+=1){
				var cl = {};
				cl.opinion = opinionMeta[i];
				cl.clId = d.clusterIndex[i][j];
				cl.post = d.clusterCount[i][j];
				cl.size = cl.post.length;
				clusters.push(cl);
			}
		}
		var array = []
		for(var i=0;i<clusters.length;i+=1){
		   array.push(0);
		}
		for(var i=0;i<clusters.length;i+=1){
		   matrix.push(array.slice(0));
		   matrix[i][i]= clusters[i].size;
		}
		d.clusters = clusters;
		d.clMatrix = matrix;		
	});
}

//processTreadContentData();
processAnnotationData(annotationData);
processCluster(clusterResult);
generateClusterMatrix();

  return{
  	opinionMeta:opinionMeta,
    threadData:threadContentData,
    clusterData:clusterData
  }
};

