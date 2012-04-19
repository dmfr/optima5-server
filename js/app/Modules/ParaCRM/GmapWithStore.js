Ext.define('Optima5.Modules.ParaCRM.GmapWithStore' ,{
	extend: 'Ext.panel.Panel',
	
	requires : ['Ext.ux.dams.GMapPanel'],
			  
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
			  
	syncWithStore: function() {
		var me=this ;
	}
});
