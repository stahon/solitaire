GMWait = 0;
GMAnimateDeal = 1;
GMAnimate = 2;
GMDragStart = 3;
GMDrag = 4;
GMWaitServer = 5;
GMHint = 6;
GMAutorun = 7;
GMDragStartWithAnimate = 8;

LoadPage();

function GameOption() {
	function ChangeModeMenu() {
		$$('i').removeClass('random-icon-active');
		$$('i').removeClass('winning-icon-active');
		$$('i').removeClass('quest-icon-active');
		$$('i').removeClass('train-icon-active');
		if (this.Mode == 'rait') $$('.random-icon').addClass('random-icon-active');
		if (this.Mode == 'winning') $$('.winning-icon').addClass('winning-icon-active');
		if (this.Mode == 'quest') $$('.quest-icon').addClass('quest-icon-active');
		if (this.Mode == 'train') $$('.train-icon').addClass('train-icon-active');
		document.cookie = 'mode=' + this.Mode + '; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
	}

	this.ChangeModeMenu = ChangeModeMenu;
	var cur_url = window.location.pathname;
	document.cookie = 'cur_name=Klondike; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
	this.Sound = getCookie('sound');
	this.Sound = (this.Sound == "true");
	this.SoundStep = new Audio("/sound/card1.mp3")
	this.SoundHint = document.getElementById('hint');
	this.Automat = getCookie('automat');
	this.Automat = (this.Automat == "true");
	this.Animate = getCookie('animate');
	if (!this.Animate) this.Animate = 5;
	this.Hint = getCookie('hint');
	this.Hint = !(this.Hint == "false");
	this.HintAll = getCookie('hintall');
	this.HintAll = (this.HintAll == "true");
	this.Mode = getCookie('mode');
	if (!this.Mode) {
		this.Mode = "rait";
		document.cookie = 'mode=rait; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
	}
	this.ChangeModeMenu();
}

function CurUser() {
	this.Bonus = new Array(8);
	for (var I = 0; I < 8; I++) this.Bonus[I] = false;
}

function OneGame() {
	function CreateRandomRasklad() {
		res = new Array(208)
		var Coloda = new Array(0);
		for (var I = 0; I < Solitaire.deal_info[1]; I++) {
			var temp = new Array(0);
			for (var J = 0; J < Solitaire.deal_info[2]; J++) {
				temp.push(Solitaire.deal_info[0])
			}
			Coloda.push(temp);
		}
		for (I = 0; I < Solitaire.deal_info[0]; I++) {
			for (J = 0; J < Solitaire.deal_info[1]; J++) {
				for (var K = 0; K < Solitaire.deal_info[2]; K++) {
					var Card = Math.floor(Math.random() * Solitaire.deal_info[1])
					var Mast = Math.floor(Math.random() * Solitaire.deal_info[2])
					while (Coloda[Card][Mast] == 0) {
						Card = Math.floor(Math.random() * Solitaire.deal_info[1])
						Mast = Math.floor(Math.random() * Solitaire.deal_info[2])
					}
					Coloda[Card][Mast] = Coloda[Card][Mast] - 1;
					res[(I * Solitaire.deal_info[1] * Solitaire.deal_info[2] + J * Solitaire.deal_info[2] + K) * 2] = Card;
					res[(I * Solitaire.deal_info[1] * Solitaire.deal_info[2] + J * Solitaire.deal_info[2] + K) * 2 + 1] = Mast;
				}
			}
		}
		return res;
	}

	function CreateRasklad() {
		if (GameOption.Mode == 'quest' || GameOption.Mode == 'winning') {
			$$.ajax({
				url : '/getdeal.php?sol_id=' + Solitaire.ID + "&mode=" + GameOption.Mode,
				dataType : 'json',
				success : function(data) {
					Game.Rasklad = data.deal;
					Game.Deal();
				},
				error : function(data) {
					myApp.alert('Проверьте соединение с интернетом', '1001solitaire.com');
					Game.Rasklad = Game.CreateRandomRasklad();
					Game.Deal();
				}
			});
//			this.Rasklad = $('#Rasklad').html().split('^');
//			for (var I = 0; I < this.Rasklad.length; I++) {
//				this.Rasklad[I] = parseInt(this.Rasklad[I]);
//			}
		} else {
			this.Rasklad = Game.CreateRandomRasklad();
			this.Deal();
		}
	}

	function Start(repeat_bool) {
		if (repeat_bool == undefined) repeat_bool = false;
		this.start = false;
		this.Timer = 0;
		this.Penalty = new Array(6);
		this.BallPenalty = new Array(6);
		this.SumPenalty = 0;
		for (var I = 0; I < 6; I++) {
			this.Penalty[I] = 0;
			this.BallPenalty[I] = 0;
		}
		this.Step = new Array();
		this.UndoNumber = 0;
		this.CountHint = 0;
//	$('#Penalty').html('0');
		this.MyTimer = Solitaire.max_timer;
		for (I = 0; I < Solitaire.CardPlace.length; I++) {
			Solitaire.CardPlace[I].RMast = Solitaire.CardPlace[I].StartMast;
			Solitaire.CardPlace[I].Count = 0;
			if ((Solitaire.CardPlace[I].Kind == 0) || (Solitaire.CardPlace[I].Kind == 2) || (Solitaire.CardPlace[I].Kind == 3) || (Solitaire.CardPlace[I].Kind == 4)) {
				Solitaire.CardPlace[I].Zazor = 1;
			}
			if ((Solitaire.CardPlace[I].Kind == 1) || (Solitaire.CardPlace[I].Kind == 5)) {
				Solitaire.CardPlace[I].Zazor = 20;
			}
		}
		if (!repeat_bool) this.CreateRasklad();
	}

	function Deal() {
		var deal_coord = new Array();
		this.GameMode = GMAnimateDeal;
		for (var I = 0; I < Solitaire.CardsCount; I++) {
// Проверка, если нужна конкретная карта - меняется в массиве "Расклад"
			if (Solitaire.deal_info[I * 2 + 4] > 10000) {
				var TempCard = Solitaire.deal_info[I * 2 + 4] % 20000;
				var TempMast = TempCard % 100;
				TempCard = (TempCard - TempMast) / 100;
				TempMast = TempMast - 1;
				for (var J = I; J < Solitaire.CardsCount; J++) {
					if (((this.Rasklad[J * 2] == TempCard) || (TempCard == 13)) && (this.Rasklad[J * 2 + 1] == TempMast)) var TempNumber = J;
				}
				var temp = this.Rasklad[TempNumber * 2];
				this.Rasklad[TempNumber * 2] = this.Rasklad[I * 2];
				this.Rasklad[I * 2] = temp;
				temp = this.Rasklad[TempNumber * 2 + 1];
				this.Rasklad[TempNumber * 2 + 1] = this.Rasklad[I * 2 + 1];
				this.Rasklad[I * 2 + 1] = temp;
			}
			Solitaire.Card[I].Digit = this.Rasklad[I * 2];
			Solitaire.Card[I].Mast = this.Rasklad[I * 2 + 1];
			Solitaire.Card[I].NumberPC = Solitaire.pc_coloda;
			var shirt = (Solitaire.deal_info[I * 2 + 4] == 0);
			if (Solitaire.deal_info[I * 2 + 4] > 20000) shirt = false;
			if (Solitaire.osob == 71) {
				if (Solitaire.deal_info[I * 2 + 3] > 0) {
					Solitaire.Card[I].Draw(shirt);
					Solitaire.Card[I].Move(Solitaire.deal_info[I * 2 + 3], false);
				} else {
					Solitaire.Card[I].Draw(false);
					for (J = 0; J < Solitaire.CardPlace.length; J++) {
						if (Solitaire.CardPlace[J].REmpty == Solitaire.Card[I].Digit + 15) Solitaire.Card[I].Move(J, false);
					}
				}
			} else {
				Solitaire.Card[I].Draw(shirt);
				var res_move = Solitaire.Card[I].Move(Solitaire.deal_info[I * 2 + 3], false);
				deal_coord.push(res_move);
			}
		}
	this.AnimateDeal(0, deal_coord);
}

	function AnimateDeal(NumberCard, DealCoord) {
		var counter;
		var CurrentCard;
		var CurrentCard2;
		var tempcard;
		var el = document.getElementById('card_' + NumberCard);
		Velocity(el, {left : DealCoord[NumberCard][0] + "px",top : DealCoord[NumberCard][1] + "px"}, GameOption.Animate / 20, function() {Solitaire.Card[NumberCard].EndMove();});
		var obj = this;
		if (NumberCard + 1 < Solitaire.CardsCount) {
			setTimeout(function() {
				AnimateDeal.call(obj, NumberCard + 1, DealCoord);
			}, GameOption.Animate / 20);
		} else {
			FullResize();
			this.DrawBank();
			if (Solitaire.osob == 69) {
				for (var I = 0; I < Solitaire.CardPlace.length; I++) {
					if (Solitaire.CardPlace[I].Kind == 1) {
						var counter = 0;
						for (var J = 0; J < Solitaire.CardPlace[I].Count; J++) {
							var CurrentCard = FindCard(I, J);
							if (Solitaire.Card[CurrentCard].Digit == 12) {
								var CurrentCard2 = FindCard(I, counter);
								var tempcard = Solitaire.Card[CurrentCard2].NumberInColumn;
								Solitaire.Card[CurrentCard2].NumberInColumn = Solitaire.Card[CurrentCard].NumberInColumn;
								Solitaire.Card[CurrentCard].NumberInColumn = tempcard;
								counter = counter + 1;
								Solitaire.Card[CurrentCard].FullDraw();
								Solitaire.Card[CurrentCard2].FullDraw();
							}
						}
					}
				}
			}
			if (Game.Automat) Game.AutorunMake();
		}
	}

	function FirstStep() {
		this.start = true;
		$$.ajax({
			url : '/startgame.php?sol_id=' + Solitaire.ID + "&mode=" + GameOption.Mode + "&callback=?",
			crossDomain : true,
			dataType : 'json',
			success : function(data) {
				GameOption.ChangeModeMenu();
				$$('#menu_1').css({'display' : 'flex'});
				$$('#menu_2').css({'display' : 'none'});
				Game.ID = data.param1.game_id;
				if (GameOption.Mode == 'rait' && data.param1.mode == 'train') {
					myApp.confirm('У Вас закончилась энергия, поэтому результаты расклада не будут учитываться в рейтинге. Хотите купить энергии?', '1001solitaire.com', function() {
						mainView.router.loadPage('/mshop');
					});
				}
				GameOption.Mode = data.param1.mode;
			},
			error : function(data) {
				myApp.alert('Проверьте соединение с интернетом', '1001solitaire.com')
			}
		});
	}

	function AddStep(StCardCount, NumberSource, NumberDest, Shirt, Shirt2, Together) {
		this.AddPenalty(1, 1);
		if (this.UndoNumber != this.Step.length) this.Step.splice(this.UndoNumber, this.Step.length - this.UndoNumber)
		this.Step.push(new OneStep());
		this.UndoNumber = this.Step.length;
		this.Step[this.Step.length - 1].Create(StCardCount, NumberSource, NumberDest, Shirt, Shirt2);
		if (Together) {
			if (this.Step[this.Step.length - 2].Together == 0) this.Step[this.Step.length - 2].Together = 1;
			this.Step[this.Step.length - 1].Together = this.Step[this.Step.length - 2].Together + 1;
			for (var I = 1; I < this.Step[this.Step.length - 1].Together; I++) {
				this.Step[this.Step.length - I - 1].Together = this.Step[this.Step.length - 1].Together;
			}
		} else {
			this.Step[this.Step.length - 1].Together = 0;
		}
	}

	function DrawBank() {
		for (var I = 0; I < Solitaire.Card.length; I++) {
			$$('#card_' + I).html('');
		}
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if (Solitaire.CardPlace[I].Kind == 2 || Solitaire.CardPlace[I].Kind == 4 || Solitaire.CardPlace[I].Kind == 7) {
				var CurrentCard = FindCard(I, 100);
				if (CurrentCard < 404) {
					$$('#card_' + CurrentCard).html('<span>' + Solitaire.CardPlace[I].Count + '/' + (Solitaire.CardPlace[I].RMast - 1) + '</span>');
					$$('#card_' + CurrentCard).css({display : 'flex', fontSize : '1em'});
				} else {
					$$('.playcard').html('');
				}
			}
		}
	}

	function AutorunMake() {
		this.Hint = new Array();
		var best_step = 30;
		var best_source = 300;
		var best_dest = 300;
		for (var I = 0; I < Solitaire.Card.length; I++) {
			if (!Solitaire.Card[I].Shirt || ((Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 2 || Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 4 || Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 7) && Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Count - 1 == Solitaire.Card[I].NumberInColumn)) {
				var res = FindDest(I);
				for (var J = 0; J < res.length; J++) {
					if (res[J][1] < best_step) {
						best_step = res[J][1];
						best_source = I;
						best_dest = res[J][0];
					}
				}
			}
		}
		if ((best_step < 3) || ((best_step < 28) && ((Solitaire.osob == 77) || (Solitaire.osob == 76) || (Solitaire.osob == 65) || (Solitaire.osob == 64)))) {
			this.GameMode = GMAutorun;
			setTimeout(function() {
				if (User.Bonus[7]) {
					Game.AddPenalty(0, 2);
				} else {
					Game.AddPenalty(2, 2);
				}
				DragEvent.MouseClick(best_source, best_dest, false);
			}, GameOption.Animate * 0.1);
		} else {
			this.TempAutorun = false;
		}
	}

	function DefTimer() {
		if (this.start) this.Timer = this.Timer + 1;
		var temp = this.Timer % 60;
		if (temp < 10) temp = '0' + temp;
		var mytimer = Math.floor(this.Timer / 60) + ' : ' + temp;
		$$('#timer').html(mytimer);
		var AllWinCard = 0;
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if (Solitaire.CardPlace[I].Kind == 0) AllWinCard = AllWinCard + Solitaire.CardPlace[I].Count;
		}
		var PointRait = (this.Timer < Solitaire.max_timer ? AllWinCard * 80 + Solitaire.max_timer - this.SumPenalty - this.Timer : AllWinCard * 80 - this.SumPenalty);
		$$('#penalty').html(PointRait);
	}

	function AddPenalty(Add, KindPen) {
		this.SumPenalty = this.SumPenalty + Add * Solitaire.koef_penalty;
		this.Penalty[KindPen - 1] = this.Penalty[KindPen - 1] + 1;
		this.BallPenalty[KindPen - 1] = this.BallPenalty[KindPen - 1] + Add * Solitaire.koef_penalty;
	}

	this.CreateRandomRasklad = CreateRandomRasklad;
	this.CreateRasklad = CreateRasklad;
	this.Deal = Deal;
	this.Start = Start;
	this.AnimateDeal = AnimateDeal;
	this.FirstStep = FirstStep;
	this.AddStep = AddStep;
	this.DrawBank = DrawBank;
	this.AutorunMake = AutorunMake;
	this.DefTimer = DefTimer;
	this.AddPenalty = AddPenalty;

	this.AnimateCount = 0;
	this.idInterval = setInterval('Game.DefTimer();', 1000);
}

