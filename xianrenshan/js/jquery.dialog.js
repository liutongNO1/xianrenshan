;(function(){
$.fn.extend({

	"dialog":function(opt){

		
		
		this.each(function(){	
		var DEFAULT={"module":".module","title":"提示","content":""}
           
		var option=$.extend({},DEFAULT,opt);	
		var dom=$(this);
		console.log(option);
		console.log($(this).html())
		
		dom.bind("click",randerHtml);
			
	
		function randerHtml(){
			dom.unbind("click",randerHtml);
			var str='';			
			str+='<div class="module mod">';
			str+='<div class="close">&times;</div>';
			str+='<h3 class="title">'+option.title+'</h3>';
			str+='<div class="mod_body">'+option.content+'</div>';
			str+='</div>';
			if(option.module!=".module"){
				// alert(option.module);
				$("body").append($(option.module).addClass("mod"));
				$(option.module).show();
			}else{
			
				$("body").append($(str));
			}
			
			if(option.mask){
				$("body").append($('<div id="mask"></div>'));
			}
			$(option.module+">.close").bind("click",closeDialog);
		}
		function closeDialog(){
			
			// dom.click(function(){showDialog();})
			if(option.module!=".module"){
				$(option.module).hide();
			}else{
				$(this).parent().remove();
			}
		
				$("#mask").remove();
			dom.unbind("click",randerHtml);
			dom.bind("click",randerHtml);
		}//closeDialog
	})//ea
	return this;
  }
})
})(jQuery)