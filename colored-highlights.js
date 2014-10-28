var createModeActive = false;
var dragActive = false;
var regions = {};
var initDragTop, initDragLeft;

//credit to http://stackoverflow.com/a/21963136
var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
function genUUID()
{
  var d0 = Math.random()*0xffffffff|0;
  var d1 = Math.random()*0xffffffff|0;
  var d2 = Math.random()*0xffffffff|0;
  var d3 = Math.random()*0xffffffff|0;
  return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
    lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
    lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
    lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
}
$(document).ready(function() {
    $('#diva-wrapper').diva({
        enableAutoHeight: true,
        enableAutoTitle: false,
        enableAnnotate: true,
        enableHighlight: true,
        fixedHeightGrid: false,
        verticallyOriented: false,
        iipServerURL: "http://diva.simssa.ca/fcgi-bin/iipsrv.fcgi",
        objectData: "debussy.json",
        imageDir: "/srv/images/debussy",
        enableCanvas: true,
        enableDownload: true
    });
    var divaInstance = $("#diva-wrapper").data('diva');
	$(document).on('keydown', function(e)
	{
		if(e.metaKey)
		{
			createModeActive = true;
	        $("#diva-wrapper").append('<div id="cover-div"></div>');
	        $("#cover-div").height($("#diva-wrapper").height());
	        $("#cover-div").width($("#diva-wrapper").width());
	        //if there are no .overlay-box objects, we want this to be NaN so it can't be clicked on.
	        $("#cover-div").css('z-index', 100);
	        $("#cover-div").offset({'top': $("#diva-wrapper").offset().top, 'left': $("#diva-wrapper").offset().left});
			
	        $("#cover-div").on('mousedown', function(ev)
	        {
	            //append the div that will resize as you drag
	            $("#cover-div").append('<div id="drag-div"></div>');
	            $("#drag-div").css('z-index', $("#cover-div").css('z-index') + 1);
	            initDragTop = ev.pageY;
	            initDragLeft = ev.pageX;
	            dragActive = true;
	            $("#drag-div").offset({'top': ev.pageY, 'left':ev.pageX});
	            $("#drag-div").css('background-color', $('input[name=color]:checked').val());

	            //as you drag, resize it - separate function as we have two document.mousemoves that we need to unbind separately
	            $(document).on('mousemove', changeDragSize);

	            $(document).on('mouseup', mouseUpHandler);
	        });
		}
	});

	$(document).on('keyup', function(e)
	{
	    if((!e.metaKey) && createModeActive)
	    {
	        createModeActive = false;
	        $("#cover-div").unbind('mousedown');
	        $("#cover-div").remove();
	    }
	});

	var changeDragSize = function(eve)
	{
	    //original four sides
	    var dragLeft = $("#drag-div").offset().left;
	    var dragTop = $("#drag-div").offset().top;
	    var dragRight = dragLeft + $("#drag-div").width();
	    var dragBottom = dragTop + $("#drag-div").height();           

	    //if we're moving left
	    if (eve.pageX < initDragLeft)
	    {
	        $("#drag-div").offset({'left': eve.pageX});
	        $("#drag-div").width(dragRight - eve.pageX);
	    }
	    //moving right
	    else 
	    {   
	        $("#drag-div").width(eve.pageX - dragLeft);
	    }
	    //moving up
	    if (eve.pageY < initDragTop)
	    {
	        $("#drag-div").offset({'top': eve.pageY});
	        $("#drag-div").height(dragBottom - eve.pageY);
	    }
	    //moving down
	    else 
	    {
	        $("#drag-div").height(eve.pageY - dragTop);
	    }
	};

	var mouseUpHandler = function()
	{
		$(document).unbind('mousemove', changeDragSize);
		$(document).unbind('mouseup', mouseUpHandler);

	    //if this was just a click
	    if ($("#drag-div").width() > 2 && $("#drag-div").height() > 2)
	    {
	        //ignore the JSLint warning
	        var pageIndex = divaInstance.getCurrentPageIndex();
	        var divaInnerObj = $("#1-diva-page-" + pageIndex);

	        //left position
	        var draggedBoxLeft = $("#drag-div").offset().left - divaInnerObj.offset().left;
	        //translated right position (converted to max zoom level)
	        var draggedBoxRight = divaInstance.translateToMaxZoomLevel(draggedBoxLeft + $("#drag-div").outerWidth());
	        //translated left - we needed the original left to get the right translation, so we translate it now
	        draggedBoxLeft = divaInstance.translateToMaxZoomLevel(draggedBoxLeft);

	        //same vertical
	        var draggedBoxTop = $("#drag-div").offset().top - divaInnerObj.offset().top;
	        var draggedBoxBottom = divaInstance.translateToMaxZoomLevel(draggedBoxTop + $("#drag-div").outerHeight());
	        draggedBoxTop = divaInstance.translateToMaxZoomLevel(draggedBoxTop);

	        //create the neume
	        /*if(regions.hasOwnProperty(pageIndex))
		        regions[pageIndex].push({'width': draggedBoxRight - draggedBoxLeft, 'height': draggedBoxBottom - draggedBoxTop, 'ulx': draggedBoxLeft, 'uly': draggedBoxTop, 'divID': genUUID()});
			else
	   			regions[pageIndex] = [{'width': draggedBoxRight - draggedBoxLeft, 'height': draggedBoxBottom - draggedBoxTop, 'ulx': draggedBoxLeft, 'uly': draggedBoxTop, 'divID': genUUID()}];
			*/
	   		divaInstance.highlightOnPage(pageIndex, [{'width': draggedBoxRight - draggedBoxLeft, 'height': draggedBoxBottom - draggedBoxTop, 'ulx': draggedBoxLeft, 'uly': draggedBoxTop, 'divID': genUUID()}], $('input[name=color]:checked').val(), "highlight-box");
	    }

	    $("#drag-div").remove();
	    dragActive = false;
	};
});