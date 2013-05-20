Ext.define('Optima5.Modules.CrmBase.BiblePanelGmap' ,{
	extend: 'Ext.panel.Panel',
	
	requires : ['Ext.ux.dams.GMapPanel'],
	
	alias : 'widget.op5crmbasebiblegmap',
			  
	initComponent: function() {
		var me = this ;
		
		if( !me.store ) {
			console.log('error!!') ;
		}
		
		Ext.apply(this,{
			layout: 'fit' ,
			items: {
				//flex: 1,
				xtype: 'damsgmappanel',
				zoomLevel: 5,
				gmapType: 'map',
				mapConfOpts: ['enableScrollWheelZoom','enableDoubleClickZoom','enableDragging'],
				mapControls: ['GSmallMapControl','GMapTypeControl','NonExistantControl'],
				setCenter: {
					geoCodeAddr: 'France'
					//marker: {title: 'Fenway Park'}
				},
				minGeoAccuracy: 'APPROXIMATE',
				displayGeoErrors: true,
				maplisteners: {
					/*
					click: function(event) {
						console.dir(event) ;
						console.log('now this is :') ;
						console.dir(this) ;
						this.addMarker( event.latLng, {}, true, false, {} ) ;
					}
					*/
				},
				listeners: {
					mapready: {
						fn: function() {
							me.firstLoad() ;
						},
						scope: me
					}
				}
			}
					  
		});
		
		this.callParent() ;
		this.on('beforeactivate',me.onBeforeActivate,me) ;
		this.on('activate',me.onActivate,me) ;
		this.on('beforedeactivate',me.onBeforeDeactivate,me) ;
	},
	firstLoad: function() {
		var me=this ;
		me.mapready = true ;
		me.fireEvent('mapready') ;
		// this.syncWithStore() ;
		me.store.on('datachanged',function() {
			me.syncWithStore() ;
		},me) ;
		me.syncWithStore() ;
	},
	
	onBeforeActivate: function() {
		var me=this ;
		
		if( typeof this.storePageSize === 'undefined' ) {
			me.storePageSize = me.store.pageSize ;
		}
		
		me.store.pageSize = 9999 ;
		
		me.store.removeAll() ;
	},
	onActivate:function() {
		var me=this ;
		me.store.loadPage(1) ;
	},
	onBeforeDeactivate: function(){
		var me=this ;
		if( !me.isVisible() )
			return ;
		
		me.store.pageSize = me.storePageSize ;
		me.storePageSize = undefined ;
		
		me.store.removeAll() ;
		me.store.loadPage(1) ;
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