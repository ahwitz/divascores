var createModeActive = false;
var dragActive = false;
var initDragTop, initDragLeft;
var regions = {};

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
//$(document).ready(function() {
function setup(){
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

	    //if this wasn't just a click
	    if ($("#drag-div").width() > 2 && $("#drag-div").height() > 2)
	    {
	        var initLeft = $("#drag-div").offset().left;
	        var initTop = $("#drag-div").offset().top;
	        var pageIndex = divaInstance.getPageIndexForPageXYValues(initLeft, initTop);
	        var divaInnerObj = $("#1-diva-page-" + pageIndex);

	        //left position
	        var draggedBoxLeft = initLeft - divaInnerObj.offset().left;
	        //translated right position (converted to max zoom level)
	        var draggedBoxRight = divaInstance.translateToMaxZoomLevel(draggedBoxLeft + $("#drag-div").outerWidth());
	        //translated left - we needed the original left to get the right translation, so we translate it now
	        draggedBoxLeft = divaInstance.translateToMaxZoomLevel(draggedBoxLeft);

	        //same vertical
	        var draggedBoxTop = initTop - divaInnerObj.offset().top;
	        var draggedBoxBottom = divaInstance.translateToMaxZoomLevel(draggedBoxTop + $("#drag-div").outerHeight());
	        draggedBoxTop = divaInstance.translateToMaxZoomLevel(draggedBoxTop);
	     
	        //create the highlight
	   		//divaInstance.highlightOnPage(pageIndex, [{'width': draggedBoxRight - draggedBoxLeft, 'height': draggedBoxBottom - draggedBoxTop, 'ulx': draggedBoxLeft, 'uly': draggedBoxTop, 'divID': genUUID()}], $('input[name=color]:checked').val(), "highlight-box");
	    
	   		//save it
	   		if (regions.hasOwnProperty(pageIndex))
	   			regions[pageIndex].push({'width': draggedBoxRight - draggedBoxLeft, 'height': draggedBoxBottom - draggedBoxTop, 'ulx': draggedBoxLeft, 'uly': draggedBoxTop, 'divID': genUUID(), 'color': $('input[name=color]:checked').val()});
	    	else 
	    		regions[pageIndex] = [{'width': draggedBoxRight - draggedBoxLeft, 'height': draggedBoxBottom - draggedBoxTop, 'ulx': draggedBoxLeft, 'uly': draggedBoxTop, 'divID': genUUID(), 'color': $('input[name=color]:checked').val()}];
	    	
	    	redrawFromRegions();
	    }

	    $("#drag-div").remove();
	    dragActive = false;
	};

	$("#save").on('click', function()
	{	
		var regionsCopy = regions;
		var pageBlob = new Blob([JSON.stringify(regionsCopy)], {type: "text/plain;charset=utf-8"}); //create a blob

	    saveAs(pageBlob, "highlights" + new Date().getTime()); //download it! from FileSaver.js
	});

	$("#load").on('change', function()
	{
        var reader = new FileReader();
		reader.file = document.getElementById("load").files[0];

        //when the file is loaded as text
        reader.onload = function(e)
        { 
            regions = JSON.parse(this.result);

            redrawFromRegions();
        };

        reader.readAsText(reader.file);
	});

	var redrawFromRegions = function()
	{
		divaInstance.resetHighlights();

		for(pageIndex in regions)
        {
    		var regionLength = regions[pageIndex].length;
    		while(regionLength--)
    		{
    			var curRegion = regions[pageIndex][regionLength];
        		divaInstance.highlightOnPage(pageIndex, [{'width': curRegion['width'], 'height': curRegion['height'], 'ulx': curRegion['ulx'], 'uly': curRegion['uly'], 'divID': curRegion['divID']}], curRegion['color'], "highlight-box");
    		}
        }

        $(".highlight-box").on('click', function(e)
        {
        	$(e.target).on('click', function(ev)
        	{
        		var pageIndex = $(ev.target).parent().attr('data-index');

	    		var regionLength = regions[pageIndex].length;
	    		while(regionLength--)
	    		{
	    			var curRegion = regions[pageIndex][regionLength];
	    			console.log(curRegion.divID, $(ev.target).attr('id'));
	        		if(curRegion.divID == $(ev.target).attr('id'))
	        		{
	        			regions[pageIndex].splice(regionLength, 1); 
	        			redrawFromRegions();
	        			break;
	        		}
	        	}
        	});
        });
	};
}//);
