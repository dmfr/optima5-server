Ext.define('Optima5.Modules.CrmBase.MainWindow',{
	extend:'Ext.window.Window',
	requires:[
		'Optima5.Modules.CrmBase.MainWindowButton',
		
		'Optima5.Modules.CrmBase.DataWindow',
		'Optima5.Modules.CrmBase.Qwindow',
		'Optima5.Modules.CrmBase.QdirectWindow',
		'Optima5.Modules.CrmBase.QueryTemplatePanel',
		'Optima5.Modules.CrmBase.AuthAndroidPanel',
		'Optima5.Modules.CrmBase.AuthDelegatePanel'
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
					itemId: 'btn-bible',
					textTitle: 'Bible Library',
					//textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					hidden: (!moduleRecord.get('auth_has_all') && !Ext.Array.contains(moduleRecord.get('auth_arrOpenActions'),'bible'))
				},{
					itemId: 'btn-files',
					textTitle: 'Data Files',
					//textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					hidden: (!moduleRecord.get('auth_has_all') && !Ext.Array.contains(moduleRecord.get('auth_arrOpenActions'),'files'))
				},{
					itemId: 'btn-scen',
					textTitle: 'Scenarios',
					//textCaption: '',
					iconCls: 'op5-crmbase-mainwindow-scen',
					menu: null,
					hidden: (!moduleRecord.get('auth_has_all'))
				},{
					itemId: 'btn-query',
					textTitle: 'Queries / Qmerge',
					textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					hidden: (!moduleRecord.get('auth_has_all') && !Ext.Array.contains(moduleRecord.get('auth_arrOpenActions'),'queries'))
				},{
					itemId: 'btn-admin',
					iconCls: 'op5-crmbase-mainwindow-admin',
					textTitle: 'Administration',
					textCaption: 'User accounts / Devices',
					menu: {
						xtype: 'menu',
						plain: true,
						items: [{
							text: 'Delegate accounts',
							iconCls: 'op5-crmbase-mainwindow-admin-authaccounts',
							handler : function(){
								this.openAuth('AuthDelegate') ;
							},
							scope: this
						},{
							text: 'Android devices',
							iconCls: 'op5-crmbase-mainwindow-admin-authandroid',
							handler : function(){
								this.openAuth('AuthAndroid') ;
							},
							scope:this
						}]
					},
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
			case 'togglepublishdata' :
			case 'togglepublishquery' :
			case 'toggleautorunquery' :
			case 'definechange' :
			case 'querychange' :
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
				data_type : 'bible'
			},
			success: me.onLoadBible,
			scope: me
		});
		ajaxConnection.request({
			params: {
				_action : 'define_getMainToolbar',
				data_type : 'file'
			},
			success: me.onLoadFiles,
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
	onLoadBible: function( response ) {
		var me = this,
			respObj = Ext.decode(response.responseText) ;
		
		var btnBible = me.child('toolbar').child('#btn-bible') ;
		
		var menuCfg = respObj.data_bible ;
		Ext.Array.each( menuCfg, function(o) {
			Ext.apply(o,{
				cls: o.isPublished ? me.clsForPublished : '' ,
				handler: function() {
					me.openBible( o.bibleId ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		if( btnBible.menu ) {
			btnBible.menu.removeAll() ;
			btnBible.menu.add(menuCfg) ;
			
			if( respObj.auth_status && !respObj.auth_status.disableAdmin ) {
				btnBible.menu.add('-') ;
				btnBible.menu.add({
					icon: 'images/op5img/ico_new_16.gif' ,
					text: 'Define new Bible' ,
					handler : function() {
						me.openBibleDefineNew() ;
					},
					scope : me
				}) ;
			}
		}
		btnBible.setIconCls('op5-crmbase-mainwindow-bible') ;
		btnBible.setObjText({
			title: btnBible.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(menuCfg)
		});
	},
	onLoadFiles: function( response ) {
		var me = this,
			respObj = Ext.decode(response.responseText) ;
		
		var btnFiles = me.child('toolbar').child('#btn-files') ;
		
		var menuCfg = respObj.data_files ;
		Ext.Array.each( menuCfg, function(o) {
			Ext.apply(o,{
				cls: o.isPublished ? me.clsForPublished : '' ,
				handler: function() {
					me.openFile( o.fileId ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		if( btnFiles.menu ) {
			btnFiles.menu.removeAll() ;
			btnFiles.menu.add(menuCfg) ;
			
			if( respObj.auth_status && !respObj.auth_status.disableAdmin ) {
				btnFiles.menu.add('-') ;
				btnFiles.menu.add({
					icon: 'images/op5img/ico_new_16.gif' ,
					text: 'Define new File' ,
					handler : function() {
						me.openFileDefineNew() ;
					},
					scope : me
				}) ;
			}
		}
		btnFiles.setIconCls('op5-crmbase-mainwindow-files') ;
		btnFiles.setObjText({
			title: btnFiles.getObjText().title,
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
		
		/* ********* Liste des queries / qmerges *********
		- AssocArray(Obj) QueryId => QueryName
		- Array de toutes les queries déja incluses dans 1 qmerge
		- Constitution des menu items
		************************************************* */
		var qObjIdName = {} ,
			qObjIdIspub = {} ;
		Ext.Array.each( respObj.data_queries , function(v) {
			var queryId = parseInt(v.queryId) ;
			var queryName = v.text ;
			var isPublished = (v.isPublished==true)? true : false ;
			
			qObjIdName[queryId] = queryName ;
			qObjIdIspub[queryId] = isPublished ;
		},me) ;
		var qmergeQueryIds = [] ;
		Ext.Array.each( respObj.data_qmerges , function(v) {
			Ext.Array.each( v.qmerge_queries , function(v2) {
				var queryId = parseInt(v2) ;
				if( !Ext.Array.contains(qmergeQueryIds,queryId) ) {
					qmergeQueryIds.push(queryId) ;
				}
			},me) ;
		},me) ;
		
		var qMenuItems = [] ;
		Ext.Array.each( respObj.data_qmerges , function(v) {
			var qMenuSubItems = [] ;
			Ext.Array.each( v.qmerge_queries , function(v2) {
				var queryId = parseInt(v2) ;
				if( typeof qObjIdName[queryId] === 'undefined' ) {
					return ;
				}
				qMenuSubItems.push({
					queryId : queryId,
					isPublished: (qObjIdIspub[queryId] == true)? true:false,
					text: qObjIdName[queryId],
					icon: 'images/op5img/ico_process_16.gif' ,
					cls: (qObjIdIspub[queryId] == true)? me.clsForPublished:null,
					handler: function(){
						me.openQuery( queryId, v.authReadOnly ) ;
					},
					scope: me
				}) ;
			},me) ;
			
			qMenuItems.push({
				qmergeId: v.qmergeId,
				isPublished: v.isPublished,
				text: v.text,
				icon: 'images/op5img/ico_filechild_16.gif' ,
				cls: (v.isPublished == true)? me.clsForPublished:null,
				handler: function(){
					me.openQmerge( parseInt(v.qmergeId), v.authReadOnly ) ;
				},
				scope: me,
				menu:qMenuSubItems
			});
		},me) ;
		Ext.Array.each( respObj.data_queries , function(v) {
			var queryId = parseInt(v.queryId) ;
			if( Ext.Array.contains(qmergeQueryIds,queryId) ) {
				return ;
			}
			
			qMenuItems.push({
				queryId: queryId,
				isPublished: v.isPublished,
				text: v.text,
				icon: 'images/op5img/ico_process_16.gif' ,
				cls: (v.isPublished == true)? me.clsForPublished:null,
				handler: function(){
					me.openQuery( queryId, v.authReadOnly ) ;
				},
				scope: me
			});
		},me) ;
		Ext.Array.each( respObj.data_qbooks , function(v) {
			var qbookId = parseInt(v.qbookId) ;
			
			qMenuItems.push({
				qbookId: qbookId,
				isPublished: v.isPublished,
				text: v.text,
				icon: 'images/op5img/ico_bookmark_16.png' ,
				cls: (v.isPublished == true)? me.clsForPublished:null,
				handler: function(){
					me.openQbook( qbookId, v.authReadOnly ) ;
				},
				scope: me
			});
		},me) ;
		Ext.Array.each( respObj.data_qwebs , function(v) {
			var qwebId = parseInt(v.qwebId) ;
			
			qMenuItems.push({
				qwebId: qwebId,
				isPublished: v.isPublished,
				text: v.text,
				icon: 'images/op5img/ico_planet_16.png' ,
				cls: (v.isPublished == true)? me.clsForPublished:null,
				handler: function(){
					me.openQweb( qwebId, v.authReadOnly ) ;
				},
				scope: me
			});
		},me) ;
		Ext.Array.each( respObj.data_qsqls , function(v) {
			var qsqlId = parseInt(v.qsqlId) ;
			
			qMenuItems.push({
				qsqlId: qsqlId,
				isPublished: v.isPublished,
				text: v.text,
				icon: 'images/op5img/ico_sql_16.png' ,
				cls: ((v.isPublished == true)? me.clsForPublished:null) + ' ' + ((v.isAutorun == true)? me.clsForAutorun:null) + ' ' + ((v.isToken == true)? me.clsForToken:null),
				handler: function(){
					me.openQsql( qsqlId, v.authReadOnly ) ;
				},
				scope: me
			});
		},me) ;
		Ext.Array.sort( qMenuItems, function(o1,o2) {
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
		
		
		
		var btnQuery = me.child('toolbar').child('#btn-query') ;
		var menuCfg = Ext.decode(response.responseText) ;
		btnQuery.setIconCls('op5-crmbase-mainwindow-query') ;
		btnQuery.setObjText({
			title: btnQuery.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(qMenuItems)
		});
		
		var menuItems = [] ;
		// ajout du "new"
		if( !authReadOnly && respObj.data_filetargets && respObj.data_filetargets.length > 0 ) {
			var subMenuFiles = Ext.Array.clone( respObj.data_filetargets ) ;
			Ext.Array.each( subMenuFiles, function(o) {
				Ext.apply(o,{
					handler: function() {
						me.openQueryNew( o.fileId ) ;
					},
					scope: me
				}) ;
			}) ;
			menuItems.push({
				icon: 'images/op5img/ico_new_16.gif' ,
				text: 'Create Query on ' ,
				menu: subMenuFiles
			}) ;
		}
		// ajout du "new" Qmerge
		if( !authReadOnly && respObj.data_queries && respObj.data_queries.length > 0 ) {
			menuItems.push({
				icon: 'images/op5img/ico_casier_small.gif' ,
				text: 'Create Qmerge on queries' ,
				handler : function() {
					me.openQmergeNew() ;
				},
				scope : me
			}) ;
		}
		// ajout du "new" Qbook
		if( !authReadOnly && respObj.data_queries && respObj.data_queries.length > 0 ) {
			menuItems.push({
				icon: 'images/op5img/ico_bookmark_16.png' ,
				text: 'Create Qbook' ,
				handler : function() {
					me.openQbookNew() ;
				},
				scope : me
			}) ;
		}
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
		if( !authDisableAdmin ) {
			menuItems.push('-') ;
			menuItems.push({
				icon: 'images/op5img/ico_config_small.gif' ,
				text: 'Cfg templates' ,
				handler: function() {
					me.openQueryTemplate() ;
				},
				scope:me
			}) ;
		}
		
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
			if( v.file_parent_code && v.file_parent_code != '' ) {
				return true ;
			}
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
	
	
	openBible: function( bibleId ) {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.CrmBase.DataWindow) ) {
				return true ;
			}
			if( win.dataType == 'bible' && win.bibleId == bibleId ) {
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
			
			dataType:'bible',
			bibleId:bibleId
		},Optima5.Modules.CrmBase.DataWindow) ;
	},
	openBibleDefineNew: function() {
		var me = this ;
		Optima5.Modules.CrmBase.DataWindow.sOpenDefineWindow(me.optimaModule,'bible',true) ;
	},
	openFile: function( fileId ) {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.CrmBase.DataWindow) ) {
				return true ;
			}
			if( win.dataType == 'file' && win.fileId == fileId ) {
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
			
			dataType:'file',
			fileId:fileId
		},Optima5.Modules.CrmBase.DataWindow) ;
	},
	openFileDefineNew: function() {
		var me = this ;
		Optima5.Modules.CrmBase.DataWindow.sOpenDefineWindow(me.optimaModule,'file',true) ;
	},
	openAuth: function( authClass ) {
		var me = this ;
		
		switch( authClass ) {
			case 'AuthAndroid' :
				// recherche d'une fenetre deja ouverte
				var doOpen = true ;
				me.optimaModule.eachWindow(function(win){
					if( win.itemId == 'auth-android-window' ) {
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
					title: 'Android Authentication',
					iconCls: 'op5-crmbase-authandroidwindow-icon',
					itemId: 'auth-android-window',
					items:[Ext.create('Optima5.Modules.CrmBase.AuthAndroidPanel',{
						optimaModule: me.optimaModule
					})]
				}) ;
				break ;
			
			case 'AuthDelegate' :
				// recherche d'une fenetre deja ouverte
				var doOpen = true ;
				me.optimaModule.eachWindow(function(win){
					if( win.itemId == 'auth-delegate-window' ) {
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
					width: 500,
					height: 300,
					title: 'Delegate accounts',
					iconCls: 'op5-crmbase-authdelegatewindow-icon',
					itemId: 'auth-delegate-window',
					items:[Ext.create('Optima5.Modules.CrmBase.AuthDelegatePanel',{
						border: false,
						optimaModule: me.optimaModule
					})]
				}) ;
				break ;
		}
	},
	
	openQueryNew: function( fileCode ) {
		var me = this ;
		return me.openQwindow({
			qType: 'query',
			queryNewFileId: fileCode
		});
	},
	openQuery: function( queryId, readOnly ) {
		var me = this ;
		return me.openQwindow({
			qType: 'query',
			queryId: queryId,
			forceQsimple: readOnly
		});
	},
	openQmergeNew: function() {
		var me = this ;
		return me.openQwindow({
			qType: 'qmerge',
			qmergeNew: true
		});
	},
	openQmerge: function( qmergeId, readOnly ) {
		var me = this ;
		return me.openQwindow({
			qType: 'qmerge',
			qmergeId: qmergeId,
			forceQsimple: readOnly
		});
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
	openQbookNew: function() {
		var me = this ;
		return me.openQwindow({
			qType: 'qbook',
			qbookNew: true
		});
	},
	openQbook: function( qbookId, readOnly ) {
		var me = this ;
		return me.openQwindow({
			qType: 'qbook',
			qbookId: qbookId,
			forceQsimple: readOnly
		});
	},
	openQweb: function( qwebId, readOnly ) {
		var me = this ;
		return me.openQwindow({
			qType: 'qweb',
			qwebId: qwebId,
			forceQsimple: readOnly
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
	
	openQueryTemplate: function() {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( win.itemId == 'qtemplate-window' ) {
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
			title: 'Query layout template',
			iconCls: 'op5-crmbase-qtemplatewindow-icon',
			itemId: 'qtemplate-window',
			items:[Ext.create('Optima5.Modules.CrmBase.QueryTemplatePanel',{
				optimaModule: me.optimaModule
			})]
		}) ;
	}
}) ;
