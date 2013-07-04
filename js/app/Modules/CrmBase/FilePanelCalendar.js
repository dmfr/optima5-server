Ext.define('Optima5.Modules.CrmBase.FilePanelCalendar' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Ext.calendar.CalendarPanel',
		'Ext.calendar.data.MemoryCalendarStore',
		'Ext.calendar.data.MemoryEventStore',
		'Ext.calendar.util.Date',
		'Ext.calendar.data.Events',
		'Ext.calendar.data.Calendars'
	],
	
	alias : 'widget.op5crmbasefilecalendar',
	
	rotatingColors:['#306da6','#86a723','#b6a980'],
	
	// forward (ajax)config from FilePanel
	gridCfg: null,
	
	// private property
	accountIsOn: false,
	accountsSelected: [],
	dataFilerecordsCache: [],
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelCalendar','No module reference ?') ;
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
			},
		});
		this.eventStore = Ext.create('Ext.data.Store', {
			model: 'Ext.calendar.data.EventModel',
			data: [],
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			},
		});
		
		/*
		 * Enumeration des bibles potentielles pour menus 2D
		 */
		
		Ext.apply(me,{
			layout: 'border',
			title: 'Loading...',
			items: [{
				itemId:'calendar-center',
				xtype:'calendarpanel',
				activeItem: 1,
				eventStore: me.eventStore,
				layout:'fit',
				border:false,
				region:'center',
				monthViewCfg: {
					showHeader: true,
					showWeekLinks: true,
					showWeekNumbers: true
				},
				listeners: {
					'viewchange': {
						fn: function(p, vw, dateInfo){
							if(this.editWin){
								this.editWin.hide();
							}
							if(dateInfo){
								// will be null when switching to the event edit form so ignore
								this.getComponent('calendar-west').getComponent('calendar-nav-datepicker').setValue(dateInfo.activeDate);
								this.updateTitle(dateInfo.viewStart, dateInfo.viewEnd);
							}
						},
						scope: this
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
		
		if( !me.gridCfg.define_file.calendar_cfg ) {
			return ;
		}
		
		console.dir(me.gridCfg) ;
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
			return ;
		}
		
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
	onViewChange: function() {
		
	},
	fetchEvents: function() {
		
	},
	buildEvents: function() {
		
	},
	
	/*
	 * Accounts listener
	 */
	onAccountsSelectionChange: function(selModel, selRecords) {
		var me = this ;
		
		var previousSelKeys = me.accountsSelected,
			nbKeysSet = previousSelKeys.length,
			currentSelKeys = [] ;
		
		Ext.Array.each(selRecords, function( selRecord ) {
			var eKey = selRecord.getId() ;
			currentSelKeys.push(eKey) ;
		});
		
		// nettoyage des couleurs
		Ext.Array.each(previousSelKeys, function( previousSelKey, index ) {
			if( !Ext.Array.contains(currentSelKeys,previousSelKey) ) {
				me.calendarStore.getById(previousSelKey).set('ColorHex',null) ;
				nbKeysSet-- ;
			}
		});
		
		Ext.Array.each(selRecords, function( selRecord ) {
			var eKey = selRecord.getId() ;
			if( !Ext.Array.contains(previousSelKeys,eKey) ) {
				var colorHex6 = me.rotatingColors[( previousSelKeys.length % (me.rotatingColors.length) )] ;
				if( colorHex6.charAt(0) == '#' ) {
					colorHex6 = colorHex6.substr(1) ;
				}
				
				me.calendarStore.getById(eKey).set('ColorHex',colorHex6) ;
				nbKeysSet++ ;
			}
		},me);
		
		me.accountsSelected = currentSelKeys ;
		
		me.buildEvents() ;
	}
	
});