function CurSolitaire() {
	function ReadSolitaire() {
		var card_info = $$('#patience_rule').html().split('<br>\n');
		var place_info = card_info[1].split('^');
		for (var I = 0; I < Math.ceil(place_info.length / 6); I++) {
			this.CardPlace.push(new OnePlaceCard(I));
			this.CardPlace[I].StartMast = parseInt(place_info[I * 6]);
			this.CardPlace[I].RDigit = parseInt(place_info[I * 6 + 1]);
			this.CardPlace[I].RHvost = parseInt(place_info[I * 6 + 2]);
			this.CardPlace[I].REmpty = parseInt(place_info[I * 6 + 3]);
			this.CardPlace[I].MaxCount = parseInt(place_info[I * 6 + 4]);
			this.CardPlace[I].Dost = parseInt(place_info[I * 6 + 5]);
			this.CardPlace[I].CanNumberArr = new Array();
		}

		var bonus_info = card_info[0].split('^');
		this.place_count = parseInt(bonus_info[0]);
		this.max_timer = parseInt(bonus_info[1]);
		this.automat_deal_count = parseInt(bonus_info[2]);
		this.automat_deal_source = new Array();
		this.automat_deal_dest = new Array();
		for (var I = 0; I < this.automat_deal_count; I++) {
			this.automat_deal_source[I] = parseInt(bonus_info[3 + I * 2]);
			this.automat_deal_dest[I] = parseInt(bonus_info[4 + I * 2]);
		}
		this.koef_penalty = parseInt(bonus_info[3 + this.automat_deal_count * 2]);
		this.koef_penalty = 5;
		this.osob = parseInt(bonus_info[4 + this.automat_deal_count * 2]);
		var count_number = parseInt(bonus_info[5 + this.automat_deal_count * 2]);
		var counter = 6 + this.automat_deal_count * 2;
		for (I = 0; I < count_number; I++) {
			var cur_number = parseInt(bonus_info[counter]);
			this.CardPlace[cur_number].CanNumber = parseInt(bonus_info[counter + 1]);
			for (var J = 0; J < this.CardPlace[cur_number].CanNumber; J++) {
				this.CardPlace[cur_number].CanNumberArr.push(parseInt(bonus_info[counter + 2 + J]));
			}
			counter = counter + 2 + this.CardPlace[cur_number].CanNumber;
		}

		this.deal_info = card_info[2].split('^');
		var ColodaCount = this.deal_info[0];
		var CardCount = this.deal_info[1];
		var MastCount = this.deal_info[2];
		this.CardsCount = ColodaCount * CardCount * MastCount;
	}

	function DrawGrid() {
		var grid_info = $$('#cardplace_rule').html().split('$');
		var grid_width = grid_info[0].split('^');
		var grid_height = grid_info[1].split('^');
		if (grid_info.length == 3) {
			var offset_pc = new Array();
			var grid_pc = grid_info[2].split('^');
		} else {
			var offset_pc = grid_info[2].split('^');
			var grid_pc = grid_info[3].split('^');
		}
		var dom_txt = '';
		for (var I = 0; I < grid_height.length; I++) {
			for (var J = 0; J < grid_width.length; J++) {
				dom_txt = dom_txt + '<div class="grid" id="grid_' + I + '_' + J + '"></div>';
			}
		}
		$$('.wrap').html(dom_txt);
		for (I = 0; I < grid_height.length; I++) {
			for (J = 0; J < grid_width.length; J++) {
				$$('#grid_' + I + '_' + J).css({width : grid_width[J] + '%'});
				$$('#grid_' + I + '_' + J).css({height : grid_height[I] + '%'});
			}
		}
		var numb = 0;
		var numb2 = 0;
		for (I = 0; I < grid_pc.length / 2; I++) {
			numb = Math.floor(parseInt(grid_pc[I * 2]) / grid_width.length);
			numb2 = parseInt(grid_pc[I * 2]) - numb * grid_width.length
			$$('#grid_' + numb + '_' + numb2).html('<div class="cardplace" id="cardplace_' + I + '" onClick="DragEvent.ReDeal();">');
			this.CardPlace[I].Kind = parseInt(grid_pc[I * 2 + 1]);
		}

		var wrap_el = $$('.page[data-page="game"] .page-content');
		for (I = 0; I < offset_pc.length / 3; I++) {
			$$('#grid_' + offset_pc[I * 3]).css({marginLeft : offset_pc[I * 3 + 1] + "%"});
			$$('#grid_' + offset_pc[I * 3]).css({marginRight : -offset_pc[I * 3 + 1] + "%"});
			$$('#grid_' + offset_pc[I * 3]).css({marginTop : offset_pc[I * 3 + 2] + "%"});
			$$('#grid_' + offset_pc[I * 3]).css({marginBottom : -offset_pc[I * 3 + 2] + "%"});
		}
		for (I = 0; I < this.CardPlace.length; I++) {
			this.DrawEmptyText(I);
			var el = document.getElementById('cardplace_' + I);
			this.CardPlace[I].Left = el.offsetLeft + parseInt(wrap_el[0].offsetLeft);
			this.CardPlace[I].Top = el.offsetTop;
			if (this.CardPlace[I].Kind == 8) {
				this.pc_coloda = I;
				$$("#cardplace_" + I).css({display : 'none'});
			}
			if (this.CardPlace[I].Kind == 1 && this.CardPlace[I].Dost == 3) {
				$$("#cardplace_" + I).css({border : '0px'});
				if (this.CardPlace[I].RMast != 0) $$("#cardplace_" + this.CardPlace[I].RMast).css({border : '0px'});
				if (this.CardPlace[I].RDigit != 0) $$("#cardplace_" + this.CardPlace[I].RDigit).css({border : '0px'});
			}
		}
	}

	function DrawCards() {
		var dom_txt = '';
		for (var I = 0; I < this.CardsCount; I++) {
			if (this.Card.length == I) this.Card.push(new OneCard(I));
			dom_txt = dom_txt + '<div class="play_card" id="card_' + I + '"/></div>'
		}
		$$('#cardplace_' + this.pc_coloda).append(dom_txt + '<div class="play_card" id="black"/></div>');
		for (var I = 0; I < this.CardsCount; I++) {
			$$('#card_' + I).css({left : '0px', top : '0px'});
		}
	}

	function DrawEmptyText(NumberDest) {
		if (this.CardPlace[NumberDest].REmpty == 0) {
			nameID = '#cardplace_' + NumberDest;
			$$(nameID).html('<div class="EmptyText">*</div>');
		}
		if (this.CardPlace[NumberDest].REmpty == 1) {
			nameID = '#cardplace_' + NumberDest;
			$$(nameID).html('<div class="EmptyText">X</div>');
		}
		if (this.CardPlace[NumberDest].REmpty == 2) {
			nameID = '#cardplace_' + NumberDest;
			$$(nameID).html('<div class="EmptyText">A</div>');
		}
		if ((this.CardPlace[NumberDest].REmpty > 2) && (this.CardPlace[NumberDest].REmpty < 12)) {
			nameID = '#cardplace_' + NumberDest;
			$$(nameID).html('<div class="EmptyText">' + (this.CardPlace[NumberDest].REmpty - 1) + '</div>');
		}
		if (this.CardPlace[NumberDest].REmpty == 12) {
			nameID = '#cardplace_' + NumberDest;
			$$(nameID).html('<div class="EmptyText">J</div>');
		}
		if (this.CardPlace[NumberDest].REmpty == 13) {
			nameID = '#cardplace_' + NumberDest;
			$$(nameID).html('<div class="EmptyText">Q</div>');
		}
		if (this.CardPlace[NumberDest].REmpty == 14) {
			nameID = '#cardplace_' + NumberDest;
			$$(nameID).html('<div class="EmptyText">K</div>');
		}
		if ((this.CardPlace[NumberDest].RKind == 2) || (this.CardPlace[NumberDest].RKind == 4) || (this.CardPlace[NumberDest].RKind == 7)) {
			nameID = '#cardplace_' + NumberDest;
			if (this.CardPlace[NumberDest].RMast > 0) {
				$4(nameID).html('<div class="EmptyText">*</div>');
			} else {
				$$(nameID).html('<div class="EmptyText">X</div>');
			}
		}
	}

	this.ReadSolitaire = ReadSolitaire;
	this.DrawGrid = DrawGrid;
	this.DrawCards = DrawCards;
	this.DrawEmptyText = DrawEmptyText;

	this.CardPlace = new Array();
	this.Card = new Array();

	this.ReadSolitaire();
	this.DrawGrid();
	this.DrawCards();
	this.ID = Sol_ID;
	Solitaire = this;
	if (typeof Game != "undefined") clearInterval(Game.idInterval);
	Game = new OneGame();
	User = new CurUser();
	DragEvent = new DragAndDrop();
}

