'use strict';
var forumData = function () {

var threadIdList =[];
var opinionMeta = ['For','Against','Not Sure'];
var clusterData = [];
var clusterMeta = [];
var maxReply = 0;

function processCluster(clusterRaw){
	var clusterPostList = [];
	for(var i=0;i<clusterRaw.length;i++){
		var clRaw = clusterRaw[i];
		var clData = {};
		clData.id=i;
		clData.size = Number(clRaw['-size']);
		clData.title = clRaw.title.phrase;
		var pIdList = [];
		var postList = [];
		var docIndex= 0;
		clData.post = clRaw.document.map(function(d){
			var id = d['-refid'];
			if(clusterPostList.indexOf(id)===-1){
				clusterPostList.push(id);
			}else{
				return;
			}
			var idStr = id.split('_');
			var treadId = idStr[0]+'_'+idStr[1];
			var postId = Number(idStr[2]);
			if(pIdList.indexOf(id)!==-1){
				return;
			}else{
				pIdList.push(id);
			}

			var tIndex = threadIdList.indexOf(treadId);
			if(tIndex!==-1){
				var tData = threadContentData[tIndex];
				var pData = tData.post[(postId-1)];
				pData.clusterId = i;
				//pData.clusterPostIndex = docIndex;
				docIndex +=1;
				var clIndex = tData.clusterIndex.indexOf(pData.clusterId);
				if(clIndex===-1){
					var cl = {};
					cl.clId = pData.clusterId;
					cl.post = [pData];
					cl.size = 1;
					tData.clusterIndex.push(cl.clId);
					tData.clusters.push(cl);
				}else{
					var cl = tData.clusters[clIndex];
					cl.post.push(pData);
					cl.size+=1;
				}
			}
			return id;
		});
		clusterData.push(clData);
	}
}

 
function processAnnotationData(rawData){
	var opinionPostCount=[0,0,0];
	threadIdList = threadContentData.map(function(d){
		return d.id;
	});
	for(var i=0;i<threadContentData.length;i+=1){
		threadContentData[i].clusters =[]; 
		threadContentData[i].clusterIndex =[]; 
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
			tData.opinionPeopleID= [];
			for(var j=0;j<opinionMeta.length;j++){
				tData.opinionPostCount.push(0);
				//tData.opinionPeople.push([]);
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

		var people_index =  tData.opinionPeopleID.indexOf(pData.user_id);
		if(people_index===-1){
			var people = {};
			people.id = pData.user_id;
			people.thread_id = threadId;
			people.post = [pData];
			people.postId = [pData.post_id];
			tData.opinionPeopleID.push(people.id);
			tData.opinionPeople.push(people);
		}else{
			var people = tData.opinionPeople[people_index];			
			if(people.postId.indexOf(pData.post_id)===-1){
				people.post.push(pData);
				people.postId.push(pData.post_id)
			}
			
		}
		if(oindex!==-1){
			opinionPostCount[oindex]+=1;
			tData.opinionPostCount[oindex]+=1;
			/*
			if(tData.opinionPeople[oindex].indexOf(pData.user_id)===-1){
				tData.opinionPeople[oindex].push(pData.user_id);
			}*/
		}
	}
	threadContentData.forEach(function(d){
		d.post.forEach(function(p){
			if(!p.opinion){
				p.opinion = opinionMeta[2];
			}
			if(p.post_id===1){
				var t=0;
			}
			var people_index =  d.opinionPeopleID.indexOf(p.user_id);				
			if(people_index===-1){
				var people = {};
				people.id = p.user_id;
				people.post = [p];
				people.postId = [p.post_id];
				people.thread_id = d.id;
				d.opinionPeopleID.push(people.id);
				d.opinionPeople.push(people);			

			}else{
				var people = d.opinionPeople[people_index];
				if(people.postId.indexOf(p.post_id)===-1){
					people.post.push(p);
					people.postId.push(p.post_id);
				}
							
			}
			if(p.replyBy.length>maxReply){
				maxReply = p.replyBy.length;
			}			
		})
	});
}



function generateClusterMatrix(){
	threadContentData.forEach(function(d){
		var matrix = [];
		
		d.clusters.sort(function(a,b){
			return b.size-a.size; 
		});
		var clusters = d.clusters;
		var array = []
		for(var i=0;i<clusters.length;i+=1){
		   array.push(0);
		}
		for(var i=0;i<clusters.length;i+=1){
		   matrix.push(array.slice(0));
		   matrix[i][i]= clusters[i].size;
		}
		d.clMatrix = matrix;		
	});
}

function generatePeopleSummary(){
	threadContentData.forEach(function(d){
		d.opinionPeople.forEach(function(p){
			p.size = p.post.length;
			var i = p.post.length-1;
			while(i>=0){
				var post = p.post[i--];
				if(opinionMeta.indexOf(post.opinion)!==2){
					p.opinion = post.opinion;
					break;
				}
			}
			if(!p.opinion){
				p.opinion = opinionMeta[2];
			}
			var postArray = p.post.filter(function(d){
				return d.opinion ===p.opinion;
			});
			p.rate = postArray.length/p.size;
		});
	   var peopleNodes = {
	   	name:'people',
	   	depth:1,
	   	children:[]
	   };
	   for(var i=0;i<opinionMeta.length;i+=1){
	   	var arr = d.opinionPeople.filter(function(d){
	   		return d.opinion ===opinionMeta[i];
	   	});
	   	var obj = {};
	   	obj.name = opinionMeta[i];
	   	obj.children = arr;
	   	depth:2,
	   	peopleNodes.children.push(obj);
	   }
	   d.peopleNodes = peopleNodes;
	});	
}


function generatePeopleLinks(){
	threadContentData.forEach(function(d){
		//var post = d.post;
		d.opinionPeople.forEach(function(people){
			var neibors = [];
			var neiborId = [];
			people.post.forEach(function(post){
				var replyBy = post.replyBy;
				var replyTo = post.replyTo;

				replyBy.forEach(function(r){
					var rp = d.post[(r-1)];
					var user = rp.user_id;
					var userIndex = neiborId.indexOf(user);
					var opinion = rp.opinion;
					if(userIndex===-1){
						neiborId.push(user);
						var obj = {
							name:user,
							post:[rp],
							opinionCount:{}
						};
						obj.opinionCount[opinion]=1;
						neibors.push(obj);
					}else{
						var userData = neibors[userIndex];
						userData.post.push(rp);
						if(userData.opinionCount[opinion]){
							userData.opinionCount[opinion]+=1;
						}else{
							userData.opinionCount[opinion]=1;
						}
					}

				});
				replyTo.forEach(function(r){
					var rp = d.post[(r-1)];
					var user = rp.user_id;
					var userIndex = neiborId.indexOf(user);
					var opinion = rp.opinion;
					if(userIndex===-1){
						neiborId.push(user);
						var obj = {
							name:user,
							post:[rp],
							opinionCount:{}
						};
						obj.opinionCount[opinion]=1;
						neibors.push(obj);
					}else{
						var userData = neibors[userIndex];
						userData.post.push(rp);
						if(userData.opinionCount[opinion]){
							userData.opinionCount[opinion]+=1;
						}else{
							userData.opinionCount[opinion]=1;
						}
					}
				});

			});

			people.neibors = neibors;
			people.neibors.sort(function(a,b){
				return b.post.length-a.post.length;
			});
		});
	});
}

//processTreadContentData();
processAnnotationData(annotationData);
processCluster(clusterResult);
generateClusterMatrix();
generatePeopleSummary();
generatePeopleLinks();

  return{
  	opinionMeta:opinionMeta,
    threadData:threadContentData,
    clusterData:clusterData,
    maxReply:maxReply
  }
};

