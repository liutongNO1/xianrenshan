define(function(require, exports, module){
	require('jwplayer');
	require("/static/page/course/common/jquery.nanoscroller.js");
	require("/static/page/course/common/drag.js");

	var store = require('store');
	var animateMp = require('./common/animate-achievement');
	var commonInterface = require("/static/page/course/common/course_detail_common.js");
	var verifyCode = require('../common/verify-code.js');
	var guideLayer = require('/static/component/base/util/guideLayer');

	var mediaData = null; // 视频信息数据

	// 倒计时
	function countDowner(opts) {
		var timer = null,
			el = opts.el, // 数值容器
			initCounter = opts.initCounter, // 初始数值
			interval = opts.interval || 1, // 间隔时间，单位s
			callback = opts.callback;

		if (initCounter > 0) {
			initCounter--;
			el.innerHTML = initCounter;
			opts.initCounter = initCounter;
			timer = setTimeout(function() {
				countDowner(opts);
			}, interval * 1000);
		} else {
			clearTimeout(timer);
			callback && callback();
		}
	};

	// 获取视频信息，并回调初始化播放器
	function getMediaInfo(callback){
		$.getJSON("/course/ajaxmediainfo/?mid="+pageInfo.mid+"&mode=flash",function(data){
			mediaData = data.data.result;
			callback && callback();
		});
	}

	// 播放下一节
	function playNextCourse(courseSrc){
		location.href = courseSrc;
	}

	// 获取当前章节
	function getcurrChapterItem(){
		var currentId = $(".J-chaptername").data('id');
   		return $('[data-id='+ currentId +']');
	}

	// 设置章节列表滚动到当前章节
	var nanoScrollerCallback = {
		scrollTo: getcurrChapterItem()
	};

	verifyCode.renderVerifyCodeBlock('.qa-pop .verify-code','/course/getcoursequestioncode');

$(function(){
	// 第一次访问显示新功能引导层
	var isFirstVisit = store.get('isFirstVisit') || 'Yes';
	if(isFirstVisit === 'Yes'){
		guideLayer.create(function(){
			getMediaInfo(initPlayerMode);
		});
	}else{
		getMediaInfo(initPlayerMode);
	}

	if(typeof continueTime != 'number'){
		continueTime=0;
        var sv=store.get("_vt");
        if(sv&&sv[pageInfo.mid]){
            continueTime=sv[pageInfo.mid].st||0;
        }
	}

    $(window).on("beforeunload",function(){
        var vt=store.get("_vt")||{},
            it=vt[pageInfo.mid],
            state=thePlayer.getState();
        if(state=="IDLE"){
            delete vt[pageInfo.mid];
            store.set("_vt",vt);
            return ;
        }
        if(it){
            it.t=new Date().getTime();
            it.st=thePlayer.getPosition();
            store.set("_vt",vt);
        }
        else{
            it={
                t:new Date().getTime(),
                st:thePlayer.getPosition()
            }
            ck();
            vt[pageInfo.mid]=it;
            store.set("_vt",vt);
        }
        function ck(){ //check length<10 ,delete overflowed;
            var k,tk,i=0,tt=new Date().getTime();
            for(k in vt){
                i++;
                if(vt[k].t<tt){
                    tt=vt[k].t;
                    tk=k;
                }
            }
            if(i>=10){
                delete vt[tk];
                ck();
            }
        }
    });

	function initPlayerMode(){
		var mode = store.get('mode') || 'flash';
		initPlayer(mode, 0);
	}

	var sentLearnTime=(function(){
		if(!OP_CONFIG.userInfo){
			return ;
		}
	 	var _params={},
	 		lastTime=0,
	 		startTime=new Date().getTime();
		var fn;
	    _params.mid=pageInfo.mid;

	    window.setInterval(fn=function(){
			var overTime,
				stayTime;
			if(typeof(thePlayer)!='object') return //no video no time;
			overTime=new Date().getTime();
			stayTime=parseInt(overTime-startTime)/1000;

			_params.time=stayTime-lastTime;
			_params.learn_time =thePlayer.getPosition();

			$.ajax({
				url:'/course/ajaxmediauser/',
				data:_params,
				type:"POST",
				dataType:'json',
				success:function(data){
					if(data.result== '0'){
						lastTime=stayTime;
                        var chapterMp = data.data.media;
                        var courseMp = data.data.course;
                        var data = [];
                        chapterMp && data.push({mp: chapterMp.mp.point, desc: chapterMp.mp.desc});
                        courseMp && data.push({mp: courseMp.mp.point, desc: courseMp.mp.desc});
                        animateMp(data);
					}
				}
			});
		},60000);

		window.onbeforeunload=function(){
			var overTime,
				stayTime;
			if(typeof(thePlayer)!='object') return //no video no time;
			overTime=new Date().getTime();
			stayTime=parseInt(overTime-startTime)/1000;

			_params.time=stayTime-lastTime;
			_params.learn_time =thePlayer.getPosition();

			$.ajax({
				url:'/course/ajaxmediauser/',
				data:_params,
				type:"POST",
				async:false,
				dataType:'json',
				success:function(data){
					if(data.result=='0'){
						lastTime=stayTime;
					}
				}
			});
		}
		return fn;
	})();

	function checkH5() {
		return window.applicationCache? true : false;
	}

//是否连续播放--
	var isplay=false;
	window.playContinue=playContinue;
	function playContinue(_isplay){
	  isplay=_isplay;
	  store.set('isplay', isplay);
	}
	//获取连续播放状态----
	window.playerAutoplay=playerAutoplay;
	function playerAutoplay(){
	  isplay = store.get('isplay') || false;
	  return isplay;
	}

	//总是以flash的方式开始调用
    function initPlayer(primary,time){
        window.thePlayer = jwplayer('video-box').setup({
            width:'100%',
            height:'100%',
            videotitile: videoTitle,
			primary: primary,
			//primary: 'html5',
            autostart:false,
            startparam: "start",
            autochange:true,

			showset:true,//是否显示设置,true ：显示，false：不显示
			ish5:checkH5(),//是否可以切换h5模式,true ：是，false：否
			isautoplay:playerAutoplay(),
          //  playlist: [{
                //image: "JW.jpg",
                sources: [{
                   file: mediaData.mpath[2],
                    label: "普清",
                    "default": true
                },{
                    file: mediaData.mpath[1],
                    label: "高清"
                },{
                    file: mediaData.mpath[0],
                    label: "超清"
                }],
           // }],

            events: {
                onReady: function(callback) {//
                    if(OP_CONFIG.userInfo){
						if(time!=0){
							continueTime=time;
						}
                        thePlayer.seek(continueTime);
                    }
                },
                onComplete: function(){
                	var $nextBox = $('.J_next-box'),
						$nextCourse = $nextBox.find('.J-next-course');

					$nextBox.removeClass('hide');

					sentLearnTime();

					// 如果有下一节
					if($nextCourse.length){
						var $nextCourseBtn = $('.J-next-btn'),
							$nextAutoPlay = $('.J-next-auto'),
							nextCourseSrc = $nextCourse.data('next-src');

						// 如果勾选了自动播放下一节
				      if(isplay){
				      	$nextAutoPlay.removeClass('hide');

				      	// 3s后自动播放下一节
				      	setTimeout(function(){
				      		countDowner({
				        		el: $nextAutoPlay.find('em')[0],
				        		initCounter: 3,
				        		callback: function(){
				        			playNextCourse(nextCourseSrc);
				        		}
				        	});
				      	}, 1000);

				      }else{ // 如果没有勾选，则显示“手动播放下一节”提示层
				      	$nextCourseBtn
				      		.removeClass('hide')
				        	.on('click', function(){
				        		playNextCourse(nextCourseSrc);
				        	});
				      }
					}else{
						// 如果本章已完结，就显示课程推荐层

					}
                },
                onPlay:function(callback){
                	//console.log(callback.oldstate+"=onPlay-----");
                	if(callback.oldstate=="BUFFERING" && switchType!=0){
                		var bufferTime=new Date().getTime()-playerWaitTime;
                		sendVideoTestData(bufferTime,"",switchType);
                	}
                },
    		    onBuffer:function(callback){//缓冲状态，缓冲图标显示
					
					playerWaitTime=new Date().getTime();
					console.log(playerWaitTime+"=onBuffer------");
				},
				onQualityChange:function(callback){
					
					hdArr.push(thePlayer.getCurrentQuality());
              		switchType=2;
              		//sendVideoTestData(bufferTime,"",2);
				},
				onQualityLevels:function(callback){
					//inint----
					initFeedbackInfo();
              		hdArr.push(thePlayer.getCurrentQuality());
              		//sendVideoTestData(bufferTime,"",1);
              		switchType=1;
            	},
				onFullscreen:function(){
					
					sendVideoTestData(0,"",4);
				},
				onError:function (callback){
					
					sendVideoTestData(new Date().getTime()-playerWaitTime,callback.message,3);
					loadNewVideo(callback.message);
					
				}
            }
        })

		thePlayer.onSpeedChange=function(){
			
			speedArr.push(document.getElementById('speedTxt').innerHTML);
			sendVideoTestData(0,"",5);
		}
    }

//1初始；2切换hd；3出错；4全屏切换；5速度切换
	//线路切换
	var requsetCount=0;
	function loadNewVideo(message) {
		requsetCount++;

		if(requsetCount>=3){ //2次仍访问不了，返回错误提示界面
			requsetCount=0;

			return;
		}else{
			//console.log("++++++++++++++" + requsetCount);
		}

		var arr=[2,1,0];
		var index=arr[thePlayer.getCurrentQuality()];
		//1 v1-->video
		if(mediaData.mpath[index].indexOf("v1")>-1){ //
			mediaData.mpath[index]=mediaData.mpath[index].replace(/v1/,"video");
		}else{//2 video-->v1
			mediaData.mpath[index]=mediaData.mpath[index].replace(/video/,"v1");

		}

		thePlayer.load([{
			sources: [{
				file: mediaData.mpath[2],
				//file:"http://video.mukewang.com/mk.mp4",
				label: "普清",
				"default": true
			},{
				file:mediaData.mpath[1],
				//file: "http://video.mukewang.com/mk.mp4",
				label: "高清"
			},{
				file: mediaData.mpath[0],
				//file:"http://video.mukewang.com/mk.mp4",
				label: "超清"
			}]

		}]);
		thePlayer.play();
}
var playerWaitTime=0,hdArr,speedArr,switchType=0;

function initFeedbackInfo(){
	hdArr=[""];
	speedArr=[""];
	//
	var speed='1.0 X';
	if(thePlayer.getRenderingMode()=='html5'){
		speed=document.getElementById('speedTxt').innerHTML;

	}
	speedArr.push(speed);
}
//播放器加载错误日志------
/*

  用户浏览器和操作系统信息
  视频响应时长：bufferTime （毫秒）
  视频id: videoId
  视频地址: videoFileName
  用户id
  错误内容:erroryMsg
  渲染模式renderingMode：flash/ html5（1/0）
  数据来源:source    1-->pc;0-->移动
  后加----------------------
  类型type：1初始；2切换hd；3出错；4全屏切换；5速度切换
  cdn信息cdn： v1.mukewng.com/video.mukewang.com
  当前视频清晰度currentHd：0普清1高清2超清
  上次视频清晰度oldHd：0普清1高清2超清
  当前播放速度currentSpeed：1.0x，1.25x，1.5,1.75x，2.0x，0.5x，0.75x，
  上次播放速度oldSpeed：1.0x，1.25x，1.5,1.75x，2.0x，0.5x，0.75x，
  是否全屏fullScreen：0否，1是
  用户屏幕分辨率winWidth winHeight
*/

function sendVideoTestData(bufferTime,msg,type){
  var fullscreen=0,renderingMode=1;
  
  var arr=[2,1,0];

  var currentHd=thePlayer.getCurrentQuality();
   //console.log(currentHd)
  var videoUrl=mediaData.mpath[arr[currentHd]];
  var cdnArr=videoUrl.split('/');
    if(thePlayer.getRenderingMode()=="html5"){
        renderingMode=0;       
    }
    if(thePlayer.getFullscreen()==true){
    	fullscreen=1;
    }

	/*
	
	console.log("errorMsg==="+msg)
	console.log("bufferTime==="+bufferTime)
	console.log("renderingMode==="+renderingMode)
	console.log("videoFileName==="+videoUrl)
	console.log("oldSpeed==="+speedArr[speedArr.length-2])
	console.log("currentSpeed==="+speedArr[speedArr.length-1])

	console.log("currentHd==="+currentHd)
	console.log("oldHd==="+hdArr[hdArr.length-2])
	console.log("fullscreen==="+fullscreen)
	console.log("cdn==="+cdnArr[2])
	console.log("videoid==="+pageInfo.mid);
	
	console.log("windowWidth==="+window.screen.width)
	console.log("windowHeight==="+window.screen.height)
	
	console.log("------------end-------------------------"+type)
	*/
    $.post("/course/collectvideo",{
        renderingMode:renderingMode,
        bufferTime:   bufferTime,
		videoFileName:videoUrl,
		videoId:      pageInfo.mid,
		errorMsg:     msg,

		currentHd:    currentHd,
		oldHd:        hdArr[hdArr.length-2],
		type:         type,
		fullscreen:   fullscreen,
		cdn:          cdnArr[2],
		source:       1,
		currentSpeed: speedArr[speedArr.length-1],
		oldSpeed:     speedArr[speedArr.length-2],
		winWidth:     window.screen.width,
		winHeight:    window.screen.height
    },
	function(data){
    	//console.log(data+"----ok----" +data.msg);
   });
   switchType=0;
    
}

	window.switchjwplayer=switchjwplayer;
	function switchjwplayer(getRenderingMode){

		var time=thePlayer.getPosition();
		var mode=getRenderingMode;
		store.set('mode', mode);
		//console.log(mode);
		thePlayer.remove();
		initPlayer(mode,time);
		//记录用户切换日志--

		$.ajax({
		  method: "GET",
		  url: "/course/videochange",
		  data: { video: mode }
		}).done(function( msg ) {
		  //console.log( "Data:" + msg );
		});

	}

 



//截图后flash回调
window.screenReceive=screenReceive;
function screenReceive(data){
	if(typeof data=="string"){

		data=$.parseJSON(data);
	}
	if(data.result==0){
		shot.screenShotFlashBack(data);
	}
	else{
		alert(data.msg||"错误，请稍后重试");
	}
	//console.log(url,typeof url)
}

$.each("qa,note".split(","),function(k,v){
  	commonInterface.remote[v].extendMethod("reset",function(){
   		shot.reset(".js-shot-video[data-type='"+v+"']");
   	});
});

var shot={
	screenShot:function(el){
	
		var $el=$(el);
			//time=parseInt(thePlayer.getPosition(),10);
			//time=(thePlayer.getPosition()-0.05);
			var shotTime=Math.round (thePlayer.getPosition());
		var matches;
		matches = thePlayer.getPlaylistItem().file.match(/\/([^\/]*?)\/[^\/]+?$/)[1];
		this.el=el;
		commonInterface.remote[$el.attr("data-type")].set('video',matches);
		commonInterface.remote[$el.attr("data-type")].set('picture_time',shotTime);
	},
	formatSecond:function(sec){
        var result = _format(parseInt(sec/60))+":"+_format(sec%60);
        function _format(min){
            return min < 10 ? '0' + min: min;
        }
        return result;
    },
    reset:function(el,fromEl){
    	var $el=$(el),$next;
    	this.el=null;
    	fromEl&&commonInterface.remote[$el.attr("data-type")].reset();
    },
    screenShotFlashBack:function(data){
    	if(!this.el) return ;
		//console.log(data)
		//console.log(data.data)
    	//$(this.el).next().find("img").attr("src",data.data);
    	//commonInterface.remote[$(this.el).attr("data-type")].set("picture_url",data.data);
    }
}

$(".js-shot-video").click(function(){
	//shot.screenShot(this);
	if(!$(this).hasClass('on')){
		$(this).addClass('on');
	}else{
		$(this).removeClass('on');
	}
});

//发问答

	$('#js-discuss-submit').on('click',function(){
		var $v,
			c,
			content,
			txt,
			txtLength,
			data={},
			title,
			$this=$(this);

		//判断是否有需要截图
		if($('.qa-pop .js-shot-video').hasClass('on')){
			shot.screenShot('.qa-pop .js-shot-video');
		}else{
			shot.reset('.qa-pop .js-shot-video',1);
		}

		if($this.hasClass("submit-loading")) return;
		title = $.trim($('#js-qa-title').val());
		if(title.length < 5 || title === $('#js-qa-title').attr('placeholder')) {
			layer.msg('问答标题不能少于5个字', 2, -1);
			return;
		}
		else if(title.length > 255) {
			layer.msg('问答标题不能大于255个字', 2, -1);
			return;
		}

		content=UE.getEditor("discuss-editor").getContent();
		content=$.trim(content);
		txt=$.trim(UE.getEditor("discuss-editor").getContentTxt());
		txtLength=txt.length;
		if(txtLength==0||txt=="请输入讨论内容..."){
			layer.msg('请输入讨论内容', 2, -1);
			return;
		}
		if(txtLength < 5){
			layer.msg('输入不能小于5个字符', 2, -1);
			return;
		}
		if(content.length >20000){
			layer.msg('输入不能超过20000个字', 2, -1);
			return;
		}

		var verifyVal = $.trim(verifyCode.getResult('.qa-pop .verify-code'));
		if(verifyVal.length==0){
			$('.qa-pop .verify-code').trigger('fail',"请输入验证码");
			return ;
		}else{
			data.verify = verifyVal;
			$('.qa-pop .verify-code').trigger('succ');
		}
		$.extend(data,postData);
		data.content = content;
		data.title = title;
		commonInterface.remote.qa.prev(data);

		//积分充足添加frommedia字段
		if($(".interal-checked").length){
            data.frommedia = 1;
        }


		$this.addClass("submit-loading").val("正在发布...");
		$.ajax({
			url:"/course/ajaxsaveques",
			data:data,
			type:"post",
			dataType:"json",
			success:function(data){
				if(data.result==0){
					layer.msg('发布成功!', 2, -1);
					commonInterface.tabList.qa.load();
					UE.getEditor("discuss-editor").setContent("");
					$('#js-qa-title').val("");
					$('.qa-pop .verify-code-ipt').val('');
					$('.qa-pop .verify-code-around').click();
					commonInterface.remote.qa.reset();
					$('.qa-pop .pop-title span').click();
					//thePlayer.play();

					$("#interal-use").removeClass("interal-checked");
				}
				else if(data.result==-103002){
					$('.qa-pop .verify-code').trigger('fail',data.msg);

					$('.qa-pop .verify-code-ipt').val('');
					$('.qa-pop .verify-code-around').click();

				}
				else{
					layer.msg(data.msg, 2, -1);
				}
			},
			complete:function(){
				$this.removeClass("submit-loading").val("发布");
			}
		})
	});

	//发笔记
	$('#js-note-submit').on('click',function(){
		var $this=$(this),
			data={};
		if($this.hasClass("submit-loading")) return ;
		//判断是否有需要截图
		if($('.note-pop .js-shot-video').hasClass('on')){
			shot.screenShot('.note-pop .js-shot-video');
		}else{
			shot.reset('.note-pop .js-shot-video',1);
		}

		if($('.publish-note-btns .verify-code-around').length!==0){
			var verifyVal = $.trim(verifyCode.getResult('.publish-note-btns .verify-code'));
			if(verifyVal.length==0){
				$('.publish-note-btns .verify-code').trigger('fail',"请输入验证码");
				return ;
			}else{
				$('.publish-note-btns .verify-code').trigger('succ');
				data.verify = verifyVal;
			}
		}

		data.content=$.trim($('#js-note-textarea').val());
		if(!data.content.length||data.content == $("#js-note-textarea").attr("placeholder")){
			layer.msg('请输入内容', 2, -1);
			return;
		}
		if(data.content.length>0 && data.content.length < 3){
			layer.msg('输入不能小于3个字符', 2, -1);
			return;
		}
		if(data.content.length > 1000){
			layer.msg('输入不能超过1000个字', 2, -1);
			return;
		}

		$.extend(data,postData);
		commonInterface.remote.note.prev(data);
		data.is_shared=$('#js-isshare').is(':checked')?1:0; //是否分享
		$this.addClass("submit-loading").val('正在保存...');
		$.ajax({
			url:"/course/addnote",
			type:"post",
			dataType:"json",
			data:data,
			success:function(data){
				$this.removeClass("submit-loading").val('保存');
				if(data.result==0){
					layer.msg('发布成功', 2, -1);
					commonInterface.tabList.note.load();
					$('#js-note-limit').text(0);
					$('#js-note-textarea').val("").blur(); //blur to trigger fake placeholder
					commonInterface.remote.note.reset();
					$('.note-pop .verify-code').trigger('succ');
					$('.note-pop .verify-code').html('');
					$('.note-pop .pop-title span').click();

					//关连只看我的
					if($(".js-ower").hasClass("checked")){
						$(".js-course-menu").attr("data-ower","all");
						$(".js-ower").removeClass("checked");
					}
					//到最新
					$(".js-select-state a").removeClass("active");
					$(".js-select-state a[data-sort=last]").addClass("active");


					//thePlayer.play();

				}else if(data.data==1&&data.result==-1){
					verifyCode.renderVerifyCodeBlock('.publish-note-btns .verify-code','/course/getnotecode');
				}else if(data.result==-103002){
					$('.note-pop .verify-code').trigger('fail',data.msg);
					setTimeout(function() {
			        	verifyCode.renderVerifyCodeBlock('.publish-note-btns .verify-code','/course/getnotecode');
			        }, 1000);
				}
				else{
					layer.msg(data.msg, 2, -1);
				}
			}
		});
	});

	

	(function(){
		//重置视频区域宽度
		var videoWrap = (function(){
			var rObj = {};
			rObj.resetSize = function(){
				//计算宽度
				var bool = $('.chapter').hasClass('light');
				if(bool){
					if($(window).width()>800){
						var w = $(window).width()-$('.section-list').outerWidth(true);
					}else{
						var w = 800;
					}
					w = w+'px';
				}else{
					var w = '100%';
				}
				//计算高度
				var hh = $('#header').outerHeight(true);//顶部高度
				var cm = $('.js-course-menu').outerHeight(true);//课程导航高度
				var h = $(window).height()-hh-cm;
				$('.js-box-wrap').css('width',w).css('height',h+'px');
			};
			return rObj;
		})();



		//随屏滚动
		var fixed = (function(){
			var fixedElem = $('.js-course-menu'),
				targetElem = $('.course-left');
			//随屏滚动以.course-left为准
			var targetT = targetElem.offset().top;
			var targetL = targetElem.offset().left;
			var fixedVideo = $('.js-fixed-video');

			$(window).on('scroll',function(){
				var wt = $(window).scrollTop();
				//console.log(wt);
				//var text = thePlayer.getRenderingMode();
				//if(!text){
				//	return ;
				//}
				if( wt >= targetT){
					fixedElem.css('position','fixed').css('left',targetL+'px');
					//thePlayer.pause();
					//var seekPosition=thePlayer.getPosition();
					//var oldState = thePlayer.getState();
					//if($(window).width()>1200){
					//	if(fixedVideo.hasClass('on')){
					//		return ;
					//	}else{
					//		fixedVideo.addClass('on');
					//		if(text==='html5'){
					//			fixedVideo.find('.fixed-video-con').append($('#video-box'));
					//		}else{
					//			fixedVideo.find('.fixed-video-con').append($('#video-box_wrapper'));
					//		}
					//		if(oldState=='PAUSED'){
					//			thePlayer.pause();
					//		}else{
					//			thePlayer.seek(seekPosition);
					//		}
					//		thePlayer.hideControlBar()
					//	}
					//}else{
					//	//thePlayer.pause();
					//	if(fixedVideo.hasClass('on')){
					//		fixedVideo.removeClass('on');
                    //
					//		if(text==='html5') {
					//			$('#J_Box').append($('#video-box'));
					//		}else{
					//			$('#J_Box').append($('#video-box_wrapper'));
					//		}
					//		if(oldState=='PAUSED'){
					//			thePlayer.pause();
					//		}else{
					//			thePlayer.seek(seekPosition);
					//		}
					//		thePlayer.showControlBar();
                    //
					//	}
					//}

				}else{
					fixedElem.css('position','absolute').css('left', 0);
					//if(fixedVideo.hasClass('on')){
					//	fixedVideo.removeClass('on');
					//	//thePlayer.pause();
					//	var seekPosition=thePlayer.getPosition();
					//	var oldState = thePlayer.getState();
                    //
					//	if(text==='html5') {
					//		$('#J_Box').append($('#video-box'));
					//	}else{
					//		$('#J_Box').append($('#video-box_wrapper'));
					//	}
					//	if(oldState=='PAUSED'){
					//		thePlayer.pause();
					//	}else{
					//		thePlayer.seek(seekPosition);
					//	}
					//	thePlayer.showControlBar();
                    //
					//}
				}
			});
			return {
				setLT:function(){
					targetT = targetElem.offset().top;
					targetL = targetElem.offset().left;
				}
			};

		})();

		videoWrap.resetSize();
		//nano 初始化
		$(".nano").nanoScroller(nanoScrollerCallback);
		fixed.setLT();
		$(window).on('resize',function(){
			setTimeout(function(){
				videoWrap.resetSize();
				$(".nano").nanoScroller(nanoScrollerCallback);
				fixed.setLT();
				$(window).trigger('scroll');
			} , 200);
		});


		// 章节列表显隐切换交互
		var $sectionList = $('.section-list');
		$('.chapter').on('click', function(){
			var $this = $(this);
			if($this.hasClass('light')){
				$this.removeClass('light');
				$sectionList.animate({
					right: -360
				}, 200);
			}else{
				$this.addClass('light');
				$sectionList.animate({
					right: 0
				}, 200);
			}
			videoWrap.resetSize();
		});
	})();

});//$(function(){}) end
});
