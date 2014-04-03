Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoCalendarSubpanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Sch.All',
		'Optima5.Modules.Spec.WbMrfoxy.PromoCalendarEventDetailView'
	],
	
	initComponent: function() {
		var me = this ;
		if( (me.parentBrowserPanel) instanceof Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoListSubpanel','No parent reference ?') ;
		}
		me.optimaModule = me.parentBrowserPanel.optimaModule ;
		
		// ** Models
		Ext.define('WbMrfoxySchEventModel', {
			extend: 'Sch.model.Event',
			fields: [
				{ name: 'ColorHex', type : 'string' },
				{ name: 'FilerecordId', type : 'int' },
				{ name: 'PromoId', type : 'string' }
			]
		}) ;
		Ext.define('WbMrfoxySchResourceModel', {
			extend: 'Sch.model.Resource',
			fields: [
				{ name: 'nodeKey', type : 'string' },
				{ name: 'nodeText', type : 'string' }
			]
		}) ;

		// ** Init dates
		var startDate, endDate ;
		if( me.startDate && me.endDate ) {
			startDate = me.startDate ;
			endDate = me.endDate ;
		} else {
			startDate = new Date() ;
			startDate.setFullYear( startDate.getFullYear() - 1 ) ;
			endDate = new Date() ;
			endDate.setFullYear( endDate.getFullYear() + 1 ) ;
		}
		
		// ** View preset
		Sch.preset.Manager.registerPreset('weekMrfoxy',{
			timeColumnWidth: 48,
			rowHeight: 24,
			resourceColumnWidth: 100,
			displayDateFormat: "Y-m-d",
			shiftUnit: "WEEK",
			shiftIncrement: 5,
			defaultSpan: 6,
			timeResolution: {
					unit: "DAY",
					increment: 1
			},
			headerConfig: {
				middle: {
					unit: "WEEK",
					renderer: function (c, b, a) {
						a.align = "center";
						return 'w.' + Ext.Date.format(c, "W")
					}
				},
				top: {
					unit: "MONTH",
					renderer: function (c, b, a) {
						a.align = "center";
						return Ext.Date.format(c, "F Y")
					}
				}
			}
		});
		
		// ** View hierarchy
		Ext.apply( this, {
			layout: 'fit',
			items: Ext.create('Sch.panel.SchedulerTree',{
				border: false,
				//rowHeight        : 32,
				eventStore       : Ext.create('Sch.data.EventStore', {
					model: 'WbMrfoxySchEventModel',
					data:[]
				}),
				resourceStore    : Ext.create('Sch.data.ResourceTreeStore', {
					model: 'WbMrfoxySchResourceModel',
					//nodeParam: 'nodeKey',
					root: {children:[]},
					proxy: {
						type: 'memory' ,
						reader: {
							type: 'json'
						}
					}
				}),
				eventRenderer    : function (record,resource,meta) {
					if (record.data.ColorHex != '') {
						meta.style = 'background-color:#'+record.data.ColorHex ;
					}
					return record.get('Name');
				},
				useArrows        : true,
				viewPreset       : 'weekMrfoxy',
				startDate        : startDate,
				endDate          : endDate,
				multiSelect      : false,
				layout           : { type : 'hbox', align : 'stretch' },
				lockedGridConfig : {
					resizeHandles : 'e',
					resizable     : { pinned : true },
					width         : 250
				},
				readOnly : true,
				schedulerConfig  : {
					scroll      : true,
					columnLines : false,
					flex        : 1
				},
				columnLines : false,
				rowLines    : true,
				columns: [{
					xtype:'treecolumn',
					dataIndex: 'nodeText',
					text: 'Store Group',
					width: 245,
					sortable: false,
					menuDisabled:true
				}],
				plugins : [
					Ext.create("Sch.plugin.Zones", {
						store : Ext.create('Ext.data.JsonStore', {
							model : 'Sch.model.Range',
							data : [{
								StartDate : Ext.Date.clearTime( Ext.Date.add(startDate,Ext.Date.WEEK,-1) ),
								EndDate   : Ext.Date.clearTime( Ext.Date.add( new Date(), Ext.Date.DAY, +1) ) ,
								Cls       : 'op5-spec-mrfoxy-promosch-today'
							}]
						})
					})
				],
				listeners: {
					'afterrender': {
						fn: function(schP) {
							Ext.defer( function() {
								this.scrollToday() ;
							},100,this) ;
						},
						scope:me
					},
					'eventclick': {
						fn: me.onEventClick,
						scope:me
					},
					'destroy': {
						fn: me.onCalendarDestroy,
						scope:me
					}
				}
			})
		}) ;
		this.callParent() ;
		
		
		me.initBible() ; // ** Init bible
		me.fetchEvents() ;  // ** Fetch events 
	},
	getSchedulerTree: function() {
		return this.items.getAt(0) ;
	},
	scrollToday: function() {
		var schP = this.getSchedulerTree() ;
		
		var nowDate = new Date() ;
		nowDate.setDate( nowDate.getDate() - (6*7) ) ; // rewind 6 weeks
		schP.scrollToDate(nowDate, false) ;
	},
	
	
	initBible: function() {
		var me = this ;
			
		
		/*
		 * Interro de la bible
		 */
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getBibleTreeOne',
				bible_code : 'IRI_STORE'
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					// this.bibleId = bibleId ;
					this.initBibleTreestore( Ext.decode(response.responseText).dataRoot ) ;
				}
			},
			scope: this
		});
	},
	initBibleTreestore: function( dataRoot ) {
		var me = this ;
		
		this.bibleTreestore = Ext.create('Ext.data.TreeStore', {
			model: 'WbMrfoxySchResourceModel',
			nodeParam: 'Id',
			root: dataRoot 
		});
		
		// suppr. "checked" parameter
		this.bibleTreestore.getRootNode().cascadeBy( function(node) {
			node.set('checked',null) ;
			node.set('Id',node.get('nodeKey')) ;
		}) ;
		
		this.buildBibleTree() ;
		this.mon(this.parentBrowserPanel,'tbarselect',function(){
			this.buildBibleTree() ;
			this.reload(false) ;
		},this) ;
	},
	buildBibleTree: function() {
		var filterNode = this.parentBrowserPanel.filterCountry ;
		
		var countryChildren = [] ;
		var dd = 0 ;
		Ext.Array.each( Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll(), function(rec) {
			if( filterNode != null && filterNode != '' && rec.get('country_code') != filterNode ) {
				return ;
			}
			dd++ ;
			countryChildren.push({
				leaf:false,
				Id: rec.get('country_code'),
				nodeKey: rec.get('country_code'),
				nodeText: rec.get('country_display'),
				icon: rec.get('country_iconurl'),
				children: ( this.bibleTreestore.getNodeById( rec.get('country_code') ) != null ? this.bibleTreestore.getNodeById( rec.get('country_code') ).childNodes : [] ),
				expanded: true
			});
		}, this) ;
		
		var newRootNode = {
			root: true,
			children: countryChildren,
			expanded: true,
			nodeKey:'',
			nodeText:'<b>'+'All countries'+'</b>',
			icon: 'images/op5img/ico_planet_small.gif'
		};
		
		this.getSchedulerTree().getResourceStore().setRootNode(newRootNode) ;
	},
	
	
	
	
	/*
	 * Data
	 */
	reload: function(scrollToday) {
		var me = this ;
		if( scrollToday !== false ) {
			me.scrollToday() ;
		}
		me.fetchEvents() ;
	},
	fetchEvents: function() {
		var me = this,
			dateStart = this.getSchedulerTree().getStart(),
			dateEnd = this.getSchedulerTree().getEnd(),
			dateMinEnd = Ext.Date.clearTime(dateStart),
			dateMaxStart = Ext.Date.clearTime(dateEnd) ;
			
		if( me.loadMask ) {
			me.loadMask.show() ;
		} else {
			me.loading = true ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'promo_getGrid',
			filter_isProd: 1,
			filter: Ext.JSON.encode([{
				type: 'date',
				comparison: 'gt',
				field: 'date_end' ,
				value: Ext.Date.format(dateMinEnd,'Y-m-d')
			},{
				type: 'date',
				comparison: 'lt',
				field: 'date_start' ,
				value: Ext.Date.format(dateMaxStart,'Y-m-d')
			}])
		};
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					return ;
				}
				if( Ext.isArray(ajaxData.data) ) {
					me.dataCacheArray = ajaxData.data ;
					me.dataCacheDateMinEnd = dateMinEnd ;
					me.dataCacheDateMaxStart = dateMaxStart ;
				}
				me.buildEvents() ;
			},
			scope: me
		}) ;
	},
	buildEvents: function() {
		var me = this ;
		
		var accountField='store_code',
			startField='date_start',
			endField='date_end',
			mecaField='mechanics_detail',
			colorField='prod_colorHex',
			promoField='promo_id' ;
		
		var eventsData = [], fileRecord ;
		for( var i=0 ; i<me.dataCacheArray.length ; i++ ) {
			fileRecord = me.dataCacheArray[i] ;
			
			var evt = {
				Id: i,
				//Name: '&#160;',
				Name: fileRecord[mecaField],
				StartDate: fileRecord[startField],
				EndDate: Ext.Date.format(Ext.Date.add(Ext.Date.parse(fileRecord[endField],'Y-m-d'), Ext.Date.DAY, +1),'Y-m-d') ,
				ResourceId: fileRecord[accountField],
				ColorHex: fileRecord[colorField],
				FilerecordId: fileRecord['_filerecord_id'],
				PromoId: fileRecord[promoField]
			} ;
			if( evt.ColorHex != null && evt.ColorHex.charAt(0) == '#' ) {
				evt.ColorHex = evt.ColorHex.substr(1) ;
			}
			eventsData.push(evt) ;
		}
		
		this.getSchedulerTree().getEventStore().loadData( eventsData ) ;
		
		Ext.defer(function() {
			if( me.loadMask ) {
				me.loadMask.hide() ;
			}
			me.loading = false ;
		},200,me) ;
	},
	
	/*
	 * Event detail floating window
	 */
	onEventClick: function( schedulerPanel, eventRecord, clickEvent ) {
		var me = this ,
			newEventDetailPanel,
			clickEl = clickEvent.getTarget( this.getSchedulerTree().eventSelector ) ;
			
		if( !me.eventDetailPanel ) {
			me.eventDetailPanel = Ext.create('Ext.Panel', {
				id: this.id + '-eventdetailpanel',
				title: '...',
				layout: 'fit',
				floating: true,
				renderTo: Ext.getBody(),
				tools: [{
					type: 'close',
					handler: function(e, t, p) {
						p.ownerCt.hide();
					}
				}],
				items: Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoCalendarEventDetailView',{
					id: this.id + '-eventdetailview',
					promoPanelCalendar: this
				}),
				listeners:{
					hide:me.onEventDetailHide,
					scope:me
				}
			});
		}
		
		var recordIdx = eventRecord.get('Id'),
			filerecordId = eventRecord.get('FilerecordId'),
			title = eventRecord.get('PromoId')
			
		// *** Titre ***
		me.eventDetailPanel.filerecordId = filerecordId ;
		me.eventDetailPanel.setTitle('Promo# '+title) ;
		
		// *** mise en place de la vue ***
		me.eventDetailPanel.getComponent(this.id + '-eventdetailview').on('eventdetailrendered',function(){
			me.onEventDetailRendered(clickEl) ;
		},me,{single:true}) ;
		me.eventDetailPanel.getComponent(this.id + '-eventdetailview').update(recordIdx) ;
	},
	onEventDetailRendered: function( clickEl ) {
		var me = this,
			p = me.eventDetailPanel,
			hideIf = me.eventDetailHideIf ;
		
		p.setWidth(null) ; // Clear any previously forced maxSize applied below (400px)
		p.show();
		p.getEl().alignTo(clickEl, 'tl-bl?');
		p.doComponentLayout() ; // Force panel to calculate fit size based on new alignTo
		
		// monitor clicking and mousewheel
		me.mon(Ext.getDoc(), {
				mousewheel: hideIf,
				mouseup: hideIf,
				scope: me
		});
	},
	onEventDetailHide: function( p ) {
		var me = this ;
			hideIf = me.eventDetailHideIf,
			doc = Ext.getDoc() ;
			
		me.getSchedulerTree().getEventSelectionModel().deselectAll() ;
			
		doc.un('mousewheel', hideIf, me);
		doc.un('mouseup', hideIf, me);
		me.stopOneClick = true ;
	},
	eventDetailHideIf: function(e) {
		var me = this;
		
		if( !me.isDestroyed && !e.within(me.eventDetailPanel.el, false, true) ) {
			me.eventDetailPanel.hide();
			
			me.mon(Ext.getDoc(),'click',function(e) {
				me.stopOneClick = false ;
			},me,{single:true}) ;
		}
	},
	
	
	
	
	/*
	 * CalendarPanel onDestroy
	 */
	onCalendarDestroy: function() {
		var me = this ;
		if( me.eventDetailPanel ) {
			me.eventDetailPanel.destroy() ;
		}
	}
});