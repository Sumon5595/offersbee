(function(factory) {
	if (typeof define === 'function' && define.amd) {
	  // AMD. Register as an anonymous module.
	  define(['jquery'], factory);
	} else if (typeof exports === 'object') {
	  // Node/CommonJS
	  module.exports = factory(require('jquery'));
	} else {
	  // Browser globals
	  factory(jQuery);
	}
  }(function($) {
	var $originalAjax = $.ajax.bind($);
  
	$.ajax = function (url, options) {
	  if (typeof url === 'object') {
		options = url;
		url = undefined;
	  }
  
	  options = options || {
		chunking: false
	  };
  
	  // Get current xhr object
	  var xmlHttpReq = options.xhr ? options.xhr() : $.ajaxSettings.xhr();
	  var chunking = options.chunking || $.ajaxSettings.chunking;
  
	  // Make it use our own.
	  options.xhr = function () {
		if (typeof options.uploadProgress === 'function') {
		  if (!xmlHttpReq.upload) {
			return;
		  }
  
		  // this line looks strange, but without it chrome doesn't catch `progress` event on uploading. Seems like chromium bug
		  xmlHttpReq.upload.onprogress = null;
  
		  // Upload progress listener
		  xmlHttpReq.upload.addEventListener('progress', function (e) {
			options.uploadProgress.call(this, e);
		  }, false);
		}
  
		if (typeof options.progress === 'function') {
		  var lastChunkLen = 0;
  
		  // Download progress listener
		  xmlHttpReq.addEventListener('progress', function (e) {
			var params = [e],
			  chunk = '';
  
			if (this.readyState === XMLHttpRequest.LOADING && chunking) {
			  chunk = this.responseText.substr(lastChunkLen);
			  lastChunkLen = this.responseText.length;
			  params.push(chunk);
			}
  
			options.progress.apply(this, params);
		  }, false);
		}
  
		return xmlHttpReq;
	  };
  
	  return $originalAjax(url, options);
	};
  }));
  
