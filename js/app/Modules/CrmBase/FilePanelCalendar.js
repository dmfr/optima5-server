Ext.define('Optima5.Modules.CrmBase.FilePanelCalendar' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Ext.calendar.CalendarPanel',
		'Ext.calendar.util.Date',
		'Ext.calendar.data.EventModel',
		'Ext.calendar.data.CalendarModel',
		'Optima5.Modules.CrmBase.FilePanelEventDetailView'
	],
	
	alias : 'widget.op5crmbasefilecalendar',
	
	rotatingColors:['#306da6','#86a723','#b6a980'],
	
	/**
	* @cfg {Number} startDay
	* The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
	*/
	startDay: 0,
	
	// forward (ajax)config from FilePanel
	gridCfg: null,
	
	// private property
	accountIsOn: false,
	accountsSelected: [],
	dataCacheDateMinEnd: null,
	dataCacheDateMaxStart: null,
	dataCacheArray: [],
	eventDetailPanel: null,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelCalendar','No module reference ?') ;
			return ;
		}
		if( (me.parentFilePanel) instanceof Optima5.Modules.CrmBase.FilePanel ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelCalendar','No parent FilePanel reference ?') ;
			return ;
		}
		if( !me.gridCfg || !me.gridCfg.grid_fields ) {
			Optima5.Helper.logError('CrmBase:FilePanelCalendar','No proper config ?') ;
			return ;
		}
		
		/*
		 * Création des stores locaux
		 */
		this.calendarStore = Ext.create('Ext.data.Store', {
			model: 'Ext.calendar.data.CalendarModel',
			data: [],
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		});
		this.eventStore = Ext.create('Ext.data.Store', {
			model: 'Ext.calendar.data.EventModel',
			data: [],
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		});
		
		/*
		 * Enumeration des bibles potentielles pour menus 2D
		 */
		
		Ext.apply(me,{
			layout: 'border',
			title: 'Loading...',
			titleAlign: 'center',
			items: [{
				itemId:'calendar-center',
				xtype:'calendarpanel',
				activeItem: 1,
				eventStore: me.eventStore,
				border:false,
				region:'center',
				dayViewCfg: {
					startDay: me.startDay // start on Monday
				},
				weekViewCfg: {
					startDay: me.startDay // start on Monday
				},
				monthViewCfg: {
					startDay: me.startDay, // start on Monday
					showHeader: true,
					showWeekLinks: true,
					showWeekNumbers: true
				},
				listeners: {
					'viewchange': {
						fn: function(p, vw, dateInfo){
							/*
							if(this.eventDetailPanel){
								this.eventDetailPanel.hide();
							}
							*/
							if(dateInfo){
								// will be null when switching to the event edit form so ignore
								this.getComponent('calendar-west').getComponent('calendar-nav-datepicker').setValue(dateInfo.activeDate);
								this.updateTitle(dateInfo.viewStart, dateInfo.viewEnd);
								this.onDateChange(dateInfo.viewStart, dateInfo.viewEnd);
							}
						},
						scope: this
					},
					'eventclick': {
						fn: me.onEventClick,
						scope: me
					},
					'dayclick': {
						fn: me.onDayClick,
						scope: me
					},
					'destroy': {
						fn: me.onCalendarDestroy,
						scope:me
					}
				}
			},{
				itemId:'calendar-west',
				region:'west',
				layout:{
					type:'vbox',
					align: 'stretch'
				},
				bodyCls: 'ux-noframe-bg',
				width: 179,
				border: true,
				items: [{
					xtype: 'datepicker',
					startDay: me.startDay,
					itemId: 'calendar-nav-datepicker',
					cls: 'ext-cal-nav-picker',
					listeners: {
						'select': {
							fn: function(dp, dt){
								me.getComponent('calendar-center').setStartDate(dt);
							},
							scope: me
						}
					}
				},{
					xtype:'grid',
					itemId: 'calendar-nav-accounts',
					border: false,
					hidden: true,
					flex:1,
					title:'Accounts',
					model:'CalendarModel',
					store: me.calendarStore,
					columns:[{
						text: '',
						width: 24,
						sortable: false,
						dataIndex: 'ColorHex',
						menuDisabled: true,
						renderer: function( value, metaData ) {
							if( value != null ) {
								// metaData.style = '' ;
								return '<div style="height:16px ; width:16px; background-color: #' + value + '; background-image: none;">&#160;</div>' ;
							}
							return '&#160;' ;
						}
					},{
						text: 'Account info',
						flex: 1,
						sortable: false,
						dataIndex: 'Description',
						menuDisabled: true
					}],
					selModel:Ext.create('Ext.selection.CheckboxModel',{
						mode: 'MULTI',
						checkOnly: true,
						listeners: {
							beforeselect:{
								fn:me.onAccountSelect,
								scope:me
							},
							beforedeselect:{
								fn:me.onAccountDeselect,
								scope:me
							},
							selectionchange:{
								fn:me.onAccountsSelectionChange,
								scope:me
							}
						}
					})
				}]
			}]
		});
		me.addCls('op5-crmbase-filecalendar-panel') ;
		
		me.callParent() ;
		
		me.on('activate',function() {
			me.buildEvents();
		},me) ;
		
		me.on('afterrender',function() {
			Ext.defer(function() {
				me.loadMask = Ext.create('Ext.LoadMask',{
					target: me.getComponent('calendar-center'),
					msg: 'Please wait'
				});
				if( me.loading ) {
					me.loadMask.show() ;
				}
			},10,me);
		},me);
		if( !me.gridCfg.define_file.calendar_cfg ) {
			return ;
		}
		
		me.initAccounts() ;
	},
	initAccounts: function() {
		var me = this ,
			fileId = me.gridCfg.define_file.file_code ,
			accountsGridCmp = me.getComponent('calendar-west').getComponent('calendar-nav-accounts'),
			accountsStore = me.calendarStore ;
			
		if( !me.gridCfg.define_file.calendar_cfg.account_is_on ) {
			accountsStore.loadData([]) ;
			accountsGridCmp.setVisible(false) ;
			
			me.accountIsOn = false ;
			
			return ;
		}
		
		me.accountIsOn = true ;
		
		/*
		 * Constitution de la liste des accounts :
		 * - bible_code ?
		 * - bible_fields to display
		 */
		var accountFileField = me.gridCfg.define_file.calendar_cfg.account_filefield ,
			accountBibleCode = null,
			accountBibleDisplayKey = null ;
			accountBibleDisplayFields = [] ;
		Ext.Array.each( me.gridCfg.grid_fields, function( gridField ) {
			if( gridField.file_code != fileId ) {
				return ;
			}
			if( gridField.file_field != accountFileField ) {
				return ;
			}
			accountBibleCode = gridField.link_bible ;
			if( gridField.link_bible_type == 'entry' && gridField.link_bible_is_key == true ) {
				accountBibleDisplayKey = gridField.link_bible_field ;
				return ;
			}
			if( gridField.link_bible_type == 'entry' && gridField.is_display == true ) {
				accountBibleDisplayFields.push(gridField.link_bible_field) ;
			}
		},me);
		
		
		/*
		 * Interro de la bible
		 */
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_getBibleGrid',
				bible_code: accountBibleCode
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					return ;
				}
				
				var calendarStoreRecords = [] ;
				var a = -1 ;
				Ext.Array.each( ajaxData.data, function( rawRecord ) {
					a++ ;
					
					var arrStr = [] ;
					arrStr.push( '<b>'+rawRecord['field_'+accountBibleDisplayKey]+'</b>' ) ;
					for( var i=0 ; i<accountBibleDisplayFields.length ; i++ ) {
						arrStr.push( rawRecord['field_'+accountBibleDisplayFields[i]] ) ;
					}
					
					calendarStoreRecords.push({
						CalendarId: rawRecord.entry_key,
						Title: arrStr.join(' '),
						Description: arrStr.join(' '),
						ColorHex: null
					});
				},me) ;
				accountsStore.loadData(calendarStoreRecords) ;
				accountsGridCmp.setVisible(true) ;
			},
			scope: me
		}) ;
	},
	
	
	
	/*
	 * Title (from ExtJS 4.1)
	 */
	// The CalendarPanel itself supports the standard Panel title config, but that title
	// only spans the calendar views.  For a title that spans the entire width of the app
	// we added a title to the layout's outer center region that is app-specific. This code
	// updates that outer title based on the currently-selected view range anytime the view changes.
	updateTitle: function(startDt, endDt){
		var p = this,
			fmt = Ext.Date.format;
		
		if(Ext.Date.clearTime(startDt).getTime() == Ext.Date.clearTime(endDt).getTime()){
			p.setTitle(fmt(startDt, 'F j, Y'));
		}
		else if(startDt.getFullYear() == endDt.getFullYear()){
			if(startDt.getMonth() == endDt.getMonth()){
					p.setTitle(fmt(startDt, 'F j') + ' - ' + fmt(endDt, 'j, Y'));
			}
			else{
					p.setTitle(fmt(startDt, 'F j') + ' - ' + fmt(endDt, 'F j, Y'));
			}
		}
		else{
			p.setTitle(fmt(startDt, 'F j, Y') + ' - ' + fmt(endDt, 'F j, Y'));
		}
	},
	
	/*
	 * Data
	 */
	reload: function() {
		var me = this ;
		if( me.dataCacheDateMinEnd != null && me.dataCacheDateMaxStart != null ) {
			me.fetchEvents( me.dataCacheDateMinEnd, me.dataCacheDateMaxStart ) ;
		}
	},
	onDateChange: function(dateStart, dateEnd) {
		//console.dir(dateStart) ;
		//console.dir(dateEnd) ;
		
		var me = this,
			dateMinEnd = Ext.Date.clearTime(dateStart),
			dateMaxStart = Ext.Date.clearTime(dateEnd) ,
			doLoad = false ;
			
		if( me.dataCacheDateMinEnd == null && me.dataCacheDateMaxStart == null ) {
			doLoad = true ;
		} else if( me.dataCacheDateMinEnd > dateMinEnd || me.dataCacheDateMaxStart < dateMaxStart ) {
			doLoad = true ;
		}
		if( doLoad ) {
			me.fetchEvents( dateMinEnd, dateMaxStart ) ;
		} else {
			//me.buildEvents() ;
		}
		
	},
	fetchEvents: function( dateMinEnd, dateMaxStart ) {
		var me = this ;
		if( me.loadMask ) {
			me.loadMask.show() ;
		} else {
			me.loading = true ;
		}
		
		var fileCode = me.gridCfg.define_file.file_code,
			startFileField = me.gridCfg.define_file.calendar_cfg.eventstart_filefield ,
			endFileField = me.gridCfg.define_file.calendar_cfg.eventend_filefield ,
			startField,
			endField ;
		Ext.Array.each( me.gridCfg.grid_fields, function( gridField ) {
			if( gridField.file_code != fileCode ) {
				return ;
			}
			if( gridField.file_field == startFileField ) {
				startField = gridField.field ;
			}
			if( gridField.file_field == endFileField ) {
				endField = gridField.field ;
			}
		},me) ;
		
		var ajaxParams = {
			_action: 'data_getFileGrid_data',
			file_code: fileCode,
			filter: Ext.JSON.encode([{
				operator: 'gt',
				property: endField ,
				value: Ext.Date.format(dateMinEnd,'Y-m-d')
			},{
				operator: 'lt',
				property: startField ,
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
		
		var calendarCfg = me.gridCfg.define_file.calendar_cfg,
			fileCode = me.gridCfg.define_file.file_code,
			accountFileField = ( calendarCfg.account_is_on ? calendarCfg.account_filefield : null),
			isDoneFileField = calendarCfg.eventstatus_filefield ,
			colorFileField = ( calendarCfg.color_is_fixed ? calendarCfg.color_filefield : null),
			accountField,
			isDoneField,
			colorField,
			startFileField = calendarCfg.eventstart_filefield ,
			endFileField = calendarCfg.eventend_filefield ,
			startField,
			endField,
			durationSrcFileField = ( calendarCfg.duration_is_fixed ? calendarCfg.duration_src_filefield : null ),
			durationSrcBibleField = ( calendarCfg.duration_is_fixed ? calendarCfg.duration_src_biblefield : null ),
			durationField,
			crmFields=[] ;
		Ext.Array.each( me.gridCfg.grid_fields, function( gridField ) {
			if( gridField.file_code != fileCode ) {
				return ;
			}
			if( accountFileField != null && gridField.file_field == accountFileField 
					&& gridField.link_bible_is_key==true && gridField.link_bible_type=='entry' ) {
				accountField = gridField.field ;
			}
			if( isDoneFileField != null && gridField.file_field == isDoneFileField ) {
				isDoneField = gridField.field ;
			}
			if( colorFileField != null && gridField.file_field == colorFileField ) {
				colorField = gridField.field ;
			}
			
			if( gridField.file_field == startFileField ) {
				startField = gridField.field ;
			}
			if( gridField.file_field == endFileField ) {
				endField = gridField.field ;
			}
			
			if( durationSrcFileField != null && durationSrcBibleField != null 
				&& gridField.file_field == durationSrcFileField
				&& gridField.link_bible_field == durationSrcBibleField ) {
				
				durationField = gridField.field ;
			}
			
			/*
			 * Regular CRM fields
			 * - exclude calendarCfg fields above
			 * - File fields (is_header=TRUE)
			 * - Bible link fields ( link_bible_type=entry + link_bible_is_key=FALDE + link_bible_is_header=TRUE)
			 */
			if( (accountFileField != null && accountFileField == gridField.file_field)
				|| (isDoneFileField != null && isDoneFileField == gridField.file_field)
				|| (colorFileField != null && colorFileField == gridField.file_field)
				|| (startFileField != null && startFileField == gridField.file_field)
				|| (endFileField != null && endFileField == gridField.file_field)
				|| (durationField != null && durationField == gridField.file_field) ) {
				
				return true ;
			}
			
			if( gridField.link_bible ) {
				if( gridField.link_bible_type=='entry' && !gridField.link_bible_is_key && gridField.link_bible_is_header ) {
					crmFields.push( gridField.field ) ;
				}
			} else {
				if( gridField.is_header ) {
					crmFields.push( gridField.field ) ;
				}
			}
		},me) ;
		
		if( me.accountIsOn ) {
			var accountsMap = {} ;
			for( var i=0 ; i<me.accountsSelected.length ; i++ ) {
				var eKey = me.accountsSelected[i] ;
				accountsMap[eKey] = me.calendarStore.getById(eKey).get('ColorHex') ;
			}
		}
		
		var eventsData = [], fileRecord, crmData, tValue ;
		for( var i=0 ; i<me.dataCacheArray.length ; i++ ) {
			fileRecord = me.dataCacheArray[i] ;
			
			crmData=[] ;
			for( var j=0 ; j<crmFields.length ; j++ ) {
				tValue = fileRecord[crmFields[j]] ;
				if( tValue != null && tValue.length > 0 ) {
					crmData.push(fileRecord[crmFields[j]]) ;
				}
			}
			
			var evt = {
				id: i,
				cid: null,
				color_hex6: null,
				title: crmData.join(" "),
				start: Ext.Date.parse(fileRecord[startField], "Y-m-d H:i:s", true),
				end: Ext.Date.parse(fileRecord[endField], "Y-m-d H:i:s", true),
				done: (isDoneField != null && fileRecord[isDoneField]==1),
				ad: (durationField != null && fileRecord[durationField] > 0)
			}
			
			if( me.accountIsOn ) {
				var accountKey = fileRecord[accountField] ;
				if( accountKey == null ) {
					evt['cid'] = '' ;
					evt['color_hex6'] = '000000' ;
				} else if( typeof accountsMap[accountKey] === 'undefined' ) {
					continue ;
				} else {
					evt['cid'] = accountKey ;
					evt['color_hex6'] = accountsMap[accountKey] ;
				}
			}
			
			if( colorField != null && fileRecord[colorField] ) {
				evt['color_hex6'] = fileRecord[colorField] ;
			}
			
			eventsData.push(evt) ;
		}
		me.eventStore.getProxy().data = eventsData ;
		me.eventStore.load() ;
		
		Ext.defer(function() {
			if( me.loadMask ) {
				me.loadMask.hide() ;
			}
			me.loading = false ;
		},200,me) ;
	},
	
	/*
	 * Accounts listener
	 */
	onAccountSelect: function(selModel, selectedRecord) {
		var me = this,
			nbKeysSet = selModel.getCount() ;
			colorHex6 = me.rotatingColors[( nbKeysSet % (me.rotatingColors.length) )] ;
			
			if( colorHex6.charAt(0) == '#' ) {
				colorHex6 = colorHex6.substr(1) ;
			}
			
		selectedRecord.set('ColorHex',colorHex6) ;
	},
	onAccountDeselect: function(selModel, deselectedRecord) {
		deselectedRecord.set('ColorHex',null);
	},
	onAccountsSelectionChange: function(selModel, selRecords) {
		var me = this ;
			currentSelKeys = [] ;
		
		Ext.Array.each(selRecords, function( selRecord ) {
			var eKey = selRecord.getId() ;
			currentSelKeys.push(eKey) ;
		});
		
		
		me.accountsSelected = currentSelKeys ;
		
		me.buildEvents() ;
	},
	
	/*
	 * Event detail floating window
	 */
	onEventClick: function( calendarView, eventRecord, clickEl ) {
		var me = this ,
			newEventDetailPanel ;
			
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
				items: Ext.create('Optima5.Modules.CrmBase.FilePanelEventDetailView',{
					id: this.id + '-eventdetailview',
					filePanelCalendar: this
				}),
				bbar:[{
					iconCls:'op5-crmbase-dataformwindow-icon',
					text:'Edit',
					handler: function(btn) {
						var filerecordId = btn.up('panel').filerecordId ;
						me.eventDetailPanel.hide() ;
						me.parentFilePanel.editRecordUpdate( filerecordId ) ;
					},
					scope: this
				},'->',{
					iconCls:'op5-crmbase-qtoolbar-file-delete',
					text:'Delete',
					handler: function(btn) {
						var filerecordId = btn.up('panel').filerecordId ;
						Ext.Msg.show({
							title:'Delete file record',
							msg: 'Delete record '+filerecordId+' ?' ,
							buttons: Ext.Msg.YESNO,
							fn:function(buttonId){
								me.eventDetailPanel.hide() ;
								if( buttonId == 'yes' ) {
									me.parentFilePanel.editRecordDelete( filerecordId ) ;
								}
							},
							scope:me
						});
					},
					scope: this
				}],
				listeners:{
					hide:me.onEventDetailHide,
					scope:me
				},
				
				width: null,
				height: null
			});
		}
		
		var recordIdx = eventRecord.get('EventId'),
			filerecordId = me.dataCacheArray[recordIdx].filerecord_id ;
			
		// *** Titre ***
		me.eventDetailPanel.filerecordId = filerecordId ;
		me.eventDetailPanel.setTitle('Event #'+filerecordId) ;
		
		// *** mise en place de la vue ***
		me.eventDetailPanel.getComponent(this.id + '-eventdetailview').on('eventdetailrendered',function(){
			me.onEventDetailRendered(clickEl) ;
		},me,{single:true}) ;
		me.eventDetailPanel.getComponent(this.id + '-eventdetailview').update(recordIdx) ;
		me.eventDetailPanel.getComponent(this.id + '-eventdetailview').updateLayout() ;
	},
	onEventDetailRendered: function( clickEl ) {
		var me = this,
			p = me.eventDetailPanel,
			hideIf = me.eventDetailHideIf ;
		
		p.setSize(null,null) ; // Clear any previously forced maxSize applied below (400px)
		p.show();
		p.getEl().alignTo(clickEl, 'tl-bl?');
		p.updateLayout() ; // Force panel to calculate fit size based on new alignTo
		if( p.getWidth() > 400 ) {
			p.setWidth(400) ;
		}
		
		// monitor clicking and mousewheel
		me.mon(Ext.getDoc(), {
				mousewheel: hideIf,
				mouseup: hideIf,
				scope: me
		});
	},
	onEventDetailHide: function( p ) {
		var me = this,
			hideIf = me.eventDetailHideIf,
			doc = Ext.getDoc() ;
			
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
	 * Day click (new events)
	 */
	onDayClick: function( calendarView, startDate, isAllDay ) {
		var me = this,
			calendarCfg = me.gridCfg.define_file.calendar_cfg,
			startFileField = calendarCfg.eventstart_filefield,
			endFileField = calendarCfg.eventend_filefield,
			msg = ( Ext.Date.format(startDate,'Y-m-d') + (isAllDay ? '' : ' (at '+Ext.Date.format(startDate,'H')+':00)' ) ),
			presets = {} ;

		if( me.stopOneClick ) {
			return ;
		}
			
		if( isAllDay ) {
			presets['field_'+startFileField] = Ext.Date.format(startDate,'Y-m-d')+' 00:00:00' ;
		} else {
			presets['field_'+startFileField] = Ext.Date.format(startDate,'Y-m-d H')+':00:00' ;
			presets['field_'+endFileField] = Ext.Date.format(Ext.Date.add(startDate, Ext.Date.HOUR, 1),'Y-m-d H')+':00:00' ;
		}
		Ext.Msg.show({
			title:'Create event',
			msg: 'Create event on '+msg+' ?' ,
			buttons: Ext.Msg.YESNO,
			fn:function(buttonId){
				if( buttonId == 'yes' ) {
					me.parentFilePanel.editRecordNew(presets) ;
				}
			},
			scope:me
		}) ;
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