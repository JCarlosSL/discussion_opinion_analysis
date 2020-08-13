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
        colorList:['#FF0000','#00FF00','#848484','#FFFF00','#0000FF','#6AD2DA','#572364','#F88E1D'],/**/
        threadRadius:160,
        peopleNodeMaxOpa:.6,
        maxArcHeight:40,/*radio nombres*/
        topLevelArcHeight:30,/*alto de top levelpost arch*/
        minArcHeight:5,/*alto minimo de los arch*/
        packRadiusRate:0.8,/*radio q contiene a las burbujas dentro del circuclo*/
        maxPeoplePadding:21,/**/
        peopleOpinionRate:1,
        peopleFocusRate:1,
        timelineLabelHeight:40,
        timeBarWidth:6,
        maxTooltipChartCount:200,
        clusterMarkSize:5,
        threadArcHeight:2,
        clusterSummaryArcHeight:10,
        legendHeight:80
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
          replyLink:'replyLink',
          postRing:'postRing',
          postBar:'postBar'
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
          self.overviewHeight = $(self.element).find('[data-id=overview]').height() - self.settings.margin.top - self.settings.margin.bottom;
          self.overviewWidth = $(self.element).find('[data-id=overview]').width() - self.settings.margin.left - self.settings.margin.right;

          self.chartHeight = $(self.element).find('[data-id=chartView]').height() - self.settings.margin.top - self.settings.margin.bottom;
          self.chartWidth = $(self.element).find('[data-id=chartView]').width() - self.settings.margin.left - self.settings.margin.right;
  
          self.timeViewHeight = $(self.element).find('[data-id=timeView]').height() - self.settings.margin.top - self.settings.margin.bottom;
          self.timeViewtWidth = $(self.element).find('[data-id=timeView]').width() - self.settings.margin.left - self.settings.margin.right;
   
          self.threadRadius_small_max = self.overviewWidth*0.3/2;
          //self.threadRadius_small_max = (self.chartWidth*0.5/self.threadData.length)*0.65;
          self.threadRadius_small_min = self.threadRadius_small_max*0.8;
          self.overViewThreadHeight = self.threadRadius_small_max*2 + 60;
          //self.overviewHeight = (self.chartWidth/self.threadData.length);

          self.threadRadius = self.chartWidth*0.52/2;
          self.settings.threadRadius = self.threadRadius_small_max;
          var postRange = d3.extent(self.threadData,function(d){
              return d.post.length;
            });
          self.threadMiniRadiusScale = d3.scale.sqrt().domain([postRange[0], postRange[1]]).range([self.threadRadius_small_min, self.threadRadius_small_max]);                

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


        },       
        _generateChart:function (data) {
            var self = this;
            self._generateOverview();

            //$(self.element).find('[data-id=chartView]').html('');
            self.chart = self.d3Ele.select('[data-id=chartView]').append('svg')
                .attr("id","forumVis")
                .attr('width', self.chartWidth  + self.settings.margin.left + self.settings.margin.right)
                .attr('height', self.chartHeight + self.settings.margin.top + self.settings.margin.bottom)
                .append("g")
                .attr('transform','translate('+self.settings.margin.left+','+self.settings.margin.top+')');

            self.timeView = self.d3Ele.select('[data-id=timeView]').append('svg')
                .attr("id","timeView")
                .attr('width', self.timeViewtWidth  + self.settings.margin.left + self.settings.margin.right)
                .attr('height', self.timeViewHeight + self.settings.margin.top + self.settings.margin.bottom)
                .append("g")
                .attr('transform','translate('+self.settings.margin.left+','+self.settings.margin.top+')'); 

            var arrowData = [];
            for(var i=0;i<self.opinionMeta.length;i++){
              arrowData.push('end_'+i);
            }

            self.chart.append("svg:defs")
                .selectAll("marker")
                .data(arrowData)      // Different link/path types can be defined here
                .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 15)
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("svg:path")
                .style('fill',function(d){
                  var opinionIndex = Number(d.split('_')[1]);
                  var opinion = self.opinionMeta[opinionIndex];
                  return self.opinionColor[opinion];
                })
                .attr("d", "M0,-5L10,0L0,5");


            self.chart.append("svg:defs")
                .selectAll("marker")
                .data(['end'])      // Different link/path types can be defined here
                .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 0)
                .attr("refY", 0)
                .attr("markerWidth", 10)
                .attr("markerHeight", 10)
                .attr("orient", "auto")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

                var filter = self.chart.select("defs")
                .append("filter")
                .attr("id", "blur")
                .append("feGaussianBlur")
                .attr("stdDeviation", 5);

              self._generateFocusThread(self.threadData[0]);
              self._generateTimeView(self.threadData[0]);
              self._drawLegend();
            //self._drawThreadRing();
            //self._drawPeople();
            //self._drawLinks();
        },
          _generateOverview:function(){
            var self = this;
            self.overview = self.d3Ele.select('[data-id=overview]').append('svg')
                .attr("id","forumVis")
                .attr('width', self.overviewWidth  + self.settings.margin.left + self.settings.margin.right)
                .attr('height', self.overviewHeight + self.settings.margin.top + self.settings.margin.bottom)
                .append("g")
                .attr('transform','translate('+self.settings.margin.left+','+self.settings.margin.top+')');

              //var cellWidth = self.chartWidth/self.threadData.length;
              var miniContainer = self.overview.selectAll('.miniThread').data(self.miniThreads).enter();
              var offSet = 12;
              //230*160


              self.miniThreads = miniContainer
              .append('g').attr('class','miniThread')
              .attr('id',function(d){
                return 'miniThread_'+d.id;
              })
              .attr('transform',function(d,i){
                return 'translate('+(self.threadRadius_small_max+offSet)+','+(i*self.overViewThreadHeight+ self.overViewThreadHeight/2)+')';
              });  
              self.miniThreads.append('rect')
              .attr('class','miniBackground')
              .attr('x', 0-(self.threadRadius_small_max+offSet))
              .attr('y', 0-self.overViewThreadHeight/2)
              .attr('rx',10)
              .attr('ry',10)
              .attr('height', self.overViewThreadHeight)
              .attr('width', self.overviewWidth)
              .attr('display','none');

              self.miniThreads.append('g').attr('class','threadRing');

              var w = self.overviewWidth - 2*self.threadRadius_small_max - offSet;

              self.miniThreads.append('g').attr('class','word')
              .append("svg:image")
               .attr('x',self.threadRadius_small_max)
               .attr('y',0-self.overViewThreadHeight/2)
               .attr('width', w-offSet)
               .attr('height', self.overViewThreadHeight)
               .attr("xlink:href",function(d,i){
                return "images/thread"+(i+1)+".png";
               });

              self.miniThreads.on('click',function(d){
                self._generateFocusThread(d.threadData);
				self._generateTimeView(d.threadData);
              });
              self.miniThreads.call(self._drawThreadRing,self);
              self.miniThreads.call(self._drawPeople,self); 
              self.miniThreads.call(self._drawLinks,self);                           
          },
          _generateTimeView:function(threadData){
            var self = this;
            self.timeView.selectAll('.timelineContainer').remove();
            if(!threadData){
                return;
            }

            var timelineContainer = self.timeView.append('g').attr('class','timelineContainer');
            var timeRange = [threadData.post[1].time,threadData.post[threadData.post.length-1].time ];
            var timelineXScale = d3.time.scale().range([0, self.timeViewtWidth]).domain(timeRange);
            var timelineHeight = self.timeViewHeight - self.settings.timelineLabelHeight;
            var minH = timelineHeight*0.2, maxH = timelineHeight*0.9;
            var timelineYScale = d3.scale.linear().domain([0, self.maxReply]).range([minH, maxH]);
            self.timelineXScale = timelineXScale;

            var bars = timelineContainer.selectAll('.'+self.classNames.postBar).data(threadData.post)
            .enter().append('g').attr('class',self.classNames.postBar).attr('id',function(d){
              return self.classNames.postBar+'_'+d.post_id;
            })
            .attr('transform',function(d){
              var xpos = timelineXScale(d.time);
              return 'translate('+xpos+','+(0)+')';
            });

            bars.append('rect').attr('y', function(d){
                var reply = d.replyBy.length+d.replyTo.length;
                var h = timelineYScale(reply);
                return timelineHeight-h;
            }).attr('width',self.settings.timeBarWidth).attr('height',function(d){
                var reply = d.replyBy.length+d.replyTo.length;
                var h = timelineYScale(reply);
                return h;
            }).style('fill',function(d){
              return self.opinionColor[d.opinion];
            });

            timelineContainer.append("g")
            .attr("class", "x axis")
            .attr('transform','translate(0,'+timelineHeight+')')
            .call(d3.svg.axis().scale(timelineXScale).orient("bottom"));


            self.timeMarkYpos = timelineHeight - maxH - 10;
            var mark = timelineContainer.append('g').attr('class','timeMark')
            .attr('transform','translate('+0+','+self.timeMarkYpos+')').attr('display','none');
            mark.append('line')
            .attr('y1',0).attr('y2',0.1)
            .attr("marker-end", "url("+'#end'+")");
            //var 

          },
          _generateFocusThread:function(threadData){
              var self = this;
              d3.selectAll('.miniThread').selectAll('.miniBackground').attr('display','none');
              d3.select('#miniThread_'+threadData.id).selectAll('.miniBackground').attr('display','block');
              if(self.focus){
                self.chart.selectAll('.focusThread').remove();
              }
              self.focusThread = [];
              if(!threadData){
                return;
              }
              var focusData = [threadData];
              focusData.forEach(function(d){
              var thread = {};
              thread.id = d.id;
              thread.miniRadius = self.threadRadius;
              thread.miniRadiusPack = thread.miniRadius * self.settings.packRadiusRate;
              thread.threadData = d;
              thread.isMini = false;
              self.focusThread.push(thread);
            });
              
              self.focus = self.chart.selectAll('.focusThread').data(self.focusThread).enter()
              .append('g').attr('class','focusThread')
              .append('g').attr('class','threadRing').attr('id',function(d){
                return 'thread_'+d.id;
              }).attr('transform','translate('+(self.chartWidth/2)+','+(self.chartHeight-self.settings.legendHeight)/2+')');
              
              self.focusCenter = {x:self.chartWidth/2, y:self.threadRadius};
              self.focus.call(self._drawThreadRing,self);
              self.focus.call(self._drawPeople,self);
              self.focus.call(self._drawLinks,self);
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
               if(tr.isMini){

                return;
               }

               var clusterData =thread.clusters[arc.source.index];
               var pAngle =  (arc.source.endAngle - arc.source.startAngle)/clusterData.post.length;
               arc.source.currentLinkAngle = currentAngle;
               arc.source.postAngle = pAngle;
               arc.postAngle = pAngle;

               var enter = d3.select(this).selectAll('.postArc').data(clusterData.post).enter();
               enter.append('path').attr('class',function(d){
                var topLevel = d.post_id===1?' toplevel':'';
                return 'post '+'cluster'+clusterData.clId+topLevel;
               })
               .attr('id',function(d,i){
                d.clusterPostIndex = i;
                return 'post_'+d.thread_id+'_'+d.post_id;
               })
               .attr("d", function (d,i) {
                var newArc={};
                //d.clusterPostIndex = i;
                newArc.startAngle=currentAngle;
                currentAngle+=pAngle;
                newArc.endAngle=currentAngle;
                var arcHeight = self.arcHeightScale(d.replyBy.length);
                if(tr.isMini){
                  arcHeight*=0.5;
                }
                if(d.post_id===1){
                  arcHeight = self.settings.topLevelArcHeight;
                }
                newArc.height = arcHeight;
                var postArc=d3.svg.arc(d,i).innerRadius(innerRadius).outerRadius(innerRadius+arcHeight);
                d.arcData = newArc;
                return postArc(newArc,i);
               })
               .attr('display',tr.isMini?'none':'block')
               .style('fill',function(d){
                return self.opinionColor[d.opinion];
               })
              .on("mouseover", function (d) { self._onMouseOverPost(d);})
              .on("mouseout", function (d) {self._onMouseOut(d); });

                if(tr.isMini){
                  return;
                }


               enter.append('path').attr('class',self.classNames.postLink)
               .attr('id',function(d){
                return self.classNames.postLink+'_'+d.thread_id+'_'+d.post_id;
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
            .style('stroke', function(d){
              return self.opinionColor[d.opinion];
            });


            peopleNode.append('circle').attr('class','peopleCircle')
            .attr('r', function(d){
              return d.r;
            }).style('fill',function(d){
              return self.opinionColor[d.opinion];
            }).style('fill-opacity',function(d){
              return self.peopleNodeOpaScale(d.rate);
            });
            //.attr("filter", "url(#blur)");

            if(tr.isMini){
              return;
            }
            peopleNode.on("mouseover", function (d) { 
              self._onMouseOverPeople(d);
              self._highlightPeopleRing(d3.select(this));
            })
            .on("mouseout", function (d) {
              self._onMouseOut(d); });
            peopleNode.call(self._drawPeoplePostRing,self);
          });
        },
        _drawThreadRing:function(g,self){
          /*
          var computeTextRotation = function(d) {
            return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
          }*/

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
                var arc=d3.svg.arc(d,i).innerRadius(radius).outerRadius(radius+self.settings.threadArcHeight);
                return arc(d.source,i);
            });

            if(tr.isMini){
              arcGroup.call(self._summaryMiniCluster, self, tr, this);
              return;
            }

            arcGroup.each(function(arc, i){
              var midAngle = (arc.source.startAngle+arc.source.endAngle)/2-self.angleOffset;
              //var midAngle = arc.source.startAngle;
              var r = self.threadRadius + 140;
              var x = Math.cos(midAngle)*r;
              var y = Math.sin(midAngle)*r;

              
              
              d3.select(this).append('g').attr('class','clusterMark')
              .append('circle')
              .attr('cx',x).attr('cy',y)
              .attr('r',self.settings.clusterMarkSize)
              .attr('display','none')
              .on('mouseover',function(d){
                self._onMouseOverCluster(d, thread);
              }).on('mouseout',function(d){
                self._onMouseOut(thread);
              });
            });
            arcGroup.call(self._placeLabels, self,thread);
            /*
            arcGroup.append('text').attr('transform',function(d){
              var angle = getAngle(d.source);
              var midAngle = (d.source.startAngle+d.source.endAngle)/2-self.angleOffset;
              //var midAngle = arc.source.startAngle;
              var r = self.threadRadius + 80;
              var x = Math.cos(midAngle)*r;
              var y = Math.sin(midAngle)*r;

              return 'translate('+x+','+y+')'+'rotate(' + angle + ')';
            }).attr('text-anchor','middle')
            .text('abcsdfsf');*/

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
        _summaryMiniCluster:function(g,self, tr, threadObj){
          var threadData = tr.threadData;
          var radius = tr.miniRadius;
          var summaryArc=d3.svg.arc()
          .innerRadius(function(d){
            return d.innerRadius
          }).outerRadius(function(d){
            return d.outerRadius
          }).startAngle(function(d){
            return d.startAngle;
          }).endAngle(function(d){
            return d.endAngle;
          });

          g.each(function(d){
            var angle =d.source.endAngle - d.source.startAngle;
            var clusterData = threadData.clusters.filter(function(cl){
              return d.clId===cl.clId;
            });
            var postCount = clusterData[0].post.length;
            var start = d.source.startAngle;
            var arcData = [];
            var arcHeight = 2;
            var inner = radius+self.settings.threadArcHeight;
            var outter = inner + self.settings.clusterSummaryArcHeight;
            for(var i=0;i<self.opinionMeta.length;i+=1){
              var opinion = self.opinionMeta[i];
              var oPost = clusterData[0].post.filter(function(p){
                return p.opinion ===opinion;
              });
              var oAngle = oPost.length*angle/postCount;
              var obj = {
                startAngle:start,
                endAngle:(start+oAngle),
                innerRadius:inner,
                outerRadius:outter,
                opinion:opinion
              }
              start+=oAngle;
              arcData.push(obj);
            }

              var entry = d3.select(threadObj).selectAll('.summary')
              .data(arcData).enter().append('g').attr('class','summaryArc'+d.clId);
              
              entry.append('path').attr('class','summaryArc')
              .attr('d', summaryArc)
              .style('fill',function(d){
                return self.opinionColor[d.opinion];
                //return self.opinionColor[d.opinionIndex];
              });            

          });
        },
        _placeLabels:function(g, self, thread){
          var getAngle = function angle(d) {
              var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
              return a > 90 ? a - 180 : a;
          }
          var labelArc=d3.svg.arc()
          .innerRadius(function(d){
            return d.centerRadius
          }).outerRadius(function(d){
            return d.centerRadius
          }).startAngle(function(d){
            return d.startAngle;
          }).endAngle(function(d){
            return d.endAngle;
          });

          g.each(function(d, count){
              var angle =d.source.endAngle - d.source.startAngle;
              var evenLabel = count%2===0?'even':'odd';
            
              if(angle>1){
                var max_level = 2;
                var max_label = 9;
                var level = 0, label = 0;
                var minAngle = 0.3;
                var max_per_level = 4;                
                /*
                while(level<=max_level&&label<max_label){
                  level+=1;

                }*/
                var lAngle = 0;
                var lCount = max_per_level;
                while(lAngle<minAngle&&lCount>0){
                  lAngle = angle/lCount;
                  lCount-=1;
                }
              var fontSize = lAngle* 50;
              var keyword = self.data.clusterData[d.clId].title;
              var labelData = [];
              var clusterId = d.clId;

              var labelCount = 0;
              for(var j=0;j<max_level;j+=1){
                var start = d.source.startAngle;
                var end = d.source.endAngle;                
                for(var i=0;i<(lCount+1);i+=1){
                  if(labelCount>=max_label){
                    continue;
                  }

                  var angleData = {
                    clId:d.clId,
                    startAngle:start,
                    endAngle:(start+lAngle),
                    centerRadius:(self.threadRadius + self.settings.maxArcHeight+30*j),
                    text:keyword[labelCount]
                  }
                  labelData.push(angleData);            
                  start+=lAngle;
                  labelCount+=1;
                }
              }

              var entry = self.focus.selectAll('.big')
              .data(labelData).enter().append('g');
              
              entry.append('path').attr('d', labelArc)
                .attr('id', function (d, i, j) {
                    return 'arc-label'+clusterId+'_' + i + '-' + j;
                });

              var label = entry.append('text')
              .attr('class','clusterLabel'+' '+evenLabel)
              .style('font-size', fontSize+'px')
              .attr('text-anchor', 'middle');
              
              label.on('mouseover',function(d){
                self._onMouseOverCluster(d.clId, thread);
              }).on('mouseout',function(d){
                self._onMouseOut(thread);
              });

              label.append('textPath')
                .attr('startOffset', '25%')
                .attr('xlink:href', function(d, i, j) {
                    return '#arc-label'+clusterId+'_' + i + '-' + j;
                })
                .text(function(d) {
                    return d.text;
                });

              return;
            }
            var lAngle = 0;
            var max = 5;
            var maxFont = 20;
            var lCount = max;
            var minAngle = 0.06;
            var endAnchor_Angle = 3.1;
            while(lAngle<minAngle&&lCount>0){
              lAngle = angle/lCount;
              lCount-=1;
            }
            var fontSize = Math.min(maxFont, lAngle*200);
            var start = d.source.startAngle;
            var end = d.source.endAngle;
            var keyword = self.data.clusterData[d.clId].title;
            for(var i=0;i<(lCount+1);i+=1){
              var angleData = {
                clId:d.clId,
                startAngle:start,
                endAngle:(start+lAngle)
              }
              var labelAngle = getAngle(angleData);
              //var label = 
              var midAngle = (start+start+lAngle)/2-self.angleOffset;
              var anchor_Angle = (start+start+lAngle)/2;
              //var midAngle = arc.source.startAngle;
              var r = self.threadRadius + self.settings.maxArcHeight;
              var x = Math.cos(midAngle)*r;
              var y = Math.sin(midAngle)*r;
              var labels = d3.select(this)
              .append('g')
              .append('text')
              .attr('class','clusterLabel ' +evenLabel)
              .style('font-size',fontSize+'px')
              .attr('transform','translate('+x+','+y+')'+'rotate(' + labelAngle + ')')
              .attr('text-anchor',anchor_Angle<endAnchor_Angle?'start':'end')
              .text(keyword[i]);

              labels.on('mouseover',function(){
                self._onMouseOverCluster(d.clId, thread);
              }).on('mouseout',function(d){
                self._onMouseOut(thread);
              });            
              start+=lAngle;
            }

            //d3.select(this).append('text').text('abc');
          })

        },
        _highlightPeopleRing:function(peopleNode, post){
          var self = this;
          peopleNode.selectAll('.peopleCircle').attr("filter", "url(#blur)");
          peopleNode.selectAll('.postRingArea').attr('display','block');
          if(post){
            peopleNode
            .selectAll('.postRingCircle').classed('fadeout',true);

            peopleNode.select('#'+self.classNames.postRing+'_'+post.post_id)
            .selectAll('.postRingCircle').classed('fadeout',false);
          }
        },
        _drawPeoplePostRing:function(g, self, post){
          var selectId = null;
          g.each(function(){
            var pd = this.__data__;
              //d3.select(this).selectAll('.postRingArea').remove();

              var people_ring = Math.max(pd.r, pd.r-self.settings.maxPeoplePadding);
              var postCount = 0;
              pd.post.forEach(function(p){
                var count;
                if(p.post_id===selectId){
                  count = self.settings.peopleFocusRate;
                }else if(p.opinion===self.opinionMeta[2]){
                  count = 1;
                }else{
                  count = self.settings.peopleOpinionRate;
                }
                postCount+= count;
              });
              var r = people_ring/postCount;
              //var r = people_ring/pd.post.length;
              var ringArea = d3.select(this).append('g').attr('class','postRingArea')
              .attr('display','none');
              
              var rings = ringArea.selectAll('.'+self.classNames.postRing)
              .data(pd.post).enter().append('g').attr('class',self.classNames.postRing)
              .attr('id',function(d){
                return self.classNames.postRing+'_'+d.post_id;
              });

              var rpos = 0;
              rings.append('path').attr('class','postRingCircle')
              .attr("d", function (d,i) {
                var newArc={};
                //d.clusterPostIndex = i;
                newArc.startAngle=0;
                newArc.endAngle=360*(Math.PI/180);

                var width =d.post_id===selectId?self.settings.peopleFocusRate*r: d.opinion===self.opinionMeta[2]?r:self.settings.peopleOpinionRate*r;

                var postArc=d3.svg.arc(d,i).innerRadius(rpos).outerRadius(rpos+width);

                rpos+=width;
                return postArc(newArc,i);
               })
               .style('fill',function(d){
                return self.opinionColor[d.opinion];
               });
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
          var getSweap = function(startx,starty,endx,endy){
            var sweap = 0;
            if(starty>endy){
              sweap =endx>startx?1: 0
            }else{
              sweap = endx>startx?0: 1
            }
            return sweap;
          }
          var sourcePos = self._getPostPos(thread,source);
          var targetPos = self._getPostPos(thread,target);
          var sourceOpinion;
          source.each(function(d){
            sourceOpinion = d.opinion;
          });
          var opinionIndex = self.opinionMeta.indexOf(sourceOpinion);
          var arrowId = '#end_'+opinionIndex;
          thread.append('path').attr('class',self.classNames.replyLink)
          //.attr('x1',sourcePos.x).attr('x2',targetPos.x)
          //.attr('y1',sourcePos.y).attr('y2',targetPos.y)
          .attr('d',function(){
            var dx = sourcePos.x - targetPos.x,
            dy = sourcePos.y - targetPos.y,
            dr = Math.sqrt(dx * dx + dy * dy);
            var sweap = getSweap(sourcePos.x,sourcePos.y,targetPos.x,targetPos.y);
            return "M" + 
            sourcePos.x + "," + 
            sourcePos.y + "A" + 
            dr + "," + dr + " 0 0,"+sweap + 
            targetPos.x + "," + 
            targetPos.y;
          })
          .style('stroke',self.opinionColor[sourceOpinion])
          .attr("marker-end", "url("+arrowId+")");          
          /*
          thread.append('line').attr('class',self.classNames.replyLink)
          .attr('x1',sourcePos.x).attr('x2',targetPos.x)
          .attr('y1',sourcePos.y).attr('y2',targetPos.y).style('stroke','black')
          .attr("marker-end", "url(#end)");          */

        },
        _highlightPost:function(p, select){
          var self = this;
              p.classed('fade',false);
              p.classed('highlight',true);
              p.each(function(d){
                if(d.post_id!==undefined){
                  self.timeView.selectAll('#'+self.classNames.postBar+'_'+d.post_id).classed('fade',false);
                }
                if(select){
                  self.timeView.selectAll('.timeMark').attr('display','block')
                  .attr('transform','translate('+self.timelineXScale(d.time)+','+self.timeMarkYpos+')');
                }
              });
        },
        _mytrick:function(p,val){
          	  var self = this;
              p.each(function(d){
          		self._showTooltip(val,d,self.opinionMeta.indexOf(d.opinion));
              });
        },
        _highlightMiniThreadPeople:function(user){
          d3.selectAll('.miniThread').each(function(d){
            if(user){
              d3.select(this).selectAll('.peopleNode').classed('fade',true);
              d3.select(this).selectAll('#peopleNode_'+user).classed('fade',false);
            }else{
              d3.select(this).selectAll('.peopleNode').classed('fade',false);
            }
            //.selectAll('#peopleNode_'+d.id)
          });
        },
        _onMouseOverPost:function(d){
          //'postLink_'+d.thread_id+'_'+d.post_id;
		  var val = window.pageYOffset + 40;
          var self = this;
          var thread = self.chart.selectAll('.focusThread').selectAll('#thread_'+d.thread_id);
          
          //highlight post
          thread.selectAll('.post').classed('fade',true);
          var selectPostArc = thread.selectAll('#post_'+d.thread_id+'_'+d.post_id);
          self.timeView.selectAll('.'+self.classNames.postBar).classed('fade',true);
          self._highlightPost(selectPostArc, true);

          //highlight reply posts and reply links
          var replyTo = [];
          var replyFrom  = [];
          var peopleList = [d];
          var linkList = [d.post_id];
          selectPostArc.each(function(d){
            var selectPost = d3.select(this);
            d.replyTo.forEach(function(r){
              var rp = thread.selectAll('#post_'+d.thread_id+'_'+r);
              self._highlightPost(rp);
              self._drawReplyLink(thread,selectPost,rp);
              rp.each(function(rd){
                self._showTooltip(val,rd,self.opinionMeta.indexOf(rd.opinion),null,{x:1350,y:100});
			    val += 70;
                peopleList.push(rd);
                linkList.push(rd.post_id);
              });
            });
            d.replyBy.forEach(function(r){
              var rp = thread.selectAll('#post_'+d.thread_id+'_'+r);
              self._highlightPost(rp);
              self._drawReplyLink(thread,rp,selectPost);
              rp.each(function(rd){
                self._showTooltip(val,rd,self.opinionMeta.indexOf(rd.opinion));
			    val += 70;
                peopleList.push(rd);
                linkList.push(rd.post_id);
              });              
            });
          })

          //highlight post link
          thread.selectAll('.'+self.classNames.postLink).classed('fade',true);
          for(var j=0;j<linkList.length;j+=1){
            var pid= linkList[j];
            var postLink = thread.selectAll('#postLink_'+d.thread_id+'_'+pid).classed('highlight', true);
            postLink.classed('fade', false);
            postLink.classed('highlight', true);
          }


          //highlight people node and ring
          thread.selectAll('.peopleNode').classed('fade',true);
          thread.selectAll('.postRingCircle').classed('highlight',false);
          for(var j=0;j<peopleList.length;j+=1){
            var userId = peopleList[j].user_id;
            var peopleNode = thread.selectAll('#peopleNode_'+userId).classed('fade',false);
            self._highlightPeopleRing(peopleNode, peopleList[j]);
          }


          //show tooltip
          self._showTooltip(val,d,self.opinionMeta.indexOf(d.opinion),true, {x:1500,y:300});
		  val += 70;
        },
        _showTooltip:function(val,postData, opinionIndex, select, pos){
          var self = this;
          var arcData = postData.arcData;
          //var offsetX = 580;
          var offsetX = screen.width;
          //var offsetY  = 10;
          
          var midAngle = (arcData.startAngle+arcData.endAngle)/2 -self.angleOffset;
          var posX =  Math.cos(midAngle)*(self.threadRadius+arcData.height)  ;
          var posY =  Math.sin(midAngle)*(self.threadRadius+arcData.height)  ;
          var tooltipHeight = 250, tooltipWidth = 300;
          var tx,ty;

          var processTooltipContent = function(text){
            var firstChar = text.slice(0,8);
            var content = text;
            if(firstChar ==='REPLYING'){
              var str = text.split('</u>')
              var replyStr =str[0].split(' ');
              content = replyStr[0]+' ' +replyStr[1]+' ' +replyStr[2]+': '+'<br>'+str[1];
            }
            return content.slice(0, self.settings.maxTooltipChartCount);
          };
		  /*
          if(posX>0&&posY<0){
            ty = posY - tooltipHeight;
            tx = posX;
          }else if(posX>0&&posY>0){
            tx = posX;
            ty = posY;
          }else if(posX<0&&posY>0){
            ty = posY;
            tx = posX - tooltipWidth;
          }else{
            tx = posX - tooltipWidth;
            ty = posY - tooltipHeight;
          }
		  */
          //tx+=self.chartWidth/2 + offsetX+tooltipWidth;
          tx = offsetX;
          //ty+=self.chartHeight/2 + offsetY;
          //ty+=self.chartHeight;
          ty = val;
          var postContent = processTooltipContent(postData.content);
          var content = '<p>' +postContent+'</p>';

          var opinionClass = 'opinion'+opinionIndex;
          if(select){
            opinionClass+= ' select';
          }
          if(pos){
            /*nv.tooltip.show([pos.x, pos.y], content, 'e', null, null,opinionClass);*/
            nv.tooltip.show([screen.width, ty], content, 'e', null, null,opinionClass);
          }else{
            nv.tooltip.show([screen.width, ty], content, 'e', null, null,opinionClass);
            //nv.tooltip.show([tx, ty], content, 'e', null, null,opinionClass);
            //nv.tooltip.show([1400, 200], content, 'e', null, null,opinionClass);
          }
          

        },
        _onMouseOut:function(d){
          var self = this;
          var thread_id = d.thread_id||d.id;
          var thread = self.chart.selectAll('#thread_'+thread_id);  
          thread.selectAll('.post').classed('highlight',false);
          thread.selectAll('.post').classed('fade',false);
          thread.selectAll('.'+self.classNames.postLink).classed('highlight', false);
          thread.selectAll('.'+self.classNames.postLink).classed('fade',false);
          var pn = thread.selectAll('.peopleNode').classed('fade',false).classed('highlight',false);
          pn.selectAll('.peopleCircle')
          .attr('filter','none');
          pn.selectAll('.postRingArea').attr('display','none');

          thread.selectAll('.'+self.classNames.postRing).selectAll('path')
          .classed('fadeout',false);
          thread.selectAll('.postRingCircle').classed('fadeout',false);
          thread.selectAll('.'+self.classNames.replyLink).remove();

          self._highlightMiniThreadPeople();
          nv.tooltip.cleanup();

          self.timeView.selectAll('.'+self.classNames.postBar).classed('fade',false);
          self.timeView.selectAll('.timeMark').attr('display','none');
          //d3.selectAll('.miniThread').selectAll('.post').attr('display','none');
          d3.selectAll('.miniThread').selectAll('.summaryArc').classed('fade',false);
          //thread.selectAll('.postRingArea').remove();           
          /*
          thread.selectAll('#post_'+d.thread_id+'_'+d.post_id).classed('highlight',false);
          thread.selectAll('#postLink_'+d.thread_id+'_'+d.post_id).classed('highlight', false);
          thread.selectAll('.peopleNode').classed('fade',false);*/
        },
        _onMouseOverPeople:function(d){
		  var val = window.pageYOffset + 40;
          var self = this;
          if(!d||!d.post){
            return;
          }
          var thread = self.chart.selectAll('#thread_'+d.thread_id);
          //highlight post and links
          self.timeView.selectAll('.'+self.classNames.postBar).classed('fade',true);
          thread.selectAll('.'+self.classNames.postLink).classed('fade',true);
          thread.selectAll('.post').classed('fade',true);
          d.post.forEach(function(post){
              var p = thread.selectAll('#post_'+d.thread_id+'_'+post.post_id);
              self._highlightPost(p);
              self._mytrick(p,val);
			  		val += 70;
              var l = thread.selectAll('#postLink_'+d.thread_id+'_'+post.post_id);
              self._highlightPost(l);
              //self._mytrick(l,val);
			  //		val += 80;
              //l.classed('fade',false);
              //l.classed('highlight', true);

          });
          
          
          thread.selectAll('.peopleNode').classed('fade',true);
          var peopleNode = thread.selectAll('#peopleNode_'+d.id).classed('fade',false);
          var maxHighlight = Math.min(d.neibors.length, 5);
          for(var i=0;i<maxHighlight;i+=1){
            var userId = d.neibors[i].name;
            thread.selectAll('#peopleNode_'+userId).classed('fade',false)
            //.selectAll('.peopleCircle')
            .classed('highlight','true');
          }
          self._highlightMiniThreadPeople(d.id);


          //var peopleNode = thread.select('#peopleNode_'+d.id)
          //self._highlightPeopleRing(peopleNode);
        },
        _onMouseOverLink:function(d){
          var self = this;
           self._onMouseOverPost(d);

        },

        _highlightMiniPost:function(clId){
          var self = this;
          d3.selectAll('.miniThread').selectAll('.summaryArc').classed('fade',true);
          d3.selectAll('.miniThread').selectAll('.summaryArc'+clId).selectAll('.summaryArc').classed('fade',false);
          //.selectAll('.post.cluster'+clId).attr('display','block');
        },

        _onMouseOverCluster:function(clId, threadData){
          var self = this;
          var clusterData =threadData.clusters.filter(function(d){
            return d.clId ===clId;
          });
          if(clusterData.length===0){
            return;
          }
          clusterData =clusterData[0];
          var thread = self.chart.selectAll('#thread_'+threadData.id);
          var threadId = threadData.id;

          thread.selectAll('.post').classed('fade',true);
          self.timeView.selectAll('.'+self.classNames.postBar).classed('fade',true);
          thread.selectAll('.'+self.classNames.postLink).classed('fade',true);
          thread.selectAll('.peopleNode').classed('fade',true);
          thread.selectAll('.postRingCircle').classed('highlight',false);

          for(var i=0;i<clusterData.post.length;i+=1){
            var post = clusterData.post[i];
            var selectPostArc = thread.selectAll('#post_'+threadId+'_'+post.post_id);
            self._highlightPost(selectPostArc);
            var postLink = thread.selectAll('#postLink_'+threadId+'_'+post.post_id);
            postLink.classed('fade', false);
            postLink.classed('highlight', true);

            var peopleNode = thread.selectAll('#peopleNode_'+post.user_id).classed('fade',false); 
            self._highlightPeopleRing(peopleNode, post);           
          }

          self._highlightMiniPost(clusterData.clId);
        },
        _drawLegend:function(){
          var self = this;
          var height = self.settings.legendHeight*1.1;
          var legendContainer = self.chart.append('g').attr('transform','translate(50,'+(self.chartHeight-self.settings.legendHeight)+')' );
              legendContainer.append("svg:image")
               .attr('x',200)
               .attr('y',0)
               .attr('width', 500)
               .attr('height', height)
               .attr("xlink:href",function(d,i){
                return "images/legend.png";
               });

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