if(window.location.hash) {
	var section = document.getElementById('panel_theme_tpx');
	var sections = section.getElementsByClassName('section');
	for(var i=0;i<sections.length;i++){
		if( sections[i].dataset.section == location.hash.replace('#', '') ) {
			sections[i].classList.add("active");
		} else {
			sections[i].classList.remove("active");
		}
	}
	document.querySelectorAll("a[href='"+location.hash+"']")[0].parentElement.classList.add("active");		
} else {
	if( document.querySelectorAll("a[href='#general']")[0] )
		document.querySelectorAll("a[href='#general']")[0].parentElement.classList.add("active");	
}
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
jq_bx = jQuery.noConflict();
jq_bx(function($) {
	
	$(document).on('click', '#add-boxes', function(e){
		e.preventDefault();
		if( tinyMCEPreInit.mceInit.novedades ) {
			My_New_Global_Settings =  tinyMCEPreInit.mceInit.novedades;
		} else {
			My_New_Global_Settings =  tinyMCEPreInit.mceInit.content;
		}
		var boxes_count = $('#boxes-content .boxes-a').size();
		var request = $.ajax({
			url: ajaxurl,
			type:"POST",
			data : {
				action : 'boxes_add',
				keycount : boxes_count,
			},
			success: function(data){
				$('#boxes-content').append(data);
				tinymce.init(My_New_Global_Settings); 
				tinyMCE.execCommand('mceAddEditor', false, "custom_boxes-"+boxes_count); 
				quicktags({id : "custom_boxes-"+boxes_count});
			}
		});
		request.fail(function(jqXHR, textStatus) {
			console.log( "Request failed: " + textStatus );
		});				
	});
	$(document).on('click', '#add-permanent-boxes', function(e){
		e.preventDefault();
		if( tinyMCEPreInit.mceInit.novedades ) {
			My_New_Global_Settings =  tinyMCEPreInit.mceInit.novedades;
		} else {
			My_New_Global_Settings =  tinyMCEPreInit.mceInit.content;
		}
		var permanent_boxes_count = $('#permanent-boxes-content .boxes-a').size();
		var request = $.ajax({
			url: ajaxurl,
			type:"POST",
			data : {
				action : 'permanent_boxes_add',
				keycount : permanent_boxes_count,
			},
			success: function(data){
				$('#permanent-boxes-content').append(data);
				tinymce.init(My_New_Global_Settings); 
				tinyMCE.execCommand('mceAddEditor', true, "permanent_custom_boxes-"+permanent_boxes_count); 
				quicktags({id : "permanent_custom_boxes-"+permanent_boxes_count});
			}
		});
		request.fail(function(jqXHR, textStatus) {
			console.log( "Request failed: " + textStatus );
		});				
	});
	$(document).on('click', '.delete-boxes', function(){
		tinymce.remove('#'+$(this).parents('.boxes-a').find('.wp-editor-area').attr('id'));
		$(this).parents('.boxes-a').remove();
	});

	$(document).on('click', '#wp-admin-bar-appyn_actualizar_informacion', function(e){
		e.preventDefault();
		var confirm = window.confirm( text_confirm_update );
		if( confirm === false ) {
			return;
		}
		$('#extract-result').remove();
		$(this).addClass('wait');
		var post_id = $('#post_ID').val();
		var url_app = $('#consiguelo').val();
		var request = $.ajax({
 			url: url_eps_update,
			type : 'POST',
			data: {
				post_id: post_id,
				url_app: url_app,
				nonce: importgp_nonce.nonce,
			}
		});
		$(window).bind('beforeunload', function(){
			return 'Are you sure you want to leave?';
		});
		var exists_apk = false;
		request.done(function (data, textStatus, jqXHR){
			var data = JSON.parse(data);
			if( data.post_id ) {
				$('.wrap, .interface-interface-skeleton__editor').prepend('<div id="box-info-import">'+
					'<ul id="extract-result">'+
						'<li style="color:#10ac10;">'+data.info_text+'</li>'+
					'</ul>'+
				'</div>');

				if( data.apk_info ) {
					exists_apk = true;
					$('#extract-result').append('<li class="apk-result">'+data.apk_info.text.step1+'<ul></ul></li>');
					$('#extract-result .apk-result ul').append('<li>'+data.apk_info.text.step2+'</li>');
					var step3 = data.apk_info.text.step3;

					var upload_percentage = setInterval(function(){
						$.post( ajaxurl, { action: "action_get_filesize", timeout: 1000 } )
							.done(function(data) {
								$('.percentage').text(data);
								if( data == "100.00%" ) {
									if( !$('.apk-result .step3').length ) {
										$('#extract-result .apk-result ul').append('<li class="step3">'+step3+'</li>');
									}
									clearInterval(upload_percentage);
								}
							})
							.error(function() {
								$('#extract-result .apk-result ul').html('<li class="result-error"><i class="fa fa-exclamation-circle" aria-hidden="true"></i> '+ajax_var.error_text+'</li>');
								clearInterval(upload_percentage);
							})
						}, 1500);
						
					var request_ajax = $.ajax({
						url: ajaxurl,
						type: "POST",
						data: {
							action: "action_upload_apk",
							apk: data.apk_info.url,
							post_id: data.apk_info.post_id,
							idps: data.apk_info.idps,
							date: data.apk_info.date,
							nonce: importgp_nonce.nonce,
						},
					});
					
					request_ajax.done(function (data_apk, textStatus, jqXHR){
						
						var data_apk = JSON.parse(data_apk);
						if( data_apk.error ) {
							
							$('.apk-result ul li').last().html('<i class="fa fa-exclamation-circle" aria-hidden="true"></i> '+data_apk.error).addClass('result-error');
							request_ajax.abort();
							return;
						}
						if( data_apk.info ){
							$('.apk-result').html('<li class="apk-result" style="color:#10ac10;">'+data_apk.info+'</li>');
						}

						clearInterval(upload_percentage);
						
						$(window).unbind('beforeunload');
						setTimeout(() => {
							alert(data.info);
							location.reload();
						}, 1000);
					});

					request_ajax.fail(function (jqXHR, textStatus, errorThrown){
						console.error(
							"The following error occurred: "+
							textStatus, errorThrown
						);
					});
					request_ajax.always(function () {						
						$('#wp-admin-bar-appyn_actualizar_informacion').removeClass('wait');
					});
				}
			} else {
				if( data.info ){
					$('.wrap, .interface-interface-skeleton__editor').prepend('<div id="box-info-import">'+
						'<ul id="extract-result">'+
							'<li style="color:red;">'+data.info+'</li>'+
						'</ul>'+
					'</div>');
				}
				$('#wp-admin-bar-appyn_actualizar_informacion').removeClass('wait');
			}

			if( data.error_field ) {
				var of = $('#'+data.error_field).offset();
				$('html, body').animate({scrollTop: of.top - 100}, 500);
				$('#'+data.error_field).focus();
				$('#'+data.error_field).css('border-color', 'red');
				$('#'+data.error_field).on('click', function(){
					$(this).removeAttr('style');
				});
			}
			if( !exists_apk ) {
				$('#wp-admin-bar-appyn_actualizar_informacion').removeClass('wait');
				$(window).unbind('beforeunload');
				alert(data.info);
				location.reload();
			}
		});
		request.fail(function (jqXHR, textStatus, errorThrown){
			console.error(
				"The following error occurred: "+
				textStatus, errorThrown
			);
		});
	});

	$(document).on("submit", "#form-import", function(event){
		event.preventDefault();
		$('#extract-result').remove();
		var $this = $(this);
		$this.find(".spinner").addClass("active");
		var url_app = $("#url_googleplay").val();
		var request = $.ajax({
			url: url_eps_publish,
			type:"POST",
			data: {
				url_app:url_app,
				nonce: importgp_nonce.nonce,
			},
		});
		$('#form-import input').prop('disabled', true);
		var exists_apk = false;
		
		request.done(function (data, textStatus, jqXHR){
			if( !IsJsonString(data) ) {
				alert("Error");
				$this.find(".spinner").removeClass("active");
				return;
			}
			var data = JSON.parse(data);
			if( data.post_id ) {
				$('.extract-box').after('<div style="font-weight:500;">'+
					'<ul id="extract-result">'+
						'<li class="result-true">'+data.info_text+'</li>'+
					'</ul>'+
				'</div>');

				if( data.apk_info ) {
					exists_apk = true;
					$('#extract-result').append('<li class="apk-result">'+data.apk_info.text.step1+'<ul></ul></li>');
					$('#extract-result .apk-result ul').append('<li>'+data.apk_info.text.step2+'</li>');
					var step3 = data.apk_info.text.step3;

					var upload_percentage = setInterval(function(){
						$.post( ajaxurl, { action: "action_get_filesize", timeout: 1000 } )
							.done(function(data) {
								$('.percentage').text(data);
								if( data == "100.00%" ) {
									$('#extract-result .apk-result ul').append('<li class="step3">'+step3+'</li>');
									clearInterval(upload_percentage);
								}
							})
							.error(function() {
								$('#extract-result .apk-result ul').html('<li class="result-error"><i class="fa fa-exclamation-circle" aria-hidden="true"></i> '+ajax_var.error_text+'</li>');
								clearInterval(upload_percentage);
							})
						}, 1500);
					
					var request_ajax = $.ajax({
						url: ajaxurl,
						type: "POST",
						data: {
							action: "action_upload_apk",
							apk: data.apk_info.url,
							post_id: data.apk_info.post_id,
							idps: data.apk_info.idps,
							date: data.apk_info.date,
							nonce: importgp_nonce.nonce,
						},
					});
					request_ajax.done(function (data, textStatus, jqXHR){
						var data_apk = JSON.parse(data);
						if( data_apk.error ) {
							
							$('.apk-result ul li').last().html('<i class="fa fa-exclamation-circle" aria-hidden="true"></i> '+data_apk.error).addClass('result-error');
							request_ajax.abort();
							return;
						}
						if( data_apk.info ){
							$('.apk-result').html('<li class="apk-result" style="color:#10ac10;">'+data_apk.info+'</li>');
						}
					});

					request_ajax.fail(function (jqXHR, textStatus, errorThrown){
						$('.apk-result ul li').last().html('<i class="fa fa-exclamation-circle" aria-hidden="true"></i> Error').addClass('result-error');
						console.error(
							"The following error occurred: "+
							textStatus, errorThrown
						);
					});
					request_ajax.always(function () {
						$this.find(".spinner").removeClass("active");
						$('#url_googleplay').val('');
						$('#form-import input').prop('disabled', false);
						clearInterval(upload_percentage);
					});
				} else {

				}
			} else {
				if( data.info ){
					$('.extract-box').after('<div style="font-weight:500;">'+
						'<ul id="extract-result">'+
							'<li style="color:red;">'+data.info+'</li>'+
						'</ul>'+
					'</div>');
				}
				$this.find(".spinner").removeClass("active");
				$('#url_googleplay').val('');
				$('#form-import input').prop('disabled', false);
			}
		});
		request.fail(function (jqXHR, textStatus, errorThrown){
			console.error(
				"The following error occurred: "+
				textStatus, errorThrown
			);
		});
		request.always(function () {
			if( !exists_apk ) {
				$this.find(".spinner").removeClass("active");
				$('#url_googleplay').val('');
				$('#form-import input').prop('disabled', false);
			}
		});
	}); 

	
	$( "ul.px-orden-cajas" ).sortable();
	$( "ul.px-orden-cajas" ).disableSelection();

	$('#panel_theme_tpx #menu ul li a').on('click', function(e){
		$('#panel_theme_tpx .section').removeClass('active');
		
		if(!$(''+$(this).attr('href')+'').hasClass('active')){
			var url = $(this).attr('href').replace('#', '');
			$('.section[data-section='+url+']').addClass('active');
		}

		$(this).parent().parent().find('li').removeClass('active');
		$(this).parent().addClass('active');
		$(window).on('popstate',function(event) {
			$('#panel_theme_tpx .section').removeClass('active');
			$('.section[data-section='+location.hash.replace('#','')+']').addClass('active');
		});
	});

	$('.switch-show').each(function(index, element){
		var el = $(this).data('sshow');

		if( $(this).find('input').is(':checked') )
			$("."+el).show();
		else
			$("."+el).hide();
	});

	$(document).on('change', '.switch-show input', function(){
		var el = $(this).parent().data('sshow');

		if( $(this).is(':checked') )
			$("."+el).show();
		else
			$("."+el).hide();
	});

	$(document).on('click', '#button_google_drive_connect', function(e){
		if( !$('#gdrive_client_id').val().length || !$('#gdrive_client_secret').val().length ) {
			$('#gdrive_client_id').css('border-color', 'red');
			$('#gdrive_client_secret').css('border-color', 'red');
			e.preventDefault();
		}
	});

	$(document).on('click', '#gdrive_client_id, #gdrive_client_secret', function(){
		$(this).removeAttr('style');
	});

	$(document).on('click', '.autocomplete_info_download_apk_zip', function(e){
		e.preventDefault();

		tinyMCE.get('apps_info_download_apk').setContent($('#default_apps_info_download_apk').html());
		
		tinyMCE.get('apps_info_download_zip').setContent($('#default_apps_info_download_zip').html());

	});

	var request;
	$(document).on('submit', '#form-panel', function(e){
		e.preventDefault();
		if (request) {
			request.abort();
		}
		$(this).addClass('wait');
		$(this).find('.submit').prepend('<span class="spinner active"></span>');
		var form = $(this);
		var inputs = form.find("input, select, button, textarea");
		var serializedData = form.serialize();
		inputs.prop("disabled", true);
		request = $.ajax({
			url: ajaxurl,
			type: "POST",
			data: {
				action: ajax_var.action,
				nonce: ajax_var.nonce,
				serializedData: serializedData,
			}
		});
		request.done(function (data, textStatus, jqXHR){
			$(form).find('.spinner').remove();
			$(form).find('.submit').prepend('<span class="panel-check"><i class="fa fa-check"></i></span>');
			$(form).removeClass('wait');
				
			setTimeout(() => {
				$(form).find('.submit .panel-check').fadeOut(500, function(){
					$(this).remove();
				});
			}, 1000);
		});
		request.fail(function (jqXHR, textStatus, errorThrown){
			console.error(
				"The following error occurred: "+
				textStatus, errorThrown
			);
		});
		request.always(function () {
			inputs.prop("disabled", false);
		});
	});
});
