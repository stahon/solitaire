var myApp = new Framework7({swipeBackPage : false});
var $$ = Dom7;
var mainView = myApp.addView('.view-main',{}); 

var loading = false;
var lastIndex = $$('.list-block li').length;
var maxItems = 60;
var itemsPerLoad = 20;

myApp.onPageInit('raiting', function (page) {
	period_rait = 'week';
	$$.get('/mraiting_data', {firstIndex : 0, period : period_rait}, function (data) {
		$$('#raiting').html(data);
		$$('.infinite-scroll').on('infinite', function () {
			if (loading) return;
			loading = true;
			lastIndex = $$('#raiting li').length;
			$$.get('/mraiting_data', {firstIndex : lastIndex, period : period_rait}, function (data) {
				loading = false;
				if (data[data.length - 1] == "&") {
					data = data.slice(0, -1);
					myApp.detachInfiniteScroll($$('.infinite-scroll'));
					$$('.infinite-scroll-preloader').remove();
				}
				$$('#raiting').append(data);
			});
		});          
	});

	$$('.label-switch').on('change', function (e) {
		if (period_rait == 'week') {
			period_rait = 'global';
		} else {
			period_rait = 'week';
		}
		$$.get('/mraiting_data', {firstIndex : 0, period : period_rait}, function (data) {
			$$('#raiting').html(data);
		});
	});
});

myApp.onPageInit('teams', function (page) {
	period_team = 'week';
	$$.get('/mteam_data', {firstIndex : 0, period : period_team}, function (data) {
		if (data[data.length - 1] == "&") {
			data = data.slice(0, -1);
			myApp.detachInfiniteScroll($$('.infinite-scroll'));
			$$('.infinite-scroll-preloader').remove();
		}
		$$('#team').html(data);
		$$('.infinite-scroll').on('infinite', function () {
			if (loading) return;
			loading = true;
			lastIndex = $$('#team li').length;
			$$.get('/mteam_data', {firstIndex : lastIndex, period : period_team}, function (data) {
				loading = false;
				if (data[data.length - 1] == "&") {
					data = data.slice(0, -1);
					myApp.detachInfiniteScroll($$('.infinite-scroll'));
					$$('.infinite-scroll-preloader').remove();
				}
				$$('#team').append(data);
			});
		});          
	});

	$$('.label-switch').on('change', function (e) {
		if (period_team == 'week') {
			period_team = 'global';
		} else {
			period_team = 'week';
		}
		myApp.attachInfiniteScroll($$('.infinite-scroll'));
		$$.get('/mteam_data', {firstIndex : 0, period : period_team}, function (data) {
			if (data[data.length - 1] == "&") {
				data = data.slice(0, -1);
				myApp.detachInfiniteScroll($$('.infinite-scroll'));
				$$('.infinite-scroll-preloader').remove();
			}
			$$('#team').html(data);
		});
	});
});

myApp.onPageInit('solitaire_rule', function (page) {
	period_rait = 'week';
	period_game = 'week';
	var active_tabs = $$('#active_tabs').data('active');
	myApp.showTab('#tab-' + active_tabs);;
//	$$('#tab-1').removeClass('active');
//	$$('#tab-' + active_tabs).addClass('active');
	$$('.sol_rait').on('opened', function (e) {
		if (e.target.id != "") {
			var temp_id = e.currentTarget.id;
			var id = temp_id.split('_');
			$$.get('/msolraiting_data', {sol : id[2], firstIndex : 0, period : period_rait}, function (data) {
				if (data[data.length - 1] == "&") {
					data = data.slice(0, -1);
					data = '<div class="accordion-list"><ul id="ul_sol_rait_' + id[2] + '">' + data + '</ul>';
				} else {
					data = '<div class="accordion-list"><ul id="ul_sol_rait_' + id[2] + '">' + data + '</ul></div><div class="infinite-scroll-preloader" id="temp_preloader" style="display:none;"><div class="preloader"></div></div><a href="#" onclick="AddRait(' + id[2] + '); return false;" class="button" id="add_rait_button">Еще</a> ';
				}
				$$('#content_sol_rait_' + id[2]).html(data);
			});
		}
	}); 
	
	$$('.sol_game').on('opened', function (e) {
		if (e.target.id != "") {
			var temp_id = e.currentTarget.id;
			var id = temp_id.split('_');
			$$.get('/msolgame_data', {sol : id[2], firstIndex : 0, period : period_game}, function (data) {
				if (data[data.length - 1] == "&") {
					data = data.slice(0, -1);
					data = '<div class="accordion-list"><ul id="ul_sol_game_' + id[2] + '">' + data + '</ul>';
				} else {
					data = '<div class="accordion-list"><ul id="ul_sol_game_' + id[2] + '">' + data + '</ul></div><div class="infinite-scroll-preloader" id="temp_preloader2" style="display:none;"><div class="preloader"></div></div><a href="#" onclick="AddGame(' + id[2] + '); return false;" class="button" id="add_game_button">Еще</a> ';
				}
				$$('#content_sol_game_' + id[2]).html(data);
			});
		}
	}); 
	
	$$('#label-switch_rait').on('change', function (e) {
		myApp.accordionClose($$('.sol_rait'));
		if (period_rait == 'week') {
			period_rait = 'global';
		} else {
			period_rait = 'week';
		}
	});
	$$('#label-switch_game').on('change', function (e) {
		myApp.accordionClose($$('.sol_game'));
		if (period_game == 'week') {
			period_game = 'global';
		} else {
			period_game = 'week';
		}
	});
});

