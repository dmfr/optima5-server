Ext.define('Optima5.Modules.CrmBase.FilePanelGmap' ,{
	extend: 'Ext.panel.Panel',
	
	requires : ['Ext.ux.dams.GMapPanel'],
	
	alias : 'widget.op5crmbasefilegmap',
			  
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
		//console.log('init') ;
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
		
		me.store.pageSize = 200 ;
		
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
		
		var arrLocations = new Array() ;
		var arrRecords = new Array() ;
		
		Ext.Array.each( me.store.getRange() , function(record) {
			if( !record.get(me.fileId+'_gmap_location') ) {
				return ;
			}
				
			var curIdx ;
			if( (curIdx=Ext.Array.indexOf(record.get(this.fileId+'_gmap_location'))) == -1 ) {
				arrLocations.push(record.get(this.fileId+'_gmap_location')) ;
				arrRecords.push(record) ;
			}
			else {
				if( record.get('filerecord_id') > arrRecords[curIdx].get('filerecord_id') ) {
					arrRecords[curIdx] = record ;
				}
			}
		},me) ;
		
		this.query('> damsgmappanel')[0].clearMarkers() ;
		Ext.Array.each( arrRecords , function(record) {
			me.addMyMarker(record) ;
		},me) ;
	},
	addMyMarker: function(record) {
		var me = this ;
		var gmappanel = this.query('> damsgmappanel')[0] ;
		
			var gPlaceLatLng = Ext.JSON.decode(record.get(this.fileId+'_gmap_location')) ;
			var point = new google.maps.LatLng(gPlaceLatLng.lat,gPlaceLatLng.lng) ;
			var mkr = gmappanel.addMarker(point,{},false,false,{
				dblclick: function(e) {
					me.fireEvent('openfile',record.get('filerecord_id')) ;
				}
			});
			
			this.getInfoWindowText(record) ;
			
			var infowin = gmappanel.createInfoWindow({
				content: this.getInfoWindowText(record).join("<br>")
			},point,mkr) ;
	},
	getInfoWindowText:function(record) {
		
		
		var strArr = new Array() ;
		var arrDoneFields = new Array() ;
		Ext.Array.each( this.gridCfg.grid_fields, function(value){
			//console.dir(value) ;
			if( value.file_code != this.fileId )
				return ;
			if( !value.file_field )
				return ;
			if( !value.is_display )
				return ;
			
			if( Ext.Array.contains(arrDoneFields,value.file_field) ) {
				return ;
			}
			else {
				arrDoneFields.push(value.file_field) ;
			}
			
			if( value.link_bible ) {
				strArr.push( function(record,file_field) {
					var returnStrArr = new Array() ;
					Ext.Array.each( this.gridCfg.grid_fields, function(tvalue){
						if( tvalue.file_field != file_field ) {
							return ;	
						}
						if( tvalue.link_bible_type == 'tree' && tvalue.link_bible_is_key ) {
							returnStrArr.push('('+record.get(tvalue.field)+')') ;
						}
						if( tvalue.link_bible_type == 'entry' && tvalue.link_bible_is_key ) {
							returnStrArr.push('<b>'+record.get(tvalue.field)+'</b>') ;
						}
						else {
							if( tvalue.link_bible_type == 'entry' && tvalue.is_display ) {
								returnStrArr.push(''+record.get(tvalue.field)+'') ;
							}
						}
					},this) ;
					return returnStrArr.join(" ") ;
				}.call(this,record,value.file_field) ) ;
			}
			else {
				if(Ext.typeOf(record.get(value.field)) == 'date' ) {
					strArr.push( Ext.Date.format(record.get(value.field), 'Y-m-d H:i') ) ;
				}
				else {
					strArr.push( record.get(value.field) ) ;
				}
			}
			
		},this) ;
		
		// console.dir(strArr) ;
		return strArr ;
	}
			  
	
}) ;