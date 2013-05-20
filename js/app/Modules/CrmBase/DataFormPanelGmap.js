Ext.define('Optima5.Modules.CrmBase.DataFormPanelGmap' ,{
	extend: 'Ext.panel.Panel',
	
	requires : ['Ext.ux.dams.GMapPanel'],
			  
	ajaxBaseParams : {},
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:DataFormPanelGrid','No module reference ?') ;
		}
		if( !me.transactionID ) {
			Optima5.Helper.logError('CrmBase:DataFormPanelGrid','No transaction ID ?') ;
		}
		
		Ext.apply(this,{
			layout: 'fit' ,
			items: {
				//flex: 1,
				xtype: 'damsgmappanel',
				//zoomLevel: 14,
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
							me.myLoad() ;
						},
						scope: me
					}
				}
			},
					  
			tbar : [{
				xtype:'textfield',
				flex:1,
				listeners : {
					change: function( field ) {
						field.clearInvalid() ;
					},
					specialkey: function(field, e){
						if (e.getKey() == e.ENTER) {
							field.up().up().addrSearch() ;
						}
					}
				}
			},{
				xtype:'button',
				text: 'Apply',
				handler : function(button,event) {
					me.addrSearch() ;
				},
				scope : me
			}]
		});
		
		this.callParent() ;
	},
			  
	addrSearch :  function() {
		var textfield = this.getDockedItems('toolbar')[0].query('textfield')[0] ;
		var gmappanel = this.query('gmappanel')[0] ;
		var me = this ;
		gmappanel.geocoderRequest( {
			addr: textfield.getRawValue(),
			success: this.addrSearchSuccess,
			failure: this.addrSearchFailure,
			scope: me 
		}) ;
		
	},
	addrSearchSuccess: function( GeocoderResult ) {
		this.gIsSet = true ;
		this.gPlaceLatLng = {
			lat : GeocoderResult.geometry.location.lat(),
			lng : GeocoderResult.geometry.location.lng()
		},
		this.gFormattedAddress = GeocoderResult.formatted_address ;
		this.gAddressComponents = GeocoderResult.address_components ;
		
		this.applyValues() ;
	},
	addrSearchFailure: function( GeocoderStatus ) {
		this.gIsSet = false ;
		this.getDockedItems('toolbar')[0].query('textfield')[0].markInvalid('GMap returned error <b>'+GeocoderStatus+'</b>') ;
		
		this.applyValues() ;
	},
	
	applyValues: function() {
		var gmappanel = this.query('gmappanel')[0] ;
		if( this.gIsSet ) {
			gmappanel.setZoom( 15 );
			var point = new google.maps.LatLng(this.gPlaceLatLng.lat,this.gPlaceLatLng.lng) ;
			var mkr = gmappanel.addMarker(point, {}, true, true, {});
			if( this.gFormattedAddress ) {
				var infowin = gmappanel.createInfoWindow({
					content: '<b>Location&nbsp;:</b><br>' + this.gFormattedAddress.split(',').join('<br>')
				},point,mkr) ;
				infowin.open(gmappanel.getMap());
				this.getDockedItems('toolbar')[0].query('textfield')[0].setRawValue(this.gFormattedAddress) ;
			}
		}
		else {
			gmappanel.clearMarkers() ;
		}
	},
	load: function() {
		// console.log('no loading there') ;
	},
	myLoad: function() {
		var me = this ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: Ext.Object.merge(me.ajaxBaseParams,{
				_action:'data_editTransaction',
				_transaction_id : me.transactionID,
				_subaction:'gmap_get'
			}),
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Load failed. Unknown error');
				}
				else {
					me.myLoadCallback( Ext.decode(response.responseText).data ) ;
				}
			},
			scope: me
		});
	},
	myLoadCallback: function(gmapData) {
		//console.dir( gmapData ) ;
		if( !gmapData.gmap_location || gmapData.gmap_location == null ) {
			this.gIsSet = false ;
		}
		else {
			this.gIsSet = true ;
			this.gPlaceLatLng = Ext.JSON.decode(gmapData.gmap_location) ;
			this.gFormattedAddress = gmapData.gmap_formattedAddress ;
			this.gAddressComponents = Ext.JSON.decode(gmapData.gmap_addressComponents) ;
		}
		// console.dir( this.gPlaceLatLng ) ;
		this.applyValues() ;
	},
	save: function(callback,callbackScope) {
		if( !callback ) {
			callback = Ext.emptyFn ;
		}
		
		var me = this ;
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,{
			_action:'data_editTransaction',
			_transaction_id : me.transactionID,
			_subaction:'gmap_set'
		}) ;
		if( this.gIsSet ) {
			Ext.apply(ajaxParams,{
				gmap_location: Ext.JSON.encode(this.gPlaceLatLng),
				gmap_formattedAddress: this.gFormattedAddress,
				gmap_addressComponents: Ext.JSON.encode(this.gAddressComponents)
			}) ;
		}
		//console.dir( ajaxParams ) ;
		//console.dir( me.ajaxBaseParams ) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: callback,
			scope: callbackScope
		});
	}
}) ;