function OneCard(NumberCard1) {

function Move(NumberDest, Anim) {
	if (GameOption.Sound) {
		GameOption.SoundStep.src = "/sound/card1.mp3";
		GameOption.SoundStep.play();
	}
// Уменьшаем значение кол-ва карт на старом месте
	var nameID = "#card_" + this.NumberCard;
	if (this.NumberPC < 200) {
		Solitaire.CardPlace[this.NumberPC].Count = Solitaire.CardPlace[this.NumberPC].Count - 1;
		if (Solitaire.CardPlace[this.NumberPC].Kind == 1) {
			var CurrentCard = FindCard(this.NumberPC, 100);
			if ((CurrentCard < 404) && (Solitaire.Card[CurrentCard].Shirt)) {
				Solitaire.Card[CurrentCard].Draw(false);
			}
		}
	}
	if ((this.NumberPC < 200) && (Solitaire.CardPlace[this.NumberPC].Kind == 5)) {
		var FirstNumber = this.NumberInColumn;
		var LastNumber = Solitaire.CardPlace[this.NumberPC].Count + 1;
		for (var I = FirstNumber; I < LastNumber; I++) {
			CurrentCard = FindCard(this.NumberPC, I);
			Solitaire.Card[CurrentCard].NumberInColumn = Solitaire.Card[CurrentCard].NumberInColumn - 1;
			Solitaire.Card[CurrentCard].Draw(false);
		}
	}
	if (Solitaire.CardPlace[NumberDest].Kind == 2) {
		this.Draw(true);
	}
// Вычисляем новые координаты
	var CurrentCard = FindCard(NumberDest, 100);
	var el1 = document.getElementById('cardplace_' + this.NumberPC);
	var el2 = document.getElementById('cardplace_' + NumberDest);
	var el3 = document.getElementById('card_' + this.NumberCard);
	if (Solitaire.CardPlace[NumberDest].MaxCount > 999) {
		var koef = 0;
		var koef2 = 10;
	} else {
		var koef = Solitaire.CardPlace[NumberDest].Zazor;
		var koef2 = 0;
	}
	this.left_css = koef2 * Solitaire.CardPlace[NumberDest].Count;
	this.top_css = koef * Solitaire.CardPlace[NumberDest].Count;
	var card_width = el2.clientWidth;
	var card_height = el2.clientHeight;
	var temp = parseInt(el2.offsetLeft) - parseInt(el1.offsetLeft) + this.left_css * card_width / 100;
	var temp2 = parseInt(el2.offsetTop) - parseInt(el1.offsetTop) + this.top_css * card_height / 100;
	Game.AnimateCount = Game.AnimateCount + 1;
// Меняем z-index для ее видимости
	this.NumberPC = NumberDest;
	this.NumberInColumn = Solitaire.CardPlace[NumberDest].Count;
	$$(nameID).css({zIndex : this.NumberInColumn});
// Увеличиваем значение кол-ва карт на новом месте
	Solitaire.CardPlace[NumberDest].Count = Solitaire.CardPlace[NumberDest].Count + 1;
// Делаем анимацию
	if (Anim) {
		var tempindex = this.NumberInColumn;
		$$(nameID).css({zIndex : 1000 + tempindex});
		var nc = this.NumberCard;
		$$(nameID).css({left : el3.offsetLeft + "px",top : el3.offsetTop + "px"});
		if (Game.GameMode == GMAutorun) {
			Velocity($$(nameID), {left : temp + "px",top : temp2 + "px"}, 5, function() {Solitaire.Card[nc].EndMove();});
		} else {
			Velocity($$(nameID), {left : temp + "px",top : temp2 + "px"}, GameOption.Animate, function() {Solitaire.Card[nc].EndMove();});
		}
		Game.GameMode = GMAnimate;
	} else {
		var DealCoord = new Array(2);
		DealCoord[0] = temp;
		DealCoord[1] = temp2;
// Делаем 75-ю особенность
		if (((Solitaire.osob == 75) || (Solitaire.osob ==66)) & (Solitaire.CardPlace[NumberDest].Kind == 0)) {
			for (var I = 0; I < Solitaire.CardPlace.length; I++) {
				if (Solitaire.CardPlace[I].Kind == 0) {
					Solitaire.CardPlace[I].REmpty = this.Digit + 2;
					Solitaire.DrawEmptyText(I);
				}
				if (Solitaire.CardPlace[I].Kind == 1 && Solitaire.CardPlace[I].REmpty > 1) {
					if (this.Digit != 2) Solitaire.CardPlace[I].REmpty = this.Digit + 1;
					Solitaire.DrawEmptyText(I);
				}
			}
		}
		return DealCoord;
	}
}
function Draw(Shirt) {
	Shirt ? BP = '0% 100%' : BP = '' + this.Digit * 100 / 12 + '% ' + this.Mast * 25 + '%';
	this.Shirt = Shirt;
	document.getElementById("card_" + this.NumberCard).style.backgroundPosition = BP;
}
function FullDraw() {
	if (Solitaire.CardPlace[this.NumberPC].MaxCount > 999) {
		var koef = 0;
		var koef2 = 10;
	} else {
		var koef = Solitaire.CardPlace[this.NumberPC].Zazor;
		var koef2 = 0;
	}
	var temp = koef2 * this.NumberInColumn;
	var temp2 = koef * this.NumberInColumn;
	var nameID = "#card_" + this.NumberCard;
	$$(nameID).css({left : (koef2 * this.NumberInColumn) + "%"});
	$$(nameID).css({top : (koef * this.NumberInColumn) + "%"});
	$$(nameID).css({zIndex : this.NumberInColumn});
	this.Draw(this.Shirt);
}
function EndMove() {
		$$("#card_" + this.NumberCard).css({zIndex : this.NumberInColumn});
		$$("#card_" + this.NumberCard).appendTo($$("#cardplace_" + this.NumberPC));
		$$("#card_" + this.NumberCard).css({top : this.top_css + "%"});
		$$("#card_" + this.NumberCard).css({left : this.left_css + "%"});
		$$("#card_" + this.NumberCard).css({zIndex : this.NumberInColumn});
		var el = document.getElementById('card_' + this.NumberCard)
		this.Left = el.offsetLeft;
		this.Top = el.offsetTop;
		Game.AnimateCount = Game.AnimateCount - 1;
		if (Game.AnimateCount == 0) {
			if (Game.GameMode == GMAnimate || Game.GameMode == GMAnimateDeal) Game.GameMode = GMWait;
			if (Game.GameMode == GMDragStartWithAnimate) Game.GameMode = GMDragStart;
			if (GameOption.Automat || Game.TempAutorun) {
				if ((Solitaire.osob == 77) || (Solitaire.osob == 76) || (Solitaire.osob == 65) || (Solitaire.osob == 64)) {
					Game.AutorunMake();
				} else {
					Game.AutorunMake();
				}
			}
		}
}

	this.NumberCard = NumberCard1;
	this.Digit = 0;
	this.Mast = 0;
	this.Shirt = true;
	this.NumberPC = 0;
	this.NumberInColumn = 0;
	this.Move = Move;
	this.Draw = Draw;
	this.FullDraw = FullDraw;
	this.EndMove = EndMove;
}

function OnePlaceCard(NumberPlace1) {
	this.NumberPlace = NumberPlace1;
	this.Left = 0;
	this.Top = 0;
	this.Count = 0;
	this.Kind = 0;
	this.RMast = 0;
	this.RDigit = 0;
	this.RHvost = 0;
	this.REmpty = 0;
	this.MaxCount = 0;
	this.CanNumber = 100;
	this.CanNumberArr = new Array();
	this.Zazor = 0;
	this.Dost = 0;
}

function OneStep() {

function Create(StCardCount, NumberSource, NumberDest) {
	this.CardCount = StCardCount;
	this.NumberSource = NumberSource;
	this.NumberDest = NumberDest;
	var CurrentCard = FindCard(NumberSource, Solitaire.CardPlace[NumberSource].Count - StCardCount - 1);
	this.Shirt = (CurrentCard == 404) || (Solitaire.Card[CurrentCard].Shirt);
	CurrentCard = FindCard(NumberSource, Solitaire.CardPlace[NumberSource].Count - StCardCount);
	this.Shirt2 = (CurrentCard == 404) || (Solitaire.Card[CurrentCard].Shirt);
}
function Back(CountTogether, Rekurs) {
	Game.CountHint = 0;
	$$('.hint-icon').html('');
	ColumnHeight(this.NumberSource, this.CardCount);
	ColumnHeight(this.NumberDest, -this.CardCount);
	var FirstCardNumber = Solitaire.CardPlace[this.NumberDest].Count - this.CardCount;
	var CurrentCard = FindCard(this.NumberSource, 100);
	if (CurrentCard < 404) Solitaire.Card[CurrentCard].Draw(this.Shirt);
	for (var I = FirstCardNumber; I < FirstCardNumber + this.CardCount; I++) {
		CurrentCard = FindCard(this.NumberDest, I);
		Solitaire.Card[CurrentCard].Move(this.NumberSource, true);
		if (CurrentCard < 404) Solitaire.Card[CurrentCard].Draw(this.Shirt2);
	}
	Game.UndoNumber = Game.UndoNumber - 1;
	if (this.Together > CountTogether) {
		CountTogether = Game.Step[Game.UndoNumber - 1].Back(CountTogether + 1, true);
	}
	return CountTogether;
}
function Forward(Rekurs) {
	var FirstCardNumber = Solitaire.CardPlace[this.NumberSource].Count - this.CardCount;
	for (var I = FirstCardNumber; I < FirstCardNumber + this.CardCount; I++) {
		var CurrentCard = FindCard(this.NumberSource, I);
		Solitaire.Card[CurrentCard].Move(this.NumberDest, true);
		if (CurrentCard < 404) Solitaire.Card[CurrentCard].Draw(false);
	}
	if (Rekurs) {
		Game.CountHint = 0;
		$$('.hint-icon').html('');
		Game.UndoNumber = Game.UndoNumber + 1;
		var counter = 1;
		while (counter < this.Together) {
			Game.Step[Game.UndoNumber].Forward(false);
			Game.UndoNumber = Game.UndoNumber + 1;
			counter = counter + 1;
		}
	}
}

	this.Create = Create;
	this.Back = Back;
	this.Forward = Forward;

	this.CardCount = 0;
	this.NumberSource = 0;
	this.NumberDest = 0;
	this.Shirt = false;
	this.Shirt2 = false;
	this.Together = 0;
}

