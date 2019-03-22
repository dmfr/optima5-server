Ext.define('Optima5.Modules.CrmBase.MainDscWindow',{
	extend:'Ext.window.Window',
	requires:[
		'Optima5.Modules.CrmBase.MainWindowButton',
		
		'Optima5.Modules.CrmBase.DataWindow',
		
		'Optima5.Modules.CrmBase.QlogsPanel',
		'Optima5.Modules.CrmBase.QsqlAutorunPanel',
		'Optima5.Modules.CrmBase.QsqlTokensPanel',
		'Optima5.Modules.CrmBase.DataImportLogsPanel'
	],
	
	clsForPublished: 'op5-crmbase-published',
	clsForAutorun:   'op5-crmbase-autorun',
	clsForToken:     'op5-crmbase-token',
	
	initComponent: function() {
		var me = this,
			moduleRecord = me.optimaModule.getSdomainRecord() ;
		
		Ext.apply(me,{
			width:250,
			height:600,
			resizable:false,
			maximizable:false,
			layout:'fit',
			items:[{
				xtype:'toolbar',
				vertical:true,
				layout:{
					align:'stretch'
				},
				defaults:{
					xtype:'op5crmbasemwbutton',
					scale:'large',
					textAlign:'left',
					width:300,
					menuAlign:'tl-tr?',
					menu: {
						xtype:'menu',
						plain:true,
						items:[]
					}
				},
				items:[{
					itemId: 'btn-tables',
					textTitle: 'SQL Tables',
					//textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					hidden: (!moduleRecord.get('auth_has_all') && !Ext.Array.contains(moduleRecord.get('auth_arrOpenActions'),'tables'))
				},{
					itemId: 'btn-query',
					textTitle: 'SQL Queries',
					textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					hidden: (!moduleRecord.get('auth_has_all') && !Ext.Array.contains(moduleRecord.get('auth_arrOpenActions'),'queries'))
				},{
					itemId: 'btn-workflow',
					textTitle: 'Workflow',
					//textCaption: '',
					iconCls: 'op5-crmbase-mainwindow-workflow',
					menu: null,
					hidden: (!moduleRecord.get('auth_has_all'))
				},{
					itemId: 'btn-logs',
					textTitle: 'Logs / Notifications',
					//textCaption: '',
					iconCls: 'op5-crmbase-mainwindow-logs',
					menu: [{
						text: 'Queries (XML)',
						icon: 'images/op5img/ico_sql_16.png' ,
						handler: function(){
							me.openQlogs() ;
						},
						scope: me
					},{
						text: 'SQL Autoruns',
						icon: 'images/op5img/ico_sql_16.png' ,
						handler: function(){
							me.openQsqlAutorun() ;
						},
						scope: me
					},{
						text: 'SQL Tokens',
						icon: 'images/op5img/ico_sql_16.png' ,
						handler: function(){
							me.openQsqlTokens() ;
						},
						scope: me
					},{
						text: 'Data Imports',
						icon: 'images/op5img/ico_bookmark_16.png' ,
						handler: function(){
							me.openDataImportLogs() ;
						},
						scope: me
					}],
					hidden: (!moduleRecord.get('auth_has_all'))
				}]
			}]
		}) ;
		
		me.on('afterrender',function(){
			var totHeight = 0 ;
			Ext.Array.each(me.child('toolbar').query('>button'),function(item) {
				if( item.isHidden() ) {
					return ;
				}
				totHeight += item.getHeight() ;
			},me) ;
			me.setHeight(totHeight+50) ;
		},me);
		
		me.on('afterrender',function(){
			Ext.defer(me.syncData,500,me);
		},me,{single:true}) ;
		
		this.callParent() ;
		
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
	},
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'definechange' :
			case 'querychange' :
			case 'togglepublishquery' :
			case 'toggleautorunquery' :
				me.syncData() ;
				break ;
		}
	},
	
	
	
	syncData: function() {
		var me = this ;
		
		var ajaxConnection = me.optimaModule.getConfiguredAjaxConnection() ;
		ajaxConnection.request({
			params: {
				_action : 'define_getMainToolbar',
				data_type : 'table'
			},
			success: me.onLoadTables,
			scope: me
		});
		ajaxConnection.request({
			params: {
				_action : 'queries_getToolbarData'
			},
			success: me.onLoadQuery,
			scope: me
		});
	},
	onLoadTables: function( response ) {
		var me = this,
			respObj = Ext.decode(response.responseText) ;
		
		var btnTables = me.child('toolbar').child('#btn-tables') ;
		
		var iterateFn = function( arr, level=1 ) {
			var map_prefix_arrObjs = {} ;
			Ext.Array.each( arr, function(o) {
				var words = o.tableId.split('_'),
					prefix = words.slice(0,level).join('_') ;
				if( !map_prefix_arrObjs.hasOwnProperty(prefix) ) {
					map_prefix_arrObjs[prefix] = [] ;
				}
				map_prefix_arrObjs[prefix].push(o) ;
			}) ;
			
			var arr = [] ;
			Ext.Object.each( map_prefix_arrObjs, function(k,v) {
				var txts = [] ;
				Ext.Array.each( v, function(o) {
					if( !Ext.Array.contains(txts,o.tableId) ) {
						txts.push( o.tableId ) ;
					}
				}) ;
				if( txts.length > 1 ) {
					v = iterateFn( v, level+1 ) ;
					arr.push({
						icon: 'images/op5img/ico_foldergreen_16.png',
						text: k,
						menu: v
					}) ;
				} else {
					Ext.Array.each( v, function(o) {
						Ext.apply(o,{
							cls: o.isPublished ? me.clsForPublished : '' ,
							handler: function() {
								me.openTable( o.tableId ) ;
							},
							scope:me
						}) ;
						arr.push(o) ;
					}) ;
				}
			});
			return arr ;
		} ;
		var menuCfg = iterateFn( respObj.data_tables ) ;
		
		if( btnTables.menu ) {
			btnTables.menu.removeAll() ;
			btnTables.menu.add(menuCfg) ;
			
			if( respObj.auth_status && !respObj.auth_status.disableAdmin ) {
				btnTables.menu.add('-') ;
				btnTables.menu.add({
					icon: 'images/op5img/ico_new_16.gif' ,
					text: 'Define new Table' ,
					handler : function() {
						me.openTableDefineNew() ;
					},
					scope : me
				}) ;
				btnTables.menu.add({
					iconCls: 'op5-crmbase-datatoolbar-file-importdata',
					text: 'Import into new Table' ,
					handler : function() {
						me.openTableImportNew() ;
					},
					scope : me
				}) ;
			}
		}
		btnTables.setIconCls('op5-crmbase-mainwindow-tables') ;
		btnTables.setObjText({
			title: btnTables.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(menuCfg)
		});
	},
	onLoadQuery: function( response ) {
		var me = this ;
		
		var respObj = Ext.decode(response.responseText) ;
		
		var authReadOnly=false,
				authDisableAdmin=false;
		if( respObj.auth_status ) {
			if( respObj.auth_status.disableAdmin ) {
				authDisableAdmin = true ;
			}
			if( respObj.auth_status.readOnly ) {
				authReadOnly = true ;
			}
		}
		
		Ext.Array.sort( respObj.data_qsqls, function(o1,o2) {
			var o1text = o1.text.toLowerCase(),
				o2text = o2.text.toLowerCase() ;
			
			if( o1text < o2text ) {
				return -1 ;
			} else if(  o1text > o2text ) {
				return 1 ;
			} else {
				return 0 ;
			}
		}) ;
		
		var iterateFn = function( arr, level=1 ) {
			var map_prefix_arrObjs = {} ;
			Ext.Array.each( arr, function(o) {
				var words = o.text.split('_'),
					prefix = words.slice(0,level).join('_') ;
				if( !map_prefix_arrObjs.hasOwnProperty(prefix) ) {
					map_prefix_arrObjs[prefix] = [] ;
				}
				map_prefix_arrObjs[prefix].push(o) ;
			}) ;
			
			var arr = [] ;
			Ext.Object.each( map_prefix_arrObjs, function(k,v) {
				var txts = [] ;
				Ext.Array.each( v, function(o) {
					if( !Ext.Array.contains(txts,o.text) ) {
						txts.push( o.text ) ;
					}
				}) ;
				if( txts.length > 1 ) {
					v = iterateFn( v, level+1 ) ;
					arr.push({
						icon: 'images/op5img/ico_foldergreen_16.png',
						text: k,
						menu: v
					}) ;
				} else {
					Ext.Array.each( v, function(o) {
						var qsqlId = parseInt(o.qsqlId) ;
						arr.push({
							qsqlId: qsqlId,
							isPublished: o.isPublished,
							text: o.text,
							icon: 'images/op5img/ico_sql_16.png' ,
							cls: ((o.isPublished == true)? me.clsForPublished:'') + ' ' + ((o.isAutorun == true)? me.clsForAutorun:'') + ' ' + ((o.isToken == true)? me.clsForToken:''),
							handler: function(){
								me.openQsql( qsqlId, o.authReadOnly ) ;
							},
							scope: me
						});
					}) ;
				}
			});
			return arr ;
		} ;
		var qMenuItems = iterateFn( respObj.data_qsqls ) ;
		
		var btnQuery = me.child('toolbar').child('#btn-query') ;
		var menuCfg = Ext.decode(response.responseText) ;
		btnQuery.setIconCls('op5-crmbase-mainwindow-query') ;
		btnQuery.setObjText({
			title: btnQuery.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(qMenuItems)
		});
		
		var menuItems = [] ;
		// ajout du "new" Qsql
		if( !authReadOnly ) {
			menuItems.push({
				icon: 'images/op5img/ico_sql_16.png' ,
				text: 'Create SQL' ,
				handler : function() {
					me.openQsqlNew() ;
				},
				scope : me
			}) ;
		}
		if( !authReadOnly && qMenuItems.length > 0 ) {
			menuItems.push('-') ;
		}
		menuItems = Ext.Array.union(menuItems,qMenuItems) ;
		
		if( btnQuery.menu ) {
			btnQuery.menu.removeAll() ;
			btnQuery.menu.add(menuItems) ;
		}
	},
	getHeadlines: function( menuCfgArray ) {
		var sortedCfgArray = Ext.Array.sort( Ext.clone(menuCfgArray), function(o1,o2) {
			if( o1.isPublished != o2.isPublished ) {
				return o2.isPublished ? 1 : -1 ;
			}
			if( o1.count != o2.count ) {
				return ( o2.count - o1.count > 0 ) ? 1 : -1 ;
			} else {
				return 0 ;
			}
		}) ;
		
		var resultStr = '' ;
		Ext.Array.each( sortedCfgArray, function(v) {
			if( resultStr.length > 0 ) {
				resultStr += ', ' ;
			}
			resultStr += v.text ;
			if( resultStr.length > 50 ) {
				return false ;
			}
			return true ;
		}) ;
		return resultStr ;
	},
	
	
	openTable: function( tableId ) {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.CrmBase.DataWindow) ) {
				return true ;
			}
			if( win.dataType == 'table' && win.tableId == tableId ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},me) ;
		
		if( !doOpen ) {
			return ;
		}
		
		var win = me.optimaModule.createWindow({
			title: '',
			
			dataType:'table',
			tableId:tableId
		},Optima5.Modules.CrmBase.DataWindow) ;
	},
	openTableDefineNew: function() {
		var me = this ;
		Optima5.Modules.CrmBase.DataWindow.sOpenDefineWindow(me.optimaModule,'table',true) ;
	},
	openTableImportNew: function() {
		var me = this ;
		
		var setSizeFromParent = function( parentPanel, targetPanel ) {
			targetPanel.setSize({
				width: parentPanel.getSize().width - 20,
				height: parentPanel.getSize().height - 60
			}) ;
		};
		
		var dataImportPanel = Ext.create('Optima5.Modules.CrmBase.DataImportPanel',{
			parentDataWindow: {
				optimaModule: this.optimaModule,
				dataType: 'table'
			}
		});
		
		win = this.optimaModule.createWindow({
			title:'Store definition',
			width:1000,
			height:600,
			iconCls: 'op5-crmbase-datatoolbar-file-importdata',
			animCollapse:false,
			border: false,
			layout: 'fit',
			items: [ dataImportPanel ]
		}) ;
		dataImportPanel.win = win ;
		dataImportPanel.on('destroy',function(p) {
			p.win.close() ;
		}) ;
	},
	openQsqlNew: function() {
		var me = this ;
		return me.openQwindow({
			qType: 'qsql',
			qsqlNew: true
		});
	},
	openQsql: function( qsqlId ) {
		var me = this ;
		return me.openQwindow({
			qType: 'qsql',
			qsqlId: qsqlId
		});
	},
	openQwindow: function( qCfg ) {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.CrmBase.Qwindow) ) {
				return true ;
			}
			if( Ext.encode(qCfg) == Ext.encode( win.getQcfg() ) ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},me) ;
		
		if( !doOpen ) {
			return ;
		}
		
		me.optimaModule.createWindow(qCfg,Optima5.Modules.CrmBase.Qwindow) ;
	},
	openQlogs: function() {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( win._winQlog ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},me) ;
		
		if( !doOpen ) {
			return ;
		}
		
		var qlogsPanel = Ext.create('Optima5.Modules.CrmBase.QlogsPanel',{
			optimaModule: this.optimaModule
		});
		
		win = this.optimaModule.createWindow({
			_winQlog: true,
			title:'Q Logs',
			width:1000,
			height:600,
			iconCls: 'op5-crmbase-datatoolbar-file',
			animCollapse:false,
			border: false,
			layout: 'fit',
			items: [ qlogsPanel ]
		}) ;
		qlogsPanel.win = win ;
		qlogsPanel.on('destroy',function(p) {
			p.win.close() ;
		}) ;
	},
	openQsqlAutorun: function() {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( win._winQsqlAutorun ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},me) ;
		
		if( !doOpen ) {
			return ;
		}
		
		var qlogsPanel = Ext.create('Optima5.Modules.CrmBase.QsqlAutorunPanel',{
			optimaModule: this.optimaModule
		});
		
		win = this.optimaModule.createWindow({
			_winQsqlAutorun: true,
			title:'Sql Autoruns',
			width:1000,
			height:600,
			iconCls: 'op5-crmbase-datatoolbar-file',
			animCollapse:false,
			border: false,
			layout: 'fit',
			items: [ qlogsPanel ]
		}) ;
		qlogsPanel.win = win ;
		qlogsPanel.on('destroy',function(p) {
			p.win.close() ;
		}) ;
	},
	openQsqlTokens: function() {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( win._winQsqlAutorun ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},me) ;
		
		if( !doOpen ) {
			return ;
		}
		
		var qlogsPanel = Ext.create('Optima5.Modules.CrmBase.QsqlTokensPanel',{
			optimaModule: this.optimaModule
		});
		
		win = this.optimaModule.createWindow({
			_winQsqlAutorun: true,
			title:'Sql Autoruns',
			width:1000,
			height:600,
			iconCls: 'op5-crmbase-datatoolbar-file',
			animCollapse:false,
			border: false,
			layout: 'fit',
			items: [ qlogsPanel ]
		}) ;
		qlogsPanel.win = win ;
		qlogsPanel.on('destroy',function(p) {
			p.win.close() ;
		}) ;
	},
	openDataImportLogs: function() {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( win._winDataImportLogs ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},me) ;
		
		if( !doOpen ) {
			return ;
		}
		
		var qlogsPanel = Ext.create('Optima5.Modules.CrmBase.DataImportLogsPanel',{
			optimaModule: this.optimaModule
		});
		
		win = this.optimaModule.createWindow({
			_winDataImportLogs: true,
			title:'Data Import Logs',
			width:1150,
			height:600,
			animCollapse:false,
			border: false,
			layout: 'fit',
			items: [ qlogsPanel ]
		}) ;
		qlogsPanel.win = win ;
		qlogsPanel.on('destroy',function(p) {
			p.win.close() ;
		}) ;
	}
}) ;
