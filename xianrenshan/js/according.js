;(function(){
	$.fn.extend({
		"according":function(opt){
			var DEFAULT={"start":0}
			var option=$.extend({},DEFAULT,opt)
			this.each(function(){
				var obj=$(this);
				init();
				
				function init(){
					obj.children(".content").hide();
					obj.children(".content").eq(option.start).show();
					obj.children(":header").eq(option.start).addClass("active")
				}
				obj.children(":header").each(function(){
					$(this).bind("click",showAcc);
				})
				function showAcc(){
					var ind=obj.children(":header").index($(this));
					if($(this).hasClass("active")){
						return;
					}else{
					obj.children(":header.active").removeClass("active");
					obj.children(".content:visible").slideUp();
					obj.children(".content").eq(ind).slideDown();
					obj.children(":header").eq(ind).addClass("active");
					}
					}
			})
		}
	})
})(jQuery)
