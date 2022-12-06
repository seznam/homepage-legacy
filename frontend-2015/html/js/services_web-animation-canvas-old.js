var ctx;
var loaded = false;
var animInterval;
var imgArray = [];
var numberOfImages = 0;


var leftAngles =		[0,	35,		40,		45,			55];
var rightAngles =		[0,	35,		40,		45,			55];

var leftOffsets = 	[0, 50, 50 + 45, 50 + 45 + 40, 50 + 45 + 40 + 35];
var rightOffsets =	 [0, 50, 50 + 45, 50 + 45 + 40, 50 + 45 + 40 + 35];

var leftOpacities =	 [0, 0.5, 0.6, 0.8, 1];
var rightOpacities =  [0, 0.5, 0.6, 0.8, 1];
var topCenterOffset = 20;
var topSideOffset = 43;

var sideVerticalScale = 0.83;
var trapezoidStepping = 400;

var animDirection;
var currentHalf = 0;

var animSpeed = 1;
var currentCenter = 6;
var animStopAt = 1;

var slowMode = false;

var currentLeftCenter = currentCenter;
var currentRightCenter = currentCenter;

var imgWidth = 700;
var imgHeight = 406;
var canvasWidth = 990;

var imgErrors = [];
var swipeStart = null;

$(function() {
    var c = document.getElementById('c');
    ctx = c.getContext('2d');
	var $items = $('.column li span.itm');
	var imgLimit = $items.length;
    $items.each(function()
	{
        if(numberOfImages <= imgLimit)
        {
            var link = $(this).find('a');
            var relLink = link.attr("rel");

            if ($(this).hasClass("itmNoScreen")){
               var imgLink = relLink;
            } else {
                if (relLink) {
                   var imgLink = '/fimg-resp/?spec=ss700x406&url=' + relLink;
                } else {
                   var imgLink = '/fimg-resp/?spec=ss700x406&url=' + link.attr('href');
                }
            }

            var img = new Image();
			img.src = imgLink;
			img.cPosition = imgLimit-numberOfImages;
			$(this).parent().data('cPosition',imgLimit-numberOfImages)
			$(this).parent().addClass('pos-'+(imgLimit-numberOfImages))
			img.onload = function()
			{
				checkLoaded(this);
			}
			img.onerror = function()
			{
				checkNotLoaded(this);
			}
			img.onabort = function()
			{
				checkNotLoaded(this);
			}
			++numberOfImages;
		}
	});
	$('#canvas-container').mousedown(function(e)
	{
		e.preventDefault();
		swipeStart = [e.clientX,e.clientY,currentCenter];
	});
	$(document).mousemove(function(e)
	{
		if(swipeStart)
		{
			var dx = e.clientX - swipeStart[0];
			var start = swipeStart[2];
			var posun;
			var step = 120;
			if(Math.abs(dx))
			{
				posun = Math.round(dx / step);
				var dst = start + posun;
				if(dst <= 0)
					dst += numberOfImages;
				if(dst > numberOfImages)
					dst -= numberOfImages;
				sweepTo(dst);
			}
		}
	});
	$(document).mouseup(function(e)
	{
		swipeStart = null;
	});
	$('.column li span.itm').mouseover(function()
	{
		if($(this).parent().hasClass('off'))
			return;
		var $p = $(this).parent();
		$('li').removeClass('active');
    sweepTo($p.data('cPosition'));
		$p.addClass('active');
	});
	$('.column li span.itm').mouseout(function()
	{
		//var $p = $(this).parent();
		//$p.removeClass('active');
	})
})

function checkNotLoaded(img)
{
	$('.pos-'+img.cPosition).addClass('off');
	//$('.pos-'+img.cPosition).removeClass('pos-'+img.cPosition);
	numberOfImages--;
	imgErrors.push(img);
	checkAllLoaded();
}
function checkLoaded(img)
{
    imgArray.push(img);
	checkAllLoaded();
    
}

