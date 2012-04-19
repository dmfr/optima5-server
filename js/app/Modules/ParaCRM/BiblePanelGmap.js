Ext.define('Optima5.Modules.ParaCRM.BiblePanelGmap' ,{
	extend: 'Optima5.Modules.ParaCRM.GmapWithStore',
	
	alias : 'widget.op5paracrmbiblegmap',
			  
	initComponent: function() {
		//console.log('init') ;
		this.callParent() ;
	},
			  
	syncWithStore: function() {
		var me=this ;
		var gmappanel = this.query('> damsgmappanel')[0] ;
		gmappanel.clearMarkers() ;
		Ext.Array.each( me.store.getRange() , function(record) {
			if( !record.get('gmap_location') ) {
				//console.dir(record) ;
				return ;
			}
			me.addMyMarker(record) ;
			
		},me) ;
	},
	addMyMarker: function(record) {
		var gmappanel = this.query('> damsgmappanel')[0] ;
		
			var gPlaceLatLng = Ext.JSON.decode(record.get('gmap_location')) ;
			var point = new google.maps.LatLng(gPlaceLatLng.lat,gPlaceLatLng.lng) ;
			var mkr = gmappanel.addMarker(point, {}, false, false, {});
			var infowin = gmappanel.createInfoWindow({
				content: '<b>Location&nbsp;:</b><br>' + record.get('gmap_formattedAddress').split(',').join('<br>')
			},point,mkr) ;
	}
			  
	
}) ;