function DragAndDrop() {

function MouseOver(NumberCard) {
	if ((Game.GameMode == GMWait) && (!Solitaire.Card[NumberCard].Shirt)) {
		var obj = this;
		setTimeout(function() {ZoomCard.call(obj, NumberCard)}, 1000);
		this.MousePlace = NumberCard;
	}
}
function MouseOut(NumberCard) {
	if ((Game.GameMode == GMWait) && (NumberCard<200)) {
		$('#card_' + NumberCard).css({zIndex : Solitaire.Card[NumberCard].NumberInColumn });
		this.MousePlace = 200;
	}
}
function ZoomCard(NumberCard) {
	if ((this.MousePlace == NumberCard) && (Game.GameMode == GMWait)) {
		$('#card_' + NumberCard).css({zIndex : 1100});
	}
}
function AddDragTarget(NumberDest) {
	var NumberCard = FindCard(NumberDest, 100);
	if (NumberCard == 404) {
		DragTarget[DragTargetCount * 3] = parseInt($('#cardplace' + NumberDest).css("left"));
		DragTarget[DragTargetCount * 3 + 1] = parseInt($('#cardplace' + NumberDest).css("top"));
	} else {
		DragTarget[DragTargetCount * 3] = parseInt($('#card' + NumberCard).css("left"));
		DragTarget[DragTargetCount * 3 + 1] = parseInt($('#card' + NumberCard).css("top"));
	}
	DragTarget[DragTargetCount * 3 + 2] = NumberDest;
	DragTargetCount = DragTargetCount + 1;
}
function MainMouseDown(event) {
	this.DecodeEvent(event);
	this.startX = this.mouseX;
	this.startY = this.mouseY;
	this.NumberTopCard = new Array();
	var el2 = document.getElementById('card_0');
	var card_width = el2.clientWidth;
	var card_height = el2.clientHeight;
	this.NumberCard = -1;
	for (var I = 0; I < Solitaire.Card.length; I++) {
		curX = Solitaire.Card[I].Left + Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Left;
		curY = Solitaire.Card[I].Top + Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Top;
		if ((this.mouseX > curX) && (this.mouseX < curX + card_width) && (this.mouseY > curY) && (this.mouseY < curY + card_height)) {
			var Shirt_bool = !Solitaire.Card[I].Shirt || Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 2 || Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 4 || Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 7;
			if (((this.NumberCard == -1) || (Solitaire.Card[I].NumberInColumn > Solitaire.Card[this.NumberCard].NumberInColumn)) && Shirt_bool) {
				if (this.NumberCard > -1 && !Solitaire.Card[I].Shirt) this.NumberTopCard.push(this.NumberCard);
				this.NumberCard = I;
			} else {
				if (!Solitaire.Card[I].Shirt) this.NumberTopCard.push(I);
			}
		} else {
			if ((this.mouseX > curX - 0.2 * card_width) && (this.mouseX < curX + 1.2 * card_width) && (this.mouseY > curY - 0.2 * card_height) && (this.mouseY < curY + 1.2 * card_height)) {
				if (!Solitaire.Card[I].Shirt) this.NumberTopCard.push(I);
			}
		}
	}
	this.Aim();
	if (this.NumberCard > -1) {
		this.LastDown = this.NumberCard;
		this.MouseDown(this.NumberCard);
	}
}
function Aim() {
	var best_step = 1000;
	if (this.NumberCard > -1) {
		var all_step = FindDest(this.NumberCard);
		for (var I = 0; I < all_step.length; I++) {
			if (all_step[I][1] < best_step) {
				best_step = all_step[I][1];
			}
		}
	}
	if (best_step > 20) {
		for (I = 0; I < this.NumberTopCard.length; I++) {
			if (this.NumberTopCard[I] != this.LastDown) {
				var all_step = FindDest(this.NumberTopCard[I]);
				for (var J = 0; J < all_step.length; J++) {
					if (all_step[J][1] < best_step) {
						best_step = all_step[J][1];
						this.NumberCard = this.NumberTopCard[I];
					}
				}
			}
		}
	}
}
function MouseDown(NumberCard) {
	if (Game.GameMode == GMWait || Game.GameMode == GMAnimate) {
		var DragCount = Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Count - Solitaire.Card[NumberCard].NumberInColumn;
		if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 5) DragCount = 1;
		this.drag_number_card = new Array();
		for (var I = 0; I < DragCount; I++)
			this.drag_number_card.push(FindCard(Solitaire.Card[NumberCard].NumberPC, Solitaire.Card[NumberCard].NumberInColumn + I));
		if (CanDragHvost(this.drag_number_card[0])) {
			setTimeout(function() {if (Game.GameMode == GMDragStart) Game.GameMode = GMDrag}, 200);
			for (I = 0; I < DragCount; I++)
				$$('#card_' + this.drag_number_card[I]).css({zIndex : 500 + Solitaire.Card[this.drag_number_card[I]].NumberInColumn});
// Поиск мест, на которые можно переложить карты
			var all_step = FindDest(NumberCard);
			this.drag_target = new Array();
			this.drag_target_coord = new Array();
			var el2 = document.getElementById('card_0');
			var card_width = el2.clientWidth;
			var card_height = el2.clientHeight;
			for (I = 0; I < all_step.length; I++) {
				if (this.drag_target.indexOf(all_step[I][0]) == -1) {
					this.drag_target.push(all_step[I][0]);
					this.drag_target_coord.push([Solitaire.CardPlace[all_step[I][0]].Left, Solitaire.CardPlace[all_step[I][0]].Top]);
					var CurrentCard = FindCard(all_step[I][0], Solitaire.CardPlace[all_step[I][0]].Count - 1);
					if (CurrentCard == 404) {
						var temp1 = Solitaire.CardPlace[all_step[I][0]].Left + card_width;
						var temp2 = Solitaire.CardPlace[all_step[I][0]].Top + card_height;
					} else {
						var temp1 = Solitaire.CardPlace[all_step[I][0]].Left + Solitaire.Card[CurrentCard].Left + card_width;
						var temp2 = Solitaire.CardPlace[all_step[I][0]].Top + Solitaire.Card[CurrentCard].Top + card_height;
					}
					this.drag_target_coord[this.drag_target_coord.length - 1].push(temp1);
					this.drag_target_coord[this.drag_target_coord.length - 1].push(temp2);
				}
			}
		}
	}
	if (CanDragHvost(this.drag_number_card[0])) {
		if (Game.GameMode == GMWait) {
			Game.GameMode = GMDragStart;
		} else {
			if (Game.GameMode == GMAnimate) Game.GameMode = GMDragStartWithAnimate;
		}
	}
}
function MouseUp() {
	if (Game.GameMode == GMDrag) {
		Game.GameMode = GMWait;
		for (var I = 0; I < this.drag_target.length; I++) {
			if ((this.mouseX > this.drag_target_coord[I][0]) && (this.mouseX < this.drag_target_coord[I][2]) && (this.mouseY > this.drag_target_coord[I][1]) && (this.mouseY < this.drag_target_coord[I][3])) {
				this.MouseClick(this.drag_number_card[0], this.drag_target[I], false);
				return true;
			}
		}
		for (I = 0; I < this.drag_number_card.length; I++) {
			Solitaire.Card[this.drag_number_card[I]].FullDraw();
		}
	}
	if (Game.GameMode == GMDragStart || Game.GameMode == GMDragStartWithAnimate) {
		Game.GameMode = (Game.GameMode == GMDragStart ? GMWait : GMAnimate);
		for (var I = 0; I < this.drag_number_card.length; I++) {
			$$('#card_' + this.drag_number_card[I]).css({left : this.startX});
			$$('#card_' + this.drag_number_card[I]).css({top : this.startY + Solitaire.Card[this.drag_number_card[I]].Top });
			$$('#card_' + this.drag_number_card[I]).css({zIndex : Solitaire.Card[this.drag_number_card[I]].NumberInColumn});
		}
		this.MouseClick(this.drag_number_card[0], 100, false);
	}
}
function CardDrag(event){
	this.DecodeEvent(event);
	var currentX = this.mouseX - this.startX;
	var currentY = this.mouseY - this.startY;
	if ((Game.GameMode == GMDragStart) || (Game.GameMode == GMDrag)) {
		for (var I = 0; I < this.drag_number_card.length; I++) {
			$$('#card_' + this.drag_number_card[I]).css({left : (currentX + Solitaire.Card[this.drag_number_card[I]].Left) + "px"});
			$$('#card_' + this.drag_number_card[I]).css({top : (currentY + Solitaire.Card[this.drag_number_card[I]].Top) + "px"});
		}
//		$('#black').css({opacity : 0});
//		for (I=0; I<DragTargetCount; I++) {
//			if ((currentX>DragTarget[I*3]-70) && (currentX<DragTarget[I*3]+71) && (currentY>DragTarget[I*3+1]-95) && (currentY<DragTarget[I*3+1]+96)) {
//				$('#black').css({left : DragTarget[I*3]});
//				$('#black').css({top : DragTarget[I*3+1]});
//				$('#black').css({opacity : 0.5});
//			}
//		}
	}
}
function DecodeEvent(event) {
	var el = document.getElementsByClassName('wrap');
	if (event.touches == undefined) {
		this.mouseX = event.clientX - el[0].offsetLeft;
		this.mouseY = event.clientY - el[0].offsetParent.offsetTop;
	} else {
		event.preventDefault();
		this.mouseX = event.touches[0].pageX - el[0].offsetLeft;
		this.mouseY = event.touches[0].pageY - el[0].offsetParent.offsetTop;
	}
}
function MouseClick(NumberCard, NumberDest, Auto) {

	function Found_Click_Step(NumberCard) {
		var all_step = FindDest(NumberCard);
		var cost_step = 1000;
		for (var I = 0; I < all_step.length; I++) {
			if (all_step[I][1] < cost_step) {
				cost_step = all_step[I][1];
				NumberDest = all_step[I][0];
			}
		}
		if (cost_step == 1000) cost_step = 0;
		return {cost : cost_step, NumberDest : NumberDest}
	}

	function Make_Auto_Step(NumberDest) {
		Game.AnimateCount = Game.AnimateCount + 5;
		var CurrentCard = FindCard(NumberDest, Solitaire.CardPlace[NumberDest].Count - 2);
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if (Solitaire.CardPlace[I].Kind == 0) {
				var a1 = I;
				if (Solitaire.osob == 64) {
					setTimeout( function(CurrentCard) {
																	MouseClick(CurrentCard, a1, true);
																	Game.DrawBank();
																	for (var J = 0; J < Solitaire.CardPlace.length; J++) {
																		if (Solitaire.CardPlace[J].Kind == 4) {
																			var temp = J;
																		}
																	}
																	CurrentCard = FindCard(temp, 100);
																	if (CurrentCard != 404) {
																		MouseClick(CurrentCard, 100, false);
																	} else {
																		ReDeal(true);
																	}
																	Game.AnimateCount = Game.AnimateCount - 5;
																	}, GameOption.Animate, CurrentCard, TempAutorun);
				} else {
					setTimeout( function(CurrentCard) {MouseClick(CurrentCard, a1, true);
																	Game.DrawBank();
																	Game.AnimateCount = Game.AnimateCount - 5;
																	}, GameOption.Animate, CurrentCard);
				}
			}
		}
	}

	function Osob72(NumberDest) {
		var CurrentCard = FindCard(NumberDest, Solitaire.CardPlace[NumberDest].Count - 1);
		Solitaire.Card[CurrentCard].Shirt = false;
		Solitaire.Card[CurrentCard].Draw(false);
		Solitaire.Card[NumberCard].Shirt = true;
		Solitaire.Card[NumberCard].Draw(true);
	}
	function Osob64(NumberSource) {
		var first_step_redeal = true;
		for (var I = Solitaire.CardPlace.length - 1; I >= 0; I--) {
				if ((Solitaire.CardPlace[I].Kind == 1) && (Solitaire.CardPlace[I].Count > 0)) {
					if (first_step_redeal && Solitaire.osob == 65) {
						Game.AddStep(Solitaire.CardPlace[I].Count, I, NumberSource, false, true, false);
						first_step_redeal = false;
					} else {
						Game.AddStep(Solitaire.CardPlace[I].Count, I, NumberSource, false, true, true);
					}
					var temp = Solitaire.CardPlace[I].Count;
					for (var J = 0; J < temp; J++) {
						var CurrentCard = FindCard(I, 100);
						Solitaire.Card[CurrentCard].Draw(true);
						Solitaire.Card[CurrentCard].Move(NumberSource, true);
					}
				}
			}
	}

	if (!Game.start) Game.FirstStep();
	var NumberSource = Solitaire.Card[NumberCard].NumberPC;
	var TypeSource = Solitaire.CardPlace[NumberSource].Kind;
	if (!Solitaire.Card[NumberCard].Shirt || Auto) {
// Определяем окончательно "цель" (если клик, определяем автоматически)
		cost_step = 1;
		if (NumberDest == 100) {
			cur_step = Found_Click_Step(NumberCard);
			cost_step = cur_step.cost;
			NumberDest = cur_step.NumberDest;
			this.MouseOut(this.MousePlace);
		}
		if (((Solitaire.osob == 77) || (Solitaire.osob == 76) || (Solitaire.osob == 65) || (Solitaire.osob == 64)) && (Solitaire.CardPlace[NumberDest].Kind == 0) && (Auto == false)) cost = 1000;
// Делаем ход
		if (cost_step > 0 && cost_step != 30) {
			Game.CountHint = 0;
			$$('.hint-icon').html('');
			var BeginNumberCard = Solitaire.Card[NumberCard].NumberInColumn;
			var EndNumberCard = Solitaire.CardPlace[NumberSource].Count;
			if (Solitaire.CardPlace[NumberSource].Kind == 5) EndNumberCard = BeginNumberCard + 1;
			Game.AddStep(EndNumberCard - BeginNumberCard, NumberSource, NumberDest, true, true, Auto);
			ColumnHeight(NumberDest, EndNumberCard - BeginNumberCard);
			ColumnHeight(NumberSource, BeginNumberCard - EndNumberCard);
			for (var I = BeginNumberCard; I < EndNumberCard; I++) {
				var CurrentCard = FindCard(NumberSource, I);
				Solitaire.Card[CurrentCard].Move(NumberDest, true);
			}
			if (Auto) {
				Solitaire.Card[NumberCard].Shirt = false;
				Solitaire.Card[NumberCard].Draw(false);
				if (Solitaire.osob == 72) Osob72(NumberDest);
			}
// Если есть автораздача, продолжаем ход
			for (var I = 0; I < Solitaire.automat_deal_count; I++) {
				if ((Solitaire.CardPlace[Solitaire.automat_deal_dest[I]].Count == 0) && (Solitaire.CardPlace[Solitaire.automat_deal_source[I]].Count > 0)) {
					var CurrentCard = FindCard(Solitaire.automat_deal_source[I], Solitaire.CardPlace[Solitaire.automat_deal_source[I]].Count - (Solitaire.osob == 72 ? 3 : 1));
					var temp_ND = NumberDest;
					MouseClick(CurrentCard, Solitaire.automat_deal_dest[I], true);
					Game.DrawBank();
					NumberDest = temp_ND;
				}
			}
			if (((Solitaire.osob == 77) || (Solitaire.osob == 76) || (Solitaire.osob == 65) || (Solitaire.osob == 64)) && ((TypeSource == 1) || (TypeSource == 3)) && ((Solitaire.CardPlace[NumberDest].Kind == 1) || (Solitaire.CardPlace[NumberDest].Kind == 3)) && (NumberSource != NumberDest)) Make_Auto_Step(NumberDest);
		}
	}

	var First = true;
	if (((TypeSource == 4) || (TypeSource == 7) || (TypeSource == 2 && Solitaire.osob == 60 && Solitaire.CardPlace[BankNumber].Count < 9)) && (!Auto)) {
		Game.CountHint = 0;
		$$('.hint-icon').html('');
		if ((Solitaire.osob == 65) || (Solitaire.osob == 64)) Osob64(NumberSource);
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if (Solitaire.CardPlace[I].Kind == 1) {
				if (Solitaire.CardPlace[NumberSource].Count >= Solitaire.CardPlace[NumberSource].RDigit) {
					var tempcount = (Solitaire.osob == 60 ? 1 : Solitaire.CardPlace[NumberSource].RDigit);
				} else {
					var tempcount = Solitaire.CardPlace[NumberSource].Count;
				}
				if (First && (Solitaire.osob != 64 && Solitaire.osob !=65)) {
					Game.AddStep(tempcount, NumberSource, I, true, false, false);
					ColumnHeight(I, 1);
					ColumnHeight(NumberSource, -1);
					First = false;
				} else {
					Game.AddStep(tempcount, NumberSource, I, true, false, true);
					ColumnHeight(I, 1);
					ColumnHeight(NumberSource, -1);
				}
				for (var J = 0; J < tempcount; J++) {
					var CurrentCard = FindCard(NumberSource, Solitaire.CardPlace[NumberSource].Count - 1);
					Solitaire.Card[CurrentCard].Draw(false);
					Solitaire.Card[CurrentCard].Move(I, true);
				}
			}
		}
		Game.DrawBank();
	}
	if ((TypeSource == 2) && (Auto == false) && (Solitaire.osob != 60 || Solitaire.CardPlace[BankNumber].Count > 8)) {
		Game.CountHint = 0;
		$$('.hint-icon').html('');
		var tempcounter = 0;
		for (var I = 1; I < Solitaire.CardPlace.length; I++) {
			if (((Solitaire.CardPlace[I].Kind == 3) || (Solitaire.CardPlace[I].Kind == 0) && (Solitaire.osob == 67)) && (Solitaire.osob != 63) && (Solitaire.osob != 62) && (Solitaire.osob != 61)) {
				var card_count = (Solitaire.CardPlace[NumberSource].RDigit > Solitaire.CardPlace[NumberSource].Count ? Solitaire.CardPlace[NumberSource].Count : Solitaire.CardPlace[NumberSource].RDigit)
				for (var J = 0; J < card_count; J++) {
					if (tempcounter > 0) {
						Game.AddStep(1, NumberSource, I, true, false, true);
						ColumnHeight(J, 1);
						ColumnHeight(NumberSource, -1);
					} else {
						Game.AddStep(1, NumberSource, I, true, false, false);
						ColumnHeight(J, 1);
						ColumnHeight(NumberSource, -1);
					}
					tempcounter = tempcounter + 1;
					var CurrentCard = FindCard(NumberSource, Solitaire.CardPlace[NumberSource].Count - 1);
					if (CurrentCard != 404) {
						Solitaire.Card[CurrentCard].Draw(false);
						Solitaire.Card[CurrentCard].Move(I, true);
					}
				}
			}
		}
		Game.DrawBank();
	}
	if (TypeSource == 5) {
		var BeginNumberCard = Solitaire.Card[NumberCard].NumberInColumn;
		var EndNumberCard = Solitaire.CardPlace[NumberSource].Count;
		ColumnHeight(NumberSource, EndNumberCard-BeginNumberCard, false);
	}
	if (Game.GameMode == GMAnimate) {
		CanWin();
	}
}
function ReDeal(Auto) {
	if (typeof Auto == "undefined") Auto = false;
	if (Game.GameMode == GMWait || (Game.GameMode == GMAnimate && Auto)) {
		for (var Counter = 0; Counter < Solitaire.CardPlace.length; Counter++) {
			if (((Solitaire.CardPlace[Counter].Kind == 2) || (Solitaire.CardPlace[Counter].Kind == 4)) && (Solitaire.CardPlace[Counter].RMast > 1) && (Solitaire.CardPlace[Counter].Count == 0)) {
				Game.CountHint = 0;
				if ((Solitaire.osob == 65) ||  (Solitaire.osob == 64)) {
					for (var I = Solitaire.CardPlace.length - 1; I >= 0; I--) {
						if ((Solitaire.CardPlace[I].Kind == 1) && (Solitaire.CardPlace[I].Count > 0)) {
							Game.AddStep(Solitaire.CardPlace[I].Count, I, Counter, false, true, false);
							var temp = Solitaire.CardPlace[I].Count;
							for (var J = 0; J < temp; J++) {
								var CurrentCard = FindCard(I, 100);
								Solitaire.Card[CurrentCard].Draw(true);
								Solitaire.Card[CurrentCard].Move(Counter, true);
							}
						}
					}
					var CurrentCard = FindCard(Counter, 100);
					MouseClick(CurrentCard, 100, false);
				}
				Solitaire.CardPlace[Counter].RMast = Solitaire.CardPlace[Counter].RMast - 1;
				for (var I = 0; I < Solitaire.CardPlace.length; I++) {
				var moving = (Solitaire.CardPlace[I].Kind == 3 && Solitaire.CardPlace[Counter].Kind == 2) || (Solitaire.CardPlace[I].Kind == 1 && Solitaire.CardPlace[Counter].Kind == 4);
				if (Solitaire.osob == 60 && Solitaire.CardPlace[Counter].RMast == 1) {
					moving = (Solitaire.CardPlace[I].Kind == 1 && Solitaire.CardPlace[Counter].Kind == 4);
				}
				if ((Solitaire.osob == 65) ||  (Solitaire.osob == 64)) moving = false;
				if (moving) {
					temp = Solitaire.CardPlace[I].Count;
					for (J = 0; J < temp; J++) {
						if (J > 0) {
							Game.AddStep(1, I, Counter, false, true, true);
						} else {
							Game.AddStep(1, I, Counter, false, true, false);
						}
						CurrentCard = FindCard(I, 100);
						Solitaire.Card[CurrentCard].Draw(true);
						Solitaire.Card[CurrentCard].Move(Counter, true);
					}
				}
			}
			Game.DrawBank();
		}
		if ((Solitaire.CardPlace[Counter].Kind == 7) && (Solitaire.CardPlace[Counter].RMast > 1) && (Solitaire.CardPlace[Counter].Count == 0)) {
			CountHint = 0;
			Solitaire.CardPlace[Counter].RMast = Solitaire.CardPlace[Counter].RMast - 1;
			for (I=0; I<Solitaire.CardPlace.length; I++) {
				if ((Solitaire.CardPlace[I].Kind == 1) && (Solitaire.CardPlace[I].Count > 0)) {
					AddStep(Solitaire.CardPlace[I].Count, I, Counter, false, true, false);
					temp = Solitaire.CardPlace[I].Count;
					for (J=0; J<temp; J++) {
						CurrentCard = FindCard(I, 100);
						Solitaire.Card[CurrentCard].Draw(true);
						Solitaire.Card[CurrentCard].Move(Counter, true);
					}
				}
			}
			Game.DrawBank();
			for (I = 0; I < Solitaire.CardPlace[Counter].Count; I++) {
				temp = GetRandomInt(Solitaire.CardPlace[Counter].Count - 1) + 1;
				temp2 = GetRandomInt(Solitaire.CardPlace[Counter].Count - 1) + 1;
				temp = FindCard(Counter, temp - 1);
				temp2 = FindCard(Counter, temp2 - 1);
				temp3 = Solitaire.Card[temp].Digit;
				Solitaire.Card[temp].Digit = Solitaire.Card[temp2].Digit;
				Solitaire.Card[temp2].Digit = temp3;
				temp3 = Solitaire.Card[temp].Mast;
				Solitaire.Card[temp].Mast = Solitaire.Card[temp2].Mast;
				Solitaire.Card[temp2].Mast = temp3;
			}
		}
	}
		if (GameOption.Automat) {
			setTimeout('Game.AutorunMake()', GameOption.Animate);
		}
	}
}

