/**
 * Created by gshanmugaiah on 10/14/14.
 */
'use strict';
var COLLECTIVEI = COLLECTIVEI || {};
COLLECTIVEI.CHART = COLLECTIVEI.CHART || {};
COLLECTIVEI.CHART.WIDGET = COLLECTIVEI.CHART.WIDGET || {};
COLLECTIVEI.CHART.WIDGET.forumVisWidget = function (options) {

    if (!options) throw 'options can not be null';
    else if (options && !options.element) throw 'options.element can not be null';

    var defaultVal = {
        transitionDuration:500,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        events: {
            onMouseOver: null
        },
        colorList:['#04B45F','#DF3A01','#BDBDBD'],
        threadRadius:130,
        peopleNodeMaxOpa:.6,
        maxArcHeight:20,
        minArcHeight:5,
        packRadiusRate:0.8,
        maxPeoplePadding:4
    };

    function ForumVis(options) {
        var self = this;
        self.d3Ele = d3.select(options.element);
        self.element = options.element;
        self.data = options.data;  
        self.threadData = options.data.threadData;
        self.opinionMeta = options.data.opinionMeta;
        self.maxReply = options.data.maxReply;
        self.settings = $.extend({}, defaultVal, options);
        self.threadRadius_small_max = 0;
        self.miniThreads=[];
        self.focusThread =[];
        self.angleOffset = 1.57079633;
        self.classNames= {
          cluster:'clusterArc',
          post:'post',
          postLink:'postLink',
          people:'peopleNode',
          replyLink:'replyLink'
        }
    }

    ForumVis.prototype = {
        init: function () {
            this._initChart();
            this._generateChart(this.data);
        },
        redraw:function(data){
          if(data){
            this.data = data;
          }
          this._generateChart(this.data);
        },
        resize:function(){
        },
        _calculateSize:function(){
          var self = this;
          self.chartHeight = $(self.element).find('[data-id=chartView]').height() - self.settings.margin.top - self.settings.margin.bottom;
          self.chartWidth = $(self.element).find('[data-id=chartView]').width() - self.settings.margin.left - self.settings.margin.right;

          self.threadRadius_small_max = (self.chartWidth*0.5/self.threadData.length)*0.8;
          self.threadRadius_small_min = self.threadRadius_small_max*0.6;
          self.overviewHeight = (self.chartWidth/self.threadData.length);

          self.threadRadius = self.chartWidth*0.4/2;
          self.settings.threadRadius = self.threadRadius_small_max;
          var postRange = d3.extent(self.threadData,function(d){
              return d.post.length;
            });
          self.threadMiniRadiusScale = d3.scale.linear().domain([postRange[0], postRange[1]]).range([self.threadRadius_small_min, self.threadRadius_small_max]);                

        },
        _initChart:function(){
            var self = this;
            self._calculateSize();

            self.opinionColor = {};
            for(var i=0;i<self.opinionMeta.length;i+=1){
              self.opinionColor[self.opinionMeta[i]] = self.settings.colorList[i];
            }

            self.chord = d3.layout.chord()
            .padding(.05)
            .sortGroups(d3.ascending );  

            self.diagonal = d3.svg.diagonal.radial();
            self.peopleNodeOpaScale = d3.scale.pow().domain([0, 1]).range([0, self.settings.peopleNodeMaxOpa]);                              
            self.arcHeightScale = d3.scale.linear().domain([0, self.maxReply]).range([self.settings.minArcHeight, self.settings.maxArcHeight]);    
          
            self.threadData.forEach(function(d){
              var thread = {};
              thread.id = d.id;
              thread.miniRadius = self.threadMiniRadiusScale(d.post.length);
              thread.miniRadiusPack = thread.miniRadius * self.settings.packRadiusRate;
              thread.threadData = d;
              thread.isMini = true;
              self.miniThreads.push(thread);
            });
            var focusData = [self.threadData[0]];
            focusData.forEach(function(d){
              var thread = {};
              thread.id = d.id;
              thread.miniRadius = self.threadRadius;
              thread.miniRadiusPack = thread.miniRadius * self.settings.packRadiusRate;
              thread.threadData = d;
              thread.isMini = false;
              self.focusThread.push(thread);
            });

        },       
        _generateChart:function (data) {
            var self = this;

            $(self.element).find('[data-id=chartView]').html('');
            self.chart = self.d3Ele.select('[data-id=chartView]').append('svg')
                .attr("id","forumVis")
                .attr('width', self.chartWidth  + self.settings.margin.left + self.settings.margin.right)
                .attr('height', self.chartHeight + self.settings.margin.top + self.settings.margin.bottom)
                .append("g")
                .attr('transform','translate('+self.settings.margin.left+','+self.settings.margin.top+')');

        self.chart.append("svg:defs")
            .selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
            .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

          var cellWidth = self.chartWidth/self.threadData.length;

          self.miniThreads = self.chart.selectAll('.miniThread').data(self.miniThreads).enter()
          .append('g').attr('class','miniThread')
          .append('g').attr('class','threadRing').attr('id',function(d){
            return 'thread_'+d.id;
          })
          .attr('transform',function(d,i){
            return 'translate('+(cellWidth/2+i*cellWidth)+','+cellWidth/2+')';
          });
          self.miniThreads.call(self._drawThreadRing,self);
          self.miniThreads.call(self._drawPeople,self);

          self.focus = self.chart.selectAll('.focusThread').data(self.focusThread).enter()
          .append('g').attr('class','focusThread')
          .append('g').attr('class','threadRing').attr('id',function(d){
            return 'thread_'+d.id;
          })
          .attr('transform','translate('+(self.chartWidth/2)+','+(self.overviewHeight+self.threadRadius)+')');
          

          self.focusCenter = {x:self.chartWidth/2, y:self.overviewHeight+self.threadRadius};
          self.focus.call(self._drawThreadRing,self);
          self.focus.call(self._drawPeople,self);
          self.focus.call(self._drawLinks,self);

            //self._drawThreadRing();
            //self._drawPeople();
            //self._drawLinks();

        },
          _createLinks:function(post,chord, thread) {

            var self = this;
            //var thread = tr.threadData;

            var target={};
            var source={};
            var link={};
            var link2={};
            var source2={};
              
            var relatedChord=chord.source;
            var relatedNode=thread.peopleNodeDict[post.user_id];
            //var r=linkRadius;
            //var r = self.threadRadius;
            var r = self.threadRadius;
            var packRadius = r * self.settings.packRadiusRate;

            var currX=(r * Math.cos(relatedChord.currentLinkAngle-self.angleOffset));
            var currY=(r * Math.sin(relatedChord.currentLinkAngle-self.angleOffset));

            var a=relatedChord.currentLinkAngle-self.angleOffset; //-90 degrees
            relatedChord.currentLinkAngle=relatedChord.currentLinkAngle+relatedChord.postAngle;
            var a1=relatedChord.currentLinkAngle-self.angleOffset;

            source.x=(r * Math.cos(a));
            source.y=(r * Math.sin(a));
            target.x = relatedNode.x-packRadius;
            target.y=relatedNode.y-packRadius;

            //target.x=relatedNode.x-(chordsTranslate-nodesTranslate);
            //target.y=relatedNode.y-(chordsTranslate-nodesTranslate);
            source2.x=(r * Math.cos(a1));
            source2.y=(r * Math.sin(a1));
            link.source=source;
            link.target=target;
            link2.source=target;
            link2.target=source2;
            return [link,link2];
        },
        _drawLinks:function(g,self){
          var diagonal = self.diagonal;
          //draw arc
          g.each(function(){
            var tr = this.__data__;
            var thread = tr.threadData;
            var innerRadius = tr.miniRadius;
            d3.select(this).selectAll('.clusterArc').each(function(arc){
               var currentAngle = arc.source.startAngle;

               var clusterData =thread.clusters[arc.source.index];
               var pAngle =  (arc.source.endAngle - arc.source.startAngle)/clusterData.post.length;
               arc.source.currentLinkAngle = currentAngle;
               arc.source.postAngle = pAngle;
               arc.postAngle = pAngle;

               var enter = d3.select(this).selectAll('.postArc').data(clusterData.post).enter();

               enter.append('path').attr('class','post')
               .attr('id',function(d){
                return 'post_'+d.thread_id+'_'+d.post_id;
               })
               .attr("d", function (d,i) {
                var newArc={};
                //d.clusterPostIndex = i;
                newArc.startAngle=currentAngle;
                currentAngle+=pAngle;
                newArc.endAngle=currentAngle;
                var arcHeight = self.arcHeightScale(d.replyBy.length);
                var postArc=d3.svg.arc(d,i).innerRadius(innerRadius).outerRadius(innerRadius+arcHeight);
                return postArc(newArc,i);
               })
               .style('fill',function(d){
                return self.opinionColor[d.opinion];
               })
              .on("mouseover", function (d) { self._onMouseOverPost(d);})
              .on("mouseout", function (d) {self._onMouseOut(d); });


               enter.append('path').attr('class','postLink')
               .attr('id',function(d){
                return 'postLink_'+d.thread_id+'_'+d.post_id;
               })
               .attr("d", function (d,i) {
                d.links=self._createLinks(d, arc, thread);
                var diag = diagonal(d.links[0],i);
                diag += "L" + String(diagonal(d.links[1],i)).substr(1);
                diag += "A" + (innerRadius) + "," + (innerRadius) + " 0 0,0 " +  d.links[0].source.x + "," + d.links[0].source.y;
                return diag;
              }).style('fill',function(d){
                return self.opinionColor[d.opinion];
              }).on("mouseover", function (d) { self._onMouseOverLink(d);})
              .on("mouseout", function (d) {self._onMouseOut(d); });

            });   
          });
        },
        _drawPeople:function(g,self){
          g.each(function(){
            var tr = this.__data__;
            var thread = tr.threadData;
            var radius = tr.miniRadius;
            var packRadius =tr.miniRadiusPack; 

            var bubble = d3.layout.pack()
            .sort(null)
            .size([packRadius*2, packRadius*2])
            .value(function(d) { return d.size; })
            .padding(1.5);


            var nodes = bubble.nodes(thread.peopleNodes);
            var peopleArea = d3.select(this).append('g')
            .attr('transform','translate('+(0-packRadius)+','+(0-packRadius)+')');
            var drawNodes = nodes.filter(function(d){
              return d.depth>1;
            });
            thread.peopleNodeDict = {};
            drawNodes.forEach(function(d){
             thread.peopleNodeDict[d.id]=d;
            });

            var peopleNode = peopleArea.selectAll('.peopleNode')
            .data(drawNodes).enter().append('g')
            .attr('class','peopleNode').attr('id',function(d){
              return 'peopleNode_'+d.id;
            })
            .attr('transform',function(d){
              return 'translate('+d.x+','+d.y+')';
            })
            .on("mouseover", function (d) { self._onMouseOverPeople(d);})
            .on("mouseout", function (d) {self._onMouseOut(d); });

            peopleNode.append('circle').attr('class','peopleCircle')
            .attr('r', function(d){
              return d.r;
            }).style('fill',function(d){
              return self.opinionColor[d.opinion];
            }).style('fill-opacity',function(d){
              return self.peopleNodeOpaScale(d.rate);
            })
            .style('stroke', function(d){
              return self.opinionColor[d.opinion];
            });

            if(tr.isMini){
              return;
            }

            peopleNode.each(function(pd){
              var people_ring = Math.max(pd.r*0.8, pd.r-self.settings.maxPeoplePadding);
              var postCount = 0;
              pd.post.forEach(function(post){
                postCount+= post.opinion===self.opinionMeta[2]?1:2;
              });
              var r = people_ring/postCount;
              //var r = people_ring/pd.post.length;
              var rings = d3.select(this).selectAll('.postRing')
              .data(pd.post).enter().append('g').attr('class','postRing');

              var rpos = 0;

              rings.append('path').attr("d", function (d,i) {
                var newArc={};
                //d.clusterPostIndex = i;
                newArc.startAngle=0;
                newArc.endAngle=360*(Math.PI/180);

                var width = post.opinion===self.opinionMeta[2]?r:2*r;
                
                var postArc=d3.svg.arc(d,i).innerRadius(i*r).outerRadius(i*r+r);
                return postArc(newArc,i);
               })
               .style('fill',function(d){
                return self.opinionColor[d.opinion];
               });

            });


          });
        },
        _drawThreadRing:function(g,self){
          g.each(function(){
            var tr = this.__data__;
            var thread = tr.threadData;
            self.chord.matrix(thread.clMatrix); 
            var chords = self.chord.chords();
            var radius = tr.miniRadius;

            thread.chordDict = {};
            chords.forEach(function(d,i){
              d.clId = thread.clusters[i].clId;
              thread.chordDict[d.clId] = d;
            });
            thread.chords = chords;

            var arcGroup = d3.select(this).selectAll(".clusterArc")
            .data(chords);

            var enter =arcGroup.enter().append("g").attr("class","clusterArc").attr('id',function(d){
              return self.classNames.cluster+'_'+d.clId;
            });
          
            enter.append("path").attr('class', function(d,i){
              return i%2===0?'clusterArcBorder even':'clusterArcBorder odd';
            })
                .attr("d", function (d,i) {
                var arc=d3.svg.arc(d,i).innerRadius(radius).outerRadius(radius);
                return arc(d.source,i);
            });

          });

          //draw Pie
          g.each(function(){
            var tr = this.__data__;
            if(!tr.isMini){
              return;
            }
            var thread = tr.threadData;            
            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d; });
            var arc = d3.svg.arc()
            .outerRadius(tr.miniRadius)
            .innerRadius(0);
                var g  = d3.select(this).selectAll(".pieArc")
                  .data(function(d){
                    return pie(d.threadData.opinionPostCount);
                  })
                 .enter().append("g")
                  .attr("class", "pieArc");
            
                g.append("path")
                .attr("d", arc)
                .style("fill", function(d,i) { return self.opinionColor[self.opinionMeta[i]]; });

             });
                    
        },
        _getPostPos:function(thread,source){
           var self = this;
           var pos;
           source.each(function(d){
            var clId = d.clusterId;
            var clIndex = d.clusterPostIndex;
            var r;
            thread.each(function(d){
              r = d.miniRadius;
            });
            var clusterArc = thread.selectAll('#'+self.classNames.cluster+'_'+clId);
            var sourceX,sourceY;
            clusterArc.each(function(arc){
              if(!arc.postAngle){
                return;
              }
              var source = arc.source;
              var startAngle = source.startAngle + clIndex*arc.postAngle - self.angleOffset;
              var midAngle = startAngle + arc.postAngle/2;
              //var startAngle = source.startAngle+clIndex*arc.postAngle;
              //var endAngle = startAngle+arc.postAngle/2;
              sourceX=(r * Math.cos(midAngle));
              sourceY=(r * Math.sin(midAngle));              
            });
            pos = {x:sourceX,y:sourceY};
          });
           return pos;
        },
        _drawReplyLink:function(thread,source,target){
          var self = this;
          var sourcePos = self._getPostPos(thread,source);
          var targetPos = self._getPostPos(thread,target);
          thread.append('line').attr('class',self.classNames.replyLink)
          .attr('x1',sourcePos.x).attr('x2',targetPos.x)
          .attr('y1',sourcePos.y).attr('y2',targetPos.y).style('stroke','black')
          .attr("marker-end", "url(#end)");          

        },
        _highlightPost:function(p){
              p.classed('fade',false);
              p.classed('highlight',true);
        },
        _onMouseOverPost:function(d){
          //'postLink_'+d.thread_id+'_'+d.post_id;
          var self = this;
          var thread = self.chart.selectAll('.focusThread').selectAll('#thread_'+d.thread_id);
          thread.selectAll('.post').classed('fade',true);
          var selectPostArc = thread.selectAll('#post_'+d.thread_id+'_'+d.post_id);
          self._highlightPost(selectPostArc);

          var replyTo = [];
          var replyFrom  = [];
          selectPostArc.each(function(d){
            var selectPost = d3.select(this);
            d.replyTo.forEach(function(r){
              var rp = thread.selectAll('#post_'+d.thread_id+'_'+r);
              self._highlightPost(rp);
              self._drawReplyLink(thread,selectPost,rp);
            });
            d.replyBy.forEach(function(r){
              var rp = thread.selectAll('#post_'+d.thread_id+'_'+r);
              self._highlightPost(rp);
              self._drawReplyLink(thread,rp,selectPost);
            });
          })


          var postLink = thread.selectAll('#postLink_'+d.thread_id+'_'+d.post_id).classed('highlight', true);
          thread.selectAll('.peopleNode').classed('fade',true);
          thread.selectAll('#peopleNode_'+d.user_id).classed('fade',false);
          
          
        },
        _onMouseOut:function(d){
          var self = this;
          var thread = self.chart.selectAll('#thread_'+d.thread_id);  
          thread.selectAll('.post').classed('highlight',false);
          thread.selectAll('.post').classed('fade',false);
          thread.selectAll('.postLink').classed('highlight', false);
          thread.selectAll('.peopleNode').classed('fade',false);
          thread.selectAll('.'+self.classNames.replyLink).remove();           
          /*
          thread.selectAll('#post_'+d.thread_id+'_'+d.post_id).classed('highlight',false);
          thread.selectAll('#postLink_'+d.thread_id+'_'+d.post_id).classed('highlight', false);
          thread.selectAll('.peopleNode').classed('fade',false);*/
        },
        _onMouseOverPeople:function(d){
          var self = this;
          var thread = self.chart.selectAll('#thread_'+d.thread_id);
          d.post.forEach(function(post){
              thread.selectAll('#post_'+d.thread_id+'_'+post.post_id).classed('highlight',true);
              thread.selectAll('#postLink_'+d.thread_id+'_'+post.post_id).classed('highlight', true);
          });
        },
        _onMouseOverLink:function(d){
          var self = this;
           self._onMouseOverPost(d);

        }

    };
    var forumVis = new ForumVis(options);
    forumVis.init();
    return {
        options: forumVis.settings,
        redraw: function () {
            forumVis.redraw.apply(forumVis, arguments);
        },
        resize:function(){
            forumVis.resize.apply(forumVis, arguments);
        }
    };
};