function checkAllLoaded()
{
	if(numberOfImages && imgArray.length == numberOfImages)
	{
		$('#preloader').remove();
		if(imgErrors.length) // osetrime chybejici obrazky
		{
			for(var i in imgErrors)
			{
				// posuneme o -1 cPosition u obrazku nad timto
				for(var j in imgArray)
				{
					if(imgArray[j].cPosition > imgErrors[i].cPosition)
					{
						--imgArray[j].cPosition;
					}
				}
				for(j in imgErrors)
				{
					if(imgErrors[j].cPosition > imgErrors[i].cPosition)
					{
						--imgErrors[j].cPosition;
					}
				}
				$('.column li span.itm').each(function()
				{
					if($(this).parent().data('cPosition') > imgErrors[i].cPosition)
					{
						var position = $(this).parent().data('cPosition');
						$(this).parent().removeClass('pos-'+position);
						position -= 1;
						$(this).parent().addClass('pos-'+position);
						$(this).parent().data('cPosition',position);
					}
				});
			}
		}
		loaded = true;
        currentCenter = 44; //Math.round(numberOfImages / 2);
		currentLeftCenter = currentCenter;
		currentRightCenter = currentCenter;
		updateCaption(currentCenter);
		var t1 = new Date();
		drawScene();
		drawScene();
		drawScene();
		var t2 = new Date();
		var framerate = 1/((t2.getTime() - t1.getTime())/1000) * 3;
		if(framerate < 24)
		{
			slowMode = true;
		}

		/*- preskocim na prvni sluzbu-*/
		jumpAnim(numberOfImages);
	}
}
function sweepTo(position)
{
	if(slowMode)
	{
		jumpAnim(position);
    return;
	}
  else if(Math.abs(position - currentCenter) > 3)
  {
    killAnim();
    jumpAnim(position);
    return;
  }
	else
	{
		if(position == undefined || position == null)
			return;
		var speed;
		if(position == currentCenter)
			return;
		if(position < currentCenter)
			speed = -0.2;
		else
			speed = +0.2;
		var distance = Math.abs(position - currentCenter)
		if(distance > numberOfImages/2)
		{
			speed *= -1;
			distance = Math.abs(distance - numberOfImages);
		}

		if(animSpeed == speed && animStopAt == position)
			return;
		killAnim();
		animSpeed = speed;
		animStopAt = position;
		startAnim();
	}
}
function moveRight()
{
	animSpeed = -0.2;
	animStopAt = Math.round(currentCenter) - 1;
	if(slowMode) {
		jumpAnim(animStopAt);
	} else {
		startAnim();
	}
}
function moveLeft()
{
	animSpeed = 0.2;
	animStopAt = Math.round(currentCenter) + 1;
	if(slowMode) {
		jumpAnim(animStopAt);
	} else {
		startAnim();
	}
}
function jumpAnim(position)
{
	// cyklovac
	if(position > imgArray.length)
		position -= imgArray.length;
	if(position <= 0)
		position += imgArray.length;
	
	 // zaokrouhlovani na n desetinnych mist
	position = Math.round(position*1000)/1000;
	
	updateCaption(position);
	drawScene(position);
}
function updateCaption(position)
{
	var $caption = $('.pos-'+position);
	$('#caption').empty().append($caption.html());
	$('#visitPage').attr('href',$caption.find('a').attr('href'));
	$('li').removeClass('active');
	$('.column li.pos-'+position).addClass('active');
}
function startAnim()
{
	if(!loaded)
		return;
	killAnim();
	$('.hideWhenMoving').addClass('hidden');
	
	if(animStopAt > imgArray.length)
		animStopAt -= imgArray.length;	
	if(animStopAt <= 0)
		animStopAt += imgArray.length;
	if(animInterval)
		return;
	if(currentCenter%1 == 0)
	{
		currentHalf = 0;
	}
	
	
	updateCaption(animStopAt);
	
	
	
	animInterval = setInterval(function(){anim(animSpeed)},33);
	
//	anim(animSpeed);
}
function killAnim()
{
	$('.hideWhenMoving').removeClass('hidden');
	if(animInterval)
		clearInterval(animInterval);
	animInterval = undefined;
}
function switchHalf()
{
	if(animSpeed < 0)
		currentCenter = currentRightCenter;
	else
		currentCenter = currentLeftCenter;
	currentHalf *= -1;
}
function anim()
{
	// ktera pulka se ma zacit posouvat jako prvni
	if(currentHalf == 0)
	{
		if(animSpeed > 0) // doleva
			currentHalf = +1;
		else
			currentHalf = -1;
	}
	currentCenter += animSpeed;
	// cyklovac
	if(currentCenter > imgArray.length)
		currentCenter -= imgArray.length;
	if(currentCenter <= 0)
		currentCenter += imgArray.length;
	
	 // zaokrouhlovani na n desetinnych mist
	currentCenter = Math.round(currentCenter*1000)/1000;
	currentRightCenter = Math.round(currentRightCenter*1000)/1000;
	currentLeftCenter = Math.round(currentLeftCenter*1000)/1000;
	
	// nastaveni stredu pro pulky podle toho, ktera se ma vykreslit
	if(currentHalf >= 0)
		currentRightCenter = currentCenter;
	if(currentHalf <= 0)
		currentLeftCenter = currentCenter;
	
	
	
	// triggery na zastaveni animace
	var stopSign = false;
	if(currentCenter == animStopAt)
	{
		stopSign = true;
	}
	
	drawScene();
	
	var sealingEnds = false;
	// prepocitani pulkovych stredu pri "svarovani" kolecka na opacnych koncich
	if(currentRightCenter < currentLeftCenter)
	{
		currentRightCenter += imgArray.length;
		sealingEnds = true;
	}
	
	// detekce, kdy se ma zacit vykreslovat druha polovina - kdyz ta prvni je uz moc daleko od prvni
	if(Math.abs(currentLeftCenter - currentRightCenter)>=1)
	{
		switchHalf();
	}
	if(animSpeed != 0 && currentRightCenter <= currentLeftCenter)
		switchHalf();
	
	// srovnani pulkovych stredu zpet po svarovani
	if(sealingEnds)
		currentRightCenter -= imgArray.length;
	
	// detekce konce animace
	if(stopSign && currentCenter == currentLeftCenter && currentCenter == currentRightCenter)
	{
		currentCenter = Math.round(currentCenter);
		currentLeftCenter = currentCenter;
		currentRightCenter = currentCenter;
		killAnim();
	}
}
function drawScene(forcePosition)
{
	if(forcePosition != undefined)
	{
		currentRightCenter = currentLeftCenter = currentCenter = forcePosition;
	}
    var trapStep;
    var scale
	var args;
	var currentAngle;
	var topOffset;
	ctx.clearRect(0,0,990,1500);
	var position;
	var leftOffset;
	var stdLeftOffset = Math.round(canvasWidth/2-imgWidth/2);
	var direction = 1;
	var opacity = 0;
	var verticalScale;
	var offsetWidth;
	var limitWidth;
	var stopDrawingAt;
	var startDrawingAt;
    for(var i in imgArray)
    {
		// rozdeleni na vlevo-vpravo
		position = currentCenter - imgArray[i].cPosition;
		
		
		if(Math.abs(position) > (imgArray.length/2)) // "kolecko"
		{
			if(position < 0)
				position += imgArray.length;
			else
				position -= imgArray.length;
		}
		if(position > 0) // vpravo
		{
			position = currentRightCenter - imgArray[i].cPosition;
			if(position < 0)
				position += imgArray.length;
		}
		else if(position < 0) // vlevo
		{
			position = currentLeftCenter - imgArray[i].cPosition;
			if(position > 0)
				position -= imgArray.length;
		}
		else // zacina se pohybovat doprostred
		{
			if(animSpeed < 0) // zleva doprostred
			{
				position = currentRightCenter - imgArray[i].cPosition;
				if(position < 0)
					position += imgArray.length;
			}
			else if(animSpeed > 0) // zleva doprostred
			{
				position = currentLeftCenter - imgArray[i].cPosition;
				if(position > 0)
					position -= imgArray.length;
			}
		}
		position = Math.round(position*1000)/1000; // zaokrouhlovani na n desetinnych mist
		imgArray[i].currentCPosition = position;
	}
	// srovnani podle z-indexu
	imgArray.sort(function(a,b)
	{
		var r;
		if(a.currentCPosition > b.currentCPosition)
			r = -1;
		else
			r = 1;
		if(a.currentCPosition < 0)
			r *= -1;
		if(animSpeed > 0)
		{
			if(a.currentCPosition < 1 && a.currentCPosition > -1)
				return 1;
			if(b.currentCPosition < 1 && b.currentCPosition > -1)
				return -1;
			
		}
		else
		{
			if(a.currentCPosition < 1 && a.currentCPosition > -1)
				return 1;
			if(b.currentCPosition < 1 && b.currentCPosition > -1)
				return -1;
		}
		return r;
	});
	
	for(i in imgArray)
	{
		position = imgArray[i].currentCPosition;
		offsetWidth = 0;
		limitWidth = 0;
		stopDrawingAt = 0;
		startDrawingAt = 0;
		if(position == 0 && currentLeftCenter == currentRightCenter) // prostredni, aktivni img
		{
			direction = 1;
			currentAngle = 0;
			topOffset = topCenterOffset;
			scale = 1;
			verticalScale = 1;
			leftOffset = stdLeftOffset;
			opacity = 0;
		}
		else if(position > 0) // prave obrazky
		{
			if(rightAngles[Math.ceil(position)] && rightOffsets[Math.ceil(position)])
			{
				currentAngle = rightAngles[Math.floor(position)]
					+ (rightAngles[Math.ceil(position)] - rightAngles[Math.floor(position)]) * (position%1);
				opacity = rightOpacities[Math.floor(position)]
					+ (rightOpacities[Math.ceil(position)] - rightOpacities[Math.floor(position)]) * (position%1);
				topOffset = topSideOffset;// + position* 50;
				verticalScale = sideVerticalScale;
				if(position < 1) // transition z centru
				{
					topOffset = topSideOffset + (topCenterOffset - topSideOffset) * (1-position%1);
					verticalScale = sideVerticalScale + (1 - verticalScale) * (1-position%1);
				}
				scale = Math.cos(currentAngle/180*Math.PI);


				leftOffset = stdLeftOffset + rightOffsets[Math.floor(position)]
					+ (rightOffsets[Math.ceil(position)] - rightOffsets[Math.floor(position)]) * (position%1);
				direction = -1;
				if(position >= 2) // 1. vykreslime cely
				{
					offsetWidth = (imgWidth - (rightOffsets[Math.ceil(position)] - rightOffsets[Math.floor(position-1)]))*scale;
					// levy offset dalsiho obrazku - do kolika mame kreslit
					--position;
					startDrawingAt = stdLeftOffset + rightOffsets[Math.floor(position)]
						+ (rightOffsets[Math.ceil(position)] - rightOffsets[Math.floor(position)]) * (position%1);
					++position;
				}			
			}
			else
				continue;
		}
		else // leve obrazky
		{
			direction = +1;
			position = Math.abs(position);
			if(leftAngles[Math.ceil(position)] && leftOffsets[Math.ceil(position)]) // leve obrazky
			{
				currentAngle = leftAngles[Math.floor(position)]
					+ (leftAngles[Math.ceil(position)] - leftAngles[Math.floor(position)]) * (position%1);
				opacity = leftOpacities[Math.floor(position)]
					+ (leftOpacities[Math.ceil(position)] - leftOpacities[Math.floor(position)]) * (position%1);
				topOffset = topSideOffset;// + position* 50;
				verticalScale = sideVerticalScale;
				if(position < 1) // transition z centru
				{
					topOffset = topSideOffset + (topCenterOffset - topSideOffset) * (1-position%1);
					verticalScale = sideVerticalScale + (1 - verticalScale) * (1-position%1);
				}
				scale = Math.cos(currentAngle/180*Math.PI);

				
				leftOffset = stdLeftOffset - (leftOffsets[Math.floor(position)]
					+ (leftOffsets[Math.ceil(position)] - leftOffsets[Math.floor(position)]) * (position%1));
				if(position >= 2) // 1. vykreslime cely
				{
					limitWidth = (leftOffsets[Math.ceil(position)] - leftOffsets[Math.floor(position-1)])/(scale-0.3);
					// levy offset dalsiho obrazku - do kolika mame kreslit
					-- position;
					stopDrawingAt = stdLeftOffset - (leftOffsets[Math.floor(position)]
						+ (leftOffsets[Math.ceil(position)] - leftOffsets[Math.floor(position)]) * (position%1));
					++ position;
				}
				
				position *= -1;
			}
			else
				continue;
		}
		
		if(opacity == 1)
			continue;
//		topOffset = 170-Math.abs(position) * 60; // HACK: odstranit
		trapStep = currentAngle / trapezoidStepping;
		args = {
            xPos:Math.round(leftOffset), // offset zleva
            yPos:Math.round(topOffset), // offset shora
            img:imgArray[i],  // objekt obrazku
            imgW:imgWidth, // sirka obrazku
            imgH:imgHeight, // vyska obrazku
            trapStepDown:trapStep, // o kolik px "klesne" rovina trapezoidu (v Y ose) za kazdy pixel (v X ose)
            scale:scale, // relativni meritko v x-ose
			verticalScale:verticalScale, // relativni meritko v y-ose
			direction:direction, // smer zatoceni - +1 = skopeni doleva, -1 = doprava
			offsetWidth:offsetWidth, // od kolikateho pixelu zdroje zacit kreslit nebo
			startDrawingAt:startDrawingAt, // od kolikateho pixelu cile kreslit
			limitWidth:limitWidth, // do kolikateho pixelu zdroje kreslit
			stopDrawingAt:stopDrawingAt // do kolikateho pixelu cile kreslit
        };
		if(opacity > 0)
			args.overlay = "rgba(255, 255, 255, "+opacity+")"; // barva prekryvneho obdelniku, ctvrty parametr je pruhlednost
		
        drawImage(args);
		// nakreslime zrcadlovy odraz
		if(position < 1 && position > -1)
		{
			limitWidth = imgWidth * scale;
			if(position < 0)
				offsetWidth = imgWidth - limitWidth;
			else
				offsetWidth = 0;
//			if(position > 0)
//				leftOffset = imgWidth - limitWidth;
//			else
//				leftOffset = 0;
			for(var row = 1;row <= 65;++row)
			{
				ctx.drawImage(imgArray[i],
					offsetWidth, // odsazeni zleva zdroje (sloupec zdroje)
					imgHeight-row, // odsazeni shora zdroje
					limitWidth, // sirka, jako vzit
					1, // vyska, jakou vzit
					leftOffset, // odsazeni v canvasu zleva
					2+topCenterOffset+imgHeight+row, // odsazeni v canvasu shora
					limitWidth, // konecna sirka v canvasu
					1 // konecna vyska v canvasu
				);	
			}
		}
    }
	// spodni sipka + "fade zrcadlo"
}
function drawImage(a)
{
    // vykreslime po sloupcich obrazek
    var newH;
    var widthStep = 1/a.trapStepDown;
	if(widthStep > a.imgW)
		widthStep = a.imgW;
	var widthToDraw = (a.limitWidth ? a.limitWidth : a.imgW);
	var offsetToDraw = (a.offsetWidth ? (a.scale*a.offsetWidth) : 0);
	var progressX;
	// na kolikrat budeme skladat?
	var numOfCols = Math.ceil(((widthToDraw*a.scale) - offsetToDraw) / widthStep);
	if(numOfCols == 0)
		numOfCols = 1;
	var verticalScale = (a.verticalScale ? a.verticalScale : 1);
	// aby osa otaceni stala na jednom miste
	var lastWidthStep = widthStep;
	if(Math.round((offsetToDraw + (numOfCols-1) * widthStep)/a.scale)+widthStep > widthToDraw)
		lastWidthStep = widthToDraw - ((offsetToDraw+((numOfCols-1)*widthStep))/a.scale);
	
	var expectedWidth = ((Math.round((offsetToDraw+((numOfCols-1)*widthStep))*a.scale)) + Math.ceil(lastWidthStep*a.scale));
	if(a.direction == -1)
		a.xPos += widthToDraw-expectedWidth;
	if(a.startDrawingAt)
	{
		a.startDrawingAt += widthToDraw;
	}
	ctx.fillStyle = 'rgb(222, 222, 222)'; // pro border
	
	var canvasLeft;
    for(var x = offsetToDraw;(x)<widthToDraw*a.scale; x+= widthStep)
    {
		canvasLeft = a.xPos+(Math.round(x*a.scale));
		if(a.stopDrawingAt && canvasLeft > a.stopDrawingAt)
			break;
		if(a.startDrawingAt && a.xPos+(Math.round((x+widthStep)*a.scale)) < a.startDrawingAt)
			continue;
		if(a.direction == -1)
			progressX = (widthToDraw - x)*a.scale;
		else
			progressX = x;

		if(Math.round(x/a.scale) + widthStep > widthToDraw)
			widthStep = widthToDraw - Math.round(x/a.scale); // dokreslime do konce obrazku a nepresahneme ho
		
		if(widthStep <= 0)
		{
			break;
		}
        newH = (a.imgH - (a.trapStepDown*(progressX)*2))*verticalScale;
		// border kolem obrazku
		if(x == 0)
			ctx.fillRect(a.xPos+(Math.round(x*a.scale))-1,a.yPos+a.trapStepDown*progressX-1,Math.ceil(widthStep*a.scale)+2,newH+2);
		else
			ctx.fillRect(a.xPos+(Math.round(x*a.scale)),a.yPos+a.trapStepDown*progressX-1,Math.ceil(widthStep*a.scale)+1,newH+2);
        ctx.drawImage(a.img,
            Math.round(x/a.scale), // odsazeni zleva zdroje (sloupec zdroje)
            0, // odsazeni shora zdroje
            widthStep, // sirka, jako vzit
            a.imgH, // vyska, jakou vzit
            canvasLeft, // odsazeni v canvasu zleva
            a.yPos+a.trapStepDown*progressX, // odsazeni v canvasu shora
            Math.ceil(widthStep*a.scale), // konecna sirka v canvasu
            newH // konecna vyska v canvasu
        );
		
		if(a.overlay)
		{
			ctx.fillStyle = a.overlay;
			if(x == 0)
				ctx.fillRect(a.xPos+(Math.round(x*a.scale))-1,a.yPos+a.trapStepDown*progressX-1,Math.ceil(widthStep*a.scale)+2,newH+2);
			else
				ctx.fillRect(a.xPos+(Math.round(x*a.scale)),a.yPos+a.trapStepDown*progressX-1,Math.ceil(widthStep*a.scale)+1,newH+2);
		}
		
    }
	//actualWidth = Math.ceil(widthStep*a.scale) + a.xPos+(Math.round(x*a.scale));
}