this.MouseOver = MouseOver;
this.MouseOut = MouseOut;
this.ZoomCard = ZoomCard;
this.MainMouseDown = MainMouseDown;
this.Aim = Aim;
this.MouseDown = MouseDown;
this.CardDrag = CardDrag;
this.DecodeEvent = DecodeEvent;
this.MouseUp = MouseUp;
this.MouseClick = MouseClick;
this.ReDeal = ReDeal;

this.LastDown = 1000;
}

// ------------------------------------------------- ЛОГИКА ИГРЫ -----------------------------------------------------------------------------------

function ColumnHeight(NumberDest, CountCard) {
// Определяется допустимая высота колонки
	var el = document.getElementById('card_0');
	var card_width = el.clientWidth;
	var card_height = el.clientHeight;
	var el = document.getElementsByClassName('wrap');
	var max_height = el[0].clientHeight - Solitaire.CardPlace[NumberDest].Top;
	if (Solitaire.CardPlace[NumberDest].Dost != 3) {
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if ((I != NumberDest) && (Solitaire.CardPlace[I].Left + card_width > Solitaire.CardPlace[NumberDest].Left) && (Solitaire.CardPlace[I].Left - card_width < Solitaire.CardPlace[NumberDest].Left)) {
				if ((Solitaire.CardPlace[I].Top > Solitaire.CardPlace[NumberDest].Top) && (Solitaire.CardPlace[I].Top - Solitaire.CardPlace[NumberDest].Top < max_height)) max_height = Solitaire.CardPlace[I].Top - Solitaire.CardPlace[NumberDest].Top;
			}
		}
	}
	var max_zazor = 100 * (max_height - card_height) / (Solitaire.CardPlace[NumberDest].Count + CountCard) / card_height;
	if ((Solitaire.CardPlace[NumberDest].Kind == 1) || (Solitaire.CardPlace[NumberDest].Kind == 5) || (Solitaire.CardPlace[NumberDest].Kind == 6)) {
		Solitaire.CardPlace[NumberDest].Zazor = (max_zazor > 20 ? 20 : max_zazor);
	} else {
		Solitaire.CardPlace[NumberDest].Zazor = (max_zazor > 0.99999 ? 1 : 0);
	}
// Перерисовываем каждую карту в колонке
	for (I = 0; I < Solitaire.CardPlace[NumberDest].Count + CountCard; I++) {
		var CurrentCard = FindCard(NumberDest, I);
		if (CurrentCard < 404) {
			var nameID = '#card_' + CurrentCard;
			if (Solitaire.CardPlace[NumberDest].MaxCount > 999) {
				toptxt = "0";
				lefttxt = 10 * I;
			} else {
				toptxt = parseInt(Solitaire.CardPlace[NumberDest].Zazor * I);
				lefttxt = "0";
			}
			$$(nameID).css({top : toptxt + "%"});
			$$(nameID).css({left : lefttxt + "%"});
			var el = document.getElementById('card_' + CurrentCard)
			Solitaire.Card[CurrentCard].Left = el.offsetLeft;
			Solitaire.Card[CurrentCard].Top = el.offsetTop;
		}
	}
}
function FullResize() {
	$$('.cardplace').css({'width' : "67px"});
	var el = document.getElementById('card_0');
	var card_width = el.clientWidth;
	var card_height = el.clientHeight;
	var cur_width = parseInt($$('.cardplace').css('width'));
	var min_height = 1000;
	var all_grid = document.getElementsByClassName('grid');
	for (var I = 0; I < all_grid.length; I++) {
		var cur_height = all_grid[I].clientHeight;
		if (cur_height < min_height && cur_height > 0) min_height = cur_height;
	}
	if (min_height < card_height) {
		var new_width = 0.95 * cur_width * min_height / card_height;
		$$('.cardplace').css({'width' : new_width + "px"});
	}
	var wrap_el = $$('.page[data-page="game"] .page-content');
	for (I = 0; I < Solitaire.CardPlace.length; I++) {
		var el = document.getElementById('cardplace_' + I);
		Solitaire.CardPlace[I].Left = el.offsetLeft + parseInt(wrap_el[0].offsetLeft);
		Solitaire.CardPlace[I].Top = el.offsetTop;
		ColumnHeight(I, 0);
	}
}

function FindCard(NumberDest, NumberCard) {
	for (var I = 0; I < Solitaire.CardsCount; I++) {
		if (NumberCard == 100) NumberCard = Solitaire.CardPlace[NumberDest].Count - 1;
		if ((Solitaire.Card[I].NumberPC == NumberDest) && (Solitaire.Card[I].NumberInColumn == NumberCard)) return I;
	}
	return 404;
}
function FindDest(NumberCard) {

	function ChooseKindDest(NumberCard) {
		if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 3) return 8;
		if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 0) return 9;
		if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 5) return 10;

		if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 1 || Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 6) {
			var CurrentCard2 = FindCard(Solitaire.Card[NumberCard].NumberPC, Solitaire.Card[NumberCard].NumberInColumn - 1);
			if (CurrentCard2 == 404) return 2
			if (CanAll(NumberCard, CurrentCard2)) {
				return (CanDest(CurrentCard2) ? 6 : (CanBase(NumberCard, CurrentCard2) ? 7 : 5));
			} else {
				return (Solitaire.Card[CurrentCard2].Shirt ? 3 : (CanDest(CurrentCard2) ? 4 : 1));
			}
		}
	}

	var res = new Array();
	if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 4 || Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 7) {
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if (Solitaire.CardPlace[I].Kind == 1 && Solitaire.osob != 61 && Solitaire.osob != 62 && Solitaire.osob != 63) {
				res.push([I, 27]);
				return res;
			}
		}
		return res;
	}
	if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 2) {
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if (Solitaire.CardPlace[I].Kind == 3 && Solitaire.osob != 61 && Solitaire.osob != 62 && Solitaire.osob != 63) {
				res.push([I, 27]);
				return res;
			}
		}
		return res;
	}
	for (var I = 0; I < Solitaire.CardPlace.length; I++) {
		if (Solitaire.CardPlace[I].Kind == 0) {
			var Bool = true;
			if (Solitaire.osob == 73) Bool = Osmos(I, NumberCard);
			if (Solitaire.CardPlace[I].Count == 0) {
				if (Solitaire.osob == 62) Bool = FaeryPut(I, NumberCard, true);
				if (Solitaire.osob == 61) Bool = FaeryPut(I, NumberCard, true);
			}
			if (Bool) {
				var CurrentCard = FindCard(I, Solitaire.CardPlace[I].Count - 1);
				if (CanAll(NumberCard, CurrentCard)) {
					(Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 0) ? res.push([I, 49]) : res.push([I, 1]);
				}
				if ((Solitaire.CardPlace[I].Count == 0)) {
					if (CanEmptyCard(I, NumberCard) && CanNumber(Solitaire.Card[NumberCard].NumberPC, I)) {
						(Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 0) ? res.push([I, 49]) : res.push([I, 2]);
					}
				}
			}
		}
		var Main_Table = [[6, 15, 20], [5, 14, 54], [3, 11, 19], [4, 12, 13], [15, 35, 36], [10, 17, 18], [31, 37, 38], [9, 10, 22], [29, 30, 34], [7, 8, 21]];
		if (((Solitaire.CardPlace[I].Kind == 1) || (Solitaire.CardPlace[I].Kind == 6)) && (I != Solitaire.Card[NumberCard].NumberPC)) {
			if (((Solitaire.osob != 78) && (Solitaire.osob != 66)) || (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind != 1)) {
				var FaeryMode = true;
				if ((Solitaire.osob == 63) || (Solitaire.osob == 62) || (Solitaire.osob == 61)) {
					for (var J = 0; J < Solitaire.CardPlace.length; J++) {
						if ((Solitaire.CardPlace[J].Kind == 3) && (Solitaire.CardPlace[J].Count > 0)) FaeryMode = false;
					}
				}
				if (FaeryMode) {
					var CurrentCard = FindCard(I, Solitaire.CardPlace[I].Count - 1);
					if (CanAll(NumberCard, CurrentCard)) {
						var kind_source = ChooseKindDest(NumberCard);
						var kind_dest = (CanBase(NumberCard, CurrentCard) ? 1 : 2);
						res.push([I, Main_Table[kind_source - 1][kind_dest - 1]]);
					}
					if ((Solitaire.CardPlace[I].Count == 0) && (CanEmptyCard(I, NumberCard)) && CanNumber(Solitaire.Card[NumberCard].NumberPC, I)) {
						var kind_source = ChooseKindDest(NumberCard);
						res.push([I, Main_Table[kind_source - 1][2]]);
					}
				}
			}
		}
	}
