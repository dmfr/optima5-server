Ext.define('Ext.ux.dams.GMapPanel', {
	extend: 'Ext.ux.GMapPanel',
	alias: 'widget.damsgmappanel',
			  
	initComponent : function(){
		this.callParent(arguments) ;
		
		var me = this ;
		this.on('resize',function(me,w,h) {
			me.onResize(w,h) ;
		},me); 
	},
			  
	setZoom : function( zoom ) {
		this.getMap().setZoom(zoom);
	},
			  
	geocoderRequest: function( options ) {
		if (!this.geocoder) {
			this.geocoder = new google.maps.Geocoder();
		}
		this.geocoder.geocode({
			address: options.addr
		}, Ext.Function.bind(this.geocoderRequestCallback, this, [options.success,options.failure,options.scope], true ));
        
	},
	geocoderRequestCallback: function( ArrayGeocoderResult, GeocoderStatus, successCallback, failureCallback, callbackScope ) {
		if( GeocoderStatus === 'OK' && ArrayGeocoderResult.length == 1 ) {
			successCallback.call( callbackScope, ArrayGeocoderResult[0] ) ;
		}
		else {
			if( ArrayGeocoderResult.length > 1 ) {
				failureCallback.call( callbackScope, 'MULTiPLE' ) ;
			}
			else {
				failureCallback.call( callbackScope, GeocoderStatus ) ;
			}
		}
	},
	
	dummyFunction: function() {
		
	}
});