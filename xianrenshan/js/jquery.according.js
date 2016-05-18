;(function(){
$.fn.extend({
"accordion":function(opt){

var pa=$(this);
var DEFAULT={"start":0};
var option=$.extend({},DEFAULT,opt);
function init(){
	pa.children("div").hide();
	pa.children("div").eq(option.start).show();
	
}
init();

pa.children(":header").each(function(){
$(this).click(function(){
var num=pa.children(":header").index($(this));

pa.children("div:visible").slideUp();
pa.children("div").eq(num).slideDown();
					   
					   })//ed									 
	})//each ed
	
	}
			})//extend ed		   
			   
})(jQuery)