// Не работает Королева Фей (убил сам!)
	if (typeof FaeryMode != "undefined" && !FaeryMode) {
		var FaeryNumber = 0;
		for (I = 0; I < Solitaire.CardPlace.length; I++) {
			if ((Solitaire.CardPlace[I].Kind == 1) && (Solitaire.CardPlace[I].Count > 0)) FaeryNumber = I;
		}
		if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 3) {
			if (Solitaire.Card[NumberCard].Digit != 12) {
				res.push([FaeryNumber, 29]);
			} else {
				res.push([FaeryNumber + 1, 29]);
			}
		}
	}
	return res;
}
function CanAll(Card1, Card2, Hvost) {
	if (typeof Hvost == "undefined") Hvost = false;
	if (Card2 < 404) {
		var NumberSource = Solitaire.Card[Card1].NumberPC;
		var NumberDest = Solitaire.Card[Card2].NumberPC;
		if (Solitaire.CardPlace[NumberDest].RMast > 15) {
			var Rule1 = parseInt(Solitaire.CardPlace[NumberDest].RMast / 10);
			var Rule2 = Solitaire.CardPlace[NumberDest].RMast % 10;
			var Bool1 = CanMast(Rule1, Solitaire.Card[Card1].Mast, Solitaire.Card[Card2].Mast);
			var Bool5 = CanMast(Rule2, Solitaire.Card[Card1].Mast, Solitaire.Card[Card2].Mast);
		} else {
			var Bool1 = CanMast(Solitaire.CardPlace[NumberDest].RMast, Solitaire.Card[Card1].Mast, Solitaire.Card[Card2].Mast);
			var Bool5 = false;
		}
		if (Solitaire.CardPlace[NumberDest].RDigit > 15) {
			var Rule1 = parseInt(Solitaire.CardPlace[NumberDest].RDigit / 10);
			var Rule2 = Solitaire.CardPlace[NumberDest].RDigit % 10;
			var Bool2 = CanCard(Rule1, Solitaire.Card[Card1].Digit, Solitaire.Card[Card2].Digit);
			var Bool6 = CanCard(Rule2, Solitaire.Card[Card1].Digit, Solitaire.Card[Card2].Digit);
		} else {
			var Bool2 = CanCard(Solitaire.CardPlace[NumberDest].RDigit, Solitaire.Card[Card1].Digit, Solitaire.Card[Card2].Digit);
			var Bool6 = false;
		}
		if ((Solitaire.CardPlace[NumberDest].RHvost == 9) || (Solitaire.CardPlace[NumberDest].RHvost == 10)) {
			Bool1 = true;
			Bool2 = true;
		}
		var Bool3 = CanHvost(Solitaire.CardPlace[NumberDest].RHvost, Card1, NumberDest);
		if (Hvost) Bool3 = true;
		var Bool4 = (Solitaire.CardPlace[NumberDest].MaxCount - Solitaire.CardPlace[NumberDest].Count > Solitaire.CardPlace[NumberSource].Count - Solitaire.Card[Card1].NumberInColumn - 1);
		if (NumberDest == NumberSource) Bool4 = true;
		if ((Solitaire.CardPlace[NumberSource].Kind == 5) && (Solitaire.CardPlace[NumberDest].MaxCount - Solitaire.CardPlace[NumberDest].Count > 1)) {
			Bool4 = true;
		}
		var Bool7 = CanNumber(NumberSource, NumberDest);
		if (((Bool1 && Bool2) || (Bool5 && Bool6)) && Bool3 && Bool4 && Bool7) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}
function CanBase(Card1, Card2) {
// Функция определяет, могут ли карты в такой последовательности идти на "базу" - на цель
	if (Card2 < 404) {
		var NumberSource = Solitaire.Card[Card1].NumberPC;
		var NumberDest = Solitaire.Card[Card2].NumberPC;
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if (Solitaire.CardPlace[I].Kind == 0) {
				var Bool1 = CanMast(Solitaire.CardPlace[I].RMast, Solitaire.Card[Card1].Mast, Solitaire.Card[Card2].Mast);
				var temp = Solitaire.CardPlace[I].RDigit;
				if (Solitaire.CardPlace[I].RHvost == 2) {
					if (temp == 2) temp = 3;
					if (temp == 3) temp = 2;
					if (temp == 4) temp = 5;
					if (temp == 5) temp = 4;
				}
				var Bool2 = CanCard(temp, Solitaire.Card[Card1].Digit, Solitaire.Card[Card2].Digit);
				temp = Solitaire.CardPlace[I].RHvost;
				if (temp == 4) temp = 3;
				if (temp == 6) temp = 5;
				Bool3 = CanHvost(temp, Card1, NumberDest, true);
				if (temp = 2) Bool3 = true;
				if (Bool1 && Bool2 && Bool3) return true;
			}
		}
	}
	return false;
}
function CanDest(Card1) {
	for (var I = 0; I < Solitaire.CardPlace.length; I++) {
		if (Solitaire.CardPlace[I].Kind == 0) {
			var CurrentCard = FindCard(I, Solitaire.CardPlace[I].Count - 1);
			if ((CanAll(Card1, CurrentCard, true)) || (Solitaire.CardPlace[I].Count == 0 && CanEmptyCard(I, Card1, true) && CanNumber(Solitaire.Card[Card1].NumberPC, I))) return true;
		}
	}
	return false;
}
function CanMast(TypeDest, Mast1, Mast2) {
	if (TypeDest == 0) return true;
	if (TypeDest == 1) return false;
	if (TypeDest == 2) return ((Mast1 == Mast2) || (Mast2 == 200));
	if (TypeDest == 3) return (Mast1 != Mast2);
	if (TypeDest == 4) return ((((Mast1 == 0) || (Mast1 == 2)) && ((Mast2 == 1) || (Mast2 == 3))) || (((Mast1 == 1) || (Mast1 == 3)) && ((Mast2 == 0) || (Mast2 == 2))));
	if (TypeDest == 5) return ((((Mast1 == 0) || (Mast1 == 2)) && ((Mast2 == 0) || (Mast2 == 2))) || (((Mast1 == 1) || (Mast1 == 3)) && ((Mast2 == 1) || (Mast2 == 3))));
}
function CanCard(TypeDest, Card1, Card2) {
	if (TypeDest == 0) return true;
	if (TypeDest == 1) return false;
	if (TypeDest == 2) return ((Card1 + 1 == Card2) || ((Card1 == 12) && (Card2 == 0)));
	if (TypeDest == 3) return ((Card1 - 1 == Card2) || ((Card1 == 0) && (Card2 == 12)));
	if (TypeDest == 4) return (Card1 + 1 == Card2);
	if ((TypeDest == 5) || (TypeDest == 8)) return (Card1 - 1 == Card2);
	if (TypeDest == 6) return (((Card1 + 1 == Card2) || (Card1 - 1 == Card2)) || ((Card1 == 12) && (Card2 == 0)) || ((Card1 == 0) && (Card2 == 12)));
	if (TypeDest == 7) return ((Card1 + 1 == Card2) || (Card1 - 1 == Card2));
	if (TypeDest == 9) return (Card1 == Card2);
	if (TypeDest == 10) return ((Card1 - 2 == Card2) || ((Card1 < 2) && (Card2 - Card1 == 11)));
	if (TypeDest == 11) return ((Card1 - 3 == Card2) || ((Card1 < 3) && (Card2 - Card1 == 10)));
	if (TypeDest == 12) return ((Card1 - 4 == Card2) || ((Card1 < 4) && (Card2 - Card1 == 9)));
	if (TypeDest == 13) return (Card1 + Card2 == 8);
	if (TypeDest == 14) return (Card1 + Card2 == 12);
}
function CanEmptyCard(NumberDest, Card1, OneCard) {
	if (typeof OneCard == "undefined") OneCard = false;
	if (CanHvost(Solitaire.CardPlace[NumberDest].RHvost, Card1, NumberDest, OneCard)) {
		var TypeDest = Solitaire.CardPlace[NumberDest].REmpty;
		if (TypeDest == 0) return true;
		if (TypeDest == 1) return false;
		if ((TypeDest > 1) && (TypeDest < 15)) {
			if (Solitaire.Card[Card1].Digit + 2 == TypeDest) {
				if (Solitaire.osob == 74 || Solitaire.osob == 60) return (Solitaire.Card[Card1].Mast == NumberDest % 4);
				return true;
			} else {
				return false;
			}
		}
		if (TypeDest == 15) return (Solitaire.CardPlace[Solitaire.Card[Card1].NumberPC].Kind == 5);
	} else {
		return false;
	}
}
function CanDragHvost(FirstCard) {
	var NumberPlaceCount = Solitaire.Card[FirstCard].NumberPC;
	var DostBool;
	if (Solitaire.CardPlace[NumberPlaceCount].Dost == 0) DostBool = true;
	if (Solitaire.CardPlace[NumberPlaceCount].Dost == 1) DostBool = false;
	if (Solitaire.CardPlace[NumberPlaceCount].Dost == 2) DostBool = (Solitaire.CardPlace[NumberPlaceCount].Count == Solitaire.Card[FirstCard].NumberInColumn + 1);
	if (Solitaire.CardPlace[NumberPlaceCount].Dost == 3) DostBool = (((Solitaire.CardPlace[NumberPlaceCount].RMast == 0) || (Solitaire.CardPlace[Solitaire.CardPlace[NumberPlaceCount].RMast].Count == 0)) && ((Solitaire.CardPlace[NumberPlaceCount].RDigit == 0) || (Solitaire.CardPlace[Solitaire.CardPlace[NumberPlaceCount].RDigit].Count == 0)));
	if (Solitaire.CardPlace[NumberPlaceCount].Dost == 4) DostBool = ((Solitaire.CardPlace[NumberPlaceCount].Count == Solitaire.Card[FirstCard].NumberInColumn+1) || (Solitaire.CardPlace[NumberPlaceCount].Count>0));
	if (DostBool) {
		for (var I = 0; I < Solitaire.CardPlace.length; I++) {
			if ((I != NumberPlaceCount) && (Solitaire.CardPlace[I].Kind < 2) && CanHvost(Solitaire.CardPlace[I].RHvost, FirstCard, I)) return true;
		}
	}
	return false;
}
function CanHvost(TypeDest, NumberCard, NumberDest, OneCard) {
	if (typeof OneCard == "undefined") OneCard = false;
	if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 5) OneCard = true;
	var HvostCount = (OneCard ? 1 : Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Count - Solitaire.Card[NumberCard].NumberInColumn);
	var HvostCard = new Array();
	var HvostMast = new Array();
	var HvostShirt = new Array();
	for (var I = 0; I < HvostCount; I++) {
		var CurrentCard = FindCard(Solitaire.Card[NumberCard].NumberPC, Solitaire.Card[NumberCard].NumberInColumn + I);
		HvostCard.push(Solitaire.Card[CurrentCard].Digit);
		HvostMast.push(Solitaire.Card[CurrentCard].Mast);
		HvostShirt.push(Solitaire.Card[CurrentCard].Shirt);
	}
	if (TypeDest == 0) return true;
	if (TypeDest == 1) return false;
	if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 5) return ((TypeDest != 4) && (TypeDest != 9) && (TypeDest != 10) && (TypeDest != 14));
	if (TypeDest == 2) return (Solitaire.Card[NumberCard].NumberInColumn == Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Count - 1 || OneCard);
	if (TypeDest == 3) {
		for (I = 0; I < HvostCount - 1; I++) {
			if (!CanMast(Solitaire.CardPlace[NumberDest].RMast, HvostMast[I + 1], HvostMast[I]) || !CanCard(Solitaire.CardPlace[NumberDest].RDigit, HvostCard[I + 1], HvostCard[I]) || HvostShirt[I + 1]) return false;
		}
		return true;
	}
	if (TypeDest == 4) {
		if (Solitaire.Card[NumberCard].NumberInColumn == Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Count-Solitaire.CardPlace[NumberDest].MaxCount) {
			for (I = 0; I < HvostCount - 1; I++) {
				if (!CanMast(Solitaire.CardPlace[NumberDest].RMast, HvostMast[I + 1], HvostMast[I]) || !CanCard(Solitaire.CardPlace[NumberDest].RDigit, HvostCard[I + 1], HvostCard[I]) || HvostShirt[I + 1]) return false;
			}
			return true;
		} else {
			return false;
		}
	}
	if (TypeDest == 5) {
		for (I = 0; I < HvostCount - 1; I++) {
			var RuleCard = (Solitaire.CardPlace[NumberDest].RDigit > 15 ? parseInt(Solitaire.CardPlace[NumberDest].RDigit/10) : parseInt(Solitaire.CardPlace[NumberDest].RDigit));
			if (!CanMast(2, HvostMast[I + 1], HvostMast[I]) || !CanCard(RuleCard, HvostCard[I + 1], HvostCard[I]) || HvostShirt[I + 1]) return false;
		}
		return true;
	}
	if (TypeDest == 7) {
		for (I = 0; I < HvostCount - 1; I++) {
			var RuleCard = (Solitaire.CardPlace[NumberDest].RDigit > 15 ? parseInt(Solitaire.CardPlace[NumberDest].RDigit/10) : parseInt(Solitaire.CardPlace[NumberDest].RDigit));
			if (!CanCard(RuleCard, HvostCard[I + 1], HvostCard[I]) || HvostShirt[I + 1]) return false;
		}
		return true;
	}
	if (TypeDest == 9) {
		if (HvostCount != 2) return false;
		return CanMast(Solitaire.CardPlace[NumberDest].RMast, HvostMast[0], HvostMast[1]) && CanCard(Solitaire.CardPlace[NumberDest].RDigit, HvostCard[0], HvostCard[1]);
	}
	if (TypeDest == 10) {
		if (HvostCount != 2) return false;
		return (HvostCard[0] + HvostCard[1] == 8);
	}
	if (TypeDest == 14) {
		if (HvostCount != 2) return false;
		return (HvostCard[0] + HvostCard[1] == 12);
	}
	if (TypeDest == 11) {
		var freecell_count = 0;
		for (I = 0; I < Solitaire.CardPlace.length; I++) {
			if ((Solitaire.CardPlace[I].Count == 0) && (Solitaire.CardPlace[I].Kind == 6)) freecell_count = freecell_count + 1;
		}
		if (HvostCount > freecell_count) return false;
		for (I = 0; I < HvostCount - 1; I++) {
			if (!CanMast(Solitaire.CardPlace[NumberDest].RMast, HvostMast[I+1], HvostMast[I]) || !CanCard(Solitaire.CardPlace[NumberDest].RDigit, HvostCard[I+1], HvostCard[I]) || HvostShirt[I+1]) return false;
		}
		return true;
	}
}
function CanNumber(NumberSource, NumberDest) {
	if (Solitaire.CardPlace[NumberSource].CanNumber == 100) return true;
	for (var I = 0; I < Solitaire.CardPlace[NumberSource].CanNumber; I++) {
		if (Solitaire.CardPlace[NumberSource].CanNumberArr[I] == NumberDest) {
			return true;
		}
	}
	return false;
}
function Osmos(NumberDest, Card1) {
	for (var I = NumberDest - 1; I > -1; I--) {
		if (Solitaire.CardPlace[I].Kind == 0) {
			if (Solitaire.CardPlace[NumberDest].Count == 0) {
				if (Solitaire.CardPlace[I].Count > 0) {
					CurrentCard = FindCard(I, 0);
					return (Solitaire.Card[CurrentCard].Digit == Solitaire.Card[Card1].Digit);
				} else {
					return false;
				}
			} else {
				var Bool = false;
				for (var J = 0; J < Solitaire.CardPlace[I].Count; J++) {
					CurrentCard = FindCard(I, J);
					if (Solitaire.Card[CurrentCard].Digit == Solitaire.Card[Card1].Digit) {
						Bool = true;
					}
				}
				return Bool;
			}
		}
	}
	return true;
}
function Faery(NumberCard, TempCount) {
	var FaeryMode = false;
	var FaeryMode2 = 0;
	var FaeryMode3 = 0;
	for (var I = 0; I < Solitaire.CardPlace.length; I++) {
		if ((Solitaire.CardPlace[I].Kind == 3) && (Solitaire.CardPlace[I].Count > 0)) FaeryMode = true;
		if ((Solitaire.CardPlace[I].Kind == 1) && (Solitaire.CardPlace[I].Count > 0)) FaeryMode2 = I;
		if ((Solitaire.CardPlace[I].Kind == 1) && (Solitaire.CardPlace[I].Count == 1)) FaeryMode3 = I;
	}
	if (FaeryMode) {
		if (TempCount === undefined) {
			DragTargetCount = 0;
		} else {
			DragTargetCount = TempCount;
		}
		if (Solitaire.CardPlace[Solitaire.Card[NumberCard].NumberPC].Kind == 3) {
			if (Solitaire.Card[NumberCard].Digit != 12) {
				return FaeryMode2;
			} else {
				return FaeryMode2 + 1;
			}
		}
	} else {
		return FaeryMode3;
	}
}
function FaeryPut(NumberPlace, NumberCard, Mast) {
	if (((Solitaire.CardPlace[NumberPlace + 9].Kind == 1) && (Solitaire.CardPlace[NumberPlace + 9].Count > 0)) || ((NumberPlace + 17 < Solitaire.CardPlace.length) && (Solitaire.CardPlace[NumberPlace + 17].Kind == 1) && (Solitaire.CardPlace[NumberPlace + 17].Count > 0))) {
		if (Mast) {
			var FirstCard = (Solitaire.CardPlace[NumberPlace + 9].Kind == 1 ? FindCard(NumberPlace + 9, 0) : FindCard(NumberPlace + 17, 0));
			if (Solitaire.Card[NumberCard].Mast == Solitaire.Card[FirstCard].Mast) return true;
		} else {
			return true;
		}
	}
	return false;
}
function CanWin() {
	function CalcNewRait(data) {
		if (data.games + 0.2 * data.vipwins > 0) {
			data.percent = (data.wins + 0.2 * data.vipwins) / (data.games + 0.2 * data.vipwins) * 100;
			var old_rait = data.raiting;
			data['raiting'] = Math.sqrt(data['games'] + 0.2 * data['vipwins']) * data['percent'];
			data['add_raiting'] = old_rait - data['raiting'];
			return data;
		} else {
			var old_rait = data.raiting;
			data['raiting'] = 0;
			data['add_raiting'] = old_rait - data['raiting'];
			return data;
		}
	}

	function RaitingModal(data) {
		var one_el = {'games': data.week_rait.games, 'add_games': 0, 'wins': data.week_rait.wins, 'add_wins': 0, 'vipwins': data.week_rait.vipwins, 'add_vipwins': 0, 'percent': data.week_rait.percent, 'raiting': data.week_rait.raiting, 'add_raiting': 0};
		var res_data = new Array();
		var temp_el = JSON.parse(JSON.stringify(one_el));
		res_data.push(temp_el);
		if (data.result_game.win) {
			if (data.result_game.vip) {
				one_el['add_vipwins'] = 1;
				one_el['vipwins'] = one_el['vipwins'] - 1;
				if (data.result_game.af_double) {
					one_el['add_vipwins'] = 2;
					one_el['vipwins'] = one_el['vipwins'] - 1;
				};
				if (data.result_game.af_bomba) {
					one_el['add_vipwins'] = 5;
					one_el['vipwins'] = one_el['vipwins'] - 4;
				};
				one_el = CalcNewRait(one_el);
				temp_el = JSON.parse(JSON.stringify(one_el));
				res_data.push(temp_el);
				one_el['add_vipwins'] = 0;
			}
			if (data.result_game.af_double) {
				one_el['add_wins'] = 1;
				one_el['add_games'] = 1;
				one_el['wins'] = one_el['wins'] - 1;
				one_el['games'] = one_el['games'] - 1;
				one_el = CalcNewRait(one_el);
				temp_el = JSON.parse(JSON.stringify(one_el));
				res_data.push(temp_el);
				one_el['add_wins'] = 0;
				one_el['add_games'] = 0;
			}
			if (data.result_game.af_bomba) {
				one_el['add_wins'] = 4;
				one_el['add_games'] = 4;
				one_el['wins'] = one_el['wins'] - 4;
				one_el['games'] = one_el['games'] - 4;
				one_el = CalcNewRait(one_el);
				temp_el = JSON.parse(JSON.stringify(one_el));
				res_data.push(temp_el);
				one_el['add_wins'] = 0;
				one_el['add_games'] = 0;
			}
			one_el['add_wins'] = 1;
			one_el['add_games'] = 1;
			one_el['wins'] = one_el['wins'] - 1;
			one_el['games'] = one_el['games'] - 1;
			one_el = CalcNewRait(one_el);
			temp_el = JSON.parse(JSON.stringify(one_el));
			res_data.push(temp_el);
			one_el['add_wins'] = 0;
			one_el['add_games'] = 0;
			add_el = JSON.parse(JSON.stringify(one_el));
			add_el.add_raiting = 0;
			for (I = 1; I < res_data.length; I++) {
				add_el.add_games = add_el.add_games + res_data[I].add_games;
				add_el.add_wins = add_el.add_wins + res_data[I].add_wins;
				add_el.add_vipwins = add_el.add_vipwins + res_data[I].add_vipwins;
				add_el.add_raiting = add_el.add_raiting + res_data[I].add_raiting;
			}
			if (add_el.add_games > 0) add_el.add_games = '+' + add_el.add_games;
			if (add_el.add_wins > 0) add_el.add_wins = '+' + add_el.add_wins;
			if (add_el.add_vipwins > 0) add_el.add_vipwins = '+' + add_el.add_vipwins;
			if (add_el.add_raiting > 0) add_el.add_raiting = '+' + parseFloat(add_el.add_raiting).toFixed(1);

			myApp.modal({
				title :  'Your rating',
				verticalButtons: true,
				buttons: [
					{
						text: '<b>' + res_data[0].games + '</b><span>Сыграно игр</span>' + add_el.add_games,
						onClick: function() {
							myApp.closeModal(this);
						}
					},
					{
						text: '<b>' + res_data[0].wins + '</b><span>Побед</span>' + add_el.add_wins,
						onClick: function() {
							myApp.closeModal(this);
							$$('#penalty').click();
						}
					},
					{
						text: '<b>-' + res_data[0].vipwins + '</b><span>VIP-побед</span>' + add_el.add_vipwins,
						onClick: function() {
							myApp.closeModal(this);
						}
					},
					{
						text: '<b>' + parseFloat(res_data[0].raiting).toFixed(1) + '</b><span>Рейтинг</span>' + add_el.add_raiting,
						onClick: function() {
							myApp.closeModal(this);
						}
					},
					{
						text: '<b id="place_alert">' + data.week_rait.place + '</b><span>Место</span>' + (data.week_rait.place - data.week_rait.old_place),
						onClick: function() {
							myApp.closeModal(this);
						}
					},
					{
						text: '<b class="button">CLOSE</b>',
						onClick: function() {
							myApp.closeModal(this);
							$$('.play_card').remove();
							Solitaire.DrawCards();
							Game.Start();
						}
					},
				]
			})
		}
	}

	var AllWinCard = 0;
	for (var I = 0; I < Solitaire.CardPlace.length; I++) {
		if (Solitaire.CardPlace[I].Kind == 0) {
			AllWinCard = AllWinCard + Solitaire.CardPlace[I].Count;
		}
	}
	if ((AllWinCard == Solitaire.CardsCount) || ((AllWinCard == Solitaire.CardsCount - Solitaire.CardsCount / 13) && ((Solitaire.osob == 79) || (Solitaire.osob == 77) || (Solitaire.osob == 63) || (Solitaire.osob == 62) || (Solitaire.osob == 61)))) {
		var PointRait = (Game.Timer < Solitaire.max_timer ? AllWinCard * 80 + Solitaire.max_timer - Game.SumPenalty - Game.Timer : AllWinCard * 80 - Game.SumPenalty);
		myApp.modal({
			title :  'Your result',
			verticalButtons: true,
			buttons: [
				{
					text: '<b>' + (AllWinCard * 80) + '</b><span>Сложено карт</span>' + AllWinCard,
					onClick: function() {
						myApp.closeModal(this);
					}
				},
				{
					text: '<b>' + (Solitaire.max_timer - Game.Timer) + '</b><span>Бонус за время</span>' + (Solitaire.max_timer - Game.Timer),
					onClick: function() {
						myApp.closeModal(this);
						$$('#penalty').click();
					}
				},
				{
					text: '<b>-' + Game.SumPenalty + '</b><span>Общий штраф</span>' + Game.SumPenalty,
					onClick: function() {
						myApp.closeModal(this);
					}
				},
				{
					text: '<b>' + PointRait + '</b><span>Итого</span>',
					onClick: function() {
						myApp.closeModal(this);
					}
				},
				{
					text: '<b id="place_alert">?</b><span>Место</span>',
					onClick: function() {
						myApp.closeModal(this);
					}
				},
				{
					text: '<b class="button">OK</b>',
					onClick: function() {
						myApp.closeModal(this);
						RaitingModal(def_data);
					}
				},
			]
		})
		if (GameOption.Mode == 'rait' || GameOption.Mode == 'winning') {
			var FullPenalty = "";
			for (I = 0; I < 6; I++) {
				if (I < 5) {
					FullPenalty = FullPenalty + Game.Penalty[I] + "^";
				} else {
					FullPenalty = FullPenalty + Game.Penalty[I];
				}
			}
			var Rasklad = JSON.stringify(Game.Rasklad);
			var Steps = JSON.stringify(Game.Step);
			$$.ajax({
				url : '/endgame.php',
				method : 'POST',
				dataType : 'json',
				data : {sol_id : Solitaire.ID, game_id : Game.ID, cards : 0, penalty : Game.SumPenalty, fullpenalty : FullPenalty, timer : Game.Timer, rasklad : Rasklad, steps : Steps},
				success : function(data) {
					GameOption.ChangeModeMenu();
					$$('#menu_2').css({'display' : 'flex'});
					$$('#menu_1').css({'display' : 'none'});
					$$('#place_alert').html(data.result_game.wgame_place);
					def_data = data;
					Game.start = false;
				},
				error : function(data) {
					myApp.alert('Проверьте соединение с интернетом', '1001solitaire.com')
				}
			});
		} else {
			GameOption.ChangeModeMenu();
			$$('#menu_2').css({'display' : 'flex'});
			$$('#menu_1').css({'display' : 'none'});
			Game.start = false;
		}
		return true;
	} else {
		return false;
	}
}