function AddRait(sol_id) {
	$$('#temp_preloader').css({'display' : 'block'});
	var first_index = $$('#sol_rait_' + sol_id + ' li').length;
	$$.get('/msolraiting_data', {sol : sol_id, firstIndex : first_index, period : period_rait}, function (data) {
		if (data[data.length - 1] == "&") {
			data = data.slice(0, -1);
			$$('#add_rait_button').css({'display' : 'none'});
		}
		$$('#ul_sol_rait_' + sol_id).append(data);
		$$('#temp_preloader').css({'display' : 'none'});
	});
}
function AddGame(sol_id) {
	$$('#temp_preloader2').css({'display' : 'block'});
	var first_index = $$('#sol_game_' + sol_id + ' li').length;
	$$.get('/msolgame_data', {sol : sol_id, firstIndex : first_index, period : period_game}, function (data) {
		if (data[data.length - 1] == "&") {
			data = data.slice(0, -1);
			$$('#add_game_button').css({'display' : 'none'});
		}
		$$('#ul_sol_game_' + sol_id).append(data);
		$$('#temp_preloader2').css({'display' : 'none'});
	});
}

myApp.onPageInit('news', function (page) {
	$$.get('/mnews_data', {firstIndex : 0}, function (data) {
		$$('#news').html(data);
		lastIndex = $$('#news li').length;
		$$('.infinite-scroll').on('infinite', function () {
			if (loading) return;
			loading = true;
			setTimeout(function () {
				loading = false;
				if (lastIndex >= maxItems) {
					myApp.detachInfiniteScroll($$('.infinite-scroll'));
					$$('.infinite-scroll-preloader').remove();
					return;
				}
				$$.get('/mnews_data', {firstIndex : lastIndex}, function (data) {
					$$('#news').append(data);
					lastIndex = $$('#news li').length;
				});
			}, 1000);
		});          
	});
});

myApp.onPageInit('game', function (page) {
	dhtmlLoadScript('js/velocity.min.js');
	dhtmlLoadScript('js/Game_mobile.js?sd=5');
});

myApp.onPageInit('shop', function (page) {
	dhtmlLoadScript('/js/Shop_mobile.js?sd=5');
});

function MyLogin(redirect) {
	var username = $$('#username').val();
	var password = $$('#password').val();
	$$.ajax({
		type: 'POST',
		url: '/login_submit.php?redirecturl=' + redirect,
		data: {username: username, password: password},
		success: function(data) {
			var arr_data = JSON.parse(data);;
			if (arr_data['status'] == 1) {
				location.replace(arr_data['txt']);
			} else {
				alert(arr_data['txt']);
			}
		},
		error:  function(xhr, str){
			alert('Возникла ошибка: ' + xhr.responseCode);
		}
	});
}

function dhtmlLoadScript(url) {
	var e = document.createElement("script");
	e.src = url;
	e.type="text/javascript";
	document.getElementsByTagName("head")[0].appendChild(e); 
}

function getCookie(name) {
	var pattern = "(?:; )?" + name + "=([^;]*);?";
	var regexp  = new RegExp(pattern);
	if (regexp.test(document.cookie))
	return decodeURIComponent(RegExp["$1"]);
	return false;
}