function LoadPage() {
//	setInterval("MyTimer()", 1000);

	Sol_ID = $$('#sol_id').data('id');
	GameOption = new GameOption();
	new CurSolitaire();
	setTimeout(function() {Game.Start();}, 400);
//	document.body.requestFullscreen();
//	hideAddressBar();
//	window.addEventListener("orientationchange", function () {
//		hideAddressBar();
//	}, false);
//	$$.getJSON("/loadgame.php?sol_id=" + Sol_ID + "&mode=" + mode_sol + "&callback=?", function(data){
//		UpdatePage(data);
//	});
//	if (Sound) {
//		$('#Sound').html('<img src="/img/SoundOn.png"></img>');
//	} else {
//		$('#Sound').html('<img src="/img/SoundOff.png"></img>');
//	}
//	var h = parseInt($('.TopEnergy span').css('height'));
//	var w = parseInt($('.TopEnergy span').css('width'));
//	var font_size = 12;
//	while (h > 24 || w > 92) {
//		font_size = font_size - 1;
//		$('#name_solitaire_h1').css({'font-size' : font_size + 'px', 'line-height' : '1.2em'});
//		h = parseInt($('.TopEnergy span').css('height'));
//		w = parseInt($('.TopEnergy span').css('width'));
//	}
}

$$('.game-modal').on('click', function () {
	myApp.modal({
		title:  'Game',
		verticalButtons: true,
		buttons: [
			{
				text: '<i class="icon new-icon"></i>New',
				onClick: function() {
					$$('#menu_2').css({'display' : 'flex'});
					$$('#menu_1').css({'display' : 'none'});
					$$('.play_card').remove();
					Solitaire.DrawCards();
					Game.Start();
				}
			},
			{
				text: '<i class="icon repeat-icon"></i>Repeat',
				onClick: function() {
					$$('.play_card').remove();
					if (!User.Bonus[8]) {
						AddPenalty(250, 6);
					} else {
						AddPenalty(0, 6);
					}
					Solitaire.DrawCards();
					Game.Start(true);
				}
			},
			{
				text: '<i class="icon choose-icon"></i>Choose',
				onClick: function() {
					mainView.router.loadPage('/mpasjansy');
				}
			},
			{
				text: '<i class="icon rule-icon"></i>Rule',
				onClick: function() {
					mainView.router.loadPage('/mpasjansy/rule/a/' + Solitaire.ID);
				}
			},
			{
				text: '<i class="icon stat-icon"></i>Stat',
				onClick: function() {
					mainView.router.loadPage('/mpasjansy/rule/a/' + Solitaire.ID + '?active=3');
				}
			},
			{
				text: '<i class="icon quest-icon"></i>Quest',
				onClick: function() {
					myApp.alert('Квестовый режим находится в разработке!', '1001solitaire.com')
				}
			},
			{
				text: '<i class="icon close-icon"></i>Close',
				onClick: function() {
					myApp.closeModal(this);
				}
			},
		]
	})
});

$$('.step-modal').on('click', function () {
	myApp.modal({
		title:  'Move',
		verticalButtons: true,
		buttons: [
			{
				text: '<i class="icon save-icon"></i>Save',
				onClick: function() {
					SaveSolitaire = cloneObject(Solitaire);
					SaveGame = cloneObject(Game);
				}
			},
			{
				text: '<i class="icon load-icon"></i>Load',
				onClick: function() {
					if (User.Bonus[6]) {
						Game.AddPenalty(0, 5);
					} else {
						Game.AddPenalty(50, 5);
					}
					Solitaire = cloneObject(SaveSolitaire);
					Game = cloneObject(SaveGame);
					$$('.play_card').remove();
					Solitaire.DrawCards();
					for (var I = 0; I < Solitaire.Card.length; I++) {
						$$("#card_" + I).appendTo($$("#cardplace_" + Solitaire.Card[I].NumberPC));
						Solitaire.Card[I].FullDraw();
					}
				}
			},
			{
				text: '<i class="icon forward-icon"></i>Forward',
				onClick: function() {
					if (Game.GameMode == GMWait) {
						Game.Step[Game.UndoNumber].Forward(true);
					}
				}
			},
			{
				text: '<i class="icon auto-icon"></i>Auto',
				onClick: function() {
					Game.TempAutorun = true;
					Game.AutorunMake();
				}
			},
			{
				text: '<i class="icon close-icon"></i>Close',
				onClick: function() {
					myApp.closeModal(this);
				}
			},
		]
	})
});

$$('.more-modal').on('click', function () {
	myApp.modal({
		title:  'More',
		verticalButtons: true,
		buttons: [
			{
				text: '<i class="icon shop-icon"></i>Shop',
				onClick: function() {
					mainView.router.loadPage('/mshop');
				}
			},
			{
				text: '<i class="icon free-icon"></i>Free Bonus',
				onClick: function() {
					mainView.router.loadPage('/mfreebonus');
				}
			},
			{
				text: '<i class="icon user-icon"></i>User',
				onClick: function() {
					mainView.router.loadPage('/muser');
				}
			},
			{
				text: '<i class="icon stat-icon"></i>Stat',
				onClick: function() {
					myApp.alert('You clicked third button!', '1001solitaire.com')
				}
			},
			{
				text: '<i class="icon option-icon"></i>Option',
				onClick: function() {
					mainView.router.loadPage('/moption');
				}
			},
			{
				text: '<i class="icon close-icon"></i>Close',
				onClick: function() {
					myApp.closeModal(this);
				}
			},
		]
	})
});

$$('.random-modal').on('click', function () {
	GameOption.Mode = "rait";
	GameOption.ChangeModeMenu();
	$$('.play_card').remove();
	Solitaire.DrawCards();
	Game.Start();
});
$$('.winning-modal').on('click', function () {
	GameOption.Mode = "winning";
	GameOption.ChangeModeMenu();
	$$('.play_card').remove();
	Solitaire.DrawCards();
	Game.Start();
});
$$('.train-modal').on('click', function () {
	GameOption.Mode = "train";
	GameOption.ChangeModeMenu();
	$$('.play_card').remove();
	Solitaire.DrawCards();
	Game.Start();
});
$$('.exit-modal').on('click', function () {
	$$('#menu_1').css({'display' : 'flex'});
	$$('#menu_2').css({'display' : 'none'});
});

$$('#penalty').on('click', function () {
	myApp.modal({
		title :  'Your result',
		verticalButtons: true,
		buttons: [
			{
				text: '<b>' + Game.BallPenalty[0] + '</b><span>Ходов</span>' + Game.Penalty[0],
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b>' + Game.BallPenalty[1] + '</b><span>Автоходов</span>' + Game.Penalty[1],
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b>' + Game.BallPenalty[2] + '</b><span>Подсказка</span>' + Game.Penalty[2],
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b>' + Game.BallPenalty[3] + '</b><span>Отмена</span>' + Game.Penalty[3],
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b>' + Game.BallPenalty[4] + '</b><span>Загрузка</span>' + Game.Penalty[4],
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b>' + Game.BallPenalty[5] + '</b><span>Повтор</span>' + Game.Penalty[5],
				onClick: function() {
					myApp.closeModal(this);
				}
			},
		]
	})
});

$$('#timer').on('click', function () {
	var AllWinCard = 0;
	for (var I = 0; I < Solitaire.CardPlace.length; I++) {
		if (Solitaire.CardPlace[I].Kind == 0) AllWinCard = AllWinCard + Solitaire.CardPlace[I].Count;
	}
	var PointRait = (Game.Timer < Solitaire.max_timer ? AllWinCard * 80 + Solitaire.max_timer - Game.SumPenalty - Game.Timer : AllWinCard * 80 - Game.SumPenalty);
	myApp.modal({
		title :  'Your result',
		verticalButtons: true,
		buttons: [
			{
				text: '<b>' + (AllWinCard * 80) + '</b><span>Сложено карт</span>' + AllWinCard,
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b>' + (Solitaire.max_timer - Game.Timer) + '</b><span>Бонус за время</span>' + (Solitaire.max_timer - Game.Timer),
				onClick: function() {
					myApp.closeModal(this);
					$$('#penalty').click();
				}
			},
			{
				text: '<b>-' + Game.SumPenalty + '</b><span>Общий штраф</span>' + Game.SumPenalty,
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b>' + PointRait + '</b><span>Итого</span>',
				onClick: function() {
					myApp.closeModal(this);
				}
			},
			{
				text: '<b class="button">CLOSE</b>',
				onClick: function() {
					myApp.closeModal(this);
				}
			},
		]
	})
});

	window.addEventListener("orientationchange", function () {
		FullResize();
	});

	window.addEventListener("resize", function () {
		FullResize();
	});

function Back(CountTogether, Rekurs) {
	if (User.Bonus[6]) {
		Game.AddPenalty(0, 4);
	} else {
		Game.AddPenalty(10, 4);
	}
	if (Game.GameMode == GMWait) {
		if (Game.UndoNumber > 0) {
			var NewCountTogether = Game.Step[Game.UndoNumber - 1].Back(CountTogether, Rekurs);
		}
	}
}

function Hint() {

function CalcHint() {
	Game.Hint = new Array();
	for (var I = 0; I < Solitaire.Card.length; I++) {
		if (!Solitaire.Card[I].Shirt || ((Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 2 || Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 4 || Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Kind == 7) && Solitaire.CardPlace[Solitaire.Card[I].NumberPC].Count - 1 == Solitaire.Card[I].NumberInColumn)) {
			if (CanDragHvost(I)) {
				var res = FindDest(I);
				for (var J = 0; J < res.length; J++) Game.Hint.push({source_card : I, dest : res[J][0], cost : res[J][1]});
			}
		}
	}
	for (I = 1; I < Game.Hint.length; I++) {
		var counter = I;
		while (counter > 0 && Game.Hint[counter].cost < Game.Hint[counter - 1].cost) {
			var temp = Game.Hint[counter - 1];
			Game.Hint[counter - 1] = Game.Hint[counter];
			Game.Hint[counter] = temp;
			counter = counter - 1;
		}
	}
	if (!GameOption.HintAll) {
		counter = 0;
		while (counter < Game.Hint.length && Game.Hint[counter].cost < 31) {
			counter = counter + 1;
		}
		Game.Hint.splice(counter, Game.Hint.length - counter);
	}
}

	if (Game.GameMode == GMWait && GameOption.Hint) {
		if (GameOption.Sound) {
			GameOption.SoundHint.src = "/sound/Hint.mp3";
			GameOption.SoundHint.play();
		}
		if (Game.CountHint == 0) {
			CalcHint();
			if (Game.Hint.length > 0) $$('.hint-icon').html('<span class="badge bg-green">1/10</span>');
		}
		if (Game.Hint.length > 0) {
			Game.GameMode = GMHint;
			if (User.Bonus[5]) {
				Game.AddPenalty(0, 3);
			} else {
				Game.AddPenalty(5, 3);
			}
			nameID = '#card_' + Game.Hint[Game.CountHint].source_card;
			var NumberDest = Game.Hint[Game.CountHint].dest;
			var NumberSource = Solitaire.Card[Game.Hint[Game.CountHint].source_card].NumberPC;
			var lefttxt = Solitaire.Card[Game.Hint[Game.CountHint].source_card].Left + "px";
			var toptxt = Solitaire.Card[Game.Hint[Game.CountHint].source_card].Top + "px";
			$$('#black').appendTo('#cardplace_' + NumberSource);
			$$('#black').css({zIndex : 1000, left : lefttxt, top : toptxt, opacity : 1});
			var delta_left = Solitaire.CardPlace[NumberDest].Left - Solitaire.CardPlace[NumberSource].Left;
			var delta_top = Solitaire.CardPlace[NumberDest].Top - Solitaire.CardPlace[NumberSource].Top;
			var CurrentCard = FindCard(NumberDest, 100);
			if (CurrentCard == 404) {
				var delta_left2 = - Solitaire.Card[Game.Hint[Game.CountHint].source_card].Left;
				var delta_top2 = - Solitaire.Card[Game.Hint[Game.CountHint].source_card].Top;
			} else {
				var delta_left2 = Solitaire.Card[CurrentCard].Left - Solitaire.Card[Game.Hint[Game.CountHint].source_card].Left;
				var delta_top2 = Solitaire.Card[CurrentCard].Top - Solitaire.Card[Game.Hint[Game.CountHint].source_card].Top;
			}
			var temp1 = parseInt(lefttxt) + delta_left + delta_left2;
			var temp2 = parseInt(toptxt) + delta_top + delta_top2;
			Velocity($$('#black'), {left : temp1 + "px", top : temp2 + "px"}, 500, function() {
				Velocity($$('#black'), {opacity : 0}, 500, function() {Game.GameMode = GMWait;});
			});
			Game.CountHint++;
			if (Game.CountHint == Game.Hint.length) {
				Game.CountHint = 0;
				$$('.hint-icon').html('');
			} else {
				$$('.badge').html(Game.CountHint + '/' + Game.Hint.length);
			}
		} else {
			myApp.confirm('Результативных ходов нет. Начать новую игру?', '1001solitaire.com', function() {
				$$('#menu_2').css({'display' : 'flex'});
				$$('#menu_1').css({'display' : 'none'});
				$$('.play_card').remove();
				Solitaire.DrawCards();
				Game.Start();
			});
		}
	}
}

myApp.onPageInit('option', function (page) {
	$$('#sound_ch').prop('checked', GameOption.Sound);
	$$('#auto_ch').prop('checked', GameOption.Automat);
	if (GameOption.Animate == 5) {
		$$('#anim_ch').prop('checked', false);
		$$('#anim_sl').prop('value', 0);
	} else {
		$$('#anim_ch').prop('checked', true);
		$$('#anim_sl').prop('value', (GameOption.Animate - 100) / 10);
	}
	$$('#hint_ch').prop('checked', GameOption.Hint);
	$$('#hintall_ch').prop('checked', GameOption.HintAll);

	$$('#sound_ch').on('change', function () {
		GameOption.Sound = $$('#sound_ch').prop('checked');
		document.cookie = 'sound=' + GameOption.Sound + '; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
	});
	$$('#auto_ch').on('change', function () {
		GameOption.Automat = $$('#auto_ch').prop('checked');
		document.cookie = 'automat=' + GameOption.Automat + '; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
	});
	$$('#anim_ch').on('change', function () {
		if ($$('#auto_ch').prop('checked')) {
			GameOption.Animate = 350;
			document.cookie = 'animate=350; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
			$$('#anim_sl').prop('value', (GameOption.Animate - 100) / 10);
		} else {
			GameOption.Animate = 5;
			document.cookie = 'animate=5; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
		}
	});
	$$('#anim_sl').on('change', function () {
		if (!$$('#auto_ch').prop('checked')) {
			GameOption.Animate = Math.ceil($$('#anim_sl').prop('value')) * 10 + 100;
			document.cookie = 'animate=' + GameOption.Animate + '; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
		} else {
			myApp.alert('Включите анимацию, чтобы регулировать ее скорость.', '1001solitaire.com');
		}
	});
	$$('#hint_ch').on('change', function () {
		GameOption.Hint = $$('#hint_ch').prop('checked');
		document.cookie = 'hint=' + GameOption.Hint + '; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
	});
	$$('#hintall_ch').on('change', function () {
		GameOption.HintAll = $$('#hintall_ch').prop('checked');
		document.cookie = 'hintall=' + GameOption.HintAll + '; path=/; expires=Sun, 01-Jan-2021 00:00:00 GMT';
	});
});

function cloneObject(obj) {  
	var newObj = {};  
	for (var prop in obj) {  
		if (typeof obj[prop] == 'object') {
			if (obj[prop] instanceof Array) {
				newObj[prop] = obj[prop].map(function(value) {
					return cloneObject(value)
				});
			} else {
				newObj[prop] = cloneObject(obj[prop]);
			}
		} else {
			newObj[prop] = obj[prop];
		}
	} 
	return newObj;  
}

function hideAddressBar() {
	setTimeout(function () {
		document.body.style.height = window.outerHeight + 'px';
		setTimeout(function () {
			window.scrollTo(0, 1);
		}, 1100);
	}, 1000);
	return false;
}

